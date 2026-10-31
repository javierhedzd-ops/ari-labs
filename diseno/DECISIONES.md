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
- Objeto: diamante en bruto realista (octaedro redondeado, casi incoloro, vetas, lechoso; referencia: foto de
  diamante sin tallar que mandó Javi). Material propio (shader) con refracción, poco fuego y entorno de joyería.
  Javi rechazó: cubo, cristal facetado de cartón, reflejos grises, líneas en los bordes.
- Movimiento: el diamante gira, respira y sigue el dedo con resorte; 7 astillas en órbitas propias sin chocar.
  Al bajar, el diamante se rompe (chispas) y sus pedazos se reparten por toda la web, flotan, suben con el scroll,
  esquivan los títulos y textos y no se tocan entre ellos.
- No pude usar fotos (el entorno bloquea sitios de fotos y descargar de Figma; Javi prefirió no cambiarlo).

## Secciones (orden)
1. Portada: "Ari Labs", "Páginas web y apps para negocios de Mérida.", botones. ✔ aprobada en estilo.
2. Qué hacemos: Páginas web y Apps (tarjetas de hielo) + De un modelo / Desde cero / Sin mensualidades caras. En revisión.
3. Trabajos (Mis citas, con pantallas en un teléfono 3D) · 4. Modelos (restaurante, barbería, consultorio)
5. Cómo trabajamos · 6. Contacto (diamante otra vez). Ideas pendientes de aprobar: entrada donde el diamante se
   forma de astillas, cursor de cristal en compu.
