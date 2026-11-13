# Ventana de una lavadora lavando: tambor de acero que gira, ropa que da vueltas, agua con espuma.
# Uso: python tambor.py carpeta_salida [frames] [muestras] [lado_px]
import bpy, math, sys, random
from mathutils import Vector
args = sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:]
OUT = args[0]; FR = int(args[1]) if len(args) > 1 else 72; SPP = int(args[2]) if len(args) > 2 else 24; RES = int(args[3]) if len(args) > 3 else 480
random.seed(7)
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.frame_start = 1; sc.frame_end = FR; sc.render.fps = 24

def lin(hx):
    h = hx.lstrip('#'); return tuple((lambda c: c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4)(int(h[i:i+2], 16)/255) for i in (0, 2, 4))
def principled(n, hx, rough=0.5, metal=0.0, **kw):
    m = bpy.data.materials.new(n); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*lin(hx), 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    for k, v in kw.items(): b.inputs[k].default_value = v
    return m, b
def lineal(obj, path, idx, pares):
    for f, v in pares:
        if idx is None: setattr(obj, path, v)
        else: getattr(obj, path)[idx] = v
        obj.keyframe_insert(path, index=-1 if idx is None else idx, frame=f)
    ad = obj.animation_data
    if ad and ad.action:
        try:
            for fc in ad.action.fcurves:
                for k in fc.keyframe_points: k.interpolation = 'LINEAR'
        except AttributeError:
            pass

# --- tambor de acero perforado (eje hacia la cámara = Y) ---
acero, ab = principled('acero', '#C9CED6', 0.32, 1.0)
t = acero.node_tree; N = t.nodes; L = t.links
tc = N.new('ShaderNodeTexCoord'); vor = N.new('ShaderNodeTexVoronoi'); vor.feature = 'DISTANCE_TO_EDGE' if False else 'F1'; vor.inputs['Scale'].default_value = 34
L.new(tc.outputs['Object'], vor.inputs['Vector'])
rg = N.new('ShaderNodeValToRGB'); rg.color_ramp.elements[0].position = 0.22; rg.color_ramp.elements[0].color = (0.02, 0.02, 0.025, 1); rg.color_ramp.elements[1].position = 0.26; rg.color_ramp.elements[1].color = (*lin('#B8BEC8'), 1)
L.new(vor.outputs['Distance'], rg.inputs[0]); L.new(rg.outputs['Color'], ab.inputs['Base Color'])
bmp = N.new('ShaderNodeBump'); bmp.inputs['Strength'].default_value = 0.6; L.new(rg.outputs['Color'], bmp.inputs['Height']); L.new(bmp.outputs['Normal'], ab.inputs['Normal'])
bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=1.0, depth=1.4, location=(0, 0.7, 0), rotation=(math.radians(90), 0, 0))
drum = bpy.context.object; bpy.ops.object.transform_apply(rotation=True); drum.data.materials.append(acero)
for p in drum.data.polygons: p.use_smooth = True
# quitar la tapa frontal para ver dentro
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.object.mode_set(mode='OBJECT')
for p in drum.data.polygons:
    if p.normal.y < -0.9: p.select = True
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.delete(type='FACE'); bpy.ops.mesh.flip_normals(); bpy.ops.object.mode_set(mode='OBJECT')
# eje que gira con el tambor
bpy.ops.object.empty_add(location=(0, 0, 0)); eje = bpy.context.object
drum.parent = eje
# aspas
for k in range(3):
    a = k * 2*math.pi/3
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0.9*math.cos(a), 0.7, 0.9*math.sin(a)), rotation=(0, -a, 0))
    asp = bpy.context.object; asp.scale = (0.16, 1.3, 0.1); asp.data.materials.append(acero); asp.parent = eje
    bv = asp.modifiers.new('b', 'BEVEL'); bv.width = 0.04; bv.segments = 3
lineal(eje, 'rotation_euler', 1, [(1, 0.0), (FR + 1, -2*math.pi)])

