import React from 'react';
import {AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Water} from './Water';

const ramp = (t, a, b) => interpolate(t, [a,b], [0,1], {
  extrapolateLeft:'clamp', extrapolateRight:'clamp', easing:Easing.bezier(.22,.61,.36,1),
});
const visibility = (t, start, end) => ramp(t,start,start+.48) * (1-ramp(t,end-.25,end));
const layers = ['Datos','Reglas','Precios','Permisos','Supervisión','Registro'];
const variants = [
  {start:21.4, title:'Tienda', sub:'Tallas y colores', rows:[['Talla','M'],['Color','Azul'],['Alternativa','Negra']]},
  {start:23.87, title:'Agenda', sub:'Citas y horarios', rows:[['Servicio','Consulta'],['Horario','11:30'],['Estado','Disponible']]},
  {start:25.3, title:'Pedidos', sub:'Productos y estado', rows:[['Producto','Playera'],['Variante','Azul · M'],['Estado','Por confirmar']]},
];
const titles = [
  [.72,4.23,'Un agente puede responder mensajes.'],
  [4.23,5.98,'Pero no conoce tu negocio.'],
  [5.98,8.43,'Empezamos con tu idea.'],
  [8.43,19.7,'Hecho para tu negocio.'],
  [19.7,27.13,'Una base. Distintos negocios.'],
  [27.13,33.29,'De un mensaje a una solicitud clara.'],
  [33.29,39.12,'Tú decides. Todo queda registrado.'],
];

function Rows({rows}) {
  return <div className="rows">{rows.map(([label,value]) => <div className="row" key={label}>
    <span>{label}</span><strong>{value}</strong>
  </div>)}</div>;
}

function WordTitle({text, time}) {
  return text.split(' ').map((word,i) => {
    const inView=ramp(time,i*.12,i*.12+.4);
    return <React.Fragment key={i}><span className="word" style={{
      opacity:inView, transform:`translateY(${24*(1-inView)}px)`,
    }}>{word}</span>{' '}</React.Fragment>;
  });
}

