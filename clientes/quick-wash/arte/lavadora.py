import bpy, math, sys
from mathutils import Vector
OUT = sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def mat(nombre, hexc, rough=0.6):
    m = bpy.data.materials.new(nombre); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    h = hexc.lstrip('#'); rgb = [int(h[i:i+2], 16)/255 for i in (0, 2, 4)]
    lin = [c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4 for c in rgb]
    b.inputs['Base Color'].default_value = (*lin, 1); b.inputs['Roughness'].default_value = rough
    return m

def rayas(nombre, a, b_, n=10, eje='X', radial=False):
    m = mat(nombre, a); t = m.node_tree; N = t.nodes; L = t.links
    tc = N.new('ShaderNodeTexCoord'); sep = N.new('ShaderNodeSeparateXYZ'); math_ = N.new('ShaderNodeMath'); math_.operation = 'SINE'
    mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; mul.inputs[1].default_value = n
    L.new(tc.outputs['Object'], sep.inputs[0])
    if radial:
        at = N.new('ShaderNodeMath'); at.operation = 'ARCTAN2'; L.new(sep.outputs['Y'], at.inputs[0]); L.new(sep.outputs['X'], at.inputs[1]); L.new(at.outputs[0], mul.inputs[0])
    else:
        L.new(sep.outputs[eje], mul.inputs[0])
    L.new(mul.outputs[0], math_.inputs[0])
    ramp = N.new('ShaderNodeValToRGB'); ramp.color_ramp.interpolation = 'CONSTANT'
    def lin(hx):
        h = hx.lstrip('#'); return [ (lambda c: c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4)(int(h[i:i+2],16)/255) for i in (0,2,4)]
    ramp.color_ramp.elements[0].position = 0.0; ramp.color_ramp.elements[0].color = (*lin(a), 1)
    ramp.color_ramp.elements[1].position = 0.5; ramp.color_ramp.elements[1].color = (*lin(b_), 1)
    rng = N.new('ShaderNodeMapRange'); rng.inputs['From Min'].default_value = -1
    L.new(math_.outputs[0], rng.inputs['Value']); L.new(rng.outputs[0], ramp.inputs[0])
    L.new(ramp.outputs['Color'], N['Principled BSDF'].inputs['Base Color'])
    return m

def poner(obj, m, suave=True):
    obj.data.materials.append(m)
    if suave and hasattr(obj.data, 'polygons'):
        for p in obj.data.polygons: p.use_smooth = True
    return obj

def bisel(obj, w=0.06, seg=4):
    mo = obj.modifiers.new('bisel', 'BEVEL'); mo.width = w; mo.segments = seg; mo.limit_method = 'ANGLE'

AMAR = mat('amarillo', '#E3B83A'); AMAR2 = mat('amarillo2', '#C99A22'); GRIS = mat('gris', '#5E6470'); GRIS2 = mat('gris2', '#9AA1AD')
VIDRIO = mat('vidrio', '#5FA8DC', 0.15); ROJO = mat('rojo', '#C8302C'); AZUL = mat('azulcaja', '#7FB4E2'); BLANCO = mat('blanco', '#F4F4F2')
MENTA = mat('menta', '#7CC8B0'); CANASTA = rayas('canasta', '#9ED6C3', '#F7FBF9', 14, 'X', radial=True); CALCE = rayas('calcetin', '#4F8FD0', '#F4F4F2', 26, 'Z')

# base

# cuerpo de la lavadora
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.1, 0.62)); c = bpy.context.object; c.scale = (1.05, 1.0, 1.24); bpy.ops.object.transform_apply(scale=True); bisel(c, 0.07); poner(c, AMAR, False)
# tapa superior
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0.1, 1.26)); t = bpy.context.object; t.scale = (1.08, 1.03, 0.05); bpy.ops.object.transform_apply(scale=True); bisel(t, 0.02); poner(t, AMAR2, False)
# perillas
for x in (-0.36, -0.2):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.055, depth=0.05, location=(x, -0.405, 1.1), rotation=(math.radians(90), 0, 0)); poner(bpy.context.object, AMAR2)
# panel
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.22, -0.4, 1.1)); p = bpy.context.object; p.scale = (0.42, 0.02, 0.1); bpy.ops.object.transform_apply(scale=True); poner(p, AMAR2, False)
# puerta: marco y vidrio
bpy.ops.mesh.primitive_torus_add(major_radius=0.36, minor_radius=0.06, major_segments=96, minor_segments=24, location=(-0.02, -0.42, 0.55), rotation=(math.radians(90), 0, 0)); poner(bpy.context.object, GRIS2)
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.33, depth=0.04, location=(-0.02, -0.41, 0.55), rotation=(math.radians(90), 0, 0)); poner(bpy.context.object, VIDRIO)
# ropa roja saliendo de la puerta
bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.2, location=(0.02, -0.5, 0.36)); r = bpy.context.object; r.scale = (1.0, 0.45, 0.7); r.rotation_euler = (0.3, 0.2, 0.4); poner(r, ROJO)
bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.14, location=(0.14, -0.56, 0.2)); r2 = bpy.context.object; r2.scale = (0.8, 0.5, 1.1); poner(r2, ROJO)
# caja de detergente arriba
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.25, 0.15, 1.52)); d = bpy.context.object; d.scale = (0.26, 0.13, 0.46); d.rotation_euler = (0, 0, math.radians(14)); bpy.ops.object.transform_apply(scale=True); bisel(d, 0.015, 2); poner(d, AZUL, False)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.25, 0.15, 1.765)); d2 = bpy.context.object; d2.scale = (0.27, 0.14, 0.04); d2.rotation_euler = (0, 0, math.radians(14)); poner(d2, BLANCO, False)
# canasta con ropa
bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.42, depth=0.62, location=(0.72, -0.62, 0.31)); k = bpy.context.object
k.data.vertices.foreach_get
for v in k.data.vertices:
    if v.co.z > 0: v.co.x *= 1.08; v.co.y *= 1.08
