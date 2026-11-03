import Phaser from 'phaser';
import { GAME_H, GAME_W, PHYS } from './config';
import { BootScene } from './scenes/BootScene';
import { CutsceneScene } from './scenes/CutsceneScene';
import { DialogueScene } from './scenes/DialogueScene';
import { PennantScene } from './scenes/PennantScene';
import { PennantGalleryScene } from './scenes/PennantGalleryScene';
import { EndingScene } from './scenes/EndingScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { MapScene } from './scenes/MapScene';
import { OptionsScene } from './scenes/OptionsScene';
import { PauseScene } from './scenes/PauseScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldMapScene } from './scenes/WorldMapScene';

// Sem WebGL o jogo não roda (o filtro de cor depende dele): mostra um aviso em vez de uma tela preta.
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
if (!hasWebGL()) {
  const box = document.getElementById('game');
  if (box) box.innerHTML = '<p style="color:#e9dcff;font:20px/1.5 sans-serif;text-align:center;padding:12vh 24px">PRISMA precisa de aceleração gráfica (WebGL).<br>Ative a aceleração por hardware no navegador ou tente outro navegador atualizado.</p>';
  throw new Error('WebGL indisponível');
}

const game = new Phaser.Game({
  type: Phaser.WEBGL, // o filtro de cor precisa de WebGL
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#120d1a',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: PHYS.gravity }, debug: false } },
  input: { gamepad: true },
  scene: [BootScene, TitleScene, MapScene, GameScene, HudScene, DialogueScene, PennantScene, PennantGalleryScene, PauseScene, EndingScene, CutsceneScene, OptionsScene, WorldMapScene],
});

// acesso para depuração no console do navegador (só em desenvolvimento)
if (import.meta.env.DEV || location.search.includes('debug')) (window as unknown as { game: Phaser.Game }).game = game;

// Erro inesperado em produção: mostra um aviso amigável (o progresso já está salvo no navegador).
if (!import.meta.env.DEV) {
  const fatal = () => {
    const box = document.getElementById('fatal');
    if (box) box.style.display = 'flex';
  };
  window.addEventListener('error', fatal);
  window.addEventListener('unhandledrejection', fatal);
}
