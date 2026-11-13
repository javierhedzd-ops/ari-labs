#!/usr/bin/env node
// Cliente simulado para Carnitas El Rey: usa la página como lo haría la gente de verdad,
// en varios teléfonos, y deja un tablero (tablero.html) con lo que pasó.
// Uso: node herramientas/cliente-simulado/el-rey.js /ruta/a/restaurante-el-rey [carpeta-salida]
// La base de datos se simula (no toca los datos reales de Kevin).
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');

const RAIZ = process.argv[2] || path.join(__dirname, '../../../restaurante-el-rey');
const SALIDA = process.argv[3] || path.join(process.cwd(), 'resultado-cliente-simulado');
fs.mkdirSync(path.join(SALIDA, 'capturas'), { recursive: true });

const R = { lat: 20.976046, lng: -89.599178 };
const lejos = km => ({ latitude: R.lat, longitude: R.lng + km / (111.32 * Math.cos(R.lat * Math.PI / 180)) });
const ENVIO = { restaurante: R, base: 40, baseKm: 4, porKm: 7, maxKm: 0, minutos: 45 };
// Abierto: jueves 19/11/2026 15:00 en Mérida. Cerrado: martes 17/11/2026 15:00 (descansa).
const ABIERTO = new Date('2026-11-19T21:00:00Z'), MARTES = new Date('2026-11-17T21:00:00Z');

const TELEFONOS = [
  ['iPhone SE', devices['iPhone SE']], ['iPhone 15', devices['iPhone 15']], ['Pixel 7', devices['Pixel 7']],
  ['Android chico', { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['iPad', devices['iPad (gen 7)']], ['Computadora', { viewport: { width: 1366, height: 800 } }]
];

const tipo = f => f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.png') ? 'image/png' : f.endsWith('.jpg') ? 'image/jpeg' : f.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream';
const servidor = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(RAIZ, u.endsWith('/') ? u + 'index.html' : u);
  fs.readFile(f, (x, d) => { r.writeHead(x ? 404 : 200, { 'content-type': tipo(f) }); r.end(d); });
}).listen(0);
const URL_PAG = () => `http://127.0.0.1:${servidor.address().port}/`;

