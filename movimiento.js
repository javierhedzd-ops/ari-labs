/* Movimiento de la web de Ari Labs: Lenis (scroll suave) + GSAP/ScrollTrigger.
   Con "reducir movimiento" o sin las librerías, todo queda visible y quieto. */
(function () {
  var raiz = document.documentElement;
  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function mostrarTodo() { document.querySelectorAll('.aparece').forEach(function (e) { e.style.opacity = 1; }); }
  if (quieto || !window.gsap || !window.ScrollTrigger) { mostrarTodo(); return; }
  gsap.registerPlugin(ScrollTrigger);

  // ---- scroll suave ----
  if (window.Lenis) {
    var lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        var destino = id.length > 1 ? document.querySelector(id) : document.body;
        if (destino) { e.preventDefault(); lenis.scrollTo(destino, { offset: id.length > 1 ? -72 : 0 }); }
      });
    });
  }

  function partir(el, porLetra) {
    var texto = el.textContent.trim();
    el.setAttribute('aria-label', texto);
    var trozos = porLetra ? texto.split('') : texto.split(/\s+/);
    el.innerHTML = trozos.map(function (p) {
      if (porLetra && p === ' ') return ' ';
      return '<span class="pal-h" aria-hidden="true"><span>' + p + '</span></span>';
    }).join(porLetra ? '' : ' ');
    return el.querySelectorAll('.pal-h > span');
  }

  // ---- portada: el nombre sube letra por letra, luego el lema y los botones ----
  var letras = partir(document.querySelector('.titulo-portada'), true);
  var entrada = gsap.timeline({ defaults: { ease: 'power4.out' } });
  entrada.from(letras, { yPercent: 115, rotate: 6, duration: 1.2, stagger: 0.05 })
         .fromTo('.portada .aparece', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 1, stagger: 0.12 }, 0.45);
  // al bajar, el nombre se aleja un poco
  gsap.to('.titulo-portada', { yPercent: -18, opacity: 0.25, ease: 'none',
    scrollTrigger: { trigger: '.portada', start: 'top top', end: 'bottom top', scrub: true } });

  // ---- la frase: cada palabra se enciende mientras la lees ----
  var frase = document.getElementById('frase');
  var texto = frase.textContent.trim();
  frase.setAttribute('aria-label', texto);
  frase.innerHTML = texto.split(/\s+/).map(function (p) { return '<span class="pal" aria-hidden="true">' + p + '</span>'; }).join(' ');
  gsap.fromTo('#frase .pal', { opacity: 0.16 }, { opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '.frase', start: 'top 75%', end: 'bottom 55%', scrub: true } });

  // ---- títulos de sección: palabra por palabra ----
  document.querySelectorAll('h2.titulo').forEach(function (h) {
    gsap.from(partir(h, false), { yPercent: 110, duration: 1, ease: 'power4.out', stagger: 0.07,
      scrollTrigger: { trigger: h, start: 'top 85%', once: true } });
  });

  // ---- lo demás aparece al llegar, escalonado ----
  gsap.utils.toArray('section .aparece').forEach(function (el, i) {
    gsap.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });

  // ---- teléfonos de Mis citas: flotan a distinta velocidad ----
  gsap.utils.toArray('.telefonos figure').forEach(function (f, i) {
    var d = [60, -40, 90][i] || 40;
    gsap.fromTo(f, { y: d, opacity: 0 }, { opacity: 1, duration: 0.8, scrollTrigger: { trigger: '.telefonos', start: 'top 85%', once: true } });
    gsap.fromTo(f, { yPercent: d / 10 }, { yPercent: -d / 10, ease: 'none',
      scrollTrigger: { trigger: '.telefonos', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // ---- modelos: las tarjetas entran desde la derecha ----
  gsap.from('.modelo', { x: 120, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12,
    scrollTrigger: { trigger: '.carrusel', start: 'top 85%', once: true } });

  // ---- botones con imán (solo con ratón) ----
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.boton, .grande').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.2, y: (e.clientY - r.top - r.height / 2) * 0.3, duration: 0.3, ease: 'power2.out' });
      });
      b.addEventListener('mouseleave', function () { gsap.to(b, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, .45)' }); });
    });
  }
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
