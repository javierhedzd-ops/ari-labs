# Arma una hoja de diseño por modelo: usa el <head> (fuentes y estilos) del propio modelo y le pone una lámina de componentes.
import re
R='/home/user/ari-labs/modelos/'
OUT='diseno/hojas/'   # correr desde la raíz del repo
LAMINA='''<style>
  .lamina{max-width:1100px;margin:0 auto;padding:44px 40px 56px}
  .lamina .enc{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:34px;padding-bottom:18px;border-bottom:1px solid var(--lh-linea)}
  .lamina .enc small{display:block;font:600 .78rem/1 "Inter Tight",sans-serif;letter-spacing:.14em;text-transform:uppercase;opacity:.7;margin-bottom:10px}
  .lbl{font:600 .72rem/1 "Inter Tight",sans-serif;letter-spacing:.16em;text-transform:uppercase;opacity:.62;margin:0 0 14px}
  .grupo{margin-bottom:38px}
  .fila-h{display:flex;flex-wrap:wrap;gap:22px;align-items:flex-start}
  .item{display:grid;gap:10px;justify-items:start}
  .item>i{font:500 .74rem/1 "Inter Tight",sans-serif;font-style:normal;opacity:.6}
  .muestras{display:flex;flex-wrap:wrap;gap:14px}
  .muestra{width:118px}
  .muestra div{height:74px;border-radius:16px;box-shadow:inset 0 0 0 1px rgba(128,128,128,.25)}
  .muestra b{display:block;font:600 .82rem/1.2 "Inter Tight",sans-serif;margin-top:8px}
  .muestra span{font:500 .74rem/1 "Inter Tight",sans-serif;opacity:.65;font-variant-numeric:tabular-nums}
  .dos-col{display:grid;grid-template-columns:1fr 1fr;gap:34px}
  .linea.pasar::after{transform:scaleX(.35)}
</style>'''
def hoja(modelo, nombre, linea, colores, letras, cuerpo):
    s=open(R+modelo+'/index.html').read()
    head=s[:s.index('</head>')]
    head=re.sub(r'<title>.*?</title>','<title>Hoja de diseño · '+nombre+'</title>',head)
    sw=''.join(f'<div class="muestra"><div style="background:{h}"></div><b>{n}</b><span>{h}</span></div>' for n,h in colores)
    html=head+LAMINA+f'<style>:root{{--lh-linea:{linea}}} .js .sube{{opacity:1;translate:none}}</style></head><body>'+f'''
<div class="lamina">
  <div class="enc"><div><small>Hoja de diseño · modelo</small>{letras}</div></div>
  <div class="grupo"><p class="lbl">Colores</p><div class="muestras">{sw}</div></div>
  {cuerpo}
</div></body></html>'''
    open(OUT+modelo+'.html','w').write(html)

