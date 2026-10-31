# Web de Ari Labs: lo decidido con Javi (se arma paso a paso)

Muestra viva: `diseno/muestra/index.html` (vista previa privada: https://claude.ai/artifact/H1ZGQByEwdgTcoAJ78TYrH).
Para verla en local: `cd diseno/muestra && python3 -m http.server` (usa módulos ES, no abre con file://).

## Cómo trabajamos
- Javi quiere ver antes de construir: cada parte se enseña como muestra y se aprueba antes de seguir.
- Cambios agrupados en un mensaje; Javi puede comentar sobre la página. Javi revisa en su teléfono (las capturas
  automáticas no muestran bien el 3D); Claude revisa lo técnico una vez por cambio.
- Nada se publica sin su "publica". Detalles perfectos: nada choca, nada tapa texto, nada queda cortado.

## Estilo
- Paleta Frostline (clara): blanco glaciar #f8fafc, plata #ced6e0, acero #5b6978, azul ártico #64b6ff,
  menta escarcha #b2e4db, noche #2e2e3e (texto y botón principal). Letra Inter Tight.
- Acabado cristalino: fondo de cáusticas (luz quebrada por el hielo), tarjetas de hielo esmerilado.
- Objeto: HIELO REAL con forma de diamante en bruto (octaedro redondeado). Shader propio: refracta la escena real
  (cámara de 6 caras en el centro, cada 2 cuadros), índice 1.31, burbujas, grietas finas, centro nublado, orillas
  azules que definen la forma sobre el fondo claro, brillos de agua. Sin tonemapping (si no, se ve gris).
  Javi rechazó: cubo, cristal facetado de cartón, reflejos grises, diamante (lo cambió por hielo), líneas en bordes.
- Movimiento: el diamante gira, respira y sigue el dedo con resorte; 7 astillas en órbitas propias sin chocar.
  Al bajar un poco, el hielo explota en cámara lenta (por tiempo, 4.5 s, no por velocidad del scroll): solo pedazos,
  SIN polvo ni chispas (Javi). Al regresar arriba se vuelve a armar (2.6 s).
- Hielo irregular, no perfecto: caras astilladas (planos de corte al azar), golpes, forma chueca, cada pedazo distinto.
- Fluidez: pixel ratio 1.5/1.75, foto del fondo para el hielo cada 5 cuadros a 160 px, shader aligerado, textos
  medidos cada 4 cuadros, esquivar con salida estable (sin brincos).
- Botones: píldora noche con filo de luz y círculo azul ártico con icono; secundario de hielo esmerilado; brillo
  que cruza al pasar el ratón, sube 2 px, se aprieta al tocar.
  Los pedazos se reparten, flotan, suben con el scroll, esquivan títulos y textos y no se tocan entre ellos.
- Tarjetas de hielo más transparentes (fondo .34→.08, blur 9px) para ver los pedazos detrás. Barra de vidrio al bajar.
- No pude usar fotos (el entorno bloquea sitios de fotos y descargar de Figma; Javi prefirió no cambiarlo).

## Secciones (orden)
1. Portada: "Ari Labs", "Páginas web y apps para negocios de Mérida.", botones. ✔ aprobada en estilo.
2. Qué hacemos: Páginas web y Apps (tarjetas de hielo) + De un modelo / Desde cero / Sin mensualidades caras. En revisión.
3. Trabajos (Mis citas, con pantallas en un teléfono 3D) · 4. Modelos (restaurante, barbería, consultorio)
5. Cómo trabajamos · 6. Contacto (diamante otra vez). Ideas pendientes de aprobar: entrada donde el diamante se
   forma de astillas, cursor de cristal en compu.

## Encargo completo (31/10)
- Documento con todo el sistema visual y cada sección: https://claude.ai/artifact/LV4wkWeHD7KDfyw2WvrJL2
- Respuestas de Javi: sin precios; en Contacto solo el botón de WhatsApp; el hielo NO se vuelve a armar al final;
  SÍ bienvenida al abrir (los pedacitos se juntan y forman el hielo, 1 s); se agrega Preguntas frecuentes.
- Javi solo usa teléfono: preguntas con botones en el chat, nada de comentar documentos.

## Web completa construida (31/10)
- La web nueva está en la raíz: `index.html` (secciones y estilo), `hielo.js` (el hielo 3D, módulo) y `web.js`
  (Lenis + GSAP: títulos palabra por palabra, Trabajos fija con el teléfono girando, Modelos de lado, línea de luz,
  preguntas, botón flotante). three.js vive en `vendor/three/`. Se quitaron `fondo.js` y `movimiento.js` (la web oscura).
- Orden: Portada · Qué hacemos · Trabajo reciente (Mis citas) · Modelos · Cómo trabajamos · Preguntas frecuentes · Contacto y pie.
- Hielo: bienvenida al abrir (los pedazos vuelan al centro y lo forman en 1 s, con un destello suave), explota al bajar
  (4.5 s), los pedazos flotan, no chocan, esquivan lo marcado con `data-esquiva` y no se cortan en la orilla; se vuelve
  a armar al regresar arriba (2.6 s). En Contacto no se arma (Javi).
- Teléfono 3D hecho con CSS (capas apiladas = canto de vidrio). En compu la sección se queda fija ~70% de pantalla y
  cambian las 3 pantallas; en teléfono gira poco y las pantallas se pasan con el dedo (con puntos).
- Modelos: 3 placas + una cuarta "¿Ninguno es lo tuyo?" (desde cero) para que el paso de lado tenga recorrido.
- Botón flotante de WhatsApp: aparece después de la portada, se aparta mientras se baja (para no tapar texto) y se
  esconde al llegar a Contacto.
- Respuestas de Preguntas frecuentes: borrador de Claude, Javi las corrige (sobre todo "¿Cómo se paga?" y tiempos).
- Revisado: 320/390/768/1440 px sin desborde ni errores; sin WebGL y con "reducir movimiento" todo se ve; toques ≥ 44 px.
- Vista previa privada de la web completa: https://claude.ai/artifact/B286gFT5qrumLSTfqKDmo7 (los enlaces "Ver modelo"
  y Privacidad/Términos solo funcionan en la web real, no en la vista previa).
- Pendiente: estilo claro en privacidad.html, terminos.html y 404.html (siguen oscuros); fotos reales en los modelos.

## Lo que Javi enseñó (31/10, después de ver la web completa)
- **Regla de oro: no son mis colores, es mi acabado.** Todo lo que salga de Ari Labs (web, modelos, apps) debe verse
  de la misma mano: Inter Tight, tarjetas de vidrio esmerilado con borde de luz, botones de píldora con círculo e
  ícono, viñetas de rombo, esquinas grandes, mucho aire, movimiento suave y detalles perfectos. El color puede ser
  el del negocio. Aprender de lo que pide: no esperar a que lo repita.
- **Mis citas:** las capturas verde y negro no pegan. Por ahora se cambia SOLO en la web (no la app real, para no
  gastar tanto): dibujar 3 pantallas nuevas de Mis citas (agenda clara, agenda oscura, detalle de una cita) con el
  acabado de Ari Labs, en HTML o imagen, y ponerlas en el teléfono 3D en lugar de img/citas-*.webp. Más adelante,
  rediseñar la app real igual.
- **Modelos (restaurante, barbería, consultorio):** "parecen trabajo de otra persona". Rehacerlos con el mismo acabado
  de Ari Labs y cada uno con su color de negocio. Luego sacar capturas nuevas para img/modelo-*.webp.
- Siguiente sesión: hacer primero Mis citas en la web, después los 3 modelos; vista previa y video al final.
