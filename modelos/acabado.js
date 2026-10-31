/* Movimiento común de los modelos: barra de vidrio al bajar y piezas que suben escalonadas al aparecer. */
(function () {
  var barra = document.querySelector('.barra');
  function f() { if (barra) barra.classList.toggle('vidrio-b', scrollY > 40); }
  addEventListener('scroll', f, { passive: true }); f();
  var piezas = [].slice.call(document.querySelectorAll('.sube'));
  piezas.forEach(function (p) {
    var grupo = p.parentElement, i = [].indexOf.call(grupo.querySelectorAll(':scope > .sube'), p);
    p.style.setProperty('--retraso', (Math.max(0, i) % 6) * 0.07 + 's');
  });
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) { piezas.forEach(function (p) { p.classList.add('visto'); }); return; }
  var ojo = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('visto'); ojo.unobserve(e.target); } }); }, { threshold: 0.1 });
  piezas.forEach(function (p) { ojo.observe(p); });
})();
