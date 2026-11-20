import React, {useLayoutEffect, useRef} from 'react';

const vertex = `attribute vec2 p; void main(){gl_Position=vec4(p,0.,1.);}`;
const fragment = `
precision highp float;
uniform float time;
float causticas(vec2 uv, float tt){
        vec2 p = mod(uv * 6.2831 * 1.6, 6.2831) - 250.0; vec2 i = p; float c = 1.0; float fuerza = 0.0045;
        for (int n = 0; n < 5; n++){
          float k = tt * (1.0 - (3.5 / float(n + 1)));
          i = p + vec2(cos(k - i.x) + sin(k + i.y), sin(k - i.y) + cos(k + i.x));
          c += 1.0 / length(vec2(p.x / (sin(i.x + k) / fuerza), p.y / (cos(i.y + k) / fuerza)));
        }
        c /= 5.0; c = 1.17 - pow(c, 1.4); return pow(abs(c), 7.0);
      }

void main(){
  vec2 uv=gl_FragCoord.xy/vec2(360.,640.);
  vec2 p=vec2(uv.x*.72,uv.y*1.28)+vec2(.13,.14);
  float t=time*.34;
  float g=causticas(p,t);
  float h=causticas(p*1.12+vec2(.41,.17),-t*.77);
  vec3 base=mix(vec3(.70,.83,.91),vec3(.89,.965,.98),uv.y);
  base=mix(base,vec3(.75,.94,.93),.22+.16*sin(uv.x*6.+uv.y*4.+t));
  gl_FragColor=vec4(base+vec3(.79,.58,.39)*min(.42,g*.77+h*.34),1.);
}
`;

function setup(canvas) {
  const gl = canvas.getContext('webgl', {alpha:false, preserveDrawingBuffer:true});
  if (!gl) throw new Error('La textura de agua necesita WebGL');
  const program = gl.createProgram();
  for (const [kind, source] of [[gl.VERTEX_SHADER, vertex], [gl.FRAGMENT_SHADER, fragment]]) {
    const shader = gl.createShader(kind);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,3,-1,-1,3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const time = gl.getUniformLocation(program, 'time');
  return {
    draw(seconds) {
      gl.uniform1f(time, seconds);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}

export function Water({seconds}) {
  const canvas = useRef(null);
  const renderer = useRef(null);
  useLayoutEffect(() => {
    renderer.current = setup(canvas.current);
    return () => renderer.current.dispose();
  }, []);
  useLayoutEffect(() => renderer.current.draw(seconds), [seconds]);
  return <canvas ref={canvas} width={360} height={640} className="water" />;
}