// Cada caso: nombre, qué revisa y la prueba. ctx = { c (contexto), p (página), eventos[], enviado() }
const CASOS = [
  ['Abre la página', 'Carga sin errores, sin moverse de lado y en pocos segundos', {}, async ({ p, errores, t0 }) => {
    const ms = Date.now() - t0;
    const desborda = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    if (desborda) throw new Error('La página se sale de la pantalla a lo ancho');
    if (errores.length) throw new Error('Error en la página: ' + errores[0]);
    return `Cargó en ${ms} ms`;
  }],
  ['Pide para recoger', 'Dos tacos, pasa a recoger: el mensaje lleva productos, total y teléfono', {}, async ({ p, enviado }) => {
    await p.evaluate(() => { cambiar('t_mac', 1); cambiar('t_cos', 1); abrirPedido(); });
    await p.fill('#f-nombre', 'Ana'); await p.fill('#f-telefono', '999 123 4567');
    await p.click('#pedido-enviar'); await p.waitForTimeout(200);
    const m = enviado(); if (!m) throw new Error('No se abrió WhatsApp');
    for (const x of ['Taco de maciza', 'Taco de costilla', '$70', '9991234567', 'Paso a recoger']) if (!m.includes(x)) throw new Error('Al mensaje le falta: ' + x);
    return 'Mensaje correcto';
  }],
  ['Pide a domicilio', 'Con dirección y ubicación a ~6 km: cobra el envío correcto', { geo: lejos(4.5) }, async ({ p, enviado }) => {
    await p.evaluate(() => { cambiar('k_promo', 1); abrirPedido(); });
    await p.fill('#f-nombre', 'Luis'); await p.fill('#f-telefono', '9991234567');
    await p.check('input[name="entrega"][value="domicilio"]'); await p.fill('#f-direccion', 'Calle 20 #300 x 21 y 23, Chuminópolis');
    await p.click('#f-ubicacion'); await p.waitForTimeout(400);
    await p.click('#pedido-enviar'); await p.waitForTimeout(200);
    const m = enviado(); if (!m) throw new Error('No se abrió WhatsApp');
    if (!m.includes('Envío (Fast Delivery):* $54')) throw new Error('El envío no es $54: ' + (m.match(/Envío[^\n]*/) || ['sin envío'])[0]);
    if (!m.includes('maps.google.com')) throw new Error('Falta el mapa');
    return 'Envío $54 y mapa incluidos';
  }],
  ['Envío por calle', 'La ruta por calles da 7.2 km: cobra $68 y lo dice en el pedido', { rutaKm: 7.2, geo: lejos(4.5) }, async ({ p, enviado }) => {
    await p.evaluate(() => { cambiar('t_mac', 1); abrirPedido(); });
    await p.fill('#f-nombre', 'Rut'); await p.fill('#f-telefono', '9991234567');
    await p.check('input[name="entrega"][value="domicilio"]'); await p.fill('#f-direccion', 'Calle 50 #10, Centro');
    await p.click('#f-ubicacion'); await p.waitForTimeout(800);
    const estado = await p.textContent('#f-ubicacion-estado'); if (!/7\.2 km por calle/.test(estado)) throw new Error('No usa la ruta: ' + estado);
    await p.click('#pedido-enviar'); await p.waitForTimeout(200);
    const m = enviado() || ''; if (!m.includes('$68') || !m.includes('por calle')) throw new Error('El pedido no lleva el envío por calle');
    return 'Cobra $68 por 7.2 km de ruta';
  }],
  ['Falla el cálculo de ruta', 'Si el servicio de rutas no responde, usa el cálculo de respaldo y deja pedir', { rutaFalla: true, geo: lejos(4.5) }, async ({ p, enviado }) => {
    await p.evaluate(() => { cambiar('t_mac', 1); abrirPedido(); });
    await p.fill('#f-nombre', 'Res'); await p.fill('#f-telefono', '9991234567');
    await p.check('input[name="entrega"][value="domicilio"]'); await p.fill('#f-direccion', 'Calle 50 #10, Centro');
    await p.click('#f-ubicacion'); await p.waitForTimeout(800);
    await p.click('#pedido-enviar'); await p.waitForTimeout(200);
    const m = enviado() || ''; if (!m.includes('$54') || !m.includes('línea recta')) throw new Error('No usó el respaldo: ' + (m.match(/Envío[^\n]*/) || ['sin envío'])[0]);
    return 'Respaldo: $54 en línea recta';
  }],
  ['Olvida datos', 'Sin teléfono, sin dirección o sin ubicación: no deja enviar y dice qué falta', {}, async ({ p, enviado }) => {
    await p.evaluate(() => { cambiar('t_mac', 1); abrirPedido(); });
    await p.fill('#f-nombre', 'Eva'); await p.check('input[name="entrega"][value="domicilio"]');
    const avisos = [];
    await p.click('#pedido-enviar'); avisos.push(await p.textContent('#f-error'));
    await p.fill('#f-telefono', '9991234567'); await p.click('#pedido-enviar'); avisos.push(await p.textContent('#f-error'));
    await p.fill('#f-direccion', 'Calle 1'); await p.click('#pedido-enviar'); avisos.push(await p.textContent('#f-error'));
    if (enviado()) throw new Error('Envió el pedido incompleto');
    if (avisos.some(a => !a.trim())) throw new Error('Falta un aviso: ' + JSON.stringify(avisos));
    return '3 avisos claros';
  }],
  ['No da permiso de ubicación', 'Niega la ubicación: la página avisa y no se traba', { sinPermiso: true }, async ({ p, enviado }) => {
    await p.evaluate(() => { cambiar('t_mac', 1); abrirPedido(); });
    await p.check('input[name="entrega"][value="domicilio"]'); await p.click('#f-ubicacion'); await p.waitForTimeout(600);
    const e = await p.textContent('#f-ubicacion-estado'); if (!e.trim()) throw new Error('No avisa nada');
    if (enviado()) throw new Error('Envió sin ubicación');
    return 'Avisa: ' + e.trim().slice(0, 60);
  }],
  ['Elige carne y picante', 'Dos chilaquiles distintos: cada uno llega con su carne y picante', {}, async ({ p, enviado }) => {
    await p.evaluate(() => cambiar('esp_chil', 1)); await p.click('.chip-op:has-text("Costilla")'); await p.click('#opciones button.btn-primary');
    await p.evaluate(() => cambiar('esp_chil', 1)); await p.click('.chip-op:has-text("Sin picante")'); await p.click('#opciones button.btn-primary');
    await p.evaluate(() => abrirPedido()); await p.fill('#f-nombre', 'Leo'); await p.fill('#f-telefono', '9991234567');
    await p.click('#pedido-enviar'); await p.waitForTimeout(200);
    const m = enviado() || ''; if (!m.includes('Costilla, con picante') || !m.includes('Maciza, sin picante')) throw new Error('No llegan las elecciones');
    return 'Llegan las dos elecciones';
  }],
  ['Quita y vuelve a poner', 'Agrega, quita y agrega: cantidades y elecciones cuadran', {}, async ({ p }) => {
    for (const c of ['Maciza', 'Buche']) { await p.evaluate(() => cambiar('esp_reyn', 1)); await p.click(`.chip-op:has-text("${c}")`); await p.click('#opciones button.btn-primary'); }
    await p.evaluate(() => cambiar('esp_reyn', -1));
    const r = await p.evaluate(() => [pedido.esp_reyn, (elecciones.esp_reyn || []).join('|')]);
    if (r[0] !== 1 || r[1] !== 'Maciza') throw new Error('No cuadra: ' + JSON.stringify(r));
    return '1 reyna de maciza';
  }],
  ['Restaurante cerrado', 'Martes (descanso): no deja enviar y explica el horario', { hora: MARTES }, async ({ p, enviado }) => {
    await p.evaluate(() => { cambiar('t_mac', 1); abrirPedido(); });
    const aviso = await p.textContent('#pedido-bloqueo'), apagado = await p.isDisabled('#pedido-enviar');
    if (!apagado) throw new Error('El botón de enviar sigue activo');
    if (!/cerrad/i.test(aviso)) throw new Error('No explica que está cerrado');
    if (enviado()) throw new Error('Se envió estando cerrado');
    return 'Bloqueado con aviso';
  }],
  ['Pedidos en pausa', 'Kevin pausó los pedidos: nadie puede enviar', { pausa: true }, async ({ p, enviado }) => {
    await p.evaluate(() => { cambiar('t_mac', 1); abrirPedido(); });
    if (!await p.isDisabled('#pedido-enviar')) throw new Error('El botón sigue activo');
    if (!/muchos pedidos/i.test(await p.textContent('#pedido-bloqueo'))) throw new Error('No avisa de la pausa');
    if (enviado()) throw new Error('Se envió en pausa');
    return 'Bloqueado con aviso';
  }],
  ['Se cae la base de datos', 'Sin servidor de precios: la página sigue y deja pedir', { sinNube: true }, async ({ p, enviado }) => {
    await p.evaluate(() => { cambiar('t_mac', 1); abrirPedido(); });
    await p.fill('#f-nombre', 'Max'); await p.fill('#f-telefono', '9991234567'); await p.click('#pedido-enviar'); await p.waitForTimeout(200);
    if (!enviado()) throw new Error('No deja pedir sin la base de datos');
    return 'Funciona con los precios guardados';
  }],
  ['Teléfono en inglés', 'Un turista: la página sale en inglés y el pedido llega marcado', { locale: 'en-US' }, async ({ p, enviado }) => {
    const titulo = await p.textContent('#pedido-titulo'); if (titulo.trim() !== 'Your order') throw new Error('No cambia a inglés');
    await p.evaluate(() => { cambiar('t_mac', 1); abrirPedido(); });
    await p.fill('#f-nombre', 'John'); await p.fill('#f-telefono', '9991234567'); await p.click('#pedido-enviar'); await p.waitForTimeout(200);
    if (!(enviado() || '').includes('inglés')) throw new Error('El pedido no avisa que el cliente habla inglés');
    return 'En inglés y avisado';
  }],
  ['Cliente que repite', 'Pide una vez; la siguiente ya tiene sus datos llenos, y puede olvidarlos', { geo: lejos(4.5) }, async ({ p }) => {
    await p.evaluate(() => { cambiar('t_mac', 1); abrirPedido(); });
    await p.fill('#f-nombre', 'Rosa'); await p.fill('#f-telefono', '9997654321');
    await p.check('input[name="entrega"][value="domicilio"]'); await p.fill('#f-direccion', 'Calle 14 #10, Chuminópolis');
    await p.click('#f-ubicacion'); await p.waitForTimeout(500); await p.click('#pedido-enviar'); await p.waitForTimeout(200);
    await p.reload({ waitUntil: 'networkidle' }); await p.waitForTimeout(400);
    await p.evaluate(() => { cambiar('t_cos', 1); abrirPedido(); });
    const v = await p.evaluate(() => [$('f-nombre').value, $('f-telefono').value, $('f-direccion').value, domicilio()]);
    if (v[0] !== 'Rosa' || v[1] !== '9997654321' || !v[2].includes('Calle 14') || !v[3]) throw new Error('No recordó: ' + JSON.stringify(v));
    await p.click('#f-olvidar');
    const w = await p.evaluate(() => [$('f-nombre').value, localStorage.getItem('rey_mis_datos')]);
    if (w[0] || w[1]) throw new Error('No olvidó los datos');
    return 'Recuerda y olvida';
  }],
  ['Se cuentan las visitas', 'Visita, carrito y pedido quedan anotados (sin datos personales)', {}, async ({ p, eventos, enviado }) => {
    await p.evaluate(() => { cambiar('t_mac', 1); abrirPedido(); });
    await p.fill('#f-nombre', 'Sol'); await p.fill('#f-telefono', '9991234567'); await p.click('#pedido-enviar'); await p.waitForTimeout(400);
    const tipos = eventos.map(e => e.tipo);
    for (const x of ['visita', 'carrito', 'pedido']) if (!tipos.includes(x)) throw new Error('No se anotó: ' + x + ' (' + tipos.join(',') + ')');
    const datos = JSON.stringify(eventos);
    if (/9991234567|Sol\b/.test(datos)) throw new Error('El contador guardó datos personales');
    return tipos.join(' · ');
  }],
  ['Se anotan los errores', 'Si algo truena en el teléfono de un cliente, queda registrado', {}, async ({ p, eventos }) => {
    await p.addScriptTag({ content: 'throw new Error("prueba de error")' }).catch(() => {}); await p.waitForTimeout(400);
    if (!eventos.some(e => e.tipo === 'error' && /prueba de error/.test(e.detalle.msg))) throw new Error('El error no se anotó');
    return 'Error anotado';
  }]
];

