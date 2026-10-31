/* Movimiento de la web de Ari Labs (31/10/2026).
   Lenis: scroll suave. GSAP + ScrollTrigger: las secciones de contenido entran y se mueven
   con el scroll. Si el sistema pide menos movimiento, o si las librerías no cargan, la página
   se queda quieta y todo se ve (las entradas con IntersectionObserver siguen de respaldo). */
(function () {
  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (quieto || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('con-gsap');

  // ---- scroll suave, al ritmo de GSAP ----
  if (window.Lenis) {
    var lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    // los enlaces internos (#modelos, #trabajo...) también llegan suave
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var destino = document.querySelector(a.getAttribute('href'));
        if (destino) { e.preventDefault(); lenis.scrollTo(destino, { offset: -16 }); }
      });
    });
  }

  // ---- títulos que suben palabra por palabra ----
  function palabras(el) {
    var texto = el.textContent.trim();
    el.setAttribute('aria-label', texto);
    el.innerHTML = texto.split(/\s+/).map(function (p) {
      return '<span class="pal" aria-hidden="true"><span>' + p + '</span></span>';
    }).join(' ');
    return el.querySelectorAll('.pal > span');
  }
  document.querySelectorAll('.oferta h2, .modelos h2, .trabajo h2, .proceso h2').forEach(function (h) {
    gsap.from(palabras(h), {
      yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.06,
      scrollTrigger: { trigger: h, start: 'top 85%', once: true }
    });
  });

  // ---- textos y bloques: entran escalonados ----
  gsap.utils.toArray('.entrada, .formas, .trabajo .texto').forEach(function (el) {
    gsap.from(el, { y: 28, opacity: 0, duration: 0.8, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
  });
  gsap.from('.campo', { y: 60, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12,
    scrollTrigger: { trigger: '.dos', start: 'top 80%', once: true } });

  // ---- modelos: cada hoja sube y su captura se desliza dentro del marco con el scroll ----
  gsap.utils.toArray('.modelo').forEach(function (m, i) {
    gsap.from(m, { y: 80, opacity: 0, duration: 1.1, ease: 'power3.out', delay: i * 0.1,
      scrollTrigger: { trigger: '.vitrina', start: 'top 80%', once: true } });
    var img = m.querySelector('img');
    gsap.fromTo(img, { yPercent: 0 }, { yPercent: -12, ease: 'none',
      scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // ---- Mis citas: las tres pantallas flotan a distinta velocidad ----
  gsap.utils.toArray('.pantallas figure').forEach(function (f, i) {
    var dist = [40, -50, 70][i] || 30;
    gsap.fromTo(f, { y: dist }, { y: -dist, ease: 'none',
      scrollTrigger: { trigger: '.pantallas', start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  // ---- cómo trabajamos: cada frase se ilumina al leerla ----
  gsap.utils.toArray('.proceso .frases li').forEach(function (li) {
    gsap.fromTo(li, { opacity: 0.18 }, { opacity: 1, ease: 'none',
      scrollTrigger: { trigger: li, start: 'top 80%', end: 'top 45%', scrub: true } });
  });

  // ---- botones: un pequeño imán al pasar el ratón (solo con ratón) ----
  if (window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.boton').forEach(function (b) {
      b.addEventListener('mousemove', function (e) {
        var r = b.getBoundingClientRect();
        gsap.to(b, { x: (e.clientX - r.left - r.width / 2) * 0.18, y: (e.clientY - r.top - r.height / 2) * 0.25, duration: 0.3, ease: 'power2.out' });
      });
      b.addEventListener('mouseleave', function () { gsap.to(b, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.5)' }); });
    });
  }

  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