poner(k, CANASTA)
for (x, y, z, rad, m) in [(0.62, -0.62, 0.66, 0.2, MENTA), (0.84, -0.55, 0.68, 0.18, ROJO), (0.74, -0.78, 0.66, 0.16, BLANCO), (0.92, -0.75, 0.63, 0.13, MENTA)]:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=rad, location=(x, y, z)); o = bpy.context.object; o.scale = (1.2, 1.0, 0.6); poner(o, m)
# calcetín rayado y ropa en el piso
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=0.09, depth=0.62, location=(-0.62, -0.78, 0.12), rotation=(math.radians(84), 0, math.radians(-28))); poner(bpy.context.object, CALCE)
bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=0.11, location=(-0.4, -1.0, 0.1)); o = bpy.context.object; o.scale = (1.5, 0.9, 0.75); o.rotation_euler = (0, 0, math.radians(-28)); poner(o, CALCE)
def tela(loc, esc, rotz, m):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc); o = bpy.context.object; o.scale = esc; o.rotation_euler = (0, 0, math.radians(rotz)); bpy.ops.object.transform_apply(scale=True); bisel(o, 0.035, 3); poner(o, m, False); return o
tela((-0.82, -0.45, 0.05), (0.5, 0.32, 0.07), 18, ROJO)
tela((-0.8, -0.47, 0.13), (0.44, 0.28, 0.07), 10, BLANCO)
tela((-0.95, -0.85, 0.05), (0.36, 0.26, 0.07), -25, MENTA)

NEGRO = bpy.data.materials.new('contorno'); NEGRO.use_nodes = True; tn = NEGRO.node_tree; tn.nodes.clear()
o_ = tn.nodes.new('ShaderNodeOutputMaterial'); em = tn.nodes.new('ShaderNodeEmission'); em.inputs['Color'].default_value = (0.02, 0.025, 0.05, 1)
tr = tn.nodes.new('ShaderNodeBsdfTransparent'); mx = tn.nodes.new('ShaderNodeMixShader'); ge = tn.nodes.new('ShaderNodeNewGeometry')
lp = tn.nodes.new('ShaderNodeLightPath'); inv = tn.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1; tn.links.new(lp.outputs['Is Camera Ray'], inv.inputs[1]); mxv = tn.nodes.new('ShaderNodeMath'); mxv.operation = 'MAXIMUM'; tn.links.new(ge.outputs['Backfacing'], mxv.inputs[0]); tn.links.new(inv.outputs[0], mxv.inputs[1]); tn.links.new(mxv.outputs[0], mx.inputs[0]); tn.links.new(em.outputs[0], mx.inputs[1]); tn.links.new(tr.outputs[0], mx.inputs[2]); tn.links.new(mx.outputs[0], o_.inputs['Surface'])
for ob in [o for o in bpy.data.objects if o.type == 'MESH' and o.name != 'piso']:
    ob.data.materials.append(NEGRO); so = ob.modifiers.new('contorno', 'SOLIDIFY'); so.thickness = 0.022; so.offset = 1; so.use_flip_normals = True; so.material_offset = len(ob.data.materials) - 1; so.use_rim = False
bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0)); piso = bpy.context.object; piso.is_shadow_catcher = True; piso.name = 'piso'
# cámara de tres cuartos, como en el letrero
bpy.ops.object.camera_add(location=(-3.2, -6.2, 3.3)); cam = bpy.context.object; sc.camera = cam
cam.data.lens = 70
dirv = Vector((0.02, -0.2, 0.75)) - cam.location; cam.rotation_euler = dirv.to_track_quat('-Z', 'Y').to_euler()
# luz
bpy.ops.object.light_add(type='SUN', location=(0, 0, 5)); sol = bpy.context.object; sol.data.energy = 3.2; sol.rotation_euler = (math.radians(42), math.radians(-18), math.radians(-35))
w = bpy.data.worlds.new('mundo'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.9
# render: Cycles en CPU, fondo transparente y contornos negros de caricatura (Freestyle)
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 48; sc.cycles.use_denoising = True
sc.render.film_transparent = True; sc.render.resolution_x = 900; sc.render.resolution_y = 900
sc.view_settings.view_transform = 'Standard'
sc.render.use_freestyle = False
ls = sc.view_layers[0].freestyle_settings.linesets[0] if sc.view_layers[0].freestyle_settings.linesets else sc.view_layers[0].freestyle_settings.linesets.new('lineas')
ls.select_by_visibility = True; ls.select_silhouette = True; ls.select_border = True; ls.select_crease = True
sc.render.filepath = OUT; sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
bpy.ops.render.render(write_still=True)
print('listo', OUT)
