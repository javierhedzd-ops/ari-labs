// El helado 3D de la portada de la heladería: cono de barquillo y dos bolas cremosas que caen y rebotan al abrir;
// después gira despacio y sigue el dedo. Se dibuja dentro de la caja .cono; si no hay 3D, se queda el cono dibujado.
import * as THREE from '../../vendor/three/three.module.min.js';
import { RoomEnvironment } from '../../vendor/three/RoomEnvironment.js';

const caja = document.querySelector('.cono');
try { if (caja) arrancar(caja); } catch (e) { console.warn('Sin 3D:', e && e.message); }

function arrancar(caja) {
  const lienzo = document.createElement('canvas');
  const render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true });
  if (!render.getContext()) throw new Error('sin WebGL');
  render.setPixelRatio(Math.min(devicePixelRatio, 2));
  render.toneMapping = THREE.ACESFilmicToneMapping; render.toneMappingExposure = 0.92;
  render.outputColorSpace = THREE.SRGBColorSpace;
  lienzo.setAttribute('aria-hidden', 'true');
  caja.appendChild(lienzo); caja.classList.add('con3d');

  const escena = new THREE.Scene();
  escena.environment = new THREE.PMREMGenerator(render).fromScene(new RoomEnvironment(), 0.04).texture;
  const camara = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  const luz = new THREE.DirectionalLight(0xffffff, 1.6); luz.position.set(3, 6, 5); escena.add(luz);
  const relleno = new THREE.DirectionalLight(0xfff0f4, 0.7); relleno.position.set(-1, -2, 6); escena.add(relleno);
  escena.add(new THREE.HemisphereLight(0xfff4f7, 0xf3b7c9, 0.75));

  // el cono: barquillo color galleta con su cuadrícula
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#e9b872'; x.fillRect(0, 0, 256, 256); x.strokeStyle = 'rgba(140,85,30,.55)'; x.lineWidth = 9;
  for (let i = -256; i < 512; i += 42) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 256, 256); x.stroke(); x.beginPath(); x.moveTo(i + 256, 0); x.lineTo(i, 256); x.stroke(); }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(3, 2); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const perfil = [new THREE.Vector2(0.02, -2.6), new THREE.Vector2(0.86, 0), new THREE.Vector2(0.98, 0.08), new THREE.Vector2(0.98, 0.26), new THREE.Vector2(0.88, 0.3)];
  const grupo = new THREE.Group(); escena.add(grupo);
  grupo.add(new THREE.Mesh(new THREE.LatheGeometry(perfil, 64), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75, side: THREE.DoubleSide })));

  // las bolas: cremosas, con la orilla de abajo ondulada y la base aplastada
  function bola(color, r) {
    const g = new THREE.SphereGeometry(r, 96, 64), p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const a = Math.atan2(v.z, v.x), y = v.y / r;
      let k = 1 + Math.sin(v.x * 5.1 + v.y * 3.7) * Math.sin(v.z * 4.3) * 0.025;
      if (y < -0.15) k *= 1 + (Math.sin(a * 9) * 0.5 + 0.5) * 0.12 * Math.min(1, (-0.15 - y) * 3);
      v.multiplyScalar(k);
      if (v.y < -r * 0.55) v.y = -r * 0.55 + (v.y + r * 0.55) * 0.25;
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return new THREE.Mesh(g, new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, sheen: 0.35, sheenRoughness: 0.6, sheenColor: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.4), clearcoat: 0.25, clearcoatRoughness: 0.45 }));
  }
  // la bola de arriba lleva el color del sabor del día
  const colorDelDia = [0xfaf6ee, 0xf3efe3, 0xf3d27a, 0xf2b84b, 0xf6c96b, 0xe2557f, 0xf4a08a][new Date().getDay()];
  const b1 = bola(0xe2557f, 1.02), b2 = bola(colorDelDia, 0.86);   // abajo fresa; arriba, el sabor del día
  grupo.add(b1, b2);
  const chispas = ['#ffffff', '#ffb3cc', '#e9b872', '#9c1f4c'];
  for (let i = 0; i < 26; i++) {
    const ch = new THREE.Mesh(new THREE.CapsuleGeometry(0.034, 0.16, 4, 8), new THREE.MeshStandardMaterial({ color: chispas[i % 4], roughness: 0.5 }));
    const th = (i * 2.399) % (Math.PI * 2), ph = 0.15 + (i % 7) / 7 * 0.75;
    const d = new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)).multiplyScalar(0.87);
    ch.position.copy(d); ch.lookAt(d.clone().multiplyScalar(2)); ch.rotateX(Math.PI / 2); ch.rotateZ(i * 1.3);
    b2.add(ch);
  }

  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const caida = [{ m: b1, meta: 0.62, y: 6.6, v: 0, retraso: 0.3, squash: 0, quieta: quieto }, { m: b2, meta: 1.98, y: 7.98, v: 0, retraso: 0.9, squash: 0, quieta: quieto }];
  if (quieto) caida.forEach(o => { o.y = o.meta; });

  // la cámara encuadra el helado completo (de la punta del cono a las chispitas) dentro de su caja
  function medir() {
    const w = caja.clientWidth, h = caja.clientHeight;
    render.setSize(w, h, false); camara.aspect = w / h;
    let alto = 6.1; if (alto * camara.aspect < 2.6) alto = 2.6 / camara.aspect;
    camara.position.set(0, 0.15, alto / (2 * Math.tan(THREE.MathUtils.degToRad(camara.fov / 2))));
    camara.updateProjectionMatrix();
  }
  medir(); addEventListener('resize', medir);
  let px = 0, py = 0, tx = 0, ty = 0; const incl = new THREE.Vector2(), vel = new THREE.Vector2();
  addEventListener('pointermove', e => { tx = e.clientX / innerWidth - 0.5; ty = e.clientY / innerHeight - 0.5; }, { passive: true });

  // solo se anima mientras se ve (ahorra batería)
  let visible = true;
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(caja);
  const reloj = new THREE.Clock(); let antes = 0;
  render.setAnimationLoop(() => {
    if (!visible) return;
    const t = reloj.getElapsedTime(), dt = Math.min(0.033, Math.max(0.001, t - antes)); antes = t;
    caida.forEach(o => {
      if (o.quieta || t < o.retraso) { o.m.position.y = o.y; o.m.visible = quieto || t >= o.retraso; return; }
      o.m.visible = true; o.v -= 26 * dt; o.y += o.v * dt;
      if (o.y <= o.meta) { o.y = o.meta; if (Math.abs(o.v) > 1.2) { o.squash = Math.min(0.28, Math.abs(o.v) * 0.022); o.v = -o.v * 0.32; } else { o.v = 0; o.quieta = true; } }
      o.squash *= Math.pow(0.86, dt * 60);
      o.m.position.y = o.y; o.m.scale.set(1 + o.squash * 0.6, 1 - o.squash, 1 + o.squash * 0.6);
    });
    px += (tx - px) * 0.06; py += (ty - py) * 0.06;
    vel.x += (py * 0.5 - incl.x) * 0.03; vel.y += (px * 0.9 - incl.y) * 0.03; vel.multiplyScalar(0.88); incl.add(vel);
    grupo.rotation.set(0.12 + incl.x, (quieto ? 0.4 : t * 0.35) + incl.y, Math.sin(t * 0.7) * 0.03);
    grupo.position.y = quieto ? 0 : Math.sin(t * 1.1) * 0.06;
    render.render(escena, camara);
  });
}
