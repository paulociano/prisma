import type Phaser from 'phaser';
import * as THREE from 'three';
import { TILE } from '../config';
import { T, type LevelData } from '../levels/LevelBuilder';
import { toUnits, type EntityView, type SpriteView } from './snapshot';

// Personagens continuam 2D dentro do cenário 3D (estilo "HD-2D"): cada objeto vira uma placa
// com o quadro que o Phaser está desenhando agora, então as animações vêm prontas do 2D.

/** Profundidade de cada tipo no corredor do jogo (o chão vai de z -1,5 a +1,5). */
const LAYER_Z: Partial<Record<EntityView['kind'], number>> = {
  decor: -0.95, // em pé no fundo do chão, atrás do caminho
  prop: -0.25,
  cage: -0.1,
  boss: 0,
  enemy: 0.1,
  pickup: 0.1,
  player: 0.2,
  shot: 0.3,
  spark: 0.6, // Faísca voa um pouco à frente de Íris
};
/** Tipos que ganham sombra no chão. */
const SHADOW_KINDS = new Set<EntityView['kind']>(['player', 'enemy', 'boss', 'cage', 'spark']);

export class SpriteBoards {
  private readonly sources = new Map<object, THREE.Texture>();
  private readonly shadowGeo = new THREE.CircleGeometry(0.5, 24).rotateX(-Math.PI / 2);

  constructor(private readonly game: Phaser.Game) {}

  create(): THREE.Mesh {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0], 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(8).fill(0), 2));
    geo.setIndex([0, 2, 1, 2, 3, 1]);
    const mat = new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, alphaTest: 0.01, side: THREE.DoubleSide, fog: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.board = true;
    return mesh;
  }

  /**
   * Copia o quadro atual do 2D para a placa. As placas ficam paradas, de frente para +Z, como
   * recortes de um diorama: girar para a câmera fazia props e portal entortarem com o movimento.
   */
  update(mesh: THREE.Mesh, kind: EntityView['kind'], s: SpriteView) {
    this.place(mesh, s, LAYER_Z[kind] ?? 0);
  }

  /** Posiciona a placa com o quadro dado na profundidade z. */
  place(mesh: THREE.Mesh, s: SpriteView, z: number) {
    const frame = this.game.textures.getFrame(s.key, s.frame);
    if (!frame) return;
    const mat = mesh.material as THREE.MeshBasicMaterial;
    const tex = this.sourceTexture(frame);
    if (mat.map !== tex) {
      mat.map = tex;
      mat.needsUpdate = true;
    }
    mat.opacity = s.alpha;

    // recorte do atlas (o quadro pode ter sido aparado: só a parte com pixels vai para a placa)
    const key = `${s.key}|${s.frame}|${s.flipX}|${s.flipY}`;
    if (mesh.userData.frameKey !== key) {
      mesh.userData.frameKey = key;
      const sw = frame.source.width, sh = frame.source.height;
      let u0 = frame.cutX / sw, u1 = (frame.cutX + frame.cutWidth) / sw;
      let vTop = 1 - frame.cutY / sh, vBot = 1 - (frame.cutY + frame.cutHeight) / sh;
      if (s.flipX) [u0, u1] = [u1, u0];
      if (s.flipY) [vTop, vBot] = [vBot, vTop];
      const uv = mesh.geometry.getAttribute('uv') as THREE.BufferAttribute;
      uv.set([u0, vTop, u1, vTop, u0, vBot, u1, vBot]);
      uv.needsUpdate = true;
    }

    // tamanho e centro da parte com pixels, a partir do centro do quadro inteiro
    const scale = s.w / frame.realWidth;
    let ox = (frame.x + frame.cutWidth / 2 - frame.realWidth / 2) * scale;
    let oy = (frame.y + frame.cutHeight / 2 - frame.realHeight / 2) * scale;
    if (s.flipX) ox = -ox;
    if (s.flipY) oy = -oy;
    const cos = Math.cos(s.angle), sin = Math.sin(s.angle);
    const px = s.x + ox * cos - oy * sin;
    const py = s.y + ox * sin + oy * cos;
    mesh.position.set(toUnits(px), -toUnits(py), z);
    mesh.scale.set(toUnits(frame.cutWidth * scale), toUnits(frame.cutHeight * scale), 1);
    mesh.rotation.z = -s.angle;
    mesh.renderOrder = 20 + s.depth;
  }

  /** Sombra suave no chão sob o objeto; some quando ele está longe do chão ou no ar sem chão. */
  createShadow(): THREE.Mesh {
    const m = new THREE.Mesh(this.shadowGeo, new THREE.MeshBasicMaterial({ color: 0x140a20, transparent: true, depthWrite: false, fog: false }));
    m.renderOrder = 15;
    return m;
  }

  hasShadow(kind: EntityView['kind']) {
    return SHADOW_KINDS.has(kind);
  }

  updateShadow(shadow: THREE.Mesh, e: EntityView, level: LevelData) {
    const feet = e.y + e.h / 2;
    const top = groundBelow(level, e.x, feet);
    const height = top === undefined ? Infinity : Math.max(0, toUnits(top - feet));
    const fade = Math.min(1, Math.max(0, 1 - height / 4));
    shadow.visible = (e.visible ?? true) && fade > 0;
    if (!shadow.visible) return;
    (shadow.material as THREE.MeshBasicMaterial).opacity = 0.38 * fade;
    const size = toUnits(e.w) * (1.3 - 0.1 * Math.min(height, 3));
    shadow.scale.set(size, 1, size * 0.6);
    shadow.position.set(toUnits(e.x), -toUnits(top!) + 0.015, LAYER_Z[e.kind] ?? 0);
  }

  /** Mesma imagem do Phaser, sem baixar de novo (uma textura por imagem de atlas). */
  private sourceTexture(frame: Phaser.Textures.Frame) {
    let tex = this.sources.get(frame.source);
    if (!tex) {
      tex = new THREE.Texture(frame.source.image as HTMLImageElement);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      this.sources.set(frame.source, tex);
    }
    return tex;
  }
}

/** Topo do primeiro chão (sólido ou atravessável) abaixo de um ponto, em px; undefined se for buraco. */
function groundBelow(level: LevelData, x: number, y: number): number | undefined {
  const c = Math.floor(x / TILE);
  if (c < 0 || c >= level.cols) return undefined;
  for (let r = Math.max(0, Math.floor(y / TILE)); r < level.rows; r++) {
    const t = level.tiles[r][c];
    if (t === T.Solid || t === T.OneWay) return r * TILE;
  }
  return undefined;
}
