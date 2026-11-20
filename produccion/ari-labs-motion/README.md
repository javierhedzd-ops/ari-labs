# Ari Labs · anuncio en Remotion

Composición editable de 50 segundos para revisión de Javi. El proyecto vive en su propia carpeta y usa una línea de tiempo de 3000 fotogramas a 60 FPS.

## Preparar y renderizar

Requiere Node.js 22 o posterior, npm y FFmpeg. Desde esta carpeta:

```sh
npm ci
npm run studio
npm run preview
npm run render
```

Antes de abrir Studio o renderizar, guarda localmente la pista de voz en `public/voz-exportada.wav`. Para reproducir la revisión, descarga el [borrador de Descript](https://share.descript.com/view/qkWJvGeObQf) mediante su opción de descarga y extrae la pista en su posición original:

```sh
ffmpeg -i borrador.mp4 -ss 0.5 -t 46.26 -vn -c:a pcm_s16le public/voz-exportada.wav
```

También se puede usar el WAV original del proyecto Descript con `ARI_VOICE='Voz Ari Labs MX.wav' npm run render` tras guardarlo en `public/`. Los WAV quedan fuera del repositorio. La revisión usa el audio AAC de la exportación decodificado a WAV, comenzando a los 0,5 s en la composición. Conserva la grabación y deja 3,24 s de cierre. La línea de tiempo sigue las pausas medidas en la exportación. No hay música.

Remotion usa Chromium con WebGL. Si ya tienes Chromium instalado, puedes indicar su ruta con `CHROME_PATH=/ruta/a/chromium npm run render`. En máquinas con menos recursos se puede ajustar `ARI_CONCURRENCY`. La vista móvil se escribe en `out/ari-labs-preview.mp4` (540 × 960 a 30 FPS) y el máster en `out/ari-labs-final.mp4` (1080 × 1920 a 60 FPS, H.264/AAC).

```sh
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,avg_frame_rate,nb_frames -of json out/ari-labs-final.mp4
```

## Identidad visual y contenido

La [referencia original](https://share.descript.com/view/x4vGB2P3ve7) dura 44 s en la copia de Descript. En el original se observan una marca pequeña arriba a la izquierda, titulares grandes en el tercio inferior, tarjetas carbón con radios suaves y una silueta de teléfono para los momentos de chat. El fondo de agua se mantiene en movimiento y Ari Labs toma el centro en el cierre.

La composición conserva esa jerarquía. Adapta las cáusticas del shader de marca en `../../hielo.js` a un reloj por fotogramas. Una tarjeta cambia de proporciones para llevar de chat a configuración, tienda, agenda, pedidos y panel del encargado. El clic de aprobación precede al registro. El cierre presenta la nueva propuesta y el CTA por WhatsApp. Cada interfaz de ejemplo se marca como demo. Tanto las interfaces como las animaciones se dibujan en React, CSS, SVG y WebGL. El video original se usó como referencia visual.

## Fuentes y recursos

- Inter Tight Variable y JetBrains Mono se instalan localmente vía Fontsource. Ambas familias usan SIL Open Font License 1.1.
- El shader deriva del código de Ari Labs. La voz y las referencias vienen de los proyectos compartidos por Javi.
- [Encargo y seguimiento en Notion](https://app.notion.com/p/41eb0c836fe88195bc25cae49f926ec0).
