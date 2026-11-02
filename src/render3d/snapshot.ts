// Contrato entre a simulação (GameScene, em Phaser) e a visualização 3D.
// A cena publica um retrato do mundo a cada quadro; o renderizador 3D só lê esse retrato
// e nunca mexe na física. Este arquivo é puro (sem Phaser nem Three) para ser testável.
import { GAME_H, TILE } from '../config';
import type { LevelData } from '../levels/LevelBuilder';

export type EntityKind = 'player' | 'spark' | 'enemy' | 'boss' | 'pickup' | 'crate' | 'cracked' | 'shot' | 'mover' | 'cage' | 'prop';

export interface EntityView {
  /** Identidade estável enquanto o objeto existir (o próprio objeto do Phaser). */
  id: object;
  kind: EntityKind;
  /** Centro, em px do mundo 2D. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Subtipo: tipo de inimigo, objeto de fase (checkpoint, saída...) ou quadro do coletável. */
  variant?: string;
  /** 1 = olhando para a direita, -1 = para a esquerda. */
  facing?: number;
  /** Visível neste quadro (ex.: piscar de invulnerabilidade). */
  visible?: boolean;
}

/** Texto preso ao mundo: dica em balão ou aviso sobre o chefão. */
export interface LabelView {
  id: object;
  style: 'hint' | 'marker';
  text: string;
  /** Centro, em px do mundo 2D. */
  x: number;
  y: number;
  alpha: number;
  scale: number;
  /** Cor do texto (avisos). */
  color?: string;
}

/** Cor que cobre a tela inteira (fade e flash da câmera 2D). */
export interface ScreenTint {
  r: number;
  g: number;
  b: number;
  alpha: number;
}

export interface WorldSnapshot {
  level: LevelData;
  /** Centro da câmera 2D, em px do mundo. */
  camX: number;
  camY: number;
  entities: EntityView[];
  labels: LabelView[];
  tint?: ScreenTint;
}

/** 1 bloco de 64 px = 1 unidade 3D; o eixo Y do Phaser cresce para baixo, o do 3D para cima. */
export const toUnits = (px: number) => px / TILE;
export const toWorld = (x: number, y: number) => ({ x: x / TILE, y: -y / TILE });

/** Altura de mundo visível no plano de jogo, igual à do 2D (11,25 blocos). */
export const PLANE_H = GAME_H / TILE;

/**
 * Câmera "Ampla" (escolhida no protótipo): FOV 55, um pouco acima do alvo e mirando
 * abaixo do centro, para a frente dos blocos não sair do quadro.
 */
export const CAMERA = { fov: 55, lift: 1.5, aim: -0.8 };

/** Posição e alvo da câmera 3D para um centro de câmera 2D (em px). */
export function cameraPose(camX: number, camY: number, cam = CAMERA) {
  const { x, y } = toWorld(camX, camY);
  // distância em que o plano z = 0 mostra a mesma altura de mundo que o 2D
  const dist = PLANE_H / 2 / Math.tan(((cam.fov / 2) * Math.PI) / 180);
  return {
    position: { x, y: y + cam.lift, z: dist },
    target: { x, y: y + cam.aim, z: 0 },
  };
}
