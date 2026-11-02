import type Phaser from 'phaser';
import { getSettings } from '../systems/Settings';

// Ponto de entrada do visual 3D. O Three.js só é baixado quando o jogador liga a opção,
// então quem joga em 2D não paga o peso extra.

export const render3dEnabled = () => getSettings().visual3d;

let loading: Promise<unknown> | undefined;

/** Carrega o renderizador 3D na primeira vez que a opção estiver ligada. Pode ser chamado sempre. */
export function syncRenderer3D(game: Phaser.Game) {
  if (!render3dEnabled() || loading) return;
  loading = import('./Renderer3D').then(({ Renderer3D }) => new Renderer3D(game));
}
