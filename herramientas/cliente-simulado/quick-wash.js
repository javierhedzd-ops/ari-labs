#!/usr/bin/env node
// Cliente simulado para Quick Wash: usa la página como la gente de verdad, en varios teléfonos,
// y deja un tablero (tablero.html). La base de datos se simula: no toca los datos reales.
// Uso: node herramientas/cliente-simulado/quick-wash.js [carpeta-salida]
const { chromium, devices } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');

const RAIZ = path.join(__dirname, '../..');
const SALIDA = process.argv[2] || path.join(process.cwd(), 'resultado-quick-wash');
fs.mkdirSync(path.join(SALIDA, 'capturas'), { recursive: true });
const CLAVE_PRUEBA = 'clave-de-prueba'; // la clave real nunca va en este archivo
const WHATS = '529999551682';
const ABIERTO = new Date('2026-11-19T17:00:00Z'), NOCHE = new Date('2026-11-20T04:30:00Z'); // 11:00 y 22:30 en Mérida

const TELEFONOS = [
  ['iPhone SE', devices['iPhone SE']], ['iPhone 15', devices['iPhone 15']], ['Pixel 7', devices['Pixel 7']],
  ['Android chico', { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }],
  ['iPad', devices['iPad (gen 7)']], ['Computadora', { viewport: { width: 1366, height: 800 } }]
];
const tipo = f => f.endsWith('.html') ? 'text/html; charset=utf-8' : f.endsWith('.webm') ? 'video/webm' : f.endsWith('.mp4') ? 'video/mp4' : f.endsWith('.jpg') ? 'image/jpeg' : f.endsWith('.js') ? 'text/javascript' : f.endsWith('.svg') ? 'image/svg+xml' : 'application/octet-stream';
const servidor = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]); const f = path.join(RAIZ, u.endsWith('/') ? u + 'index.html' : u);
  fs.readFile(f, (x, d) => { r.writeHead(x ? 404 : 200, { 'content-type': tipo(f) }); r.end(d); });
}).listen(0);
const URL_PAG = () => `http://127.0.0.1:${servidor.address().port}/clientes/quick-wash/`;
const moneda = (p, grupo, i) => p.click(`#${grupo} .moneda[data-i="${i}"]`);

const CASOS = [
  ['Abre la página', 'Carga sin errores, sin moverse de lado y sin franja de muestra', {}, async ({ p, errores, t0 }) => {
    const ms = Date.now() - t0;
    if (await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)) throw new Error('Se sale de la pantalla a lo ancho');
    if (await p.isVisible('.franja')) throw new Error('Sale la franja de "muestra"');
    if (errores.length) throw new Error('Error en la página: ' + errores[0]);
    return `Cargó en ${ms} ms`;
  }],
  ['La lavadora gira', 'El tambor se mueve (video o respaldo) y la ventanita es redonda', {}, async ({ p }) => {
    await p.waitForTimeout(1200);
    const r = await p.evaluate(() => { const v = document.querySelector('.lavando'), o = document.querySelector('.ojo').getBoundingClientRect(), t = document.querySelector('.tambor');
      return { mueve: (v && !v.paused) || t.classList.contains('sin-video'), w: Math.round(o.width), h: Math.round(o.height) }; });
    if (!r.mueve) throw new Error('El tambor está quieto');
    if (Math.abs(r.w - r.h) > 1) throw new Error(`La ventanita no es redonda: ${r.w}×${r.h}`);
    return `Gira · ${r.w}×${r.h}`;
  }],
  ['Calcula el precio', 'Lavadora mediana + secadora grande + detergente = $140', {}, async ({ p }) => {
    await moneda(p, 'op-lav', 1); await moneda(p, 'op-sec', 1); await p.click('#op-ext button[data-i="0"]'); await p.clock.runFor(2000); await p.waitForTimeout(100);
    const total = (await p.textContent('#total')).trim(); if (total !== '$140') throw new Error('Total ' + total + ' (esperado $140)');
    return total;
  }],
  ['Precios de diciembre', 'Al tocar "Desde el 1 de dic" cambia a los precios nuevos', {}, async ({ p }) => {
    await p.click('#m-dic'); await moneda(p, 'op-lav', 0); await p.clock.runFor(2000); await p.waitForTimeout(100);
    const total = (await p.textContent('#total')).trim(); if (total !== '$47') throw new Error('Chica en diciembre: ' + total + ' (esperado $47)');
    return total;
  }],
  ['Pregunta por WhatsApp', 'El botón abre WhatsApp al número de la dueña', {}, async ({ p, abierto }) => {
    await p.click('.hero [data-contacto]'); await p.waitForTimeout(200);
    const u = abierto(); if (!u || !u.includes('wa.me/' + WHATS)) throw new Error('No abre WhatsApp correcto: ' + u);
    return 'wa.me/' + WHATS;
  }],
  ['Lista de planchado', 'Los 9 precios de planchado se ven completos', {}, async ({ p }) => {
    const v = await p.$$eval('.plancha .fila b', b => b.map(x => x.textContent.trim()));
    const esperados = ['$180', '$17', '$50', '$40', '$60', '$50', '$40', '$40', '$5'];
    if (JSON.stringify(v) !== JSON.stringify(esperados)) throw new Error('Precios: ' + v.join(' '));
    const cortados = await p.$$eval('.plancha .fila b', b => b.filter(x => x.scrollWidth > x.clientWidth + 1).length);
    if (cortados) throw new Error(cortados + ' precios cortados');
    return '9 precios bien';
  }],
  ['Botones de las dos partes', '"Lo lavo yo" y "Se lo dejamos listo" llevan a su sección', {}, async ({ p }) => {
    for (const [sel, dest] of [['.elegir a[href="#precios"]', 'precios'], ['.elegir a[href="#encargo-sec"]', 'encargo-sec']]) {
      await p.click(sel); await p.waitForTimeout(700);
      const top = await p.evaluate(id => document.getElementById(id).getBoundingClientRect().top, dest);
      if (top < -50 || top > 400) throw new Error('No llega a ' + dest + ' (' + Math.round(top) + ' px)');
    }
    return 'Las dos llegan';
  }],
  ['Horario', 'De día dice abierto; a las 10:30 p. m. dice cerrado', { hora: NOCHE }, async ({ p }) => {
    const t = (await p.textContent('#estado')).trim(); if (!/Cerrado/.test(t)) throw new Error('A las 22:30 dice: ' + t);
    return t;
  }],
  ['La dueña entra a su panel', 'Clave mala: avisa. Clave buena: puede cambiar un precio y se guarda', {}, async ({ p, guardado }) => {
    await p.click('a[href="#panel"]'); await p.waitForTimeout(300);
    await p.fill('#pd-clave', 'otra-clave'); await p.click('#pd-entrar button[type="submit"]'); await p.waitForTimeout(300);
    if (!/no es/i.test(await p.textContent('#pd-msg-entrar'))) throw new Error('No avisa de clave mala');
    await p.fill('#pd-clave', CLAVE_PRUEBA); await p.click('#pd-entrar button[type="submit"]'); await p.waitForTimeout(400);
    if (!await p.isVisible('#pd-editar')) throw new Error('No se abre el editor');
    const campo = p.locator('#pd-editar input[type="number"]').first(); await campo.fill('45');
    await p.click('#pd-editar button[type="submit"]'); await p.waitForTimeout(400);
    const g = guardado(); if (!g || JSON.stringify(g).indexOf('45') < 0) throw new Error('No se guardó el precio');
    if (!/Listo/.test(await p.textContent('#pd-msg'))) throw new Error('No confirma que se guardó');
    return 'Guarda y confirma';
  }],
  ['Se cae la base de datos', 'Sin servidor: la página sigue completa y los botones funcionan', { sinNube: true }, async ({ p, abierto }) => {
    if (await p.isVisible('.franja')) throw new Error('Sale como "muestra" sin la base de datos');
    await p.click('.hero [data-contacto]'); await p.waitForTimeout(200);
    if (!abierto()) throw new Error('El botón de WhatsApp no funciona sin la base de datos');
    return 'Sigue funcionando';
  }]
];

