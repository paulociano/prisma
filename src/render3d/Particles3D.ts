import type Phaser from 'phaser';
import * as THREE from 'three';
import { toUnits, type ParticleView } from './snapshot';

// Partículas do 2D (vapor dos gêiseres, brilhos, bolhas, poeira) desenhadas no 3D. O Phaser
// continua simulando; aqui cada imagem de partícula vira um InstancedMesh de quadradinhos
// voltados para a câmera, um pouco à frente do caminho.

const MAX = 400; // por imagem de partícula
const Z = 0.35;

interface Layer {
  mesh: THREE.InstancedMesh;
  used: number;
}

export class Particles3D {
  readonly root = new THREE.Group();
  private readonly layers = new Map<string, Layer>();
  private readonly m = new THREE.Matrix4();
  private readonly color = new THREE.Color();
  private readonly q = new THREE.Quaternion();
  private readonly pos = new THREE.Vector3();
  private readonly scale = new THREE.Vector3();

  constructor(private readonly game: Phaser.Game) {}

  sync(list: ParticleView[]) {
    for (const l of this.layers.values()) l.used = 0;
    for (const p of list) {
      const layer = this.layer(p);
      if (!layer || layer.used >= MAX) continue;
      const s = toUnits(p.size);
      this.pos.set(toUnits(p.x), -toUnits(p.y), Z);
      this.scale.set(s, s, 1);
      this.m.compose(this.pos, this.q, this.scale);
      layer.mesh.setMatrixAt(layer.used, this.m);
      // a transparência vai na cor: com mistura aditiva, cor * alpha some do mesmo jeito que no 2D
      this.color.setHex(p.tint).multiplyScalar(p.alpha);
      layer.mesh.setColorAt(layer.used, this.color);
      layer.used++;
    }
    for (const l of this.layers.values()) {
      l.mesh.count = l.used;
      l.mesh.instanceMatrix.needsUpdate = true;
      if (l.mesh.instanceColor) l.mesh.instanceColor.needsUpdate = true;
    }
  }

  /** Remove as partículas da fase anterior (as camadas e texturas ficam para reaproveitar). */
  clear() {
    for (const l of this.layers.values()) l.mesh.count = 0;
  }

  private layer(p: ParticleView): Layer | undefined {
    const id = `${p.key}|${p.frame}`;
    const cached = this.layers.get(id);
    if (cached) return cached;
    const frame = this.game.textures.getFrame(p.key, p.frame);
    if (!frame) return undefined;
    const tex = new THREE.Texture(frame.source.image as HTMLImageElement);
    tex.colorSpace = THREE.SRGBColorSpace;
    // recorta o quadro do atlas pela própria textura
    tex.repeat.set(frame.cutWidth / frame.source.width, frame.cutHeight / frame.source.height);
    tex.offset.set(frame.cutX / frame.source.width, 1 - (frame.cutY + frame.cutHeight) / frame.source.height);
    tex.needsUpdate = true;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, MAX);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.count = 0;
    mesh.frustumCulled = false; // as instâncias mudam de lugar a cada quadro
    mesh.renderOrder = 40;
    this.root.add(mesh);
    const layer = { mesh, used: 0 };
    this.layers.set(id, layer);
    return layer;
  }
}
