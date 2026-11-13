# Cliente simulado

Usa la página de un cliente como lo haría la gente de verdad, en 6 teléfonos y pantallas,
y deja un tablero (`tablero.html`) con qué funcionó y qué falló, con captura de cada falla.
La base de datos se simula: no toca los datos reales del negocio.

    node herramientas/cliente-simulado/el-rey.js /ruta/a/restaurante-el-rey salida/

Correrlo antes de entregar una página y después de cada cambio. Para otro cliente,
copiar `el-rey.js` y cambiar las situaciones (CASOS); `tablero.js` sirve igual.
