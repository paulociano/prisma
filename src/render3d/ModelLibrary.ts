import type Phaser from 'phaser';
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { clipFor } from './models';

// Modelos .glb listados no manifest (npm run assets copia assets/models/). Cada um é baixado
// na primeira vez que um objeto precisa dele; até lá o renderizador usa a forma provisória.

interface ModelState {
  mixer: THREE.AnimationMixer;
  actions: Map<string, THREE.AnimationAction>;
  current?: string;
}

export class ModelLibrary {
  private readonly loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  private readonly loaded = new Map<string, GLTF>();
  private readonly pending = new Set<string>();
  private readonly failed = new Set<string>();
  private files?: Map<string, string>;

  constructor(private readonly game: Phaser.Game) {}

  /** Arquivos disponíveis; o manifest só existe depois que a BootScene o carrega. */
  private list() {
    if (this.files) return this.files;
    const manifest = this.game.cache.json.get('manifest') as { models?: { key: string; file: string }[] } | undefined;
    if (!manifest) return new Map<string, string>();
    this.files = new Map((manifest.models ?? []).map((m) => [m.key, m.file]));
    return this.files;
  }

  /** O jogo tem um modelo com esse nome (mesmo que ainda não baixado)? */
  has(key: string) {
    return this.list().has(key) && !this.failed.has(key);
  }

  isLoaded(key: string) {
    return this.loaded.has(key);
  }

  /**
   * Cópia do modelo encaixada no corpo de física (w × h em unidades): pés na base do corpo,
   * altura igual à do corpo, de frente para a direita. Undefined enquanto não baixou.
   */
  instantiate(key: string, h: number): THREE.Object3D | undefined {
    const gltf = this.loaded.get(key);
    if (!gltf) {
      this.load(key);
      return undefined;
    }
    const model = cloneSkinned(gltf.scene);
    // glTF olha para +Z; no jogo "frente" é +X (facing = 1)
    model.rotation.y = Math.PI / 2;
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const scale = size.y > 0 ? h / size.y : 1;
    model.scale.setScalar(scale);
    const center = box.getCenter(new THREE.Vector3());
    model.position.set(-center.x * scale, -h / 2 - box.min.y * scale, -center.z * scale);
    model.traverse((o) => (o.castShadow = o.receiveShadow = true));

    const wrapper = new THREE.Group();
    wrapper.add(model);
    const mixer = new THREE.AnimationMixer(model);
    const actions = new Map(gltf.animations.map((clip) => [clip.name, mixer.clipAction(clip)]));
    wrapper.userData.model = { mixer, actions } satisfies ModelState;
    wrapper.userData.shared = true; // geometria e materiais são do modelo em cache: não liberar
    return wrapper;
  }

  /** Avança a animação do objeto e troca de clipe (com transição) quando o 2D muda de estado. */
  animate(obj: THREE.Object3D, anim: string | undefined, dt: number) {
    const state = obj.userData.model as ModelState | undefined;
    if (!state) return;
    const clip = clipFor(anim, [...state.actions.keys()]);
    if (clip && clip !== state.current) {
      const next = state.actions.get(clip)!;
      const prev = state.current ? state.actions.get(state.current) : undefined;
      next.reset().play();
      if (prev) next.crossFadeFrom(prev, 0.15, false);
      state.current = clip;
    }
    state.mixer.update(dt);
  }

  /** Para as animações de um objeto que vai sair de cena. */
  release(obj: THREE.Object3D) {
    const state = obj.userData.model as ModelState | undefined;
    state?.mixer.stopAllAction();
    state?.mixer.uncacheRoot(state.mixer.getRoot());
  }

  private load(key: string) {
    const file = this.list().get(key);
    if (!file || this.pending.has(key) || this.failed.has(key)) return;
    this.pending.add(key);
    this.loader.load(
      `assets/${file}`,
      (gltf) => {
        this.pending.delete(key);
        this.loaded.set(key, gltf);
      },
      undefined,
      (err) => {
        // modelo quebrado não derruba o jogo: o objeto continua com a forma provisória
        this.pending.delete(key);
        this.failed.add(key);
        console.warn(`[3D] não deu para carregar o modelo "${key}" (${file})`, err);
      },
    );
  }
}
