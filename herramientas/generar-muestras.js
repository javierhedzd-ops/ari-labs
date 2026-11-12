#!/usr/bin/env node
// Convierte una lista de prospectos en muestras y mensajes de WhatsApp listos para un toque.
// Uso: node herramientas/generar-muestras.js prospectos.json "domingo 15 de noviembre" > envios.json
// Escribe un archivo por negocio en modelos/cocina/muestras/ (hay que subirlos) y da enlaces cortos (?m=nombre).
const fs = require('fs'), path = require('path');
const [, , archivo, hasta = ''] = process.argv;
if (!archivo) { console.error('Uso: node herramientas/generar-muestras.js prospectos.json "fecha"'); process.exit(1); }
const BASE = 'https://javierhedzd-ops.github.io/ari-labs/modelos/cocina/';
const CARPETA = path.join(__dirname, '..', 'modelos', 'cocina', 'muestras');
const CAMPOS = ['tipo', 'giro', 'nombre', 'lema', 'direccion', 'colonia', 'entrega', 'horario', 'delDia', 'menu', 'piel', 'colores', 'ejemplo'];
const slug = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
fs.mkdirSync(CARPETA, { recursive: true });
const vistos = new Set();
const salida = JSON.parse(fs.readFileSync(archivo, 'utf8')).map(p => {
  const faltan = ['nombre', 'telefono'].filter(k => !p[k]);
  if (!p.ejemplo && !(p.menu && p.menu.length)) faltan.push('menu (o "ejemplo": true)');
  if (faltan.length) return { nombre: p.nombre || '(sin nombre)', error: 'faltan: ' + faltan.join(', ') };
  const tel = String(p.telefono).replace(/\D/g, '');
  if (tel.length !== 10) return { nombre: p.nombre, error: 'el teléfono debe tener 10 dígitos: ' + p.telefono };
  const id = p.id || slug(p.nombre);
  if (vistos.has(id)) return { nombre: p.nombre, error: 'nombre repetido: ' + id }; vistos.add(id);
  const datos = { muestraHasta: hasta }; for (const k of CAMPOS) if (p[k] != null) datos[k] = p[k];
  fs.writeFileSync(path.join(CARPETA, id + '.json'), JSON.stringify(datos) + '\n');
  const muestra = BASE + '?m=' + id, comida = !p.giro || p.giro === 'comida';
  const queEs = p.ejemplo
    ? `Le armamos una página de muestra con el nombre de ${p.nombre}:\n\n${muestra}\n\n${comida ? 'El menú y los precios' : 'Los servicios y los precios'} son de ejemplo; los cambiamos por los suyos. Sirve para que sus clientes ${comida ? 'vean su menú y le pidan' : 'vean sus precios y le escriban'} por WhatsApp.`
    : `Le hicimos una página de muestra para ${p.nombre}, ${comida ? 'con su menú, para que sus clientes vean lo que hay hoy y le pidan' : 'con sus servicios y precios, para que sus clientes lo encuentren y le escriban'} por WhatsApp:\n\n${muestra}\n`;
  const mensaje = `Hola, buen día. Somos Ari Labs, de Mérida. ${queEs}\n` + (hasta ? `Estará en línea hasta el ${hasta}. ` : '') +
    'Si le gusta, se la dejamos funcionando por $700, pago único. Si no le interesa, no hay problema y no le volvemos a escribir.';
  return { id, nombre: p.nombre, telefono: tel, muestra, mensaje, whatsapp: 'https://wa.me/52' + tel + '?text=' + encodeURIComponent(mensaje) };
});
process.stdout.write(JSON.stringify(salida, null, 1) + '\n');
