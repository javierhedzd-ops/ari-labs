import {mkdirSync, existsSync, renameSync, rmSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const mode = process.argv[2];
const voice = process.env.ARI_VOICE ?? 'voz-exportada.wav';
const browser = process.env.CHROME_PATH;
const destination = `out/ari-labs-${mode}.mp4`;
const video = `out/ari-labs-${mode}.video.mp4`;
const muxed = `out/ari-labs-${mode}.muxed.mp4`;

function run(command, args) {
  const result = spawnSync(command, args, {stdio:'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(`public/${voice}`)) {
  throw new Error(`Falta public/${voice}. Consulta README.md para preparar la voz.`);
}
mkdirSync('out', {recursive:true});

if (process.argv[3] !== '--mux-only') {
  run('remotion', [
    'render', 'src/index.jsx', 'AriLabs', video,
    '--codec=h264', '--gl=swangle', '--muted',
    `--concurrency=${process.env.ARI_CONCURRENCY ?? '50%'}`,
    ...(mode === 'preview' ? ['--scale=0.5','--every-nth-frame=2','--crf=22'] : ['--crf=18']),
    ...(browser ? [`--browser-executable=${browser}`] : []),
  ]);
}

run('ffmpeg', [
  '-nostdin', '-y', '-loglevel', 'error', '-i', video, '-i', `public/${voice}`,
  '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
  '-af', 'atrim=duration=46.26,adelay=500:all=1,apad=whole_dur=50',
  '-t', '50', '-movflags', '+faststart', muxed,
]);
renameSync(muxed, destination);
rmSync(video);
