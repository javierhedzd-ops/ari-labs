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
// Listas de ejemplo para cuando no se conocen los servicios del negocio. La página avisa que son de ejemplo.
const pl = (nombre, precio, detalle) => detalle ? { nombre, precio, detalle } : { nombre, precio };
const EJEMPLOS = {
  barberia: [{ titulo: 'Cortes', platos: [pl('Corte clásico', 100), pl('Corte con degradado', 120), pl('Corte de niño', 80)] }, { titulo: 'Barba', platos: [pl('Arreglo de barba', 70), pl('Corte y barba', 170)] }],
  estetica: [{ titulo: 'Cortes', platos: [pl('Corte de niño', 100), pl('Corte de niña', 120), pl('Primer corte', 150, 'Con diploma y mechón de recuerdo.')] }, { titulo: 'Peinados', platos: [pl('Peinado sencillo', 80), pl('Peinado para fiesta', 150)] }],
  lavanderia: [{ titulo: 'Por kilo', platos: [pl('Lavado y secado', 20, 'Por kilo. Mínimo 3 kilos.'), pl('Lavado, secado y doblado', 25, 'Por kilo.')] }, { titulo: 'Por pieza', platos: [pl('Edredón individual', 70), pl('Edredón matrimonial', 90), pl('Planchado', 10, 'Por pieza.')] }],
  papeleria: [{ titulo: 'Copias e impresiones', platos: [pl('Copia en blanco y negro', 1), pl('Impresión en blanco y negro', 2), pl('Impresión a color', 5)] }, { titulo: 'Servicios', platos: [pl('Engargolado', 30), pl('Enmicado tamaño carta', 20), pl('Escaneo', 5, 'Por hoja.')] }],
  unas: [{ titulo: 'Manos', platos: [pl('Manicure', 120), pl('Gelish', 180), pl('Uñas acrílicas', 300), pl('Retoque de acrílico', 200)] }, { titulo: 'Pies', platos: [pl('Pedicure', 200), pl('Pedicure con gelish', 280)] }],
  salon: [{ titulo: 'Cabello', platos: [pl('Corte de dama', 150), pl('Tinte', 450), pl('Alaciado', 600), pl('Peinado', 250)] }, { titulo: 'Uñas', platos: [pl('Manicure', 120), pl('Gelish', 180)] }],
  taqueria: [{ titulo: 'Tacos', platos: [pl('Taco al pastor', 18), pl('Taco de asada', 22), pl('Orden de 5 tacos al pastor', 80)] }, { titulo: 'Gringas y tortas', platos: [pl('Gringa', 55), pl('Torta al pastor', 50)] }, { titulo: 'Bebidas', platos: [pl('Refresco', 25), pl('Agua de sabor', 20)] }]
};
fs.mkdirSync(CARPETA, { recursive: true });
const vistos = new Set();
const salida = JSON.parse(fs.readFileSync(archivo, 'utf8')).map(p => {
  if (p.ejemplo && !p.menu && p.ejemploDe) { if (!EJEMPLOS[p.ejemploDe]) return { nombre: p.nombre, error: 'no hay ejemplo de: ' + p.ejemploDe }; p.menu = EJEMPLOS[p.ejemploDe]; }
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
    ? `Le armamos una página de muestra con el nombre de ${p.nombre}:\n\n${muestra}\n\n${comida ? 'El menú y los precios' : 'Los servicios y los precios'} son de ejemplo; los cambiamos por los suyos, y el diseño lo personalizamos con los colores y el estilo de su negocio. Sirve para que sus clientes ${comida ? 'vean su menú y le pidan' : 'vean sus precios y le escriban'} por WhatsApp.`
    : `Le hicimos una página de muestra para ${p.nombre}, ${comida ? 'con su menú, para que sus clientes vean lo que hay hoy y le pidan' : 'con sus servicios y precios, para que sus clientes lo encuentren y le escriban'} por WhatsApp:\n\n${muestra}\n\nEl diseño lo personalizamos con los colores y el estilo de su negocio.`;
  const mensaje = `Hola, buen día. Somos Ari Labs, de Mérida. ${queEs}\n` + (hasta ? `Estará en línea hasta el ${hasta}. ` : '') +
    'Si le gusta, se la dejamos funcionando por $700, pago único. Sin compromiso.';
  return { id, nombre: p.nombre, telefono: tel, muestra, mensaje, whatsapp: 'https://wa.me/52' + tel + '?text=' + encodeURIComponent(mensaje) };
});
process.stdout.write(JSON.stringify(salida, null, 1) + '\n');