# ---------- Heladería ----------
hoja('heladeria','Heladería','rgba(44,24,32,.14)',
 [('Rosa mexicano','#d6336c'),('Rosa sombra','#9c1f4c'),('Rosa claro','#ffb3cc'),('Rosa pálido','#ffe1ec'),('Crema rosada','#fdf3f6'),('Tinta','#2c1820'),('Galleta','#e9b872')],
 '<h1 style="font-size:4.2rem;color:var(--tinta)">Heladería · alegre</h1><p style="margin:10px 0 0;color:var(--suave)">Títulos en Caprasimo, texto en Inter Tight. Formas redondas, botones gorditos que se hunden, ondas y sellos.</p>',
 '''
  <div class="grupo"><p class="lbl">Letra</p><div class="dos-col">
    <div><h2 style="font-size:3.4rem">Mamey con nata</h2><p style="margin:8px 0 0;color:var(--suave)">Caprasimo · títulos, precios y sellos</p></div>
    <div><p style="margin:0;font-size:1.15rem">Hecho hoy en la mañana, con fruta de temporada.</p><p style="margin:8px 0 0;color:var(--suave)">Inter Tight · textos y botones</p></div></div></div>
  <div class="grupo"><p class="lbl">Botones · se hunden al tocarlos</p><div class="fila-h">
    <div class="item"><a class="gordo oscuro">Armar mi pedido</a><i>Principal</i></div>
    <div class="item"><a class="gordo oscuro" style="transform:translateY(4px);box-shadow:0 1px 0 #000">Armar mi pedido</a><i>Al tocarlo</i></div>
    <div class="item"><a class="gordo rosa">Pedir por WhatsApp</a><i>Pedido</i></div>
    <div class="item"><a class="gordo rosa" style="opacity:.5">Pedir por WhatsApp</a><i>Sin sabores aún</i></div>
    <div class="item" style="background:var(--rosa);padding:14px;border-radius:24px"><a class="gordo">Pedir</a><i style="color:#fff">Sobre rosa</i></div>
  </div></div>
  <div class="grupo"><p class="lbl">Tamaños</p><div class="tamanos" style="max-width:520px;margin:0">
    <label class="tam"><input type="radio" name="t"><span><b>Vasito</b><small>1 sabor</small><em>$35</em></span></label>
    <label class="tam"><input type="radio" name="t" checked><span><b>Cono</b><small>2 sabores</small><em>$45</em></span></label>
    <label class="tam"><input type="radio" name="t"><span><b>Litro</b><small>3 sabores</small><em>$150</em></span></label></div><p style="margin:10px 0 0;color:var(--suave);font-size:.85rem">Normal · escogido (se levanta con borde rosa)</p></div>
  <div class="grupo"><p class="lbl">Sabores</p><div class="sabores">
    <label class="sabor"><input type="checkbox" checked><span><i style="background:#f4a08a"></i>Mamey</span></label>
    <label class="sabor"><input type="checkbox"><span><i style="background:#fff;box-shadow:inset 0 0 0 2px var(--rosa-claro)"></i>Coco</span></label>
    <label class="sabor"><input type="checkbox" disabled><span><i style="background:#5a3426"></i>Chocolate</span></label></div>
    <p style="margin:10px 0 0;color:var(--suave);font-size:.85rem">Marcado · normal · ya escogiste todos los de tu tamaño</p></div>
  <div class="grupo"><p class="lbl">Sello, tarjeta y barra del pedido</p><div class="fila-h" style="align-items:center">
    <div class="sello" style="position:static;rotate:12deg"><div>$45<small>EL CONO</small></div></div>
    <article class="postre" style="width:250px"><div class="forma"></div><h3>Malteada</h3><p>Del sabor que quieras.</p><em>$65</em></article>
    <div class="pedido" style="position:static;width:440px;margin:0"><span><small>Cono · mamey y fresa</small><b>$45</b></span><a class="gordo rosa">Pedir por WhatsApp</a></div>
  </div></div>
''')