(async () => {
  const navegador = await chromium.launch(); const resultados = [];
  for (const [tel, disp] of TELEFONOS) for (const [nombre, que, op, prueba] of CASOS) {
    const c = await navegador.newContext({ ...disp, locale: op.locale || 'es-MX', ...(op.sinPermiso ? {} : { geolocation: op.geo || lejos(1.5), permissions: ['geolocation'] }) });
    const eventos = []; let mensaje = null; const errores = [];
    await c.route('**/*.supabase.co/**', r => {
      const u = r.request().url();
      if (op.sinNube) return r.abort();
      if (u.includes('/functions/v1/ruta')) return op.rutaKm ? r.fulfill({ contentType: 'application/json', body: JSON.stringify({ km: op.rutaKm }) }) : op.rutaFalla ? r.fulfill({ status: 503, body: '{"error":"sin_llave"}' }) : r.fulfill({ status: 503, body: '{}' });
      if (u.includes('/rest/v1/eventos')) { try { eventos.push(JSON.parse(r.request().postData())); } catch (e) {} return r.fulfill({ status: 201, body: '' }); }
      if (u.includes('ajustes')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify([{ clave: 'envio', valor: ENVIO }, ...(op.pausa ? [{ clave: 'pedidos', valor: { activa: true, mensaje: 'Por ahora tenemos muchos pedidos. Vuelve a intentarlo en un rato, por favor.' } }] : [])]) });
      return r.fulfill({ contentType: 'application/json', body: '[]' });
    });
    await c.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: '' }));
    const p = await c.newPage();
    p.on('pageerror', e => { if (!/prueba de error/.test(e.message)) errores.push(e.message); });
    await p.exposeFunction('__capturar', u => { mensaje = decodeURIComponent((u.split('text=')[1] || '')); });
    await p.addInitScript(() => { window.open = u => { window.__capturar(u); return null; }; });
    await p.clock.install({ time: op.hora || ABIERTO });
    const t0 = Date.now(); let estado = 'bien', nota = '', captura = '';
    try {
      await p.goto(URL_PAG(), { waitUntil: 'networkidle', timeout: 20000 }); await p.waitForTimeout(500);
      nota = await prueba({ c, p, eventos, errores, t0, enviado: () => mensaje });
      if (errores.length && nombre !== 'Abre la página') throw new Error('Error en la página: ' + errores[0]);
    } catch (e) {
      estado = 'falla'; nota = e.message.split('\n')[0].slice(0, 200);
      captura = `capturas/${tel.replace(/\W+/g, '-')}-${nombre.replace(/\W+/g, '-')}.png`;
      await p.screenshot({ path: path.join(SALIDA, captura) }).catch(() => { captura = ''; });
    }
    resultados.push({ tel, nombre, que, estado, nota, ms: Date.now() - t0, captura });
    process.stdout.write(estado === 'bien' ? '.' : 'F');
    await c.close();
  }
  await navegador.close(); servidor.close();
  const fecha = new Date().toISOString();
  fs.writeFileSync(path.join(SALIDA, 'resultados.json'), JSON.stringify({ fecha, resultados }, null, 1));
  const bien = resultados.filter(r => r.estado === 'bien').length;
  console.log(`\n${bien}/${resultados.length} pruebas bien`);
  require('./tablero').escribir(path.join(SALIDA, 'tablero.html'), { fecha, resultados, telefonos: TELEFONOS.map(t => t[0]), casos: CASOS.map(c => [c[0], c[1]]) });
  process.exit(bien === resultados.length ? 0 : 1);
})();
