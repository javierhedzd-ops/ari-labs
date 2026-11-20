import {mkdirSync, existsSync} from 'node:fs';
import {spawnSync} from 'node:child_process';

const mode = process.argv[2];
const voice = process.env.ARI_VOICE ?? 'voz-exportada.wav';
const browser = process.env.CHROME_PATH;
if (!existsSync(`public/${voice}`)) {
  throw new Error(`Falta public/${voice}. Consulta README.md para preparar la voz.`);
}
mkdirSync('out', {recursive:true});
const preview = mode === 'preview';
const result = spawnSync('remotion', [
  'render', 'src/index.jsx', 'AriLabs', `out/ari-labs-${mode}.mp4`,
  '--codec=h264', '--audio-codec=aac', '--gl=swangle', `--concurrency=${process.env.ARI_CONCURRENCY ?? '50%'}`,
  `--props=${JSON.stringify({voice})}`,
  ...(preview ? ['--scale=0.5','--every-nth-frame=2','--crf=22'] : ['--crf=18']),
  ...(browser ? [`--browser-executable=${browser}`] : []),
], {stdio:'inherit'});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