# ---------- Restaurante ----------
hoja('restaurante','Restaurante','rgba(239,228,211,.16)',
 [('Noche','#17120f'),('Noche 2','#211915'),('Crema','#efe4d3'),('Crema suave','#b9ab96'),('Barro','#c46a3c')],
 '<h1 style="font-size:4.2rem">Restaurante · <em>de autor</em></h1><p style="margin:10px 0 0;color:var(--crema-suave)">Títulos en Cormorant Garamond, texto en Inter Tight. Mucho silencio, líneas finas y enlaces subrayados en lugar de botones.</p>',
 '''
  <div class="grupo"><p class="lbl">Letra</p><div class="dos-col">
    <div><h2 style="font-size:3.4rem">Sabores de <em>casa</em></h2><p style="margin:8px 0 0;color:var(--crema-suave)">Cormorant Garamond · títulos y platillos</p></div>
    <div><span class="ceja">Cocina yucateca</span><p style="margin:10px 0 0;font-size:1.1rem">Recetas de la abuela, servidas despacio.</p><p style="margin:8px 0 0;color:var(--crema-suave)">Inter Tight · textos y cejas espaciadas</p></div></div></div>
  <div class="grupo"><p class="lbl">Acciones · el subrayado se recoge al pasar y la flecha avanza</p><div class="fila-h">
    <div class="item"><a class="linea">Reservar mesa <span class="fl">→</span></a><i>Principal</i></div>
    <div class="item"><a class="linea pasar">Reservar mesa <span class="fl" style="transform:translateX(6px)">→</span></a><i>Al pasar</i></div>
    <div class="item"><a class="linea barro">Ver la carta <span class="fl">→</span></a><i>Secundaria</i></div>
    <div class="item"><a class="linea barro">Confirmar por WhatsApp <span class="fl">→</span></a><i>Reserva</i></div>
  </div></div>
  <div class="grupo"><p class="lbl">Pestañas de la carta y platillo</p>
    <div class="pestanas" style="justify-content:flex-start;max-width:520px" role="tablist"><button aria-selected="true">Entradas</button><button aria-selected="false">Fuertes</button><button aria-selected="false">Postres</button></div>
    <ul class="platos" style="max-width:620px"><li style="animation:none"><h3>Relleno negro</h3><span class="precio">$260</span><p>Pavo en recado negro, con su but y tortillas a mano.</p></li></ul></div>
  <div class="grupo"><p class="lbl">Campos de la reserva y plato</p><div class="fila-h" style="align-items:center;gap:40px">
    <div class="campo" style="width:220px"><label>Personas</label><select><option>4 personas</option></select></div>
    <div class="campo" style="width:220px"><label>Hora</label><select><option>2:30 p. m.</option></select></div>
    <div class="plato" style="width:180px;margin:0;animation:none"><div class="comida" style="animation:none"><span class="hoja" style="left:62%;top:22%;rotate:-30deg"></span></div></div>
  </div></div>
''')

# ---------- Barbería ----------
hoja('barberia','Barbería','rgba(185,192,201,.3)',
 [('Fondo','#0e0f12'),('Grafito','#1a1c21'),('Brillo','#2b2f36'),('Plata','#b9c0c9'),('Rojo poste','#d23c3c'),('Crema fría','#eef0f3')],
 '<h1 class="letrero" style="font-size:4.6rem">Barbería <span style="color:var(--rojo)">clásica</span></h1><p style="margin:10px 0 0;color:var(--suave)">Títulos en Big Shoulders, texto en Inter Tight. Marcos con doble filete, letreros centrados, esquinas rectas.</p>',
 '''
  <div class="grupo"><p class="lbl">Letra</p><div class="dos-col">
    <div><div class="letrero" style="font-size:3.6rem">Corte <span style="color:var(--rojo)">y</span> barba</div><p style="margin:8px 0 0;color:var(--suave)">Big Shoulders Display · letreros y precios</p></div>
    <div><div class="orn" style="justify-content:flex-start">Barbería</div><p style="margin:12px 0 0;font-size:1.1rem">Toalla caliente, navaja y buena plática.</p><p style="margin:8px 0 0;color:var(--suave)">Inter Tight · textos</p></div></div></div>
  <div class="grupo"><p class="lbl">Botones · cuadrados de borde doble; el borde se abre al pasar</p><div class="fila-h">
    <div class="item"><a class="cuadro">Apartar mi silla</a><i>Principal</i></div>
    <div class="item"><a class="cuadro" style="outline-offset:7px;background:var(--rojo-osc)">Apartar mi silla</a><i>Al pasar</i></div>
    <div class="item"><a class="cuadro plata">La casa</a><i>Secundario</i></div>
    <div class="item"><a class="cuadro" style="opacity:.45">Apartar mi silla</a><i>Sin servicios aún</i></div>
  </div></div>
  <div class="grupo"><p class="lbl">Tabla de precios</p><div class="pared" style="max-width:620px">
    <label class="serv"><input type="checkbox" checked><span class="caja-m"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg></span><span class="nombre">Corte clásico <small>40 min</small></span><span class="puntos"></span><span class="precio">$180</span></label>
    <label class="serv"><input type="checkbox"><span class="caja-m"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg></span><span class="nombre">Fade <small>45 min</small></span><span class="puntos"></span><span class="precio">$200</span></label></div></div>
  <div class="grupo"><p class="lbl">Ticket, marco y poste</p><div class="fila-h" style="align-items:center">
    <div class="ticket" style="position:static;width:440px;margin:0"><span><small>2 servicios · 1 h 25 min</small><b>$380</b></span><a class="cuadro">Apartar mi silla</a></div>
    <div class="marco" style="width:260px;margin:0"><div style="padding:22px"><div class="orn">Dónde</div></div></div>
    <div class="poste" style="width:260px;margin:0;animation:none"></div>
  </div></div>
''')