# --- ropa: telas arrugadas que giran con el tambor y además dan vueltas sobre sí ---
telas = [('#C8302C', 0.62, 0.44), ('#7CC8B0', 0.56, 0.4), ('#F2F2EE', 0.55, 0.36), ('#4F8FD0', 0.5, 0.36), ('#F4B92B', 0.42, 0.3),
         ('#1F2A5C', 0.5, 0.34), ('#F2F2EE', 0.44, 0.3), ('#E58FA6', 0.4, 0.3), ('#7CC8B0', 0.36, 0.26), ('#C8302C', 0.34, 0.24)]
nube = bpy.data.textures.new('arrugas', 'CLOUDS'); nube.noise_scale = 0.45; nube.noise_depth = 1
PER = FR // 2
def pos(u, rr, a1d=-215):
    # u en [0,1): la tela sube pegada a la pared y luego cae por el centro
    a0, a1 = math.radians(-95), math.radians(a1d)
    if u < 0.62:
        a = a0 + (a1 - a0) * (u / 0.62); return rr*math.cos(a), rr*math.sin(a)
    v = (u - 0.62) / 0.38; x0, z0 = rr*math.cos(a1), rr*math.sin(a1); x1, z1 = rr*math.cos(a0), rr*math.sin(a0)
    return x0 + (x1 - x0)*v, z0 + (z1 - z0)*(v*v)
for i, (hx, w, h) in enumerate(telas):
    m, b = principled(f'tela{i}', hx, 0.9, 0.0)
    try: b.inputs['Sheen Weight'].default_value = 0.8
    except KeyError: pass
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0.3 + random.uniform(0, .8), 0))
    o = bpy.context.object; o.scale = (w, h, 1); o.data.materials.append(m)
    sub = o.modifiers.new('s', 'SUBSURF'); sub.levels = 5; sub.render_levels = 5; sub.subdivision_type = 'SIMPLE'
    dp = o.modifiers.new('d', 'DISPLACE'); dp.texture = nube; dp.strength = 0.1; dp.texture_coords = 'LOCAL'
    bd = o.modifiers.new('b', 'SIMPLE_DEFORM'); bd.deform_method = 'BEND'; bd.angle = random.uniform(0.6, 1.3); bd.deform_axis = random.choice(['X', 'Y'])
    tw = o.modifiers.new('t', 'SIMPLE_DEFORM'); tw.deform_method = 'TWIST'; tw.angle = random.uniform(-0.45, 0.45)
    so = o.modifiers.new('g', 'SOLIDIFY'); so.thickness = 0.025
    sm = o.modifiers.new('sm', 'SUBSURF'); sm.levels = 2; sm.render_levels = 2
    for p in o.data.polygons: p.use_smooth = True
    off = i / len(telas) + random.uniform(-.04, .04); rr = random.uniform(0.42, 0.74); a1d = random.uniform(-235, -175)
    rx, ry, rz = (random.uniform(0, 6) for _ in range(3)); giro = random.choice([-1, 1]) * 2*math.pi
    for f in range(1, FR + 2, 2):
        u = (((f - 1) % PER) / PER + off) % 1.0
        x, z = pos(u, rr, a1d); o.location.x = x; o.location.z = z
        o.keyframe_insert('location', index=0, frame=f); o.keyframe_insert('location', index=2, frame=f)
        k = (f - 1) / FR; o.rotation_euler = (rx + giro*k, ry + 2*giro*k, rz); o.keyframe_insert('rotation_euler', frame=f)
    ad = o.animation_data
    try:
        for fc in ad.action.fcurves:
            for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
    except AttributeError:
        pass

