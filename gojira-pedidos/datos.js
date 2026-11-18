/* Datos de la MUESTRA de Gojira Sushi & Thai.
   - El menú y los precios salen del PDF «Menú Gojira Odara» (precios de Plaza Odara, más altos que en las otras dos).
   - Las coordenadas, horarios, tarifas de envío y números de WhatsApp son DE EJEMPLO: se cambian por los reales aquí mismo.
   - Las bebidas con alcohol (cervezas, destilados, cócteles y preparados) NO van a domicilio: solo se sirven en el restaurante. */
(function (raiz) {
  // [nombre, precio, descripción?, favorito?]
  const i = (n, p, d, f) => ({ n, p, d: d || '', f: !!f });

  const MENU = [
    { id: 'empezar', nombre: 'Para empezar', grupos: [
      { nombre: 'Kushiagues', nota: 'Brocheta empanizada (1 pza)', items: [
        i('Camarón con philadelphia búfalo', 55), i('Salmón con philadelphia', 55), i('Camarón con philadelphia', 55),
        i('Philadelphia', 50), i('Plátano con queso', 50), i('Queso manchego', 50), i('Surimi con queso', 50),
        i('Kushiague Gojira', 175, '5 pzas empanizadas, rellenas de salmón, philadelphia, aguacate y camarón'),
        i('Tenders de pollo', 175, '150 gr de pollo')] },
      { nombre: 'Hongos', nota: '3 pzas de hongos empanizados, rellenos a tu elección', items: [
        i('Hongos de tampico', 105), i('Hongos de philadelphia', 105), i('Hongos mixtos', 105, 'Combinación a elegir')] },
      { nombre: 'Entradas', items: [
        i('Oniguiris', 135, '3 esferas de arroz empanizadas, rellenas de tampico y philadelphia, con queso gratinado encima y un toque de furikake', true),
        i('Edamames', 135, 'Vainas de soya al vapor con especias picantes'),
        i('Tostada de atún', 115, 'Pasta Won ton con aderezo chipotle, láminas de atún, aguacate, zanahoria frita y vinagre oriental'),
        i('Tostada de salmón', 125), i('Tostada de pulpo', 115), i('Tostada atún spicy', 115), i('Tostada Hiroshima', 155),
        i('Yasai Maki', 155, 'Papel de arroz con pepino, zanahoria, ensalada de alga, lechuga y aguacate, con salsa oriental de la casa'),
        i('Yasai Maki con atún', 165), i('Yasai Maki con salmón', 179),
        i('Tempura Ebi', 150, '5 camarones capeados y 1 porción de calabaza y zanahoria capeadas con salsa tempura'),
        i('Yasai Tempura', 130, 'Calabaza y zanahoria capeadas, 2 champiñones, 2 pimientos, 2 rodajas de cebolla y brócoli capeados'),
        i('Camarones Roca', 160, 'Pops de camarón bañados en salsa roca con guarnición de pepino y zanahoria'),
        i('Camarones Reptil Crunchy', 155, '5 camarones crunchy con guarnición de pepino y zanahoria, con aderezo roca'),
        i('Crab Cakes', 189, '4 esferas de tampico especial empanizadas'),
        i('Baby Squid', 155, 'Calamares baby rellenos de tampico especial, sobre una cama de pepino y zanahoria, con topping de sriracha y salsa de anguila')] }
    ] },
    { id: 'tradicionales', nombre: 'Tradicionales', grupos: [
      { nombre: 'Temaki', nota: 'Cono de alga nori con arroz, aguacate, pepino, philadelphia y el marisco de tu elección', items: [
        i('Temaki de salmón', 150), i('Temaki de camarón', 135), i('Temaki de pulpo', 135), i('Temaki de atún', 145),
        i('Temaki de kanikama', 130), i('Temaki de anguila', 160)] },
      { nombre: 'Sashimi', nota: 'Cortes finos bañados en salsa oriental de la casa, con cebollín y aguacate', items: [
        i('Sashimi de atún', 220), i('Sashimi de atún, corte grueso', 265), i('Sashimi de salmón', 245), i('Sashimi de salmón, corte grueso', 280),
        i('Sashimi de pulpo', 199), i('Sashimi mixto', 245), i('Sashimi mixto, corte grueso', 320)] },
      { nombre: 'Teriyaki', nota: 'Proteína de tu elección y verduras salteadas con salsa teriyaki, con arroz al vapor', items: [
        i('Teriyaki de pollo', 199), i('Teriyaki de salmón', 245), i('Teriyaki de camarón', 240), i('Teriyaki de atún', 245),
        i('Teriyaki de arrachera', 235), i('Teriyaki mixto', 245)] },
      { nombre: 'Teppanyaki', nota: 'Proteína de tu elección y verduras salteadas con nuestra salsa de soya', items: [
        i('Teppanyaki de pollo', 199), i('Teppanyaki de salmón', 255), i('Teppanyaki de camarón', 235), i('Teppanyaki de atún', 245),
        i('Teppanyaki de arrachera', 239), i('Teppanyaki mixto', 255)] },
      { nombre: 'Miso', nota: 'Sopa japonesa con hongos shitake, wakame y fideos de arroz, con la proteína de tu elección', items: [
        i('Miso tradicional', 149), i('Miso Guyu (arrachera)', 165), i('Miso Ebi (camarón)', 179), i('Miso Tori (pollo)', 139), i('Miso mixto', 180)] },
      { nombre: 'Nigiri', nota: 'Pequeña porción de arroz con el marisco de tu elección', items: [
        i('Nigiri de salmón', 99), i('Nigiri de atún', 99), i('Nigiri de pulpo', 99), i('Nigiri de kanikama', 99),
        i('Nigiri de camarón', 99), i('Nigiri spicy maguro', 155), i('Nigiri de anguila', 155), i('Manaita (5 pzas)', 489)] }
    ] },
    { id: 'especialidades', nombre: 'Especialidades', grupos: [
      { nombre: 'Ramen', nota: 'Pasta ligeramente picosa, con elote, wakame, huevo, zanahoria y calabaza italiana', items: [
        i('Ramen de arrachera', 220), i('Ramen de pollo', 185),
        i('Ramen de camarón', 199, 'Sin elote, con una porción de espinacas, cebollín y 1 huevo'),
        i('Ramen de mariscos', 220), i('Ramen mixto', 220, 'Con pollo, arrachera y camarón'), i('Extra pasta de ramen (140 g)', 60)] },
      { nombre: 'Sushi Burger', nota: 'Rellena de philadelphia, aguacate, algas frescas, tampico, chipotle y proteína glaseada en salsa Tai Chi', items: [
        i('Sushi Burger de salmón', 199), i('Sushi Burger de atún', 199), i('Sushi Burger de camarón', 199), i('Hitokuchi Burger', 299)] },
      { nombre: 'Omakase', nota: 'Sugerencia del chef', items: [
        i('Salmón Asia', 255, '120 gramos de salmón bañado en salsa Thai-Chi, con verduras al vapor y arroz'),
        i('Salmón Gojira', 260, 'Salmón a la plancha relleno de philadelphia, camarones y champiñones, con verduras a la plancha y arroz al vapor'),
        i('Tartar de atún', 245, 'Cubos de atún bañado en salsa oriental, aguacate, palmitos y zanahoria crocante, con totopos Won ton'),
        i('Timbalito de atún spicy', 245, 'Cubos de atún spicy con una base de arroz al vapor y aguacate, coronado con philadelphia y cubos de mango, con totopos Won ton. Mango sujeto a disponibilidad')] }
    ] },
    { id: 'thai', nombre: 'Thai', grupos: [
      { nombre: 'Arma tu platillo', nota: 'Elige tu base, tu proteína, tus vegetales y tu salsa. La primera salsa va incluida.', items: [
        Object.assign(i('Thai a tu gusto', 0, 'Base de 200 g, proteína, vegetales y salsa, como tú lo quieras'), { arma: 'thai' })] }
    ] },
    { id: 'rollos', nombre: 'Rollos', pista: 'Elige un tipo y se abren sus rollos.', grupos: [
      { nombre: 'Empanizados y capeados', nota: 'PF: por fuera · PD: por dentro', items: [
        i('Tempura Maki', 189, 'PF: Capeado tempura · PD: Surimi, philadelphia y tampico'),
        i('BBQ', 189, 'PF: Empanizado con topping de salsa bbq · PD: Pollo, zanahoria y aguacate'),
        i('Reptil', 210, 'PF: Empanizado con hojuelas de maíz · PD: Camarón, philadelphia, pepino y aguacate', true),
        i('Popeye', 210, 'PF: Espinaca y rollo tempura · PD: Salmón, philadelphia y aguacate'),
        i('Magma', 199, 'PF: Empanizado búfalo · PD: Pollo, zanahoria, pepino y philadelphia', true),
        i('Rollito', 205, 'PF: Empanizado · PD: Camarón, pepino, aguacate, philadelphia y tampico'),
        i('Ebi Coco', 205, 'PF: Rollo empanizado, topping de tampico · PD: Camarón empanizado, philadelphia, aguacate y coco rallado'),
        i('Ninja', 210, 'PF: 1/2 empanizado y 1/2 philadelphia con tampico · PD: Camarón, philadelphia, pepino y aguacate', true),
        i('Mar y Tierra', 210, 'PF: Empanizado · PD: Philadelphia, pollo, camarón, manchego y aguacate'),
        i('Gaijin', 210, 'PF: Empanizado con topping de tampico con tocino · PD: Arrachera, manchego y philadelphia', true),
        i('Tempura Especial', 210, 'PF: Capeado tempura y mermelada chipotle · PD: Salmón, philadelphia y aguacate'),
        i('Neo Tokio', 225, 'PF: Philadelphia, empanizado con tampico · PD: Salmón, philadelphia, surimi y aguacate')] },
      { nombre: 'Philadelphia Roll', nota: 'Rollos con cubierta de philadelphia', items: [
        i('Tempura Yasai', 189, 'PF: Philadelphia y verduras tempura · PD: Camarón y aguacate'),
        i('Party Roll', 199, 'PF: Philadelphia y pasta Won ton · PD: Salmón, pepino y aguacate'),
        i('Pacific Roll', 199, 'PF: Philadelphia, ajonjolí y tampico · PD: Camarón empanizado, pepino y aguacate', true),
        i('Rock and Roll', 199, 'PF: Philadelphia y tampico · PD: Salmón, camarón, manchego y aguacate', true),
        i('Del Gallo Roll', 210, 'PF: Philadelphia y queso de bola · PD: Camarón, jamón serrano y kakiage', true),
        i('Baby Dragon Roll', 199, 'PF: Philadelphia y mermelada chipotle · PD: Camarón empanizado, aguacate y manchego'),
        i('Pamplona', 210, 'PF: Philadelphia, jamón serrano, tampico y aderezo chipotle · PD: Camarón, pepino, aguacate y queso de bola'),
        i('Sushi Fest', 199, 'PF: Philadelphia y salmón frito · PD: Camarón empanizado y aguacate'),
        i('Philisago', 225, 'PF: Philadelphia y masago · PD: Salmón, aguacate y pepino', true),
        i('Kumonga', 225, 'PF: Philadelphia, kanikama y furikake de camarón · PD: Pulpo capeado, salmón empanizado y aguacate', true)] },
      { nombre: 'California Roll', nota: 'Arroz por fuera. Aguacate, pepino y philadelphia por dentro. Puedes pedirlo con masago adicional', items: [
        i('California de surimi', 165), i('California de pollo', 165), i('California de pulpo', 189), i('California de camarón', 189),
        i('California de salmón', 195), i('California de arrachera', 199), i('Extra masago por fuera', 49), i('Rollo empanizado (adicional)', 39)] },
      { nombre: 'Avocado Roll', nota: 'PF: Aguacate, tártara y ajonjolí · PD: Pepino, philadelphia, tampico y proteína a tu elección', items: [
        i('Avocado de surimi', 189), i('Avocado de pollo', 199), i('Avocado de camarón', 205), i('Avocado de salmón', 215),
        i('Avocado de pulpo', 205), i('Avocado de arrachera', 205)] },
      { nombre: 'Raw and Fresh', items: [
        i('Noriroll', 199, 'PF: Alga nori · PD: Philadelphia, surimi, pepino y aguacate'),
        i('Sake Roll', 210, 'PF: Salmón · PD: Philadelphia, pepino y aguacate', true),
        i('Svelty Especial', 245, 'PF: Aguacate, salmón con aderezo chipotle y salsa de anguila · PD: Verduras a la plancha, camarón empanizado, aguacate y philadelphia', true),
        i('Todito Roll', 225, 'PF: Alga nori · PD: Salmón, camarón, surimi, philadelphia y aguacate'),
        i('Magno Roll', 249, 'PF: Camarón, salmón y atún · PD: Surimi, philadelphia y aguacate', true),
        i('Tuna Roll', 225, 'PF: Atún · PD: Philadelphia, aguacate y pepino'),
        i('Ebi Roll', 225, 'PF: Camarón · PD: Philadelphia, aguacate y pepino'),
        i('Kiury Roll', 189, 'PF: Pepino, togarashi y topping de tampico · PD: Surimi, philadelphia y aguacate'),
        i('Fresh Roll', 210, 'Rollo de pepino. PD: Atún, aguacate, zanahoria y philadelphia · PF: Chipotle, togarashi y zanahoria frita')] },
      { nombre: 'Dulces y frutales', items: [
        i('Spicy Manguito', 210, 'PF: Mango, philadelphia y spicy de salmón · PD: Surimi, pepino y aguacate', true),
        i('Banano Roll', 210, 'PF: Plátano frito · PD: Philadelphia, camarón empanizado, pepino y aguacate'),
        i('Spring Roll', 210, 'PF: Mango, aguacate, chispa tempura y crema de coco · PD: Camarones al coco, philadelphia y aguacate')] },
      { nombre: 'Flameados', items: [
        i('Pollito Roll', 210, 'PF: Queso manchego y ajonjolí · PD: Pollo empanizado y aguacate'),
        i('El Texano Roll', 225, 'PF: Manchego y tocino · PD: Arrachera, pepino y aguacate'),
        i('Dragon Roll', 210, 'PF: Manchego picante · PD: Pollo empanizado, philadelphia y aguacate'),
        i('Gojira Roll', 225, 'PF: Manchego, arrachera y sriracha · PD: Arrachera, philadelphia, pepino y aguacate', true),
        i('Maguro Roll', 210, 'PF: Manchego spicy · PD: Camarón empanizado, philadelphia y aguacate')] },
      { nombre: 'Radiactivos', items: [
        i('Mothra', 225, 'PF: Alga rosa, tampico y chip · PD: Camarón empanizado, surimi, verduras tempura, philadelphia y aguacate'),
        i('Hiroshima Roll', 245, 'PF: Alga nori y topping de mariscos salteados en cajún, en una base spicy y topping de sriracha · PD: Aguacate y pepino', true),
        i('Ghidorah Roll', 225, 'PF: Salmón con spicy de camarón bañado en chipotle · PD: Philadelphia, pepino y aguacate', true),
        i('Volcano Roll', 225, 'PF: Spicy mayo, masago, camarón empanizado y aguacate · PD: Surimi, philadelphia y pepino', true),
        i('Flaminhot Roll', 199, 'PF: Cheetos FlaminHot y salsa búfalo · PD: Arrachera, aguacate, philadelphia y pepino'),
        i('Spicy Tuna', 205, 'PF: Alga, spicy tuna, cebollín y ajonjolí · PD: Aguacate y pepino'),
        i('Masago Roll', 205, 'PF: Masago y chispas tempura · PD: Camarón capeado, aguacate, pepino y philadelphia'),
        i('Anguila Roll', 265, 'PF: Mitad anguila, mitad aguacate, togarashi y topping de tampico · PD: Philadelphia, pepino y camarón empanizado'),
        i('Ebi Roca Roll', 245, 'PF: Chispas tempura y camarón roca · PD: Aguacate, philadelphia y camarón'),
        i('Tekka Maki Roll', 245, 'PF: Alga nori, zanahoria frita y cubos de atún sazonados con la vinagreta de la casa, salsa chipotle y un toque de cebollín · PD: Pepino y aguacate')] },
      { nombre: 'Extras para rollos', items: [
        i('Extra pollo', 45), i('Extra arrachera', 49), i('Extra salmón', 70), i('Extra atún', 55), i('Extra camarón', 65), i('Extra pulpo', 65),
        i('Extra anguila', 99), i('Extra tampico', 40), i('Extra verduras (pepino, zanahoria, brócoli)', 40), i('Extra aguacate', 40), i('Extra tampico chipotle', 40)] }
    ] },
    { id: 'arroz', nombre: 'Arroz', grupos: [
      { nombre: 'Yakimeshi', nota: 'Arroz a la plancha, con verduras y cebollín salteado con salsa de soya', items: [
        i('Yakimeshi de pollo', 160), i('Yakimeshi de camarón', 189), i('Yakimeshi de arrachera', 189), i('Yakimeshi vegetariano', 160),
        i('Yakimeshi mixto', 199, 'Pollo, camarón y arrachera'), i('Yakimeshi Gojira', 210, 'Camarón, pulpo y salmón'),
        i('Yakimeshi especial', 225, 'Camarón crispy, philadelphia, aguacate, tampico y frituras de la casa')] },
      { nombre: 'Gohan', nota: 'Arroz al vapor', items: [
        i('Gohan natural', 130), i('Gohan tampico', 145),
        i('Gohan Gojira', 210, 'Tampico, salmón, camarón, philadelphia, aguacate y furikake', true),
        i('Gohan Spicy Tuna', 210, 'Tampico y spicy tuna'),
        i('Gohan Dragon', 195, 'Tampico, salsa dragon, pollo empanizado, aguacate y ajonjolí'),
        i('Gohan TexMex', 195, 'Tampico, arrachera, aguacate y ajonjolí', true),
        i('Gohan Di Mare', 210, 'Tampico, pulpo asado, atún a la plancha y aguacate'),
        i('Gohan especial', 225, 'Tampico, camarón crispy, philadelphia, aguacate y frituras de la casa')] },
      { nombre: 'Extras para arroz', items: [
        i('Extra pollo para arroz', 65), i('Extra arrachera para arroz', 70), i('Extra salmón para arroz', 85), i('Extra atún para arroz', 70),
        i('Extra camarón para arroz', 70), i('Extra pulpo para arroz', 70), i('Extra anguila ahumada', 125), i('Extra aguacate para arroz', 55), i('Extra tampico encima', 55)] }
    ] },
    { id: 'paquetes', nombre: 'Paquetes', grupos: [
      { nombre: 'Paquetes familiares', nota: 'Elige los rollos de tu paquete. El contenido y las cantidades son de ejemplo hasta confirmarlos con Gojira.', items: [
        Object.assign(i('Gojira Box', 855, 'Tú eliges los 4 rollos (contenido de ejemplo)'), { arma: 'box-gojira' }),
        Object.assign(i('Party Box', 1210, 'Tú eliges los 6 rollos (contenido de ejemplo)'), { arma: 'box-party' }),
        Object.assign(i('Momster Box', 1055, 'Tú eliges los 5 rollos (contenido de ejemplo)'), { arma: 'box-momster' })] }
    ] },
    { id: 'bebidas', nombre: 'Bebidas y postres', grupos: [
      { nombre: 'Aguas', items: [i('Té', 50), i('Jamaica', 50), i('Horchata', 50), i('Chaya con limón', 50), i('Limonada', 50)] },
      { nombre: 'Refrescos', items: [i('Coca', 50), i('Coca sin azúcar', 50), i('Coca light', 50), i('Sprite', 50), i('Fanta', 50), i('Mundet', 50), i('Agua Cristal', 50)] },
      { nombre: 'Postres', items: [
        i('Tempura helado', 135, 'Tradicional postre japonés bañado en chocolate o cajeta'),
        i('Tempura cookies', 135, '5 galletas Oreo capeadas con una bola de helado de vainilla y topping de chocolate'),
        i('Strudell manzana', 165), i('Mouse chocolate', 165), i('Suuffle de elote', 165)] }
    ] }
  ];

  // ---------- Platillos que se arman o se personalizan ----------
  // Una receta dice qué pasos tiene el platillo y cuántas opciones se pueden elegir en cada uno.
  // TODO el contenido y los precios de abajo son DE EJEMPLO («por confirmar» con Gojira): se cambian aquí y la pantalla se ajusta sola.
  //   paso: { id, titulo, nota?, corto (cómo se nombra en el mensaje), min, max, contar (cada opción se puede repetir),
  //           verPrecio (muestra «+$») , opciones: [{ n, p }] }
  const op = (n, p) => ({ n, p: p || 0 });
  const ROLLOS_BOX = ['Tempura Maki', 'BBQ', 'Reptil', 'Popeye', 'Magma', 'Rollito', 'Flaminhot Roll', 'Tekka Maki Roll'].map(n => op(n));
  const caja = (id, titulo, cuantos) => ({ id, modo: 'pasos', titulo, base: 0, pasos: [
    { id: 'rollos', titulo: `Elige tus ${cuantos} rollos`, nota: 'Puedes repetir el que más te guste.', corto: 'Rollos', min: cuantos, max: cuantos, contar: true, opciones: ROLLOS_BOX }] });
  const RECETAS = {
    thai: { id: 'thai', modo: 'pasos', titulo: 'Arma tu Thai', base: 0, desde: true, pasos: [
      { id: 'base', titulo: 'Elige tu base', nota: '200 g', corto: 'Base', min: 1, max: 1, opciones: [op('Arroz', 110), op('Tallarines', 110), op('Zucchini', 110)] },
      { id: 'proteina', titulo: 'Elige tu proteína', corto: 'Proteína', min: 1, max: 1, opciones: [op('Pollo', 85), op('Arrachera', 85), op('Camarón', 85)] },
      { id: 'vegetales', titulo: 'Elige tus vegetales', nota: 'De 1 a 3', corto: 'Vegetales', min: 1, max: 3, opciones: [op('Champiñón', 35), op('Elote baby', 29), op('Pimiento', 19), op('Cacahuate', 19), op('Brócoli', 19), op('Apio', 19)] },
      { id: 'salsa', titulo: 'Elige tu salsa', nota: 'La primera va incluida', corto: 'Salsa', min: 1, max: 1, opciones: [op('Agridulce'), op('Dragón'), op('Teriyaki'), op('Curry coco'), op('Jambalaya')] },
      { id: 'salsa2', titulo: '¿Otra salsa?', nota: 'Opcional', corto: 'Salsa extra', min: 0, max: 1, verPrecio: true, opciones: [op('Salsa extra combinada', 35)] }] },
    'box-gojira': caja('box-gojira', 'Arma tu Gojira Box', 4),
    'box-party': caja('box-party', 'Arma tu Party Box', 6),
    'box-momster': caja('box-momster', 'Arma tu Momster Box', 5),
    rollo: { id: 'rollo', modo: 'hoja', titulo: 'Tu rollo', base: 0, pasos: [
      { id: 'alga', titulo: 'Preparación', nota: 'Sin costo', corto: '', min: 0, max: 1, opciones: [op('Sin alga')] },
      { id: 'proteina', titulo: 'Cambiar proteína', nota: 'Cambia la del rollo por otra', corto: 'Proteína', min: 0, max: 1, verPrecio: true,
        opciones: [op('Pollo', 45), op('Arrachera', 49), op('Salmón', 70), op('Atún', 55), op('Camarón', 65), op('Pulpo', 65), op('Anguila', 99)] },
      { id: 'aderezos', titulo: 'Aderezos', nota: 'Hasta 3', corto: 'Aderezos', min: 0, max: 3, verPrecio: true,
        opciones: [op('Tampico', 40), op('Tampico chipotle', 40), op('Aguacate', 40), op('Verduras', 40)] }] }
  };
  // Cada rollo del menú se puede personalizar
  MENU.find(c => c.id === 'rollos').grupos.forEach(g => g.items.forEach(it => { it.arma = 'rollo'; }));

  // Ubicaciones en un mapa ESQUEMÁTICO (km). Son de ejemplo para la muestra: no son las ubicaciones reales.
  // Con las coordenadas reales de cada sucursal (lat/lng) la lógica es la misma.
  const ORIGEN = { lat: 20.97, lng: -89.59 };

  const SUCURSALES = [
    { id: 'heroes', nombre: 'Los Héroes', direccion: 'C. 136 #653 x 115 esq. 117, Fracc. Los Héroes',
      xKm: 7.5, yKm: 5.5, whatsapp: '5219990000001', horario: { abre: '13:00', cierra: '22:30' }, pausada: false,
      reparto: 'propio', zonaFija: { radioKm: 1.2, precio: 5, nombre: 'dentro del fraccionamiento' }, tarifaKm: 10, minimo: 25, maxKm: 8 },
    { id: 'americas', nombre: 'Las Américas', direccion: 'Av. 59 x 94 y 96, Plaza 59, Fracc. Las Américas',
      xKm: -6, yKm: 4, whatsapp: '5219990000002', horario: { abre: '13:00', cierra: '22:30' }, pausada: false,
      reparto: 'propio', zonaFija: null, tarifaKm: 10, minimo: 30, maxKm: 8 },
    { id: 'odara', nombre: 'Plaza Odara', direccion: 'Plaza Odara, Av. Yucatán, Mérida (dirección por confirmar)',
      xKm: 1, yKm: 9, whatsapp: '5219990000003', horario: { abre: '13:00', cierra: '22:30' }, pausada: false,
      reparto: 'externo', zonaFija: null, tarifaKm: 12, minimo: 35, maxKm: 8 }
  ].map(s => ({
    ...s,
    lat: ORIGEN.lat + s.yKm / 111.32,
    lng: ORIGEN.lng + s.xKm / (111.32 * Math.cos(ORIGEN.lat * Math.PI / 180))
  }));

  const PAGOS = ['Efectivo', 'Transferencia'];

  const datos = { MENU, RECETAS, SUCURSALES, PAGOS, ORIGEN, MARCA: { nombre: 'Gojira Sushi & Thai' } };
  if (typeof module !== 'undefined' && module.exports) module.exports = datos;
  else raiz.GOJIRA = datos;
})(typeof window !== 'undefined' ? window : globalThis);