# ---------- Consultorio ----------
hoja('consultorio','Consultorio','rgba(31,27,56,.1)',
 [('Crema','#fbf7f1'),('Crema 2','#f4eee5'),('Lavanda','#6d5bd0'),('Lavanda oscura','#5a48bb'),('Lavanda clara','#cdc4fb'),('Lavanda pálida','#ece8ff'),('Tinta','#1f1b38')],
 '<h1 style="font-size:4.2rem">Consultorio · <em>cálido</em></h1><p style="margin:10px 0 0;color:var(--suave)">Títulos en Instrument Serif con una palabra en cursiva, texto en Inter Tight. Formas suaves, óvalos y sombras ligeras.</p>',
 '''
  <div class="grupo"><p class="lbl">Letra</p><div class="dos-col">
    <div><h2 style="font-size:3.4rem">Sin <em>miedo</em> al dentista</h2><p style="margin:8px 0 0;color:var(--suave)">Instrument Serif · títulos</p></div>
    <div><span class="ceja">Clínica dental</span><p style="margin:6px 0 0;font-size:1.1rem">Te explicamos todo antes de empezar.</p><p style="margin:8px 0 0;color:var(--suave)">Inter Tight · textos y botones</p></div></div></div>
  <div class="grupo"><p class="lbl">Botones · suaves, suben un poco al pasar</p><div class="fila-h" style="align-items:center">
    <div class="item"><a class="suave">Apartar mi cita</a><i>Principal</i></div>
    <div class="item"><a class="suave" style="transform:translateY(-2px);background:var(--lav-osc)">Apartar mi cita</a><i>Al pasar</i></div>
    <div class="item"><a class="suave claro">Tratamientos</a><i>Secundario</i></div>
    <div class="item"><a class="suave claro redondo" aria-label="Paso anterior"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg></a><i>Regresar</i></div>
  </div></div>
  <div class="grupo"><p class="lbl">La cita en 3 pasos</p><div class="asistente" style="max-width:620px">
    <div class="avance"><span>Paso 2 de 3</span><span style="margin-left:auto">Día</span></div><div class="barrita"><i style="width:66.6%"></i></div>
    <div class="opciones"><label><input type="radio" name="d"><span>Hoy<small>sáb 31</small></span></label><label><input type="radio" name="d" checked><span>Lun<small>lun 2</small></span></label><label><input type="radio" name="d"><span>Mar<small>mar 3</small></span></label></div></div></div>
  <div class="grupo"><p class="lbl">Tarjetas y óvalo</p><div class="fila-h" style="align-items:center">
    <div class="confia" style="margin:0;padding:0;display:block;width:240px"><div><b>El mismo día</b><span>si tienes dolor, te damos lugar.</span></div></div>
    <div class="trat" style="width:250px"><div class="forma"></div><h3>Limpieza dental</h3><span class="precio">desde $600</span><p>Cada seis meses.</p></div>
    <div class="ovalo" style="width:140px;animation:none"></div>
  </div></div>
''')
print('ok')