export function Ad({voice}) {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const t=frame/fps;
  const intro=ramp(t,5.7,6.5);
  const expand=ramp(t,8.43,10);
  const settle=ramp(t,18.6,20.2);
  const prompt=ramp(t,26.6,27.5);
  const parse=ramp(t,29.2,31.6);
  const approval=ramp(t,32.89,33.7);
  const requestOut=ramp(t,32.89,33.13);
  const approvalIn=ramp(t,33.13,33.65);
  const cursor=ramp(t,35.35,35.94)*(1-ramp(t,36.28,36.65));
  const pressed=ramp(t,35.9,36.2)*(1-ramp(t,36.2,36.5));
  const logged=ramp(t,36.98,37.5);
  const close=ramp(t,38.7,39.6);
  const layoutOut=1-close;
  const message='hola tienes la azul m? y si no negra apartame una';
  return <AbsoluteFill>
    <Water seconds={t}/>
    {voice && <Sequence from={Math.round(.5*fps)} durationInFrames={Math.round(46.26*fps)}><Audio src={staticFile(voice)}/></Sequence>}
    <div className="brand" style={{opacity:layoutOut}}>Ari Labs</div>
    <div className="stage" style={{opacity:ramp(t,.35,1.3)*layoutOut,transform:`translateY(${-65*close}px) scale(${1-.08*close})`}}>
      <div className="panel" style={{
        width: 580+212*intro-164*prompt+90*approval,
        height: 813-456*intro+185*settle+142*prompt-74*approval,
        transform:`translate(-50%, -50%) translateY(${-64*expand+64*settle}px)`,
      }}>
        <div className="panel-label"><span className="dot"/>{t<6?'Mensajes':t<26.9?'Sistema del negocio':t<33.13?'Solicitud de cliente':'Panel del encargado'}<span className="demo">DEMO</span></div>
        <section style={{opacity:1-intro, transform:`translateY(${-40*intro}px)`}}>
          <div className="bubble">¿Tienes la azul en talla M?</div>
          <div className="bubble reply" style={{opacity:ramp(t,2.25,3.3)}}>Déjame consultar el inventario…</div>
          <div className="status" style={{opacity:ramp(t,4.23,4.8)}}>Inventario sin configurar</div>
        </section>
        <section style={{opacity:intro*(1-settle)}}>
          <div className="bubble idea" style={{opacity:1-expand*.25}}>Quiero que mis clientes pidan por mensaje.</div>
          <h2 style={{opacity:expand}}>Agente configurado</h2>
        </section>
        {variants.map(({start,title,sub,rows},i) => {
          const enter=i===0?settle:ramp(t,start-.18,start+.42);
          const leave=i===2?prompt:ramp(t,variants[i+1].start-.18,variants[i+1].start+.42);
          return <section key={title} style={{opacity:enter*(1-leave),transform:`translateY(${36*(1-enter)-36*leave}px)`}}>
            <h2>{title}</h2><div className="sub">{sub}</div><Rows rows={rows}/>
          </section>;
        })}
        <section style={{opacity:prompt*(1-requestOut)}}>
          <div className="bubble" style={{opacity:1-parse*.42}}>{message.slice(0,Math.floor(message.length*ramp(t,27.13,29.55)))}</div>
          <div style={{opacity:parse,transform:`translateY(${30*(1-parse)}px)`}}>
            <Rows rows={[[ 'Talla','M'],['Color','Azul'],['Alternativa','Negra'],['Solicitud','Apartar una']]}/>
          </div>
        </section>
        <section style={{opacity:approvalIn,transform:`translateY(${35*(1-approval)}px)`}}>
          <h2>{logged>.5?'Historial':'Apartar una playera'}</h2>
          <div className="sub">{logged>.5?'Acción registrada':'Azul · M · Alternativa negra'}</div>
          <div className="decision">
            <div className="button" style={{opacity:1-logged,transform:`scale(${1-.07*pressed})`}}>Aprobar</div>
            <svg className="cursor" aria-hidden="true" viewBox="0 0 44 52" style={{
              opacity:cursor, transform:`translate(${42*(1-cursor)}px, ${32*(1-cursor)}px)`,
            }}><path d="M4 3v43l11-12 8 15 7-4-8-15 17-1z" /></svg>
            <div className="history" style={{opacity:logged,transform:`translateY(${20*(1-logged)}px)`}}>✓ Aprobó el encargado</div>
          </div>
        </section>
      </div>
      <svg className="links" viewBox="0 0 1080 700" style={{opacity:expand*(1-settle)}}>
        {layers.map((name,i) => <path key={name} d={`M540 178 Q540 255 ${257+i%3*284} ${304+Math.floor(i/3)*97}`} pathLength="1"
          strokeDasharray="1" strokeDashoffset={1-ramp(t,9.2+i*.94,10+i*.94)}/>)}
      </svg>
      {layers.map((name,i) => {
        const progress=ramp(t,9.2+i*.94,10+i*.94);
        return <div className="chip" key={name} style={{
          left:540+(i%3-1)*284*progress,
          top:870+(177+Math.floor(i/3)*97)*progress,
          opacity:progress*(1-settle),transform:`translate(-50%, -50%) scale(${.82+.18*progress})`,
        }}><span className="dot"/>{name}</div>;
      })}
    </div>
    {titles.map(([start,end,text])=><div key={start} className="headline" style={{opacity:visibility(t,start,end)}}>
      <WordTitle text={text} time={t-start}/>
    </div>)}
    <div className="end" style={{opacity:ramp(t,39.11,40.05),transform:`translateY(${34*(1-ramp(t,39.11,40.05))}px)`}}>
      <h1>Ari Labs</h1>
      <p>Tecnología que se adapta a tu forma de trabajar.</p>
      <div className="cta" style={{opacity:ramp(t,42.54,43.35)}}>
        <strong>Cuéntanos tu idea.</strong>
        <span>Escríbele a nuestro agente por WhatsApp</span>
      </div>
      <footer>Demostración con datos de ejemplo. Agente de IA.</footer>
    </div>
  </AbsoluteFill>;
}
