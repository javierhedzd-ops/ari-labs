// Tablero del cliente simulado: un solo archivo HTML (las capturas de fallas van incrustadas).
const fs = require('fs'), path = require('path');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

exports.escribir = (archivo, { fecha, resultados, telefonos, casos, titulo = 'Carnitas El Rey' }) => {
  const dir = path.dirname(archivo);
  const total = resultados.length, bien = resultados.filter(r => r.estado === 'bien').length, fallas = total - bien;
  const r = (tel, caso) => resultados.find(x => x.tel === tel && x.nombre === caso);
  const msProm = Math.round(resultados.filter(x => x.nombre === 'Abre la página').reduce((a, b) => a + b.ms, 0) / Math.max(1, telefonos.length));
  const fechaLocal = new Date(fecha).toLocaleString('es-MX', { timeZone: 'America/Merida', dateStyle: 'medium', timeStyle: 'short' });
  const filas = casos.map(([nombre, que]) => {
    const celdas = telefonos.map(tel => {
      const x = r(tel, nombre); if (!x) return '<td class="nada">—</td>';
      return `<td class="${x.estado}" title="${esc(x.nota)}"><span class="punto"></span><span class="txt">${x.estado === 'bien' ? 'Bien' : 'Falla'}</span></td>`;
    }).join('');
    return `<tr><th scope="row"><b>${esc(nombre)}</b><small>${esc(que)}</small></th>${celdas}</tr>`;
  }).join('');
  const detalleFallas = resultados.filter(x => x.estado === 'falla').map(x => {
    let img = '';
    if (x.captura) { try { img = `<img src="data:image/png;base64,${fs.readFileSync(path.join(dir, x.captura)).toString('base64')}" alt="Captura de la falla">`; } catch (e) {} }
    return `<article class="falla"><div><b>${esc(x.nombre)}</b><span class="tel">${esc(x.tel)}</span><p>${esc(x.nota)}</p></div>${img}</article>`;
  }).join('') || '<p class="vacio">Ninguna falla. Todo pasó en todos los teléfonos.</p>';
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Cliente simulado · ${esc(titulo)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet">
<style>
:root{--fondo:#0b1017;--capa:#121a24;--capa2:#18222f;--borde:#243244;--texto:#e8eef5;--suave:#93a3b5;--hielo:#9fd3ff;--verde:#4ade80;--rojo:#f87171}
*{box-sizing:border-box}body{margin:0;background:var(--fondo);color:var(--texto);font:15px/1.5 "Inter Tight",system-ui,sans-serif}
main{max-width:1180px;margin:0 auto;padding:28px 16px 60px}
h1{font-size:clamp(1.6rem,1.2rem + 2vw,2.4rem);letter-spacing:-.03em;margin:0 0 4px}
.sub{color:var(--suave);margin:0 0 24px}
.mono{font-family:"JetBrains Mono",monospace}
.cifras{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:12px;margin-bottom:28px}
.cifra{background:var(--capa);border:1px solid var(--borde);border-radius:18px;padding:16px 18px}
.cifra b{display:block;font-size:2rem;letter-spacing:-.03em;line-height:1.1}
.cifra span{color:var(--suave);font-size:.9rem}
.cifra.ok b{color:var(--verde)}.cifra.mal b{color:var(--rojo)}.cifra.azul b{color:var(--hielo)}
h2{font-size:1.15rem;margin:30px 0 12px}
.tabla{overflow-x:auto;border:1px solid var(--borde);border-radius:18px;background:var(--capa)}
table{border-collapse:collapse;width:100%;min-width:760px}
th,td{padding:10px 12px;border-bottom:1px solid var(--borde);text-align:left;vertical-align:middle}
thead th{font-size:.82rem;color:var(--suave);font-weight:600;background:var(--capa2);position:sticky;top:0}
tbody th b{display:block;font-weight:600}tbody th small{display:block;color:var(--suave);font-weight:400;font-size:.82rem;max-width:34ch}
td{white-space:nowrap}.punto{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;vertical-align:middle}
td.bien .punto{background:var(--verde)}td.falla .punto{background:var(--rojo)}td.falla{background:rgba(248,113,113,.08)}td.falla .txt{color:var(--rojo);font-weight:600}
tr:last-child th,tr:last-child td{border-bottom:0}
.falla{display:grid;grid-template-columns:1fr;gap:12px;background:var(--capa);border:1px solid rgba(248,113,113,.4);border-radius:18px;padding:16px;margin-bottom:12px}
@media(min-width:760px){.falla{grid-template-columns:1fr 260px}}
.falla .tel{margin-left:10px;color:var(--suave);font-size:.85rem}.falla p{margin:6px 0 0;color:#fecaca}
.falla img{width:100%;border-radius:12px;border:1px solid var(--borde)}
.vacio{background:var(--capa);border:1px solid var(--borde);border-radius:18px;padding:18px;color:var(--verde)}
.pie{color:var(--suave);font-size:.85rem;margin-top:28px}
</style></head><body><main>
<h1>Cliente simulado · ${esc(titulo)}</h1>
<p class="sub">${casos.length} situaciones reales en ${telefonos.length} teléfonos · <span class="mono">${esc(fechaLocal)}</span></p>
<section class="cifras">
<div class="cifra ${fallas ? 'mal' : 'ok'}"><b>${bien}/${total}</b><span>pruebas bien</span></div>
<div class="cifra ${fallas ? 'mal' : 'ok'}"><b>${fallas}</b><span>fallas</span></div>
<div class="cifra azul"><b>${(msProm / 1000).toFixed(1)} s</b><span>en abrir la página (promedio)</span></div>
<div class="cifra azul"><b>${telefonos.length}</b><span>teléfonos y pantallas</span></div>
</section>
<h2>Resultado por situación y teléfono</h2>
<div class="tabla"><table><thead><tr><th scope="col">Situación</th>${telefonos.map(t => `<th scope="col">${esc(t)}</th>`).join('')}</tr></thead><tbody>${filas}</tbody></table></div>
<h2>Fallas</h2>${detalleFallas}
<p class="pie">La base de datos se simula: estas pruebas no tocan los datos reales del negocio. Ari Labs.</p>
</main></body></html>`;
  fs.writeFileSync(archivo, html);
};