(async () => {
  const navegador = await chromium.launch(); const resultados = [];
  for (const [tel, disp] of TELEFONOS) for (const [nombre, que, op, prueba] of CASOS) {
    const c = await navegador.newContext({ ...disp, locale: 'es-MX' });
    let abierto = null, guardado = null; const errores = [];
    await c.route('**/*.supabase.co/**', async r => {
      if (op.sinNube) return r.abort();
      const u = r.request().url(); const cuerpo = (() => { try { return JSON.parse(r.request().postData() || 'null'); } catch (e) { return null; } })();
      if (u.includes('rpc/entrar')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify(cuerpo && cuerpo.p_clave === CLAVE_PRUEBA) });
      if (u.includes('rpc/guardar')) { guardado = cuerpo && cuerpo.p_datos; return r.fulfill({ contentType: 'application/json', body: 'true' }); }
      if (u.includes('paginas')) return r.fulfill({ contentType: 'application/json', body: JSON.stringify([{ datos: {}, activa: true }]) });
      return r.fulfill({ contentType: 'application/json', body: '[]' });
    });
    await c.route('https://fonts.googleapis.com/**', r => r.fulfill({ contentType: 'text/css', body: '' }));
    const p = await c.newPage(); p.on('pageerror', e => errores.push(e.message));
    await p.exposeFunction('__abrir', u => { abierto = u; });
    await p.addInitScript(() => { window.open = u => { window.__abrir(String(u)); return null; }; });
    await p.clock.install({ time: op.hora || ABIERTO });
    const t0 = Date.now(); let estado = 'bien', nota = '', captura = '';
    try {
      await p.goto(URL_PAG(), { waitUntil: 'networkidle', timeout: 20000 }); await p.waitForTimeout(600);
      await p.addStyleTag({ content: '.rev{opacity:1!important;transform:none!important;animation:none!important}html{scroll-behavior:auto!important}' });
      nota = await prueba({ p, errores, t0, abierto: () => abierto, guardado: () => guardado });
      if (errores.length && nombre !== 'Abre la página') throw new Error('Error en la página: ' + errores[0]);
    } catch (e) {
      estado = 'falla'; nota = e.message.split('\n')[0].slice(0, 200);
      captura = `capturas/${tel.replace(/\W+/g, '-')}-${nombre.replace(/\W+/g, '-')}.png`;
      await p.screenshot({ path: path.join(SALIDA, captura) }).catch(() => { captura = ''; });
    }
    resultados.push({ tel, nombre, que, estado, nota, ms: Date.now() - t0, captura });
    process.stdout.write(estado === 'bien' ? '.' : 'F'); await c.close();
  }
  await navegador.close(); servidor.close();
  const fecha = new Date().toISOString();
  fs.writeFileSync(path.join(SALIDA, 'resultados.json'), JSON.stringify({ fecha, resultados }, null, 1));
  const bien = resultados.filter(r => r.estado === 'bien').length;
  console.log(`\n${bien}/${resultados.length} pruebas bien`);
  require('./tablero').escribir(path.join(SALIDA, 'tablero.html'), { fecha, resultados, telefonos: TELEFONOS.map(t => t[0]), casos: CASOS.map(c => [c[0], c[1]]), titulo: 'Quick Wash' });
  process.exit(bien === resultados.length ? 0 : 1);
})();
