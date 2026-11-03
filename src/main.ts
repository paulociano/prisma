import Phaser from 'phaser';
import { GAME_H, GAME_W, PHYS } from './config';
import { BootScene } from './scenes/BootScene';
import { CutsceneScene } from './scenes/CutsceneScene';
import { DialogueScene } from './scenes/DialogueScene';
import { PennantScene } from './scenes/PennantScene';
import { EndingScene } from './scenes/EndingScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { MapScene } from './scenes/MapScene';
import { OptionsScene } from './scenes/OptionsScene';
import { PauseScene } from './scenes/PauseScene';
import { TitleScene } from './scenes/TitleScene';
import { WorldMapScene } from './scenes/WorldMapScene';

const game = new Phaser.Game({
  type: Phaser.WEBGL, // o filtro de cor precisa de WebGL
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: '#120d1a',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: PHYS.gravity }, debug: false } },
  input: { gamepad: true },
  scene: [BootScene, TitleScene, MapScene, GameScene, HudScene, DialogueScene, PennantScene, PauseScene, EndingScene, CutsceneScene, OptionsScene, WorldMapScene],
});

// acesso para depuração no console do navegador (só em desenvolvimento)
if (import.meta.env.DEV) (window as unknown as { game: Phaser.Game }).game = game;
