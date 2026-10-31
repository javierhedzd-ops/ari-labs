// Fotografía las pantallas de diseno/capturas/*.html y las guarda en img/ como .webp.
// Uso (desde la raíz del repo, con un servidor local en el puerto 8123: python3 -m http.server 8123):
//   node diseno/capturas/sacar.js
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path');
const raiz = path.resolve(__dirname, '../..');
const trabajos = [
  ['mis-citas.html?p=claro', 'img/citas-agenda-claro'],
  ['mis-citas.html?p=oscuro', 'img/citas-agenda'],
  ['mis-citas.html?p=detalle', 'img/citas-detalle'],
  // los modelos: su portada en un teléfono (360x701 a escala 1.5 = 540x1052)
  ['../../modelos/restaurante/', 'img/modelo-restaurante', 701],
  ['../../modelos/barberia/', 'img/modelo-barberia', 701],
  ['../../modelos/consultorio/', 'img/modelo-consultorio', 701],
];
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 360, height: 760 }, deviceScaleFactor: 1.5 });
  for (const [url, salida, alto] of trabajos) {
    await pg.setViewportSize({ width: 360, height: alto || 760 });
    await pg.goto('http://localhost:8123/diseno/capturas/' + url, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.waitForTimeout(1500);   // deja terminar la entrada de las piezas
    const png = path.join(raiz, salida + '.png');
    await pg.screenshot({ path: png });
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', png, '-c:v', 'libwebp', '-quality', '82', path.join(raiz, salida + '.webp')]);
    fs.unlinkSync(png);
    console.log('listo', salida + '.webp', fs.statSync(path.join(raiz, salida + '.webp')).size);
  }
  await b.close();
})();
