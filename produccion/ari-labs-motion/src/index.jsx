import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Ad} from './Ad';
import '@fontsource-variable/inter-tight';
import '@fontsource/jetbrains-mono/400.css';
import './style.css';

registerRoot(() => <Composition
  id="AriLabs"
  component={Ad}
  width={1080}
  height={1920}
  fps={60}
  durationInFrames={3000}
  defaultProps={{voice: 'voz-exportada.wav'}}
/>);
