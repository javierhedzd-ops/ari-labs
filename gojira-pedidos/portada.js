/* Portada: tres rollos distintos que caen después de la primera carga de Godzilla y orbitan el sol; y el logo del encabezado al bajar. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const sec = $('.pg-portada'); if (!sec) return;
  const NOMBRES_ROLLOS = [['rollo2', 4.8], ['rollo1', 8.2], ['rollo4', 11.6]];   // [pieza, cuándo cae (s)]; la carga de Godzilla termina a ~4.6 s
  // Tres rollos distintos caen (uno a uno, después de la primera carga de Godzilla) y se acomodan en una órbita
  // alrededor del sol: giran despacio, siempre derechos y siempre sólidos (sin desvanecidos).
  const cont = document.createElement('div'); cont.className = 'pg-lluvia'; sec.insertBefore(cont, $('.pg-texto-final'));
  const REPOSO = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const geometria = () => {
    const W = sec.clientWidth, H = sec.clientHeight, ancha = W >= 900, sol = $('.pg-sol').getBoundingClientRect(), p = sec.getBoundingClientRect();
    return ancha
      ? { W, H, cx: sol.left - p.left + sol.width / 2, cy: sol.top - p.top + sol.height / 2, rx: Math.min(W * .27, H * .55), ry: Math.min(W * .27, H * .55) * .72, tam: W * .085 }
      : { W, H, cx: W / 2, cy: H * .53, rx: W * .40, ry: H * .105, tam: W * .21 };
  };
  const PERIODO = 44000;
  if (!REPOSO) NOMBRES_ROLLOS.forEach(([n, t], k) => setTimeout(() => {
    const g = geometria(), ang = k / NOMBRES_ROLLOS.length * Math.PI * 2 + .6, ancho = g.tam;
    const giro = document.createElement('div'); giro.className = 'pg-pieza'; giro.style.cssText = `left:${g.cx}px;top:${g.cy}px;width:0;height:0`;
    const ranura = document.createElement('div'); ranura.style.cssText = `position:absolute;width:${ancho}px;left:${-ancho / 2}px;top:${-ancho / 2}px`;
    const cae = document.createElement('div'); const hijo = document.createElement('div');
    hijo.innerHTML = `<img src="img/rollos-web/${n}.webp" alt="" width="534" height="560">`;
    cae.append(hijo); ranura.append(cae); giro.append(ranura); cont.append(giro);
    // la órbita es una elipse: x e y se animan por separado y así el rollo recorre el círculo achatado
    const pasos = 48, orbita = (f, ang0) => Array.from({ length: pasos + 1 }, (_, i) => { const a = ang0 + i / pasos * Math.PI * 2; return { transform: `translate(${Math.cos(a) * g.rx}px,${Math.sin(a) * g.ry}px)` }; });
    ranura.animate(orbita(1, ang), { duration: PERIODO, iterations: Infinity, easing: 'linear' });
    // entra cayendo desde arriba hasta su sitio, con un rebote suave
    const alto = g.cy + g.ry + ancho * 1.4;
    cae.animate([{ transform: `translateY(${-alto}px) rotate(-40deg)` }, { transform: 'translateY(0) rotate(0deg)', offset: .62 }, { transform: 'translateY(-14px) rotate(4deg)', offset: .8 }, { transform: 'translateY(0) rotate(0deg)' }], { duration: 2600, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'both' });
  }, t * 1000));
  // cuando termina la subida de luz, se quita la máscara animada y queda solo el latido (más liviano)
  const aura = $('.pg-gz-aura'); aura.addEventListener('animationend', e => { if (e.animationName === 'pg-espinas-cargan') aura.classList.add('pg-listo'); });
  // El katakana se coloca en el cuadrante alto-derecho del SOL (que es lo que lo une a Godzilla), no por alto de pantalla:
  // así no choca con el lomo en ningún tamaño de teléfono o tableta. En pantallas anchas lo ubica el CSS.
  const kata = $('.pg-kata');
  function ubicarKata() {
    if (sec.clientWidth >= 900) { kata.style.left = kata.style.top = kata.style.right = kata.style.width = ''; return; }
    const s = $('.pg-sol').getBoundingClientRect(), p = sec.getBoundingClientRect(), w = Math.min(120, Math.max(70, s.width * .19));
    kata.style.width = w + 'px'; kata.style.right = 'auto';
    kata.style.left = Math.min(sec.clientWidth - w - 12, s.left - p.left + s.width * .5 + s.width * .42 - w) + 'px';
    kata.style.top = (s.top - p.top + s.height * .5 - s.height * .20) + 'px';
  }
  addEventListener('resize', ubicarKata); ubicarKata();
  // el logo chico del encabezado aparece cuando ya se bajó de la portada
  const marca = () => document.body.classList.toggle('pasada-portada', scrollY > sec.offsetHeight * .55);
  addEventListener('scroll', marca, { passive: true }); marca();
})();