# --- agua jabonosa con olas que se mecen (cíclicas) ---
agua, wb = principled('agua', '#B5D6EE', 0.04, 0.0, **{'Transmission Weight': 0.95, 'IOR': 1.33})
import bmesh
bpy.ops.mesh.primitive_cylinder_add(vertices=128, radius=0.975, depth=1.36, location=(0, 0.7, 0), rotation=(math.radians(90), 0, 0)); w = bpy.context.object
bpy.ops.object.transform_apply(rotation=True)
bm = bmesh.new(); bm.from_mesh(w.data)
geo = bm.verts[:] + bm.edges[:] + bm.faces[:]
bmesh.ops.bisect_plane(bm, geom=geo, plane_co=(0, 0, -0.18), plane_no=(0, 0, 1), clear_outer=True, clear_inner=False)
bmesh.ops.holes_fill(bm, edges=[e for e in bm.edges if e.is_boundary], sides=0)
bm.to_mesh(w.data); bm.free()
w.data.materials.append(agua)
r1 = w.modifiers.new('r', 'REMESH'); r1.mode = 'VOXEL'; r1.voxel_size = 0.035
ola = bpy.data.textures.new('olas', 'STUCCI'); ola.noise_scale = 0.35
emp = bpy.data.objects.new('mov_olas', None); sc.collection.objects.link(emp)
d2 = w.modifiers.new('d', 'DISPLACE'); d2.texture = ola; d2.strength = 0.05; d2.texture_coords = 'OBJECT'; d2.texture_coords_object = emp
for p in w.data.polygons: p.use_smooth = True
lineal(emp, 'rotation_euler', 2, [(1, 0.0), (FR + 1, 2*math.pi)])
w.rotation_mode = 'XYZ'
for f in range(1, FR + 2, max(1, FR//8)):
    w.rotation_euler[1] = math.radians(7) * math.sin(2*math.pi*2*(f-1)/FR); w.keyframe_insert('rotation_euler', index=1, frame=f)

# --- espuma: burbujas blancas en la superficie ---
esp, eb = principled('espuma', '#FFFFFF', 0.35, 0.0, **{'Transmission Weight': 0.35})
for i in range(220):
    x = random.uniform(-0.92, 0.92); rr = random.uniform(0.006, 0.026)
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=rr, location=(x, random.uniform(0.15, 0.9), -0.2 + random.uniform(-0.02, 0.04)))
    bb = bpy.context.object; bb.location.z = -0.16 + random.uniform(-0.01, 0.03); bb.data.materials.append(esp); bb.parent = w
    for p in bb.data.polygons: p.use_smooth = True

# --- cámara viendo de frente por la puerta, luces ---
bpy.ops.object.camera_add(location=(0, -1.38, 0.0), rotation=(math.radians(90), 0, 0)); cam = bpy.context.object; sc.camera = cam; cam.data.lens = 26
bpy.ops.object.light_add(type='AREA', location=(0.4, -1.4, 1.3)); lz = bpy.context.object; lz.data.energy = 120; lz.data.size = 1.6
lz.rotation_euler = (Vector((0, 0.7, 0)) - lz.location).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.light_add(type='POINT', location=(-0.5, -0.3, 0.6)); lp = bpy.context.object; lp.data.energy = 35
wo = bpy.data.worlds.new('m'); sc.world = wo; wo.use_nodes = True; wo.node_tree.nodes['Background'].inputs['Color'].default_value = (0.05, 0.06, 0.08, 1); wo.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35

sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SPP; sc.cycles.use_denoising = True
sc.cycles.max_bounces = 8; sc.cycles.transmission_bounces = 6
sc.render.resolution_x = RES; sc.render.resolution_y = RES
sc.view_settings.view_transform = 'AgX' if 'AgX' in [x.name for x in []] else sc.view_settings.view_transform
sc.render.motion_blur_shutter = 0.3; sc.render.use_motion_blur = True
sc.render.image_settings.file_format = 'PNG'
sc.render.filepath = OUT.rstrip('/') + '/f_'
import os
if os.environ.get('SOLO'): sc.frame_start = sc.frame_end = int(os.environ['SOLO'])
bpy.ops.render.render(animation=True)
print('listo')
