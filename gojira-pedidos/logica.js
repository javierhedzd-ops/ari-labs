/* Lógica del pedido: sin pantalla, para poder probarla sola.
   Elegir la sucursal, calcular el envío y armar el mensaje que le llega a la cajera. */
(function (raiz) {
  const RADIO_TIERRA_KM = 6371.0088;
  const rad = g => g * Math.PI / 180;

  // Distancia en línea recta entre dos puntos {lat, lng}, en km.
  function distanciaKm(a, b) {
    const dLat = rad(b.lat - a.lat), dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * RADIO_TIERRA_KM * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  const aMinutos = hhmm => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };

  // ¿Está abierta a esa hora (minutos desde medianoche)? Soporta horarios que pasan de medianoche.
  function estaAbierta(sucursal, ahoraMin) {
    if (!sucursal.horario) return true;
    const a = aMinutos(sucursal.horario.abre), c = aMinutos(sucursal.horario.cierra);
    return a <= c ? ahoraMin >= a && ahoraMin < c : ahoraMin >= a || ahoraMin < c;
  }

  // Costo del envío según la regla de esa sucursal: tarifa fija dentro de su zona, por kilómetro fuera de ella.
  function calcularEnvio(sucursal, km) {
    if (!(km >= 0)) return { ok: false, motivo: 'sin-distancia' };
    if (km > sucursal.maxKm) return { ok: false, motivo: 'fuera-de-zona' };
    if (sucursal.zonaFija && km <= sucursal.zonaFija.radioKm) return { ok: true, costo: sucursal.zonaFija.precio, tipo: 'zona', detalle: sucursal.zonaFija.nombre };
    const costo = Math.max(sucursal.minimo || 0, Math.ceil(km * sucursal.tarifaKm));
    return { ok: true, costo, tipo: 'km', detalle: `${km.toFixed(1)} km` };
  }

  // A qué sucursal va el pedido a domicilio: la más cercana que esté abierta, sin pausa y con el cliente dentro de su zona.
  function elegirSucursal(sucursales, punto, ahoraMin, rutas) {
    const filas = sucursales.map(s => {
      const r = rutas && rutas[s.id], km = r ? r.km : distanciaKm(punto, s), abierta = estaAbierta(s, ahoraMin), envio = calcularEnvio(s, km);
      let razon = null;
      if (s.pausada) razon = 'pausada';
      else if (!abierta) razon = 'cerrada';
      else if (!envio.ok) razon = 'fuera-de-zona';
      return { sucursal: s, km, min: r ? r.min : null, porRuta: !!r, abierta, envio, razon, disponible: razon === null };
    }).sort((x, y) => x.km - y.km);

    const masCercana = filas[0];
    const elegida = filas.find(f => f.disponible) || null;
    if (!elegida) {
      return { elegida: null, filas, masCercana, motivo: filas.every(f => f.razon === 'fuera-de-zona') ? 'fuera-de-zona' : 'ninguna-disponible', aviso: null };
    }
    const desvio = elegida !== masCercana;
    return { elegida, filas, masCercana, motivo: null, desvio, aviso: desvio ? { cercana: masCercana.sucursal.nombre, razon: masCercana.razon } : null };
  }

  // ---------- Ruta real por calle (OSRM «table»: una sola consulta con todas las sucursales) ----------
  // Dirección de la consulta: del cliente (fuente 0) a cada sucursal. Coordenadas en el orden lng,lat.
  function urlRutas(punto, sucursales, base) {
    const pts = [punto, ...sucursales].map(p => `${(+p.lng).toFixed(6)},${(+p.lat).toFixed(6)}`).join(';');
    const destinos = sucursales.map((_, i) => i + 1).join(';');
    return `${base || 'https://router.project-osrm.org'}/table/v1/driving/${pts}?sources=0&destinations=${destinos}&annotations=distance,duration`;
  }
  // Convierte la respuesta en { idSucursal: { km, min } }. Si una sucursal no tiene ruta, simplemente no aparece (se usa línea recta).
  function leerRutas(json, sucursales) {
    if (!json || json.code !== 'Ok' || !Array.isArray(json.distances) || !Array.isArray(json.distances[0])) return null;
    const out = {}, d = json.distances[0], t = (json.durations && json.durations[0]) || [];
    sucursales.forEach((s, i) => { const m = d[i]; if (typeof m === 'number' && isFinite(m) && m >= 0) out[s.id] = { km: m / 1000, min: typeof t[i] === 'number' ? Math.round(t[i] / 60) : null }; });
    return Object.keys(out).length ? out : null;
  }

  const dinero = n => '$' + Math.round(n).toLocaleString('en-US');

  function totales(lineas, envio) {
    const subtotal = lineas.reduce((t, l) => t + l.p * l.cant, 0);
    const costoEnvio = envio && envio.ok ? envio.costo : 0;
    return { subtotal, envio: costoEnvio, total: subtotal + costoEnvio };
  }


  // ---------- Platillos armados: reglas, precio y descripción (sin pantalla, para probarlos solos) ----------
  // sel = { idPaso: [nombre de opción, …] }; en los pasos «contar» un nombre se repite tantas veces como se elija.
  const nombresDe = (sel, id) => (sel && Array.isArray(sel[id]) ? sel[id] : []);
  const contar = lista => lista.reduce((m, n) => (m[n] = (m[n] || 0) + 1, m), {});

  // Revisa un paso: ¿se eligió lo permitido? Devuelve { ok, falta, sobra, mensaje }.
  function revisarPaso(paso, sel) {
    const nombres = nombresDe(sel, paso.id), validos = new Set(paso.opciones.map(o => o.n)), veces = contar(nombres);
    if (nombres.some(n => !validos.has(n))) return { ok: false, mensaje: 'Hay una opción que ya no existe.' };
    if (!paso.contar && Object.values(veces).some(v => v > 1)) return { ok: false, mensaje: 'No se puede repetir una opción.' };
    const q = nombres.length;
    if (q < paso.min) { const f = paso.min - q; return { ok: false, falta: f, mensaje: paso.min === paso.max ? (paso.max === 1 ? 'Elige 1 opción.' : `Elige ${paso.max}: te falta${f === 1 ? '' : 'n'} ${f}.`) : `Elige al menos ${paso.min}.` }; }
    if (q > paso.max) return { ok: false, sobra: q - paso.max, mensaje: `Elige máximo ${paso.max}.` };
    return { ok: true };
  }

  // Revisa toda la receta. El primer paso con problema dice qué falta.
  function validarSeleccion(receta, sel) {
    for (const paso of receta.pasos) { const r = revisarPaso(paso, sel); if (!r.ok) return { ok: false, paso: paso.id, mensaje: r.mensaje }; }
    return { ok: true };
  }

  // Precio de UNA pieza: lo que cuesta el platillo más lo de cada opción elegida. Nunca sale de la pantalla.
  function precioLinea(item, receta, sel) {
    if (!receta) return item.p;
    let t = (item.p || 0) + (receta.base || 0);
    for (const paso of receta.pasos) { const ps = new Map(paso.opciones.map(o => [o.n, o.p || 0])); for (const n of nombresDe(sel, paso.id)) t += ps.get(n) || 0; }
    return t;
  }

  // Precio más bajo posible («desde»): lo mínimo que exige cada paso, con las opciones más baratas.
  function precioDesde(item, receta) {
    let t = (item.p || 0) + (receta.base || 0);
    for (const paso of receta.pasos) t += paso.opciones.map(o => o.p || 0).sort((a, b) => a - b).slice(0, paso.min).reduce((x, y) => x + y, 0);
    return t;
  }

  // Identificador de la línea: el mismo platillo con las mismas elecciones es la misma línea (sube la cantidad).
  function claveLinea(id, sel) {
    const partes = Object.keys(sel || {}).sort().map(k => `${k}=${[...nombresDe(sel, k)].sort().join('|')}`).filter(x => !x.endsWith('='));
    return partes.length ? `${id}#${partes.join(';')}` : id;
  }

  // Renglones que se leen en el pedido y en el mensaje: «Proteína: Salmón (+$70)».
  function detalleLinea(receta, sel) {
    if (!receta) return [];
    const out = [];
    for (const paso of receta.pasos) {
      const nombres = nombresDe(sel, paso.id); if (!nombres.length) continue;
      const ps = new Map(paso.opciones.map(o => [o.n, o.p || 0])), veces = contar(nombres);
      const txt = paso.opciones.filter(o => veces[o.n]).map(o => (veces[o.n] > 1 ? `${veces[o.n]}× ` : '') + o.n + (paso.verPrecio && ps.get(o.n) ? ` (+${dinero(ps.get(o.n) * veces[o.n])})` : '')).join(', ');
      out.push(paso.corto ? `${paso.corto}: ${txt}` : txt);
    }
    return out;
  }

  const limpiar = t => String(t || '').replace(/[\r\n]+/g, ' ').trim();

  // El mensaje que recibe la cajera: siempre en el mismo orden, con todo lo que hoy pregunta.
  function armarMensaje(p) {
    const t = totales(p.lineas, p.envio);
    const l = [];
    l.push(`Pedido ${p.folio} · Gojira Sushi ${p.sucursal.nombre}`);
    l.push('');
    l.push(`Nombre: ${limpiar(p.nombre)}`);
    l.push(`Teléfono: ${limpiar(p.telefono)}`);
    if (p.entrega === 'domicilio') {
      l.push('Entrega: A domicilio');
      l.push(`Dirección: ${limpiar(p.direccion)}`);
      if (p.punto) l.push(`Ubicación: https://maps.google.com/?q=${p.punto.lat.toFixed(5)},${p.punto.lng.toFixed(5)}`);
    } else {
      l.push(`Entrega: Recoger en sucursal (${p.sucursal.nombre})`);
    }
    l.push('');
    l.push('Pedido:');
    for (const x of p.lineas) { l.push(`${x.cant} × ${x.n} — ${dinero(x.p * x.cant)}`); for (const d of x.detalle || []) l.push(`   · ${limpiar(d)}`); }
    l.push('');
    l.push(`Subtotal: ${dinero(t.subtotal)}`);
    if (p.entrega === 'domicilio') l.push(`Envío: ${dinero(t.envio)}${p.envio && p.envio.detalle ? ` (${p.envio.detalle})` : ''}`);
    l.push(`Total: ${dinero(t.total)}`);
    l.push(`Pago: ${limpiar(p.pago)}`);
    if (limpiar(p.notas)) l.push(`Notas: ${limpiar(p.notas)}`);
    return l.join('\n');
  }

  const urlWhatsApp = (numero, texto) => `https://wa.me/${String(numero).replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;

  const api = { urlRutas, leerRutas, distanciaKm, estaAbierta, calcularEnvio, elegirSucursal, totales, revisarPaso, validarSeleccion, precioLinea, precioDesde, claveLinea, detalleLinea, armarMensaje, urlWhatsApp, dinero, aMinutos };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else raiz.GojiraLogica = api;
})(typeof window !== 'undefined' ? window : globalThis);
