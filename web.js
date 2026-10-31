/* Movimiento de la web de Ari Labs (todo menos el hielo 3D, que vive en hielo.js).
   Lenis (scroll suave) + GSAP/ScrollTrigger. Con "reducir movimiento" o sin las librerías,
   todo queda visible y quieto, y cada parte sigue funcionando con el dedo. */
(function () {
  var raiz = document.documentElement;
  var quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conGsap = !quieto && window.gsap && window.ScrollTrigger;
  var esCompu = matchMedia('(min-width: 860px)');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // ---- barra de vidrio, señal "baja" y botón flotante de WhatsApp ----
  var barra = $('.barra'), bajar = $('.bajar'), flotante = $('.flotante'), contacto = $('#contacto');
  // el botón flotante se aparta mientras se baja (para no tapar lo que se lee) y regresa al subir o al detenerse
  var yAntes = scrollY, bajando = false, reposo = 0;
  function alBajar() {
    var y = scrollY;
    bajando = y > yAntes + 2 ? true : (y < yAntes - 2 ? false : bajando); yAntes = y;
    clearTimeout(reposo); reposo = setTimeout(function () { bajando = false; flotar(y); }, 900);
    barra.classList.toggle('vidrio', y > 24);
    if (y > 10) bajar.classList.add('fuera');
    flotar(y);
  }
  function flotar(y) {
    var ver = !bajando && y > innerHeight * 0.7 && contacto.getBoundingClientRect().top > innerHeight * 0.85;
    if (ver !== flotante.classList.contains('ver')) {
      flotante.classList.toggle('ver', ver);
      flotante.tabIndex = ver ? 0 : -1;
      flotante.setAttribute('aria-hidden', ver ? 'false' : 'true');
    }
  }
  flotante.setAttribute('aria-hidden', 'true');
  addEventListener('scroll', alBajar, { passive: true }); alBajar();

  // ---- textos y tarjetas suben un poco al aparecer, escalonados ----
  var piezas = $$('.sube');
  piezas.forEach(function (p) {
    var hermanos = $$(':scope > .sube', p.parentElement);
    p.style.transitionDelay = (Math.max(0, hermanos.indexOf(p)) % 4) * 0.09 + 's';
  });
  if (quieto || !('IntersectionObserver' in window)) piezas.forEach(function (p) { p.classList.add('visto'); });
  else {
    var ojo = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); ojo.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -4% 0px' });
    piezas.forEach(function (p) { ojo.observe(p); });
  }
  // al terminar de subir, quitamos el retraso para que la inclinación responda al instante
  piezas.forEach(function (p) { p.addEventListener('transitionend', function f(e) { if (e.propertyName === 'translate') { p.style.transitionDelay = ''; p.removeEventListener('transitionend', f); } }); });

  // ---- preguntas frecuentes: se abren al tocarlas ----
  $$('.pregunta button').forEach(function (b) {
    b.addEventListener('click', function () {
      var abierta = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', abierta ? 'true' : 'false');
      b.closest('.pregunta').classList.toggle('abierta', abierta);
      if (window.ScrollTrigger) setTimeout(function () { ScrollTrigger.refresh(); }, 520);
    });
  });

  // ---- las pantallas de Mis citas ----
  var pantallas = $('.pantallas'), imgs = $$('img', pantallas), puntos = $$('.puntos button'), actual = 0;
  function marcar(i) {
    actual = i;
    imgs.forEach(function (im, k) { im.classList.toggle('activa', k === i); });
    puntos.forEach(function (p, k) { p.setAttribute('aria-current', k === i ? 'true' : 'false'); });
  }
  function mostrar(i) {
    if (esCompu.matches) marcar(i);
    else pantallas.scrollTo({ left: i * pantallas.clientWidth, behavior: quieto ? 'auto' : 'smooth' });
  }
  puntos.forEach(function (p, k) { p.addEventListener('click', function () { mostrar(k); }); });
  pantallas.addEventListener('scroll', function () {
    if (esCompu.matches) return;
    var i = Math.round(pantallas.scrollLeft / Math.max(1, pantallas.clientWidth));
    if (i !== actual) marcar(i);
  }, { passive: true });
  pantallas.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { mostrar(Math.min(2, actual + 1)); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { mostrar(Math.max(0, actual - 1)); e.preventDefault(); }
  });
  var cuerpo = $('.cuerpo');
  function girar(gy, gx) { cuerpo.style.setProperty('--gy', gy.toFixed(2) + 'deg'); cuerpo.style.setProperty('--gx', gx.toFixed(2) + 'deg'); }

  // ---- la línea de luz de "Cómo trabajamos": va de nodo a nodo ----
  var caja = $('.pasos-caja'), linea = $('.linea'), pasos = $$('.paso');
  function colocarLinea() {
    var c = function (paso) { var n = $('.nodo', paso); return { x: paso.offsetLeft + n.offsetLeft + n.offsetWidth / 2, y: paso.offsetTop + n.offsetTop + n.offsetHeight / 2 }; };
    var a = c(pasos[0]), b = c(pasos[pasos.length - 1]);
    if (esCompu.matches) { linea.style.cssText = 'left:' + a.x + 'px;top:' + (a.y - 1) + 'px;width:' + (b.x - a.x) + 'px;height:2px'; }
    else { linea.style.cssText = 'left:' + (a.x - 1) + 'px;top:' + a.y + 'px;height:' + (b.y - a.y) + 'px;width:2px'; }
  }
  function llenar(k) {
    linea.firstElementChild.style.setProperty('--lleno', k.toFixed(3));
    pasos.forEach(function (p, i) { p.classList.toggle('encendida', k >= i / (pasos.length - 1) - 0.02); });
  }
  colocarLinea(); addEventListener('resize', colocarLinea);
  document.fonts && document.fonts.ready.then(colocarLinea);

  // ---- las tarjetas de vidrio se inclinan un poco hacia el ratón (o con el giro del teléfono) ----
  if (!quieto) {
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      $$('.inclina').forEach(function (t) {
        t.addEventListener('pointermove', function (e) {
          var r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          t.style.setProperty('--ry', (x * 6).toFixed(2) + 'deg'); t.style.setProperty('--rx', (-y * 5).toFixed(2) + 'deg');
        });
        t.addEventListener('pointerleave', function () { t.style.setProperty('--ry', '0deg'); t.style.setProperty('--rx', '0deg'); });
      });
    } else if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission !== 'function') {
      var base = null, ultimo = 0;
      addEventListener('deviceorientation', function (e) {
        if (e.beta == null) return;
        var ahora = performance.now(); if (ahora - ultimo < 80) return; ultimo = ahora;
        if (!base) base = { b: e.beta, g: e.gamma };
        var lim = function (v) { return Math.max(-4, Math.min(4, v)); };
        raiz.style.setProperty('--ry', lim((e.gamma - base.g) * 0.25).toFixed(2) + 'deg');
        raiz.style.setProperty('--rx', lim(-(e.beta - base.b) * 0.2).toFixed(2) + 'deg');
      }, { passive: true });
    }
  }

  // ---- sin GSAP o con "reducir movimiento": todo visible y quieto ----
  if (!conGsap) { llenar(1); girar(-12, 4); return; }
  gsap.registerPlugin(ScrollTrigger);

  // scroll suave en toda la web
  var lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'), destino = id === '#arriba' ? 0 : $(id);
      if (destino === null) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(destino, { offset: destino === 0 ? 0 : -72 });
      else scrollTo({ top: destino === 0 ? 0 : destino.getBoundingClientRect().top + scrollY - 72, behavior: 'smooth' });
    });
  });

  // parte un texto en palabras (y letras, si se pide) dentro de ventanitas que esconden lo que sube
  function partir(el, porLetra) {
    var texto = el.textContent.trim();
    el.setAttribute('aria-label', texto);
    el.innerHTML = texto.split(/\s+/).map(function (p) {
      var dentro = porLetra ? p.split('').map(function (l) { return '<span class="letra">' + l + '</span>'; }).join('') : '<span>' + p + '</span>';
      return '<span class="pal-h" aria-hidden="true">' + dentro + '</span>';
    }).join(' ');
    return $$(porLetra ? '.letra' : '.pal-h > span', el);
  }

  // portada: el título sube letra por letra (1 s), luego la frase y los botones
  var letras = partir($('.titulo-portada'), true);
  letras.forEach(function (l) { l.style.display = 'inline-block'; });
  gsap.timeline({ defaults: { ease: 'power4.out' } })
    .from(letras, { yPercent: 118, duration: 0.7, stagger: 0.045 })
    .fromTo('.portada .aparece', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.12 }, 0.75);

  // cada título de sección entra palabra por palabra
  $$('h2.titulo').forEach(function (h) {
    gsap.from(partir(h, false), { yPercent: 115, duration: 1, ease: 'power4.out', stagger: 0.07,
      scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
  });

  // la línea se llena de luz al bajar y cada tarjeta se enciende cuando la línea la alcanza
  ScrollTrigger.create({ trigger: caja, start: 'top 72%', end: 'bottom 60%', scrub: 0.5, onUpdate: function (s) { llenar(s.progress); }, onRefresh: function (s) { colocarLinea(); llenar(s.progress); } });

  var mm = gsap.matchMedia();
  // compu: Trabajos se queda fija mientras el teléfono gira y cambian las pantallas; Modelos pasa de lado
  mm.add('(min-width: 860px) and (min-height: 600px)', function () {
    girar(-8, 6);
    ScrollTrigger.create({
      trigger: '.trabajos', start: 'top top', end: '+=70%', pin: true, scrub: 0.6, anticipatePin: 1,
      onUpdate: function (s) {
        var p = s.progress;
        girar(-8 + p * 36, 6 - p * 4);
        var i = Math.min(2, Math.floor(p * 3 + 0.0001));
        if (i !== actual) marcar(i);
      }
    });
    var seccion = $('.modelos'), pista = $('.pista');
    seccion.classList.add('fijo');
    var distancia = function () { return Math.max(0, pista.scrollWidth - innerWidth); };
    var tw = null;
    if (distancia() > 40) {
      tw = gsap.to(pista, { x: function () { return -distancia(); }, ease: 'none',
        scrollTrigger: { trigger: seccion, start: 'top top', end: function () { return '+=' + distancia(); }, pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 } });
    }
    return function () { seccion.classList.remove('fijo'); if (tw) gsap.set(pista, { x: 0 }); };
  });
  // teléfono: sin quedarse fija; el teléfono gira solo un poco
  mm.add('(max-width: 859px), (max-height: 599px)', function () {
    $('.modelos').classList.remove('fijo');
    girar(-12, 4);
    ScrollTrigger.create({ trigger: '.telefono', start: 'top bottom', end: 'bottom top', scrub: 0.6,
      onUpdate: function (s) { girar(-12 + s.progress * 20, 5 - s.progress * 3); } });
  });

  addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
