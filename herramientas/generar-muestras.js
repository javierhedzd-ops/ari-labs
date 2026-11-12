#!/usr/bin/env node
// Convierte una lista de prospectos en enlaces de muestra y mensajes de WhatsApp listos para un toque.
// Uso: node generar.js prospectos.json https://DIRECCION/modelos/cocina/ "viernes 14 de noviembre" > envios.json
const fs = require('fs');
const [, , archivo, base, hasta = ''] = process.argv;
if (!archivo || !/^https:\/\//.test(base || '')) { console.error('Uso: node generar.js prospectos.json https://.../modelos/cocina/ "fecha"'); process.exit(1); }
const b64 = o => Buffer.from(JSON.stringify(o), 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const CAMPOS = ['tipo', 'nombre', 'lema', 'direccion', 'colonia', 'entrega', 'horario', 'delDia', 'menu', 'piel', 'colores'];
const salida = JSON.parse(fs.readFileSync(archivo, 'utf8')).map(p => {
  const faltan = ['nombre', 'telefono', 'menu'].filter(k => !p[k] || (k === 'menu' && !p.menu.length));
  if (faltan.length) return { nombre: p.nombre || '(sin nombre)', error: 'faltan: ' + faltan.join(', ') };
  const tel = String(p.telefono).replace(/\D/g, '');
  if (tel.length !== 10) return { nombre: p.nombre, error: 'el teléfono debe tener 10 dígitos: ' + p.telefono };
  const datos = { muestraHasta: hasta }; for (const k of CAMPOS) if (p[k] != null) datos[k] = p[k];
  const muestra = base.replace(/\/?$/, '/') + '#d=' + b64(datos);
  const mensaje = `Hola, buen día. Somos Ari Labs, de Mérida. Le hicimos una página de muestra para ${p.nombre}, con su menú, para que sus clientes vean el guiso del día y le pidan por WhatsApp:\n\n${muestra}\n\n` +
    (hasta ? `Estará en línea hasta el ${hasta}. ` : '') + 'Si le gusta, se la dejamos funcionando por $700, pago único. Si no le interesa, no hay problema y no le volvemos a escribir.';
  return { nombre: p.nombre, colonia: p.colonia || '', telefono: tel, muestra, mensaje, whatsapp: 'https://wa.me/52' + tel + '?text=' + encodeURIComponent(mensaje) };
});
process.stdout.write(JSON.stringify(salida, null, 1) + '\n');
