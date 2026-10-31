// El hielo de Ari Labs: una sola escena 3D detrás de toda la web.
// Al fondo, la luz quebrada por el hielo (cáusticas). Al frente, un hielo real con forma de diamante en bruto
// que refracta ese fondo, con 7 astillas en órbita. Al abrir, los pedazos vuelan al centro y lo forman (1 s);
// al bajar un poco, se rompe en cámara lenta (4.5 s) y los pedazos flotan por toda la web esquivando los textos;
// si el visitante regresa arriba, se vuelve a armar (2.6 s). Si algo falla, la web se ve completa sin el 3D.
import * as THREE from './vendor/three/three.module.min.js';

const lienzo = document.getElementById('escena');
try { arrancar(); } catch (err) { document.documentElement.classList.add('sin3d'); console.warn('Sin 3D:', err && err.message); }

function arrancar() {
  const render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: 'high-performance' });
  if (!render.getContext()) throw new Error('sin WebGL');
  const movilAlAbrir = innerWidth < 760;
  render.setPixelRatio(Math.min(devicePixelRatio, movilAlAbrir ? 1.5 : 1.75));
  const escena = new THREE.Scene();

  // Un "estudio" chiquito que solo sirve para los brillos de agua (tiras de luz que se reflejan en las caras).
  const cielo = new THREE.Scene();
  cielo.add(new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), new THREE.ShaderMaterial({
    side: THREE.BackSide,
    vertexShader: 'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 p; void main(){ vec3 d = normalize(p); float a = atan(d.z, d.x);
      vec3 noche = vec3(0.03,0.06,0.12), artico = vec3(0.20,0.55,0.98), menta = vec3(0.55,0.90,0.84), hielo = vec3(0.90,0.96,1.0);
      vec3 c = mix(noche, artico, smoothstep(-0.6, 0.1, d.y)); c = mix(c, hielo, smoothstep(0.35, 0.9, d.y));
      c = mix(c, menta, smoothstep(0.6, 1.0, sin(a * 3.0)) * 0.5 * (1.0 - abs(d.y)));
      c = mix(c, noche, smoothstep(0.75, 1.0, sin(a * 5.0 + 1.3)) * 0.7);
      gl_FragColor = vec4(c, 1.0); }`
  })));
  [[0, 7, 0, 8, 1.2], [-7, 2, 2, 1, 6], [7, 1, -2, 1, 6], [2, -3, 7, 6, 0.8], [-3, 4, -6, 0.8, 0.8], [5, 5, 5, 0.6, 0.6]].forEach(([x, y, z, w, h]) => {
    const tira = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 1, 1).multiplyScalar(4), side: THREE.DoubleSide }));
    tira.position.set(x, y, z); tira.lookAt(0, 0, 0); cielo.add(tira);
  });
  const cubo = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const camCubo = new THREE.CubeCamera(0.1, 50, cubo); cielo.add(camCubo);
  camCubo.update(render, cielo);

  // El material del hielo: transparente (refracta la escena real, índice 1.31), azul tenue, grietas finas,
  // burbujas, centro un poco nublado, orillas azules que definen la forma sobre el fondo claro y brillos de agua.
  const cuboHielo = new THREE.WebGLCubeRenderTarget(160, { type: THREE.HalfFloatType, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter });
  const matHielo = new THREE.ShaderMaterial({
    uniforms: { env: { value: cuboHielo.texture }, brillo: { value: cubo.texture } },
    vertexShader: `varying vec3 vN; varying vec3 vP; varying vec3 vO;
      void main(){ vO = position; vec4 w = modelMatrix * vec4(position, 1.0); vP = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform samplerCube env; uniform samplerCube brillo; varying vec3 vN; varying vec3 vP; varying vec3 vO;
      float h(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
        return mix(mix(mix(h(i), h(i+vec3(1,0,0)), f.x), mix(h(i+vec3(0,1,0)), h(i+vec3(1,1,0)), f.x), f.y),
                   mix(mix(h(i+vec3(0,0,1)), h(i+vec3(1,0,1)), f.x), mix(h(i+vec3(0,1,1)), h(i+vec3(1,1,1)), f.x), f.y), f.z); }
      float fbm(vec3 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ v += a * n3(p); p *= 2.03; a *= 0.5; } return v; }
      float grietas(vec3 q){
        float w = (fbm(q * 2.0) - 0.5) * 0.35, g = 0.0;
        g += smoothstep(0.018, 0.0, abs(dot(q, normalize(vec3(0.8, 0.5, 0.2))) - 0.18 + w)) * smoothstep(0.45, 0.7, fbm(q * 1.7 + 3.0));
        g += smoothstep(0.014, 0.0, abs(dot(q, normalize(vec3(-0.3, 0.9, 0.4))) + 0.12 + w)) * smoothstep(0.5, 0.75, fbm(q * 1.9 + 9.0));
        g += smoothstep(0.012, 0.0, abs(dot(q, normalize(vec3(0.2, -0.4, 0.9))) - 0.05 + w)) * smoothstep(0.55, 0.8, fbm(q * 2.3 + 17.0));
        return g;
      }
      float burbujas(vec3 q){ return smoothstep(0.86, 0.9, n3(q * 16.0)) + smoothstep(0.93, 0.95, n3(q * 31.0 + 5.0)) * 0.7; }
      void main(){
        vec3 n = normalize(gl_FrontFacing ? vN : -vN);
        vec3 gr = vec3(n3(vO*2.6), n3(vO*2.6+5.3), n3(vO*2.6+11.7)) - 0.5;
        vec3 fino = vec3(n3(vO*26.0), n3(vO*26.0+3.1), n3(vO*26.0+7.7)) - 0.5;
        n = normalize(n + gr * 0.5 + fino * 0.05);
        vec3 v = normalize(vP - cameraPosition);
        float cosv = clamp(dot(-v, n), 0.0, 1.0);
        float fres = 0.02 + 0.98 * pow(1.0 - cosv, 5.0);
        vec3 detras;
        detras.r = textureCube(env, refract(v, n, 1.0 / 1.305)).r;
        detras.g = textureCube(env, refract(v, n, 1.0 / 1.310)).g;
        detras.b = textureCube(env, refract(v, n, 1.0 / 1.318)).b;
        vec3 rr = refract(v, n, 1.0 / 1.31);
        float dentro = 0.0, nube = 0.0;
        for (int k = 0; k < 2; k++){
          vec3 q = vO + rr * (0.2 + float(k) * 0.4);
          dentro += grietas(q) * 0.55 + burbujas(q) * 0.5;
          nube += smoothstep(1.1, 0.15, length(q * vec3(1.0, 0.85, 1.0))) * (0.55 + 0.45 * fbm(q * 3.0));
        }
        nube /= 2.0;
        vec3 c = detras * vec3(0.86, 0.93, 1.0);
        c = mix(c, vec3(0.97, 0.985, 1.0), nube * 0.42);
        c += vec3(1.0) * dentro * 0.55;
        vec3 refl = textureCube(brillo, reflect(v, n)).rgb;
        float luces = smoothstep(0.75, 1.4, dot(refl, vec3(0.333)));
        c = mix(c, textureCube(env, reflect(v, n)).rgb, fres * 0.6) + vec3(1.0) * luces * (0.35 + fres);
        c = mix(c, c * vec3(0.52, 0.72, 0.93), pow(1.0 - cosv, 1.6) * 0.75);
        gl_FragColor = vec4(c, 1.0);
      }`
  });

  const camara = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camara.position.set(0, 0, 9);

  // ---- fondo: cáusticas claras en blanco glaciar, plata, menta y azul ártico ----
  const fondoMat = new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 }, m: { value: new THREE.Vector2(0.5, 0.5) }, asp: { value: 1 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `
      varying vec2 vUv; uniform float t; uniform vec2 m; uniform float asp;
      float causticas(vec2 uv, float tt){
        vec2 p = mod(uv * 6.2831 * 1.6, 6.2831) - 250.0; vec2 i = p; float c = 1.0; float fuerza = 0.0045;
        for (int n = 0; n < 5; n++){
          float k = tt * (1.0 - (3.5 / float(n + 1)));
          i = p + vec2(cos(k - i.x) + sin(k + i.y), sin(k - i.y) + cos(k + i.x));
          c += 1.0 / length(vec2(p.x / (sin(i.x + k) / fuerza), p.y / (cos(i.y + k) / fuerza)));
        }
        c /= 5.0; c = 1.17 - pow(c, 1.4); return pow(abs(c), 7.0);
      }
      void main(){
        vec2 uv = vUv; uv.x *= asp; uv += (m - 0.5) * 0.05;
        float tt = t * 0.32;
        float r = causticas(uv + vec2(0.004, 0.0), tt);
        float g = causticas(uv, tt);
        float b = causticas(uv - vec2(0.004, 0.0), tt);
        vec3 base = mix(vec3(0.85,0.90,0.94), vec3(0.94,0.96,0.98), vUv.y);
        base = mix(base, vec3(0.70,0.89,0.86), smoothstep(0.55, 1.0, sin(vUv.x * 2.2 + t * 0.05) * 0.5 + 0.5) * 0.22);
        vec3 col = base + vec3(r * 0.95, g, b * 1.08) * vec3(0.55, 0.62, 0.72);
        col = mix(col, vec3(0.39,0.71,1.0), b * 0.12);
        gl_FragColor = vec4(col, 1.0);
      }`
  });
  const fondo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), fondoMat);
  fondo.position.z = -6; escena.add(fondo);
  escena.background = new THREE.Color().setRGB(0.90, 0.94, 0.965, THREE.LinearSRGBColorSpace);
  const camHielo = new THREE.CubeCamera(0.1, 40, cuboHielo); escena.add(camHielo);

  // ---- la forma: octaedro irregular con caras astilladas, golpes y forma chueca (cada pedazo distinto) ----
  let semilla = 23; const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
  function octaedroBruto(tam, irregular, detalle = 5) {
    const g = new THREE.IcosahedronGeometry(1, detalle), p = g.attributes.position, v = new THREE.Vector3();
    const sesgo = new THREE.Vector3(azar() - 0.5, azar() - 0.5, azar() - 0.5).multiplyScalar(0.4);
    const f1 = 3 + azar() * 4, f2 = 3 + azar() * 4, f3 = 3 + azar() * 4, ph1 = azar() * 6, ph2 = azar() * 6, ph3 = azar() * 6;
    const estira = new THREE.Vector3(0.82 + azar() * 0.36, 0.9 + azar() * 0.4, 0.8 + azar() * 0.36);
    const cortes = [];
    for (let k = 0; k < 5 + Math.floor(azar() * 4); k++) cortes.push({ n: new THREE.Vector3(azar() - 0.5, azar() - 0.5, azar() - 0.5).normalize(), d: 0.62 + azar() * 0.35 });
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).normalize();
      const forma = v.clone().divideScalar(Math.abs(v.x) + Math.abs(v.y) + Math.abs(v.z)).multiplyScalar(1.55).lerp(v, 0.42);
      const bulto = 1 + (Math.sin(v.x * f1 + ph1) * Math.sin(v.y * f2 + ph2) * Math.sin(v.z * f3 + ph3)) * irregular
                      + Math.sin(v.x * 11.0 + ph2) * Math.sin(v.z * 9.0 + ph1) * irregular * 0.25;
      forma.multiplyScalar(bulto).add(sesgo.clone().multiplyScalar(v.y));
      forma.x *= estira.x; forma.y *= estira.y; forma.z *= estira.z;
      for (const c of cortes) { const d = forma.dot(c.n); if (d > c.d) forma.addScaledVector(c.n, -(d - c.d) * 0.92); }
      p.setXYZ(i, forma.x * tam, forma.y * tam, forma.z * tam);
    }
    g.computeVertexNormals(); g.computeBoundingSphere();
    return g;
  }
  const grupo = new THREE.Group(); escena.add(grupo);
  const diamante = new THREE.Mesh(octaedroBruto(1.05, 0.14), matHielo);
  grupo.add(diamante);
  const radioGrande = diamante.geometry.boundingSphere.radius;

  // destellos que parpadean sobre las caras, y el destello suave de la bienvenida
  const textura = (paradas, cruz) => {
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); paradas.forEach(([o, col]) => g.addColorStop(o, col));
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    if (cruz) { x.fillStyle = 'rgba(255,255,255,.95)'; x.fillRect(31, 2, 2, 60); x.fillRect(2, 31, 60, 2); }
    return new THREE.CanvasTexture(c);
  };
  const estrella = textura([[0, 'rgba(255,255,255,1)'], [0.15, 'rgba(220,240,255,.9)'], [1, 'rgba(255,255,255,0)']], true);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: textura([[0, 'rgba(255,255,255,.95)'], [0.35, 'rgba(214,236,255,.55)'], [1, 'rgba(214,236,255,0)']]), transparent: true, depthWrite: false, opacity: 0 }));
  grupo.add(halo);
  const pos = diamante.geometry.attributes.position, dest = [];
  for (let i = 0; i < 14; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: estrella, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.position.fromBufferAttribute(pos, Math.floor(azar() * pos.count)).multiplyScalar(1.01);
    sp.userData = { f: azar() * 6.28, v: 1.2 + azar() * 2.2, s: 0.12 + azar() * 0.16 };
    diamante.add(sp); dest.push(sp);
  }

  // 7 astillas, cada una con su carril, inclinación y velocidad: nunca se tocan
  const astillas = [], carriles = [0, 3, 1, 5, 2, 6, 4];
  for (let i = 0; i < 7; i++) {
    const a = new THREE.Mesh(octaedroBruto(0.17 + azar() * 0.07, 0.22, 3), matHielo);
    a.userData = {
      radio: a.geometry.boundingSphere.radius, carril: carriles[i],
      v: (0.16 + azar() * 0.12) * (i % 2 ? 1 : -1), f: (i / 7) * Math.PI * 2 + azar() * 0.4,
      inclina: new THREE.Euler((azar() - 0.5) * 1.1, 0, (azar() - 0.5) * 0.9), giro: (azar() - 0.5) * 2, ret: azar(),
      sx: [0.82, -0.85, 0.15, -0.3, 0.6, -0.6, 0.95][i], sy: [-0.75, 0.7, -0.2, -0.85, 0.35, 0.05, 0.6][i],
    };
    a.position.set(99, 99, 0);
    astillas.push(a); escena.add(a);
  }
  const meta = new THREE.Vector3(), dif = new THREE.Vector3(), tmp = new THREE.Vector3();

  // los pedazos de la rotura: 10 en teléfono, 20 en compu, repartidos en una rejilla movida al azar
  const pedazos = [], nPedazos = movilAlAbrir ? 10 : 20, cols = movilAlAbrir ? 3 : 5;
  for (let i = 0; i < nPedazos; i++) {
    const pz = new THREE.Mesh(octaedroBruto(0.16 + azar() * 0.2, 0.22, 3), matHielo);
    const u = azar() * 2 - 1, th = azar() * Math.PI * 2, rr = Math.cbrt(azar()) * radioGrande * 0.6;
    const col = i % cols, fila = Math.floor(i / cols), filas = Math.ceil(nPedazos / cols);
    pz.userData = {
      radio: pz.geometry.boundingSphere.radius,
      ret: azar(), dentro: new THREE.Vector3(Math.sqrt(1 - u * u) * Math.cos(th), u, Math.sqrt(1 - u * u) * Math.sin(th)).multiplyScalar(rr),
      sx: ((col + 0.5) / cols) * 2 - 1 + (azar() - 0.5) * 0.25, sy: ((fila + 0.5) / filas) * 2 - 1 + (azar() - 0.5) * 0.25,
      z: -3.2 + azar() * 3.6, deriva: 0.5 + azar() * 0.9, giro: new THREE.Vector3(azar() - 0.5, azar() - 0.5, azar() - 0.5).multiplyScalar(2),
      rot: new THREE.Euler(azar() * 6, azar() * 6, azar() * 6),
    };
    pz.visible = false; pedazos.push(pz); escena.add(pz);
  }
  const todos = pedazos.concat(astillas);

  // ---- lo que el hielo no debe tapar: títulos, frases sueltas y botones (las tarjetas de vidrio no: detrás se ven bonitos) ----
  const textos = [...document.querySelectorAll('[data-esquiva]')];
  const cajas = [];
  function medirTextos() {
    cajas.length = 0;
    for (const el of textos) {
      const r0 = el.getBoundingClientRect();
      if (r0.bottom < -60 || r0.top > innerHeight + 60) continue;
      // el ancho real de las letras, no el de la caja
      const rango = document.createRange(); rango.selectNodeContents(el);
      const r = rango.getBoundingClientRect();
      cajas.push({ l: r.left - 14, r: r.right + 14, t: r.top - 12, b: r.bottom + 12 });
    }
  }
  const esq = new THREE.Vector3();
  let kEsq = 0.12;   // cuánto se acerca cada cuadro a su salida (se ajusta a los cuadros por segundo)
  function esquivarTexto(pz, prof) {
    esq.copy(pz.position).project(camara);
    const px = (esq.x + 1) / 2 * innerWidth, py = (1 - esq.y) / 2 * innerHeight;
    const pxPorUnidad = innerWidth / (2 * borde.medioAncho * prof);
    const rp = pz.userData.radio * pz.scale.x * pxPorUnidad * 1.1;
    const u = pz.userData; let mx2 = 0, my2 = 0;
    for (const c of cajas) {
      if (px + rp > c.l && px - rp < c.r && py + rp > c.t && py - rp < c.b) {
        // la salida más corta que quepa en la pantalla; se queda con ella hasta salir (sin brincos)
        const op = { izq: [(c.l - rp) - px, 0], der: [(c.r + rp) - px, 0], arr: [0, (c.t - rp) - py], aba: [0, (c.b + rp) - py] };
        if (!u.salida) {
          const validas = Object.keys(op).filter(k => (k !== 'izq' || c.l - rp * 2 > 0) && (k !== 'der' || c.r + rp * 2 < innerWidth));
          validas.sort((a, b) => Math.hypot(...op[a]) - Math.hypot(...op[b]));
          u.salida = validas[0];
        }
        [mx2, my2] = op[u.salida];
        break;
      }
    }
    if (mx2 === 0 && my2 === 0) u.salida = null;
    u.esqX = (u.esqX || 0) + (mx2 / pxPorUnidad - (u.esqX || 0)) * kEsq;
    u.esqY = (u.esqY || 0) + (-my2 / pxPorUnidad - (u.esqY || 0)) * kEsq;
    pz.position.x += u.esqX; pz.position.y += u.esqY;
  }

  // dónde están el título y la barra, pasado a coordenadas 3D (plano z = 0)
  const borde = { medioAncho: 4, medioAlto: 2.5, textoDer: 0, textoArriba: -1, techo: 2 };
  const titulo = document.querySelector('h1'), barra = document.querySelector('.barra');
  function medirBordes() {
    borde.medioAlto = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) * camara.position.z;
    borde.medioAncho = borde.medioAlto * camara.aspect;
    const t = titulo.getBoundingClientRect(), b = barra.getBoundingClientRect(), y0 = scrollY;
    // el título se mide como si estuviera arriba del todo (el hielo vive en la portada)
    borde.textoDer = (t.right / innerWidth * 2 - 1) * borde.medioAncho;
    borde.textoArriba = -((t.top + y0) / innerHeight * 2 - 1) * borde.medioAlto;
    borde.techo = -((b.bottom + 34) / innerHeight * 2 - 1) * borde.medioAlto;
  }

  function medir() {
    render.setSize(innerWidth, innerHeight, false); camara.aspect = innerWidth / innerHeight; camara.updateProjectionMatrix();
    const alto = 2 * Math.tan(THREE.MathUtils.degToRad(camara.fov / 2)) * (camara.position.z - fondo.position.z);
    fondo.scale.set(alto * camara.aspect, alto, 1);
    fondoMat.uniforms.asp.value = camara.aspect;
    medirBordes();
  }
  medir(); addEventListener('resize', medir);
  document.fonts && document.fonts.ready.then(medirBordes);

  let mx = 0.5, my = 0.5, tx = 0.5, ty = 0.5;
  const incl = new THREE.Vector2(), vel = new THREE.Vector2();
  addEventListener('pointermove', e => { tx = e.clientX / innerWidth; ty = 1 - e.clientY / innerHeight; }, { passive: true });
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reloj = new THREE.Clock();
  const suave = k => k * k * (3 - 2 * k);

  // Estado del hielo (va por tiempo, no por la velocidad del scroll). Cada pedazo lleva su propio avance (e, de 0 =
  // dentro del hielo a 1 = repartido) con un desfase propio (ret): la rotura y el armado no se mueven como un bloque.
  // El hielo grande no desaparece de golpe: se encoge mientras salen los pedazos y crece cuando llegan.
  let estado = 'armando', t0 = 0, durArmar = 1.1, cuadro = 0, tFormado = -9, tRompe = -9, tPrev = 0, escalaDiam = 0;
  todos.forEach(o => { o.userData.e = 1; o.userData.desde = 1; });
  if (quieto || scrollY / innerHeight > 0.08) {
    estado = scrollY / innerHeight > 0.08 ? 'roto' : 'entero';
    todos.forEach(o => { o.userData.e = estado === 'roto' ? 1 : 0; });
    escalaDiam = estado === 'entero' ? 1 : 0;
  }
  const lim = k => Math.min(1, Math.max(0, k)), salida4 = k => 1 - Math.pow(1 - k, 4);
  // calidad automática: si el teléfono no llega a ~42 cuadros por segundo, baja la resolución un poco (sin tirones)
  let pr = render.getPixelRatio(), sumaDt = 0, nDt = 0;

  render.setAnimationLoop(() => {
    const t = reloj.getElapsedTime(), tv = quieto ? 8 : t;   // tv: tiempo visual (quieto con "reducir movimiento")
    const dt = Math.min(0.05, Math.max(0.001, t - tPrev)); tPrev = t;
    const f = dt * 60, k = a => 1 - Math.pow(1 - a, f);     // suavizados iguales a 30, 60 o 120 cuadros por segundo
    kEsq = k(0.12);
    if (cuadro > 60 && !document.hidden) {
      sumaDt += dt;
      if (++nDt === 90) { const prom = sumaDt / nDt; sumaDt = 0; nDt = 0; if (prom > 0.024 && pr > 1) { pr = Math.max(1, pr - 0.25); render.setPixelRatio(pr); medir(); } }
    }
    mx += (tx - mx) * k(0.05); my += (ty - my) * k(0.05);
    fondoMat.uniforms.t.value = tv; fondoMat.uniforms.m.value.set(mx, my);
    // el hielo sigue el dedo con un resorte suave (se pasa un poquito y regresa)
    vel.x += ((my - 0.5) * -0.9 - incl.x) * 0.02 * f; vel.y += ((mx - 0.5) * 1.3 - incl.y) * 0.02 * f;
    vel.multiplyScalar(Math.pow(0.9, f)); incl.addScaledVector(vel, f);
    grupo.rotation.set(0.18 + Math.sin(tv * 0.33) * 0.12 + incl.x, tv * 0.22 + incl.y, Math.sin(tv * 0.21) * 0.1);
    const movil = innerWidth < 760;
    if (cuadro % 30 === 0) medirBordes();
    const escala = (movil ? 0.56 : 0.74) * (1 + Math.sin(tv * 1.1) * 0.015);

    const yr = scrollY / innerHeight;
    if ((estado === 'entero' || estado === 'armando') && yr > 0.08) { estado = 'rompiendo'; t0 = t; tRompe = t; todos.forEach(o => { o.userData.desde = o.userData.e; }); }
    if ((estado === 'rompiendo' || estado === 'roto') && yr < 0.03) { estado = 'armando'; t0 = t; durArmar = 2.6; todos.forEach(o => { o.userData.desde = o.userData.e; }); }
    const kr = lim((t - t0) / (estado === 'rompiendo' ? 4.5 : durArmar));
    let eMax = 0;
    todos.forEach(o => {
      const d = o.userData;
      if (quieto) d.e = yr > 0.08 ? 1 : 0;
      // rotura: salen rápido y se frenan en cámara lenta; cada uno arranca con hasta 0.3 s de diferencia
      else if (estado === 'rompiendo') d.e = d.desde + (1 - d.desde) * salida4(lim((kr - d.ret * 0.06) / (1 - d.ret * 0.06)));
      // armado: todos salen juntos y llegan escalonados, uno tras otro
      else if (estado === 'armando') d.e = d.desde * (1 - suave(lim(kr * (1 + d.ret * 0.3))));
      else d.e = estado === 'roto' ? 1 : 0;
      eMax = Math.max(eMax, d.e);
    });
    if (quieto) escalaDiam = yr > 0.08 ? 0 : 1;
    else if (estado === 'rompiendo') escalaDiam = Math.min(escalaDiam, 1 - suave(lim((t - t0) / 0.55)));
    else if (estado === 'armando') escalaDiam = suave(lim((kr - 0.74) / 0.26));
    else escalaDiam = estado === 'entero' ? 1 : 0;
    if (estado === 'rompiendo' && kr >= 1) estado = 'roto';
    if (estado === 'armando' && kr >= 1) { estado = 'entero'; tFormado = t; }

    const rG = radioGrande * escala, hueco = movil ? 0.7 : 1.15;
    let x, y;
    // compu: arriba a la derecha (el título va abajo a la izquierda); teléfono: arriba, entre la barra y el título
    if (!movil) { x = Math.min(borde.medioAncho - rG - hueco * 0.8, 2.5); y = Math.min(borde.techo - rG - 0.35, Math.max(1.0, borde.textoArriba + rG + 0.2)); }
    else { x = 0; y = (borde.techo + borde.textoArriba) / 2; }
    // la portada se va hacia arriba al bajar: el hielo entero también (antes de romperse)
    grupo.position.set(x, y + Math.sin(tv * 0.8) * 0.06 + yr * borde.medioAlto * 2, 0);
    grupo.scale.setScalar(escala);
    if (!quieto) diamante.rotation.y += 0.09 * dt;
    diamante.scale.setScalar(Math.max(0.0001, escalaDiam));
    diamante.visible = escalaDiam > 0.002;
    grupo.updateMatrixWorld();
    dest.forEach(d => { const u = d.userData, b = Math.max(0, Math.sin(tv * u.v + u.f)); d.material.opacity = Math.pow(b, 6); d.scale.setScalar(u.s * (0.4 + Math.pow(b, 3))); });
    // destellos suaves: uno grande al formarse y uno chico al romperse
    const kh = (t - tFormado) / 0.9, kb = (t - tRompe) / 0.7;
    const oh = kh >= 0 && kh < 1 ? Math.sin(kh * Math.PI) * 0.75 : 0, ob = kb >= 0 && kb < 1 ? Math.sin(kb * Math.PI) * 0.4 : 0;
    halo.material.opacity = Math.max(oh, ob);
    halo.scale.setScalar(oh >= ob ? 2.2 + lim(kh) * 1.6 : 1.6 + lim(kb) * 2.4);

    // astillas en órbita alrededor del hielo entero
    const centro = grupo.position, kOrb = k(0.08);
    astillas.forEach(a => {
      const d = a.userData, ang = d.f + tv * d.v, orbita = rG + d.radio + 0.24 + d.carril * 0.11;
      meta.set(Math.cos(ang) * orbita, 0, Math.sin(ang) * orbita).applyEuler(d.inclina);
      meta.x *= 0.78; meta.add(centro);
      if (a.position.x > 50) a.position.copy(meta); else a.position.lerp(meta, kOrb);
      a.rotation.set(tv * 0.5 * d.giro + d.f, tv * 0.4, tv * 0.2 * d.giro);
    });
    for (let paso = 0; paso < 3; paso++) {
      for (let i = 0; i < astillas.length; i++) {
        const a = astillas[i], ra = a.userData.radio;
        dif.subVectors(a.position, centro); let dist = dif.length(), minimo = rG + ra + 0.12;
        if (dist < minimo) a.position.copy(centro).addScaledVector(dif.normalize(), minimo);
        for (let j = i + 1; j < astillas.length; j++) {
          const b = astillas[j]; dif.subVectors(a.position, b.position); dist = dif.length(); minimo = ra + b.userData.radio + 0.1;
          if (dist < minimo && dist > 1e-4) { dif.multiplyScalar((minimo - dist) / dist * 0.5); a.position.add(dif); b.position.sub(dif); }
        }
      }
    }
    // nada encima del título ni de la barra, y nada cortado por la orilla
    const subida = yr * borde.medioAlto * 2;
    astillas.forEach(a => {
      const prof = (camara.position.z - a.position.z) / camara.position.z;
      const ancho = borde.medioAncho * prof, m = a.userData.radio * 1.15 + 0.1;
      a.position.x = Math.min(Math.max(a.position.x, -ancho + m), ancho - m);
      a.position.y = Math.min(a.position.y, (borde.techo + subida) * prof - m);
      if (!movil) { if (a.position.y - m < (borde.textoArriba + subida) * prof) a.position.x = Math.max(a.position.x, borde.textoDer * prof + m); }
      else a.position.y = Math.max(a.position.y, (borde.textoArriba + subida) * prof + m);
    });

    // los pedazos: salen del hielo, se reparten por la pantalla, flotan y suben despacio al bajar
    const despues = Math.max(0, scrollY - innerHeight * 0.6);
    if (eMax > 0.001 && cuadro % 4 === 0) medirTextos();
    pedazos.forEach(pz => {
      const d = pz.userData, e = d.e;
      pz.visible = e > 0.002;
      if (!pz.visible) return;
      tmp.copy(d.dentro).applyMatrix4(grupo.matrixWorld);
      const prof = (camara.position.z - d.z) / camara.position.z, altoTotal = borde.medioAlto * prof * 2 + 1.2;
      let yd = d.sy * borde.medioAlto * prof * 0.86 + despues * 0.0016 * d.deriva + Math.sin(tv * 0.5 + d.sx * 4) * 0.08;
      yd = ((yd + altoTotal / 2) % altoTotal + altoTotal) % altoTotal - altoTotal / 2;   // al salir por arriba, entra por abajo
      meta.set(d.sx * borde.medioAncho * prof * 0.84 + Math.cos(tv * 0.4 + d.sy * 3) * 0.08, yd, d.z);
      pz.position.lerpVectors(tmp, meta, e);
      // nacen pequeñitos desde dentro del hielo y crecen al salir (y al revés cuando se juntan)
      pz.scale.setScalar(suave(lim(e / 0.14)) * (0.6 + 0.4 * e) * (movil ? 0.72 : 1));
      d.prof = prof;
      pz.rotation.set(d.rot.x + tv * d.giro.x * (0.3 + (1 - e) * 2), d.rot.y + tv * d.giro.y * (0.3 + (1 - e) * 2), d.rot.z + tv * d.giro.z * 0.3);
    });
    if (eMax > 0.001) {
      astillas.forEach(a => {
        const d = a.userData, prof = (camara.position.z - a.position.z) / camara.position.z, altoTotal = borde.medioAlto * prof * 2 + 1.2;
        let yd = d.sy * borde.medioAlto * prof * 0.85 + despues * 0.0012;
        yd = ((yd + altoTotal / 2) % altoTotal + altoTotal) % altoTotal - altoTotal / 2;
        meta.set(d.sx * borde.medioAncho * prof * 0.86, yd, a.position.z);
        a.position.lerp(meta, d.e); d.prof = prof;
      });
      // ningún hielo choca con otro
      for (let paso = 0; paso < 3; paso++) for (let i = 0; i < todos.length; i++) for (let j = i + 1; j < todos.length; j++) {
        const a = todos[i], b = todos[j], minimo = a.userData.radio * a.scale.x + b.userData.radio * b.scale.x + 0.08;
        dif.subVectors(a.position, b.position); const dist = dif.length();
        if (dist < minimo && dist > 1e-4) { dif.multiplyScalar((minimo - dist) / dist * 0.5); a.position.add(dif); b.position.sub(dif); }
      }
      todos.forEach(o => {
        if (o.userData.e <= 0.05) return;
        esquivarTexto(o, o.userData.prof || 1);
        // nada cortado por la orilla de la pantalla
        const prof = o.userData.prof || 1, m = o.userData.radio * o.scale.x * 1.2 + 0.06, ancho = borde.medioAncho * prof;
        o.position.x = Math.min(Math.max(o.position.x, -ancho + m), ancho - m);
      });
    }

    if (cuadro++ % 5 === 0) {   // el fondo cambia despacio: basta fotografiarlo cada 5 cuadros
      const visibles = [diamante, halo, ...todos].map(o => o.visible);
      diamante.visible = halo.visible = false; todos.forEach(o => o.visible = false);
      camHielo.position.copy(grupo.position); camHielo.update(render, escena);
      [diamante, halo, ...todos].forEach((o, i) => o.visible = visibles[i]);
    }
    render.render(escena, camara);
  });
  document.documentElement.classList.add('con3d');
}
