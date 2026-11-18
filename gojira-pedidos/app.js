/* Pantalla de la muestra de Gojira Sushi & Thai. La lógica (sucursal, envío, mensaje) vive en logica.js. */
(function () {
  'use strict';
  const D = window.GOJIRA, L = window.GojiraLogica;
  const CONFIG = Object.assign({ coordenadasReales: false, envioReal: false, rutaReal: false, servidorRutas: '', sucursalesDeEjemplo: true }, window.GOJIRA_CONFIG || {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const guardar = {
    leer(k, def) { try { const v = JSON.parse(localStorage.getItem('gj.' + k)); return v == null ? def : v; } catch { return def; } },
    poner(k, v) { try { localStorage.setItem('gj.' + k, JSON.stringify(v)); } catch { /* sin almacenamiento: sigue funcionando */ } }
  };

  // ---------- estado ----------
  let ORI = { ...D.ORIGEN }; const KM_LAT = 111.32; let KM_LNG = KM_LAT * Math.cos(ORI.lat * Math.PI / 180);
  const aPunto = (x, y) => ({ lat: ORI.lat + y / KM_LAT, lng: ORI.lng + x / KM_LNG });
  const aKm = p => ({ x: (p.lng - ORI.lng) * KM_LNG, y: (p.lat - ORI.lat) * KM_LAT });
  const PUNTO_INICIAL = aPunto(2.2, 5);

  const estado = {
    lineas: guardar.leer('lineas', []),
    entrega: guardar.leer('entrega', 'domicilio'),
    punto: guardar.leer('punto', null) || PUNTO_INICIAL,
    recoger: guardar.leer('recoger', null),
    pausas: {}, demoHora: null,
    rutas: null, rutasClave: null, cargandoRuta: false, errorRuta: false,
    folio: guardar.leer('folio', 0)
  };

  // Muestra con sucursales de ejemplo: al tomar la ubicación REAL del visitante se colocan las 3 sucursales a su alrededor
  // (con las mismas distancias del mapa de ejemplo), para que vea funcionar la elección por ruta desde donde esté.
  // Con las coordenadas reales de Gojira se apaga con GOJIRA_CONFIG.sucursalesDeEjemplo = false.
  function reanclar(p) {
    ORI = { lat: p.lat - 5 / KM_LAT, lng: p.lng - 2.2 / (KM_LAT * Math.cos(p.lat * Math.PI / 180)) };
    KM_LNG = KM_LAT * Math.cos(ORI.lat * Math.PI / 180);
    D.SUCURSALES.forEach(s => { s.lat = ORI.lat + s.yKm / KM_LAT; s.lng = ORI.lng + s.xKm / KM_LNG; });
    estado.rutas = null; estado.rutasClave = null;
  }
  if (CONFIG.sucursalesDeEjemplo && guardar.leer('anclado', false) && guardar.leer('punto', null)) reanclar(estado.punto);

  // ---------- menú: ids estables ----------
  const ITEMS = {};
  D.MENU.forEach((c, ci) => c.grupos.forEach((g, gi) => g.items.forEach((it, ii) => { it.id = `c${ci}g${gi}i${ii}`; ITEMS[it.id] = it; })));
  const recetaDe = it => (it && it.arma ? D.RECETAS[it.arma] : null);
  // Lo guardado en el teléfono se revisa: si el menú o las reglas cambiaron, lo que ya no vale se descarta.
  estado.lineas = (Array.isArray(estado.lineas) ? estado.lineas : []).filter(l => l && ITEMS[l.id] && l.cant > 0 && (!recetaDe(ITEMS[l.id]) || L.validarSeleccion(recetaDe(ITEMS[l.id]), l.sel || {}).ok))
    .map(l => ({ id: l.id, sel: l.sel || {}, cant: Math.min(30, l.cant), key: L.claveLinea(l.id, l.sel || {}) }));

  const ahoraMin = () => estado.demoHora != null ? estado.demoHora : new Date().getHours() * 60 + new Date().getMinutes();
  const sucursales = () => D.SUCURSALES.map(s => ({ ...s, pausada: !!estado.pausas[s.id] }));
  const sucursalPorId = id => sucursales().find(s => s.id === id);
  const razonTexto = r => ({ pausada: 'tiene los pedidos en pausa', cerrada: 'está cerrada', 'fuera-de-zona': 'no llega hasta donde estás' }[r] || 'no puede atenderte');
  const estadoDe = s => s.pausada ? 'pausada' : (L.estaAbierta(s, ahoraMin()) ? 'abierta' : 'cerrada');
  const textoEstado = e => ({ abierta: 'Abierta', cerrada: 'Cerrada', pausada: 'Pedidos en pausa' }[e]);

  // ---------- ruta real por calle ----------
  // Con rutaReal, los kilómetros salen de la ruta por calle (no en línea recta). Si no se puede calcular, se avisa y se usa la línea recta.
  const claveRuta = () => `${estado.punto.lat.toFixed(5)},${estado.punto.lng.toFixed(5)}`;
  const rutasVigentes = () => (CONFIG.rutaReal && estado.rutas && estado.rutasClave === claveRuta() ? estado.rutas : null);
  let relojRuta, abortarRuta;
  function pedirRutas(espera) {
    if (!CONFIG.rutaReal) return;
    clearTimeout(relojRuta);
    if (estado.rutasClave === claveRuta() && !estado.cargandoRuta) return;
    estado.cargandoRuta = true; estado.errorRuta = false; refrescarRuta();
    relojRuta = setTimeout(async () => {
      const clave = claveRuta(), ctl = new AbortController(), corte = setTimeout(() => ctl.abort(), 8000);
      if (abortarRuta) abortarRuta.abort(); abortarRuta = ctl;
      let rutas = null;
      try {
        const r = await fetch(L.urlRutas(estado.punto, D.SUCURSALES, CONFIG.servidorRutas || undefined), { signal: ctl.signal });
        if (r.ok) rutas = L.leerRutas(await r.json(), D.SUCURSALES);
      } catch { rutas = null; }
      clearTimeout(corte);
      if (clave !== claveRuta()) return; // el cliente movió el punto mientras tanto: esa respuesta ya no sirve
      estado.rutas = rutas; estado.rutasClave = clave; estado.cargandoRuta = false; estado.errorRuta = !rutas;
      refrescarRuta();
    }, espera == null ? 350 : espera);
  }
  function refrescarRuta() { pintarMapa(); pintarChip(); if ($('#dlgLugar').open) pintarResultadoLugar(); if ($('#dlgPedido').open) pintarPedido(); }
  const textoRuta = e => e.porRuta ? `Ruta de ${e.km.toFixed(1)} km${e.min != null ? ` · unos ${e.min} min` : ''}` : (CONFIG.rutaReal && estado.errorRuta ? `~${e.km.toFixed(1)} km en línea recta (no pudimos calcular la ruta)` : `A ${e.km.toFixed(1)} km`);

  // Lo que sabemos de la entrega con lo que hay ahorita (cambia si pausan una sucursal o cambia la hora).
  function entregaActual() {
    if (estado.entrega === 'recoger') {
      const ss = sucursales();
      const s = ss.find(x => x.id === estado.recoger) || ss.find(x => estadoDe(x) === 'abierta') || ss[0];
      return { tipo: 'recoger', sucursal: s, ok: estadoDe(s) === 'abierta', problema: estadoDe(s) !== 'abierta' ? estadoDe(s) : null };
    }
    const r = L.elegirSucursal(sucursales(), estado.punto, ahoraMin(), rutasVigentes());
    if (!r.elegida) return { tipo: 'domicilio', sucursal: null, ok: false, resultado: r };
    return { tipo: 'domicilio', sucursal: r.elegida.sucursal, km: r.elegida.km, min: r.elegida.min, porRuta: r.elegida.porRuta, envio: r.elegida.envio, aviso: r.aviso, ok: true, resultado: r };
  }

  // ---------- menú ----------
  function pintarMenu() {
    $('#listaCats').innerHTML = D.MENU.map(c => `<li><a href="#cat-${c.id}" data-cat="${c.id}">${esc(c.nombre)}</a></li>`).join('');
    const arte = { empezar: null, tradicionales: ['img/banner-caja.jpg', 'Tu pedido, directo a tu mesa.'], especialidades: null, thai: null, rollos: ['img/banner-sol.jpg', 'Rollos que hacen ruido.'] };
    $('#menu').innerHTML = D.MENU.map(c => {
      const a = arte[c.id] ? `<div class="arte" aria-hidden="true"><img src="${arte[c.id][0]}" alt="" loading="lazy" decoding="async" width="900" height="560"><p>${esc(arte[c.id][1])}</p></div>` : '';
      const fila = it => `<li class="platillo" data-id="${it.id}" data-en-pedido="false"><div class="info"><span class="nombre">${esc(it.n)}</span>${it.f ? '<span class="fav">Favorito</span>' : ''}${it.d ? `<div class="desc">${esc(it.d)}</div>` : ''}</div><div class="precio">${textoPrecio(it)}</div><div class="control"></div></li>`;
      const pleg = c.plegable !== undefined ? c.plegable : c.grupos.length > 1;   // varios grupos: se muestran como tipos que se abren al tocar
      const grupo = g => pleg
        ? `<details class="grupo grupo-plegable" name="g-${c.id}"><summary><span class="g-tit">${esc(g.nombre)}</span><span class="g-pedido" aria-hidden="true"></span><span class="g-cuenta">${g.items.length} ${g.items.length === 1 ? 'opción' : 'opciones'}</span></summary>${g.nota ? `<p class="nota">${esc(g.nota)}</p>` : ''}<ul class="platillos">${g.items.map(fila).join('')}</ul></details>`
        : `<div class="grupo"><h3>${esc(g.nombre)}</h3>${g.nota ? `<p class="nota">${esc(g.nota)}</p>` : ''}<ul class="platillos">${g.items.map(fila).join('')}</ul></div>`;
      return `${a}<section class="categoria" id="cat-${c.id}" aria-labelledby="h-${c.id}"><h2 id="h-${c.id}">${esc(c.nombre)}</h2>${c.aviso ? `<p class="pista-cat aviso-cat">${esc(c.aviso)}</p>` : ''}${(c.pista || (pleg ? 'Toca un tipo para ver sus platillos.' : '')) ? `<p class="pista-cat">${esc(c.pista || 'Toca un tipo para ver sus platillos.')}</p>` : ''}` + c.grupos.map(grupo).join('') + '</section>';
    }).join('');
    $$('.platillo').forEach(li => pintarControl(li));
  }

  function textoPrecio(it) {
    const r = recetaDe(it);
    if (r && r.desde) return `<small>desde</small> ${L.dinero(L.precioDesde(it, r))}`;
    return it.p ? L.dinero(it.p) : 'Incluida';
  }

  function pintarControl(li) {
    const id = li.dataset.id, it = ITEMS[id], r = recetaDe(it), ctl = $('.control', li);
    const q = estado.lineas.filter(l => l.id === id).reduce((t, l) => t + l.cant, 0);
    li.dataset.enPedido = q > 0 ? 'true' : 'false';
    if (r) { // se arma o se personaliza: el botón abre la hoja; si ya hay piezas en el pedido se avisa cuántas
      const insignia = q > 0 ? `<span class="en-pedido" aria-label="${q} en tu pedido">×${q}</span>` : '';
      ctl.innerHTML = insignia + (r.modo === 'pasos'
        ? `<button type="button" class="armar" data-acc="armar" aria-label="Armar ${esc(it.n)}">Armar</button>`
        : `<button type="button" class="mas" data-acc="armar" aria-label="Personalizar y agregar ${esc(it.n)}">+</button>`);
      return;
    }
    ctl.innerHTML = q > 0
      ? `<div class="cantidad"><button type="button" class="menos" data-acc="menos" aria-label="Quitar uno de ${esc(it.n)}">−</button><output aria-label="Cantidad de ${esc(it.n)}">${q}</output><button type="button" class="mas" data-acc="mas" aria-label="Agregar otro ${esc(it.n)}">+</button></div>`
      : `<button type="button" class="mas" data-acc="mas" aria-label="Agregar ${esc(it.n)}">+</button>`;
  }

  const guardarLineas = () => guardar.poner('lineas', estado.lineas.map(({ id, sel, cant }) => ({ id, sel, cant })));
  const repintarItem = id => { const li = $(`.platillo[data-id="${id}"]`); if (li) pintarControl(li); };

  // Suma piezas a una línea (misma comida y mismas elecciones = misma línea) o crea la línea.
  function agregarLinea(id, sel, cant) {
    const key = L.claveLinea(id, sel), ya = estado.lineas.find(l => l.key === key);
    if (ya) ya.cant = Math.min(30, ya.cant + cant); else estado.lineas.push({ id, sel, cant: Math.min(30, cant), key });
    return key;
  }

  function cambiarCantidad(key, delta) {
    const l = estado.lineas.find(x => x.key === key); if (!l) { if (delta > 0 && ITEMS[key]) agregarLinea(key, {}, 1); else return; }
    else { l.cant = Math.max(0, Math.min(30, l.cant + delta)); if (!l.cant) estado.lineas = estado.lineas.filter(x => x !== l); }
    guardarLineas();
    const id = (l || { id: key }).id; repintarItem(id);
    const li = $(`.platillo[data-id="${id}"]`), q = (estado.lineas.find(x => x.key === key) || {}).cant || 0;
    if (li && !recetaDe(ITEMS[id])) { const b = $(delta > 0 ? '.mas' : (q ? '.menos' : '.mas'), li); if (b) b.focus({ preventScroll: true }); }
    pintarBarra();
    if (delta > 0) pulsoOjo();
    if ($('#dlgPedido').open) pintarPedido();
  }

  const sinMovimiento = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  function pulsoOjo() { if (sinMovimiento()) return; const o = $('#verPedido'); o.classList.add('pulso'); setTimeout(() => o.classList.remove('pulso'), 280); }
  const pausa = ms => new Promise(r => setTimeout(r, ms));

  const lineas = () => estado.lineas.map(l => { const it = ITEMS[l.id], r = recetaDe(it); return { key: l.key, id: l.id, n: it.n, p: L.precioLinea(it, r, l.sel), cant: l.cant, detalle: L.detalleLinea(r, l.sel), armada: !!r }; });
  const cuenta = () => estado.lineas.reduce((t, l) => t + l.cant, 0);

  function barraArriba() { $('#barraPedido').classList.toggle('arriba', scrollY < 24); }
  function pintarBarra() {
    const n = cuenta(), barra = $('#barraPedido');
    barra.hidden = n === 0;
    $('#barraTexto').textContent = `Ver mi pedido · ${n} ${n === 1 ? 'platillo' : 'platillos'}`;
    $('#barraTotal').textContent = L.dinero(L.totales(lineas(), null).subtotal);
    marcarGrupos();
  }

  addEventListener('scroll', barraArriba, { passive: true });

  // ---------- categorías: se ve una a la vez (el menú no se vuelve interminable) ----------
  const CATEGORIAS = D.MENU.map(c => c.id);
  function mostrarCategoria(id, { bajar = true, historial = true } = {}) {
    if (!CATEGORIAS.includes(id)) id = CATEGORIAS[0];
    $$('.categoria').forEach(c => { const on = c.id === 'cat-' + id; c.classList.toggle('activa', on); c.inert = !on; });
    $$('#listaCats a').forEach(a => {
      const on = a.dataset.cat === id; a.setAttribute('aria-current', on ? 'true' : 'false');
      if (on) { const ul = a.closest('ul'); ul.scrollTo({ left: a.offsetLeft - ul.clientWidth / 2 + a.clientWidth / 2, behavior: sinMovimiento() ? 'auto' : 'smooth' }); }
    });
    if (historial && location.hash !== '#cat-' + id) { try { history.replaceState(null, '', '#cat-' + id); } catch { /* sin historial: no pasa nada */ } }
    guardar.poner('cat', id);
    if (bajar) { const top = $('#menu').getBoundingClientRect().top + scrollY - $('.cats').offsetHeight - $('.barra').offsetHeight - 8; scrollTo({ top: Math.max(0, top), behavior: 'instant' }); }
  }
  // Tipos de rollos plegables: al abrir uno se acomoda debajo de las barras fijas; las marcas «×N» cuentan lo que ya está en el pedido
  function marcarGrupos() {
    $$('.grupo-plegable').forEach(d => {
      const ids = $$('.platillo', d).map(li => li.dataset.id), n = estado.lineas.filter(l => ids.includes(l.id)).reduce((t, l) => t + l.cant, 0), m = $('.g-pedido', d);
      m.textContent = n ? `×${n} en tu pedido` : ''; d.dataset.pedido = n ? 'si' : 'no';
    });
  }
  document.addEventListener('toggle', ev => { const d = ev.target; if (d.classList && d.classList.contains('grupo-plegable') && d.open) requestAnimationFrame(() => d.scrollIntoView({ block: 'start', behavior: 'instant' })); }, true);
  function vigilarCategorias() {
    $('#listaCats').addEventListener('click', ev => { const a = ev.target.closest('a'); if (!a) return; ev.preventDefault(); mostrarCategoria(a.dataset.cat); });
    // Las descripciones largas se cortan a 2 líneas: un toque las abre completas.
    $('#menu').addEventListener('click', ev => { const d = ev.target.closest('.desc'); if (d) d.classList.toggle('abierta'); });
    const hash = location.hash.replace('#cat-', '');
    mostrarCategoria(CATEGORIAS.includes(hash) ? hash : guardar.leer('cat', CATEGORIAS[0]), { bajar: false, historial: false });
    addEventListener('hashchange', () => { const h = location.hash.replace('#cat-', ''); if (CATEGORIAS.includes(h)) mostrarCategoria(h); });
  }

  // ---------- sucursales (pie) ----------
  function pintarSucursales() {
    $('#tarjetas').innerHTML = sucursales().map(s => {
      const e = estadoDe(s);
      return `<article class="tarjeta"><h3>${esc(s.nombre)}</h3><p>${esc(s.direccion)}</p><p>Horario de ejemplo: ${s.horario.abre} a ${s.horario.cierra} · ${s.reparto === 'propio' ? 'Reparto propio' : 'Reparto con grupo externo'}</p><p><span class="estado ${e}">${textoEstado(e)}</span></p><button type="button" class="boton" data-recoger="${s.id}" style="width:100%">Recoger aquí</button></article>`;
    }).join('');
  }

  // ---------- chip de arriba ----------
  function pintarChip() {
    const e = entregaActual(); let t;
    if (e.tipo === 'recoger') t = `Recoger · ${e.sucursal.nombre}`;
    else if (e.ok) t = `A domicilio · sale de ${e.sucursal.nombre}`;
    else t = 'Sin sucursal disponible';
    if (!guardar.leer('eligio', false)) t = '¿Dónde te lo llevamos?';
    $('#chipTexto').textContent = t;
  }

  // ---------- mapa de ejemplo ----------
  const MAPA = { x0: -10, x1: 15, y0: 0, y1: 12.5 };
  const ANCHO = MAPA.x1 - MAPA.x0, ALTO = MAPA.y1 - MAPA.y0;
  const sx = x => x - MAPA.x0, sy = y => MAPA.y1 - y;

  function construirMapa() {
    let r = '';
    for (let x = Math.ceil(MAPA.x0); x <= MAPA.x1; x += 2) r += `<line class="rejilla" x1="${sx(x)}" y1="0" x2="${sx(x)}" y2="${ALTO}"/>`;
    for (let y = 0; y <= MAPA.y1; y += 2) r += `<line class="rejilla" x1="0" y1="${sy(y)}" x2="${ANCHO}" y2="${sy(y)}"/>`;
    const zonas = D.SUCURSALES.map(s => `<circle class="zona" cx="${sx(s.xKm)}" cy="${sy(s.yKm)}" r="${s.maxKm}"/>`).join('');
    $('#mapa').innerHTML = `<svg viewBox="0 0 ${ANCHO} ${ALTO}" role="group" aria-label="Mapa de ejemplo con las tres sucursales y tu ubicación"><g>${r}</g><g>${zonas}</g><line class="linea-ruta" id="lineaRuta" x1="0" y1="0" x2="0" y2="0" visibility="hidden"/><g id="capaSuc"></g><g class="yo" id="yo" tabindex="0" role="application" aria-label="Tu ubicación. Usa las flechas del teclado para moverla"><circle class="yo-halo" r=".5"/><circle class="yo-punto" r=".2"/></g></svg>`;
  }

  function pintarMapa() {
    const eleg = entregaActual(), ss = sucursales();
    $('#capaSuc').innerHTML = ss.map(s => {
      const e = estadoDe(s), cls = e === 'pausada' ? 'suc-pausada' : e === 'cerrada' ? 'suc-cerrada' : 'suc-punto';
      const x = sx(s.xKm), y = sy(s.yKm), ancla = x > ANCHO - 4.5 ? 'end' : 'start', dx = ancla === 'end' ? -.75 : .75;
      return `<g><circle class="${cls}" cx="${x}" cy="${y}" r=".45"/><text class="suc-texto" x="${x + dx}" y="${y + .25}" text-anchor="${ancla}">${esc(s.nombre)}</text></g>`;
    }).join('');
    const k = aKm(estado.punto), px = Math.max(MAPA.x0, Math.min(MAPA.x1, k.x)), py = Math.max(MAPA.y0, Math.min(MAPA.y1, k.y));
    $('#yo').setAttribute('transform', `translate(${sx(px)} ${sy(py)})`);
    const linea = $('#lineaRuta');
    if (eleg.tipo === 'domicilio' && eleg.ok) {
      linea.setAttribute('x1', sx(px)); linea.setAttribute('y1', sy(py)); linea.setAttribute('x2', sx(eleg.sucursal.xKm)); linea.setAttribute('y2', sy(eleg.sucursal.yKm)); linea.setAttribute('visibility', 'visible');
    } else linea.setAttribute('visibility', 'hidden');
  }

  function moverPunto(x, y) {
    x = Math.max(MAPA.x0, Math.min(MAPA.x1, x)); y = Math.max(MAPA.y0, Math.min(MAPA.y1, y));
    estado.punto = aPunto(x, y); pintarMapa(); pintarResultadoLugar(); pedirRutas();
  }

  function enlazarMapa() {
    const svg = $('#mapa svg'); let arrastrando = false;
    const desde = ev => { const r = svg.getBoundingClientRect(); return { x: MAPA.x0 + (ev.clientX - r.left) / r.width * ANCHO, y: MAPA.y1 - (ev.clientY - r.top) / r.height * ALTO }; };
    svg.addEventListener('pointerdown', ev => { arrastrando = true; svg.setPointerCapture(ev.pointerId); const p = desde(ev); moverPunto(p.x, p.y); $('#yo').focus({ preventScroll: true }); });
    svg.addEventListener('pointermove', ev => { if (!arrastrando) return; const p = desde(ev); moverPunto(p.x, p.y); });
    const soltar = () => { arrastrando = false; };
    svg.addEventListener('pointerup', soltar); svg.addEventListener('pointercancel', soltar);
    $('#yo').addEventListener('keydown', ev => {
      const paso = ev.shiftKey ? 1.5 : .4, k = aKm(estado.punto), d = { ArrowLeft: [-paso, 0], ArrowRight: [paso, 0], ArrowUp: [0, paso], ArrowDown: [0, -paso] }[ev.key];
      if (!d) return; ev.preventDefault(); moverPunto(k.x + d[0], k.y + d[1]);
    });
  }

  const ATAJOS = [['Junto a Los Héroes', 7.2, 5], ['Junto a Las Américas', -5.7, 4.4], ['Junto a Plaza Odara', 1.3, 8.6], ['Entre las tres', 2.2, 5], ['Lejos de todas', 15, .5]];

  // ---------- diálogo: dónde ----------
  function pintarResultadoLugar() {
    const cont = $('#resultadoLugar'), btn = $('#confirmarLugar');
    const tipo = $('input[name=entregaLugar]:checked').value;
    if (tipo === 'recoger') {
      const s = sucursalPorId($('#selRecoger').value), e = estadoDe(s);
      cont.innerHTML = e === 'abierta'
        ? `<div class="caja-info"><p>Recoges en <b>${esc(s.nombre)}</b></p><p>${esc(s.direccion)}</p></div>`
        : `<div class="caja-info mal"><p><b>${esc(s.nombre)}</b> ${razonTexto(e)} en este momento.</p><p>Elige otra sucursal.</p></div>`;
      btn.disabled = e !== 'abierta'; return;
    }
    if (CONFIG.rutaReal && estado.cargandoRuta) { cont.innerHTML = '<div class="caja-info"><p><b>Calculando la ruta…</b></p><p>Buscamos la sucursal más cercana por calle.</p></div>'; btn.disabled = true; return; }
    const e = entregaActual(), r = e.resultado;
    if (e.ok) {
      const km = e.km.toFixed(1), env = e.envio;
      let html = '';
      if (e.aviso) html += `<div class="caja-info aviso"><p><b>${esc(e.aviso.cercana)}</b> ${razonTexto(e.aviso.razon)}.</p><p>Tu pedido sale de <b>${esc(e.sucursal.nombre)}</b>, a ${km} km, así que el envío puede costar más.</p></div>`;
      html += `<div class="caja-info"><p>Tu pedido sale de <b>${esc(e.sucursal.nombre)}</b></p><p>${esc(textoRuta(e))} · Envío ${L.dinero(env.costo)}${env.tipo === 'zona' ? ` (${esc(env.detalle)})` : ' (por kilómetro)'}${e.sucursal.reparto === 'externo' ? ' · lo lleva un grupo de repartidores' : ''}</p></div>`;
      cont.innerHTML = html; btn.disabled = false;
    } else {
      cont.innerHTML = r.motivo === 'fuera-de-zona'
        ? '<div class="caja-info mal"><p><b>Estás fuera de la zona de reparto de las tres sucursales.</b></p><p>Puedes recoger tu pedido en la que prefieras.</p></div>'
        : '<div class="caja-info mal"><p><b>Por ahora ninguna sucursal puede llevarte el pedido.</b></p><p>Pueden estar cerradas o con los pedidos en pausa. Puedes intentar más tarde o recoger cuando abran.</p></div>';
      btn.disabled = true;
    }
  }

  function pintarSelectRecoger() {
    const sel = $('#selRecoger'), previo = estado.recoger || sel.value;
    sel.innerHTML = sucursales().map(s => `<option value="${s.id}">${esc(s.nombre)} · ${textoEstado(estadoDe(s))}</option>`).join('');
    const abiertas = sucursales().filter(s => estadoDe(s) === 'abierta');
    sel.value = sucursales().some(s => s.id === previo) ? previo : (abiertas[0] || sucursales()[0]).id;
  }

  function sincronizarTipoLugar() {
    const tipo = $('input[name=entregaLugar]:checked').value;
    $('#bloqueDomicilio').hidden = tipo !== 'domicilio'; $('#bloqueRecoger').hidden = tipo !== 'recoger';
    estado.entrega = tipo; pintarResultadoLugar();
  }

  function abrirLugar() {
    estado.entrega = guardar.leer('entrega', 'domicilio');
    $(`input[name=entregaLugar][value=${estado.entrega}]`).checked = true;
    pintarSelectRecoger(); pintarMapa(); pedirRutas(0);
    $('#bloqueDomicilio').hidden = estado.entrega !== 'domicilio'; $('#bloqueRecoger').hidden = estado.entrega !== 'recoger';
    pintarResultadoLugar(); $('#dlgLugar').showModal();
  }

  function confirmarLugar() {
    const tipo = $('input[name=entregaLugar]:checked').value;
    estado.entrega = tipo; if (tipo === 'recoger') estado.recoger = $('#selRecoger').value;
    guardar.poner('entrega', estado.entrega); guardar.poner('punto', estado.punto); guardar.poner('recoger', estado.recoger); guardar.poner('eligio', true);
    $('#dlgLugar').close(); pintarChip();
    if ($('#dlgPedido').open) pintarPedido();
    const e = entregaActual();
    avisar(e.ok ? (e.tipo === 'recoger' ? `Recoges en ${e.sucursal.nombre}.` : `Tu pedido saldría de ${e.sucursal.nombre}.`) : 'Listo, guardamos tu elección.');
  }

  // ---------- diálogo: pedido ----------
  function pintarPedido() {
    const ls = lineas(), vacio = ls.length === 0;
    $('#pedidoVacio').hidden = !vacio; $('#formPedido').hidden = vacio;
    if (vacio) return;
    $('#lineas').innerHTML = ls.map(l => `<li data-key="${esc(l.key)}"><span class="l-nombre">${esc(l.n)}</span><span class="l-precio">${L.dinero(l.p * l.cant)}</span>${l.detalle.length ? `<ul class="l-detalle">${l.detalle.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}<div class="cantidad"><button type="button" class="menos" data-linea="menos" aria-label="Quitar uno de ${esc(l.n)}">−</button><output>${l.cant}</output><button type="button" class="mas" data-linea="mas" aria-label="Agregar otro ${esc(l.n)}">+</button></div>${l.armada ? `<button type="button" class="editar" data-editar aria-label="Cambiar lo que elegiste en ${esc(l.n)}">Cambiar</button>` : ''}</li>`).join('');
    $(`input[name=entrega][value=${estado.entrega}]`).checked = true;
    const e = entregaActual(), dom = estado.entrega === 'domicilio';
    $('#campoDireccion').hidden = !dom; $('#direccion').required = dom;
    const tot = L.totales(ls, dom && e.ok ? e.envio : null);
    $('#totales').innerHTML = `<div><span>Subtotal</span><span>${L.dinero(tot.subtotal)}</span></div>` + (dom ? `<div><span>Envío</span><span>${e.ok ? L.dinero(tot.envio) : 'Sin calcular'}</span></div>` : '') + `<div class="total"><span>Total</span><span>${L.dinero(tot.total)}</span></div>`;
    let info;
    if (!dom) info = e.ok ? `<div class="caja-info"><div><p>Recoges en <b>${esc(e.sucursal.nombre)}</b></p><p>${esc(e.sucursal.direccion)}</p></div></div>` : `<div class="caja-info mal"><p><b>${esc(e.sucursal.nombre)}</b> ${razonTexto(e.problema)} en este momento.</p></div>`;
    else if (e.ok) info = (e.aviso ? `<div class="caja-info aviso"><p><b>${esc(e.aviso.cercana)}</b> ${razonTexto(e.aviso.razon)}. Tu pedido sale de ${esc(e.sucursal.nombre)}.</p></div>` : '') + `<div class="caja-info"><div><p>Sale de <b>${esc(e.sucursal.nombre)}</b></p><p>${esc(textoRuta(e))} · envío ${L.dinero(e.envio.costo)}</p></div></div>`;
    else info = '<div class="caja-info mal"><div><p><b>Todavía no sabemos de qué sucursal saldría.</b></p><p>Marca tu ubicación o elige recoger en sucursal.</p></div></div>';
    $('#infoEntrega').innerHTML = info + `<button type="button" class="boton" data-cambiar-lugar style="width:100%;margin:-4px 0 14px">${dom ? 'Cambiar ubicación' : 'Cambiar sucursal'}</button>`;
    $('#errorEnvio').style.display = 'none';
  }

  function abrirPedido() { pintarPedido(); $('#dlgPedido').showModal(); }

  let enviando = false;
  async function enviarPedido(ev) {
    ev.preventDefault();
    if (enviando) return;
    const form = $('#formPedido'), err = $('#errorEnvio');
    const falla = t => { err.textContent = t; err.style.display = 'block'; err.scrollIntoView({ block: 'nearest' }); };
    if (!form.checkValidity()) { form.reportValidity(); return; }
    if (!lineas().length) return falla('Agrega algo al pedido primero.');
    const e = entregaActual(), dom = estado.entrega === 'domicilio';
    if (dom && CONFIG.rutaReal && estado.cargandoRuta) return falla('Estamos calculando la ruta. Intenta de nuevo en un momento.');
    if (!e.ok) return falla(dom ? 'Por ahora ninguna sucursal puede llevarte el pedido. Cambia a «Recoger en sucursal» o intenta más tarde.' : `${e.sucursal.nombre} ${razonTexto(e.problema)} en este momento. Elige otra sucursal.`);
    const fd = new FormData(form);
    // Gojira carga su rayo (≈0.7 s) y dispara; con movimiento reducido no espera.
    if (!sinMovimiento()) { enviando = true; $('#btnEnviar').disabled = true; document.body.classList.add('cargando'); await pausa(720); document.body.classList.replace('cargando', 'disparado'); await pausa(260); document.body.classList.remove('disparado'); $('#btnEnviar').disabled = false; enviando = false; }
    estado.folio += 1; guardar.poner('folio', estado.folio);
    const pedido = { folio: 'GJ-' + String(estado.folio).padStart(4, '0'), sucursal: e.sucursal, nombre: fd.get('nombre'), telefono: fd.get('telefono'), entrega: estado.entrega,
      direccion: fd.get('direccion'), punto: dom ? estado.punto : null, lineas: lineas(), envio: dom ? e.envio : null, pago: fd.get('pago'), notas: fd.get('notas') };
    const texto = L.armarMensaje(pedido);
    $('#mensaje').textContent = texto;
    $('#textoListo').textContent = CONFIG.envioReal ? 'Se abrió WhatsApp con este mensaje para la sucursal.' : `Esto es una muestra: no se envía nada. En la versión real este mensaje llega por WhatsApp a ${e.sucursal.nombre}.`;
    $('#dlgPedido').close(); $('#dlgListo').showModal();
    if (CONFIG.envioReal) window.open(L.urlWhatsApp(e.sucursal.whatsapp, texto), '_blank', 'noopener');
  }

  async function copiar() {
    const t = $('#mensaje').textContent;
    try { await navigator.clipboard.writeText(t); avisar('Mensaje copiado.'); }
    catch { const r = document.createRange(); r.selectNodeContents($('#mensaje')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); avisar('Selecciona y copia el mensaje.'); }
  }

  // Vaciar el pedido: pide una confirmación dentro de la misma ventana (no se usa confirm(), que algunos navegadores bloquean)
  function pedirVaciar(ver) { $('#vaciarPedido').hidden = ver; $('#vaciarConfirma').hidden = !ver; if (ver) $('#vaciarNo').focus({ preventScroll: true }); }
  function vaciarPedido() {
    estado.lineas = []; guardarLineas(); $$('.platillo').forEach(pintarControl); pintarBarra(); pintarPedido(); pedirVaciar(false);
    avisar('Pedido vaciado.');
  }
  function nuevoPedido() { estado.lineas = []; guardarLineas(); $$('.platillo').forEach(pintarControl); pintarBarra(); $('#dlgListo').close(); $('#formPedido').reset(); }

  let relojAviso;
  function avisar(t) { const el = $('#toast'); el.textContent = t; el.classList.add('ver'); clearTimeout(relojAviso); relojAviso = setTimeout(() => el.classList.remove('ver'), 2600); }


  // ---------- hoja para armar o personalizar ----------
  // Todo sale de la receta (datos.js): la hoja solo dibuja pasos, cuenta lo elegido y avisa qué falta.
  let arm = null; // { it, r, sel, i, edita }
  const pasosVisibles = () => arm.r.modo === 'hoja' ? arm.r.pasos : [arm.r.pasos[arm.i]];
  const textoOpc = (paso, o) => o.p ? (paso.verPrecio ? '+' : '') + L.dinero(o.p) : '';

  function abrirArmar(id, linea) {
    const it = ITEMS[id], r = recetaDe(it); if (!r) return;
    arm = { it, r, sel: linea ? JSON.parse(JSON.stringify(linea.sel)) : {}, i: 0, edita: linea ? linea.key : null };
    $('#tArmar').textContent = r.modo === 'hoja' ? it.n : r.titulo;
    pintarPasoArmar(); $('#dlgArmar').showModal();
  }

  function pintarPasoArmar() {
    const hoja = arm.r.modo === 'hoja';
    $('#armarCuerpo').innerHTML = pasosVisibles().map(paso => {
      const lista = nombres => nombres.includes.bind(nombres), sel = lista(arm.sel[paso.id] || []);
      const veces = n => (arm.sel[paso.id] || []).filter(x => x === n).length;
      const unico = paso.max === 1 && paso.min === 1;
      return `<fieldset class="paso" data-paso="${esc(paso.id)}"><legend tabindex="-1">${esc(paso.titulo)}${paso.nota ? ` <small>${esc(paso.nota)}</small>` : ''}</legend><div class="opc-lista">` + paso.opciones.map(o => paso.contar
        ? `<div class="opc contar" data-n="${esc(o.n)}"><span class="opc-n">${esc(o.n)}</span><div class="cantidad"><button type="button" class="menos" data-menos aria-label="Quitar uno: ${esc(o.n)}">−</button><output aria-label="${esc(o.n)}">${veces(o.n)}</output><button type="button" class="mas" data-mas aria-label="Agregar uno: ${esc(o.n)}">+</button></div></div>`
        : `<label class="opc"><input type="${unico ? 'radio' : 'checkbox'}" name="p-${esc(paso.id)}" data-n="${esc(o.n)}" ${sel(o.n) ? 'checked' : ''}><span class="opc-n">${esc(o.n)}</span><span class="opc-p">${textoOpc(paso, o)}</span></label>`).join('') + '</div></fieldset>';
    }).join('');
    $('#dlgArmar').scrollTo({ top: 0 });
    actualizarArmar();
    if (!hoja) $('#armarCuerpo legend').focus({ preventScroll: true });
  }

  // Pone al día lo que se ve (desactivados, contadores, total, botones) sin volver a dibujar los pasos.
  function actualizarArmar() {
    const { r, sel } = arm, hoja = r.modo === 'hoja', paso = r.pasos[arm.i], total = L.precioLinea(arm.it, r, sel);
    for (const p of pasosVisibles()) {
      const fs = $(`[data-paso="${p.id}"]`), q = (sel[p.id] || []).length;
      $$('input', fs).forEach(inp => { inp.disabled = p.max > 1 && q >= p.max && !inp.checked; inp.closest('.opc').classList.toggle('lleno', inp.disabled); });
      $$('.opc.contar', fs).forEach(d => { const n = (sel[p.id] || []).filter(x => x === d.dataset.n).length; $('output', d).textContent = n; $('[data-menos]', d).disabled = n === 0; $('[data-mas]', d).disabled = q >= p.max; });
    }
    const valido = hoja ? L.validarSeleccion(r, sel) : L.revisarPaso(paso, sel), ultimo = hoja || arm.i === r.pasos.length - 1;
    const resumen = L.detalleLinea(r, sel).join(' · ');
    $('#armarProgreso').textContent = hoja ? `Base ${L.dinero(arm.it.p)} · cada extra suma a tu rollo` : (r.pasos.length > 1 ? `Paso ${arm.i + 1} de ${r.pasos.length}` : '');
    $('#armarBarra').style.setProperty('--paso', hoja ? 100 : Math.round((arm.i + 1) / r.pasos.length * 100));
    $('#armarBarra').hidden = hoja || r.pasos.length < 2;
    const pista = $('#armarPista'); pista.textContent = valido.ok ? (resumen || 'Sin cambios: así viene el rollo.') : valido.mensaje; pista.classList.toggle('falta', !valido.ok);
    $('#armarAtras').hidden = hoja || arm.i === 0;
    const sig = $('#armarSig'); sig.disabled = !valido.ok;
    sig.textContent = ultimo ? `${arm.edita ? 'Guardar cambios' : 'Agregar al pedido'} · ${L.dinero(total)}` : 'Siguiente';
  }

  function elegirArmar(paso, nombre, marcado) {
    let lista = (arm.sel[paso.id] || []).slice();
    if (marcado) lista = paso.max === 1 ? [nombre] : (lista.includes(nombre) ? lista : lista.concat(nombre));
    else lista = lista.filter(x => x !== nombre);
    if (lista.length) arm.sel[paso.id] = lista; else delete arm.sel[paso.id];
  }

  function confirmarArmar() {
    const { it, r, sel } = arm, v = L.validarSeleccion(r, sel);
    if (!v.ok) { actualizarArmar(); return; }
    let cant = 1, lugar = -1;
    if (arm.edita) { const vieja = estado.lineas.find(l => l.key === arm.edita); if (vieja) { cant = vieja.cant; lugar = estado.lineas.indexOf(vieja); estado.lineas.splice(lugar, 1); } }
    const yaEra = estado.lineas.some(l => l.key === L.claveLinea(it.id, sel));
    agregarLinea(it.id, sel, cant);
    if (lugar >= 0 && !yaEra) estado.lineas.splice(lugar, 0, estado.lineas.pop()); // al editar, la línea se queda donde estaba
    guardarLineas();
    $$('.platillo').forEach(li => { if (li.dataset.id === it.id) pintarControl(li); });
    $('#dlgArmar').close(); pintarBarra(); pulsoOjo();
    if ($('#dlgPedido').open) pintarPedido();
    avisar(arm.edita ? 'Cambios guardados.' : `Agregado: ${it.n}`);
    arm = null;
  }

  function enlazarArmar() {
    const cuerpo = $('#armarCuerpo');
    cuerpo.addEventListener('change', ev => {
      const inp = ev.target.closest('input[data-n]'); if (!inp) return;
      const paso = arm.r.pasos.find(p => p.id === inp.closest('[data-paso]').dataset.paso);
      if (paso.max === 1 && inp.checked) $$('input', inp.closest('fieldset')).forEach(o => { if (o !== inp) o.checked = false; });
      elegirArmar(paso, inp.dataset.n, inp.checked); actualizarArmar();
    });
    cuerpo.addEventListener('click', ev => {
      const b = ev.target.closest('[data-mas],[data-menos]'); if (!b) return;
      const paso = arm.r.pasos.find(p => p.id === b.closest('[data-paso]').dataset.paso), nombre = b.closest('.opc').dataset.n, lista = (arm.sel[paso.id] || []).slice();
      if (b.hasAttribute('data-mas')) { if (lista.length >= paso.max) return; lista.push(nombre); }
      else { const k = lista.indexOf(nombre); if (k < 0) return; lista.splice(k, 1); }
      if (lista.length) arm.sel[paso.id] = lista; else delete arm.sel[paso.id];
      actualizarArmar();
    });
    $('#armarAtras').addEventListener('click', () => { if (arm.i > 0) { arm.i--; pintarPasoArmar(); } });
    $('#armarSig').addEventListener('click', () => {
      if (arm.r.modo === 'hoja' || arm.i === arm.r.pasos.length - 1) return confirmarArmar();
      if (!L.revisarPaso(arm.r.pasos[arm.i], arm.sel).ok) return;
      arm.i++; pintarPasoArmar();
    });
    $('#dlgArmar').addEventListener('close', () => { arm = null; });
  }

  // ---------- demostración ----------
  function pintarDemo() {
    $('#demoControles').innerHTML = D.SUCURSALES.map(s => `<label for="pausa-${s.id}">Pausar ${esc(s.nombre)}<input type="checkbox" id="pausa-${s.id}" data-pausa="${s.id}" ${estado.pausas[s.id] ? 'checked' : ''}></label>`).join('');
  }
  function refrescarTodo() {
    pintarSucursales(); pintarChip();
    if ($('#dlgLugar').open) { pintarSelectRecoger(); pintarMapa(); pintarResultadoLugar(); }
    if ($('#dlgPedido').open) pintarPedido();
  }

  // ---------- eventos ----------
  function enlazar() {
    $('#menu').addEventListener('click', ev => {
      const b = ev.target.closest('[data-acc]'); if (!b) return;
      const id = b.closest('.platillo').dataset.id;
      if (b.dataset.acc === 'armar') return abrirArmar(id);
      cambiarCantidad(id, b.dataset.acc === 'mas' ? 1 : -1);
    });
    $('#lineas').addEventListener('click', ev => {
      const li = ev.target.closest('#lineas > li'); if (!li) return;
      if (ev.target.closest('[data-editar]')) { const l = estado.lineas.find(x => x.key === li.dataset.key); if (l) abrirArmar(l.id, l); return; }
      const b = ev.target.closest('[data-linea]'); if (!b) return;
      cambiarCantidad(li.dataset.key, b.dataset.linea === 'mas' ? 1 : -1);
    });
    enlazarArmar();
    $('#tarjetas').addEventListener('click', ev => {
      const b = ev.target.closest('[data-recoger]'); if (!b) return;
      estado.entrega = 'recoger'; estado.recoger = b.dataset.recoger;
      guardar.poner('entrega', 'recoger'); guardar.poner('recoger', estado.recoger); guardar.poner('eligio', true);
      pintarChip(); const s = sucursalPorId(estado.recoger); avisar(estadoDe(s) === 'abierta' ? `Recoges en ${s.nombre}.` : `${s.nombre} ${razonTexto(estadoDe(s))} ahora; elige otra para pedir.`);
    });
    $('#chipLugar').addEventListener('click', abrirLugar);
    $('#btnUbicacion').addEventListener('click', abrirLugar);
    $('#verPedido').addEventListener('click', abrirPedido);
    $('#confirmarLugar').addEventListener('click', confirmarLugar);
    $$('input[name=entregaLugar]').forEach(r => r.addEventListener('change', sincronizarTipoLugar));
    $('#selRecoger').addEventListener('change', pintarResultadoLugar);
    $('#atajos').innerHTML = ATAJOS.map(([t, x, y]) => `<button type="button" data-x="${x}" data-y="${y}">${esc(t)}</button>`).join('');
    $('#atajos').addEventListener('click', ev => { const b = ev.target.closest('button'); if (b) moverPunto(+b.dataset.x, +b.dataset.y); });
    $$('input[name=entrega]').forEach(r => r.addEventListener('change', () => { estado.entrega = r.value; guardar.poner('entrega', r.value); guardar.poner('eligio', true); pintarChip(); pintarPedido(); }));
    $('#infoEntrega').addEventListener('click', ev => { if (ev.target.closest('[data-cambiar-lugar]')) abrirLugar(); });
    $('#formPedido').addEventListener('submit', enviarPedido);
    $('#copiarMensaje').addEventListener('click', copiar);
    $('#nuevoPedido').addEventListener('click', nuevoPedido);
    $('#vaciarPedido').addEventListener('click', () => pedirVaciar(true));
    $('#vaciarNo').addEventListener('click', () => { pedirVaciar(false); $('#vaciarPedido').focus({ preventScroll: true }); });
    $('#vaciarSi').addEventListener('click', vaciarPedido);
    $('#dlgPedido').addEventListener('close', () => pedirVaciar(false));
    $$('dialog').forEach(d => {
      d.addEventListener('click', ev => { if (ev.target === d) d.close(); });
      $$('[data-cerrar]', d).forEach(b => b.addEventListener('click', () => d.close()));
    });
    $('#demoControles').addEventListener('change', ev => { const c = ev.target.closest('[data-pausa]'); if (!c) return; estado.pausas[c.dataset.pausa] = c.checked; refrescarTodo(); });
    $('#demoHora').addEventListener('change', ev => { estado.demoHora = ev.target.value === 'real' ? null : +ev.target.value; refrescarTodo(); });
    $('#demoReiniciar').addEventListener('click', () => { estado.pausas = {}; estado.demoHora = null; $('#demoHora').value = 'real'; pintarDemo(); nuevoPedido(); refrescarTodo(); avisar('Demostración reiniciada.'); });
  }

  // ---------- arranque ----------
  $$('select#pago').forEach(s => s.insertAdjacentHTML('beforeend', D.PAGOS.map(p => `<option>${esc(p)}</option>`).join('')));
  // Teléfono: al menos 10 dígitos (acepta espacios, guiones y paréntesis)
  $('#telefono').addEventListener('input', ev => { const d = ev.target.value.replace(/\D/g, ''); ev.target.setCustomValidity(d.length >= 10 && d.length <= 13 ? '' : 'Escribe un teléfono de 10 dígitos.'); });
  $('#btnGps').hidden = !CONFIG.coordenadasReales;
  if (CONFIG.coordenadasReales) {
    $('#pistaMapa').textContent = CONFIG.sucursalesDeEjemplo ? 'Toca «Usar mi ubicación» y el navegador te pedirá permiso. En esta muestra las 3 sucursales se colocan cerca de ti para que veas cómo se elige la más cercana por ruta; en la versión real usan sus direcciones. También puedes mover el punto.' : 'Usamos tu ubicación para ver qué sucursal te queda más cerca. Si prefieres, mueve el punto en el mapa.';
    $('#btnGps').addEventListener('click', () => {
      if (!navigator.geolocation) return avisar('Tu teléfono no permite ver tu ubicación. Mueve el punto del mapa.');
      navigator.geolocation.getCurrentPosition(p => { estado.punto = { lat: p.coords.latitude, lng: p.coords.longitude }; if (CONFIG.sucursalesDeEjemplo) { reanclar(estado.punto); guardar.poner('anclado', true); guardar.poner('punto', estado.punto); } pintarMapa(); pintarResultadoLugar(); pedirRutas(0); },
        () => avisar('No pudimos ver tu ubicación. Mueve el punto del mapa.'), { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
    });
  }
  if (CONFIG.rutaReal && guardar.leer('eligio', false)) pedirRutas(0);
  pintarMenu(); barraArriba(); vigilarCategorias(); pintarSucursales(); pintarBarra(); pintarChip(); construirMapa(); enlazarMapa(); pintarDemo(); enlazar();
})();
