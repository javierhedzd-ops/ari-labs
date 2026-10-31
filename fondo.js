/* El fondo vivo de Ari Labs: un shader de ruido que se tuerce sobre sí mismo (domain warping),
   en noche, violeta y azul hielo. Reacciona al dedo/ratón y cambia un poco con el scroll.
   Se dibuja a baja resolución y se detiene cuando la pestaña no se ve. Sin WebGL, o con
   "reducir movimiento", queda un solo cuadro quieto (o el degradado del CSS). */
(function () {
  var lienzo = document.getElementById('fondo');
  if (!lienzo) return;
  var gl = lienzo.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
  if (!gl) return;

  var vert = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var frag = [
    'precision mediump float;',
    'uniform vec2 r;uniform float t;uniform vec2 m;uniform float s;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);',
    ' return mix(mix(h(i),h(i+vec2(1.,0.)),u.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),u.x),u.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.02+vec2(1.7,9.2);a*=.5;}return v;}',
    'void main(){',
    ' vec2 uv=gl_FragCoord.xy/r;',
    ' vec2 p=(gl_FragCoord.xy-.5*r)/min(r.x,r.y);',
    ' p+=(m-.5)*vec2(.22,-.22);',
    ' float k=t*.045;',
    ' vec2 q=vec2(fbm(p*1.5+k),fbm(p*1.5+vec2(5.2,1.3)-k));',
    ' vec2 w=vec2(fbm(p*1.5+3.2*q+vec2(1.7,9.2)+k*1.4),fbm(p*1.5+3.2*q+vec2(8.3,2.8)-k));',
    ' float f=fbm(p*1.5+3.4*w+s*1.2);',
    ' vec3 noche=vec3(.031,.067,.086);',
    ' vec3 violeta=mix(vec3(.20,.14,.36),vec3(.10,.22,.33),s);',
    ' vec3 hielo=vec3(.62,.85,.93);',
    ' vec3 c=mix(noche,violeta,clamp(f*f*1.8,0.,1.));',
    ' c=mix(c,hielo,clamp(length(q)*f*1.05-.32,0.,1.)*.62);',
    ' c*=.55+.75*f;',
    ' c*=1.-.9*dot(uv-vec2(.5,.55),uv-vec2(.5,.55));',
    ' c+= (h(gl_FragCoord.xy+fract(t))-.5)*.035;',
    ' gl_FragColor=vec4(c,1.);',
    '}'
  ].join('\n');

  function sombreador(tipo, src) {
    var s = gl.createShader(tipo); gl.shaderSource(s, src); gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  var vs = sombreador(gl.VERTEX_SHADER, vert), fs = sombreador(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return;
  var prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var uR = gl.getUniformLocation(prog, 'r'), uT = gl.getUniformLocation(prog, 't'), uM = gl.getUniformLocation(prog, 'm'), uS = gl.getUniformLocation(prog, 's');

  // baja resolución: el ruido es suave y así cuesta poco (sobre todo en teléfonos)
  var escala = window.innerWidth < 760 ? 0.35 : 0.5;
  function medir() {
    lienzo.width = Math.max(2, Math.round(window.innerWidth * escala));
    lienzo.height = Math.max(2, Math.round(window.innerHeight * escala));
    gl.viewport(0, 0, lienzo.width, lienzo.height);
  }
  medir(); window.addEventListener('resize', medir);

  var raton = [0.5, 0.5], meta = [0.5, 0.5], scroll = 0;
  window.addEventListener('pointermove', function (e) { meta = [e.clientX / window.innerWidth, e.clientY / window.innerHeight]; }, { passive: true });
  window.addEventListener('scroll', function () {
    var alto = document.documentElement.scrollHeight - window.innerHeight;
    scroll = alto > 0 ? window.scrollY / alto : 0;
  }, { passive: true });

  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var inicio = performance.now(), corriendo = false;
  function cuadro(ahora) {
    raton[0] += (meta[0] - raton[0]) * 0.04; raton[1] += (meta[1] - raton[1]) * 0.04;
    gl.uniform2f(uR, lienzo.width, lienzo.height);
    gl.uniform1f(uT, quieto ? 12 : (ahora - inicio) / 1000);
    gl.uniform2f(uM, raton[0], raton[1]);
    gl.uniform1f(uS, scroll);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!quieto && !document.hidden) requestAnimationFrame(cuadro); else corriendo = false;
  }
  function arrancar() { if (!corriendo) { corriendo = true; requestAnimationFrame(cuadro); } }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) arrancar(); });
  arrancar();
  lienzo.style.background = 'none';
})();
