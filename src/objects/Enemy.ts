import Phaser from 'phaser';
import { F, has } from '../gfx/art';
import { texRes } from '../gfx/textures';

type Body = Phaser.Physics.Arcade.Body;

export type EnemyKind = 'blot' | 'moth' | 'megaphone' | 'padlock' | 'beetle' | 'scorpion' | 'drone' | 'snapper' | 'puffer' | 'comet' | 'sentinel';

// Arte de cada tipo: atlas próprio (frames 0-3 movimento, 4 dano, 5 restaurado)
// ou, na falta dele, a ficha "faded" (0-3 cinzas, 4-7 restaurados).
const ART: Record<EnemyKind, { tex: string; fallback: number }> = {
  blot: { tex: 'blot', fallback: 0 },
  moth: { tex: 'moth', fallback: 1 },
  megaphone: { tex: 'megaphone', fallback: 2 },
  padlock: { tex: 'padlock', fallback: 3 },
  beetle: { tex: 'w1_enemy', fallback: 0 },
  scorpion: { tex: 'w2_enemy', fallback: 0 },
  drone: { tex: 'w3_enemy', fallback: 1 },
  snapper: { tex: 'w4_enemy', fallback: 0 },
  puffer: { tex: 'w5_enemy', fallback: 0 },
  comet: { tex: 'w6_enemy', fallback: 1 },
  sentinel: { tex: 'w7_enemy', fallback: 3 },
};
const SIZE: Record<EnemyKind, [number, number]> = {
  blot: [64, 44],
  moth: [56, 44],
  megaphone: [52, 52],
  padlock: [52, 66],
  beetle: [60, 50],
  scorpion: [62, 44],
  drone: [60, 46],
  snapper: [56, 70],
  puffer: [58, 54],
  comet: [62, 44],
  sentinel: [54, 70],
};

/** Tipos que flutuam (sem gravidade) e são desenhados centrados no corpo. */
const FLOATERS = new Set<EnemyKind>(['moth', 'drone', 'puffer', 'comet']);

export interface EnemyHost {
  isSolidAt(x: number, y: number): boolean;
  enemyShoot(e: Enemy, dir: number): void;
  playerX(): number;
  playerY(): number;
}

// Os Desbotados. Ao serem atingidos não morrem: recuperam a cor e ficam felizes.
export class Enemy {
  /** Multiplicador de velocidade de caminhada (dificuldade e mundo); a cena define ao montar a fase. */
  static speedScale = 1;

  readonly hit: Phaser.Physics.Arcade.Sprite;
  readonly view: Phaser.GameObjects.Sprite;
  restored = false;

  private dir = -1;
  /** Para onde o inimigo olha (1 = direita), lido pelo visual 3D. */
  get facing() {
    return this.dir;
  }
  private t = Math.random() * 10;
  private anchor: Phaser.Math.Vector2;
  private shootTimer = 1.5;
  private hopTimer = 1;
  private baseScale: number;
  private drawn: boolean;
  private tex: string;

  constructor(
    private scene: Phaser.Scene,
    private host: EnemyHost,
    readonly kind: EnemyKind,
    x: number,
    y: number,
  ) {
    const [w, h] = SIZE[kind];
    this.hit = scene.physics.add.sprite(x, y - h / 2, 'pixel').setVisible(false);
    this.body.setSize(w, h);
    if (FLOATERS.has(kind)) this.body.setAllowGravity(false);
    this.anchor = new Phaser.Math.Vector2(x, y - h / 2);

    this.drawn = has(scene, ART[kind].tex);
    this.tex = this.drawn ? ART[kind].tex : 'faded';
    this.baseScale = 1 / texRes(scene, this.tex);
    this.view = scene.add.sprite(x, y, this.tex, this.drawn ? 0 : ART[kind].fallback).setOrigin(0.5, 1).setScale(this.baseScale).setDepth(8);
    if (this.drawn) {
      // começa num frame aleatório para os inimigos não andarem em sincronia
      const frames = scene.anims.get(`${kind}-move`)?.frames.length ?? 1;
      this.view.play({ key: `${kind}-move`, startFrame: Phaser.Math.Between(0, frames - 1) });
    }
  }

  get body() {
    return this.hit.body as Body;
  }

  /** Só dá para restaurar o cadeado pisando nele; de lado, ele bloqueia o golpe. */
  get armoredFront() {
    // o Sentinela só bloqueia quem está à frente do escudo; pelas costas ele é vulnerável
    const sentinelFront = this.kind === 'sentinel' && Math.sign(this.host.playerX() - this.hit.x) === this.dir;
    return this.kind === 'padlock' || this.spiky || sentinelFront;
  }

  // Escorpião: anda → cava → corre enterrado atrás de Íris → emerge.
  private dig: 'walk' | 'dig' | 'under' | 'emerge' = 'walk';
  private digT = 2;

  /** Enterrado, o escorpião não machuca nem pode ser atingido. */
  get exposed() {
    return this.kind !== 'scorpion' || this.dig === 'walk' || this.dig === 'emerge';
  }

  private scorpion(dt: number) {
    const b = this.body;
    this.digT -= dt;
    const frame = (f: number) => {
      if (!this.drawn) return;
      this.view.anims.stop();
      this.view.setFrame(String(f));
    };
    switch (this.dig) {
      case 'walk':
        this.walk(65);
        if (this.digT <= 0 && b.blocked.down) {
          this.dig = 'dig';
          this.digT = 0.45;
          b.setVelocityX(0);
          frame(1);
        }
        break;
      case 'dig':
        b.setVelocityX(0);
        if (this.digT <= 0) {
          this.dig = 'under';
          this.digT = 1.6;
          frame(2);
        }
        break;
      case 'under': {
        // montinho de areia que persegue Íris (sem passar da beira)
        this.dir = this.host.playerX() < this.hit.x ? -1 : 1;
        const aheadX = this.hit.x + this.dir * (b.width / 2 + 6);
        b.setVelocityX(this.host.isSolidAt(aheadX, b.bottom + 8) && Math.abs(this.host.playerX() - this.hit.x) > 8 ? this.dir * 150 : 0);
        if (this.digT <= 0) {
          this.dig = 'emerge';
          this.digT = 0.4;
          b.setVelocity(0, -300);
          frame(3);
        }
        break;
      }
      case 'emerge':
        if (this.digT <= 0) {
          this.dig = 'walk';
          this.digT = 2.2;
          if (this.drawn) this.view.play('scorpion-move');
        }
        break;
    }
  }

  update(dt: number) {
    this.t += dt;
    const b = this.body;

    if (this.restored) {
      const flyer = FLOATERS.has(this.kind);
      if (b.blocked.down && !flyer && this.kind !== 'snapper') b.setVelocityY(-260); // pulinhos de alegria
      if (flyer) this.hit.y = this.anchor.y + Math.sin(this.t * 2) * 10;
      b.setVelocityX(0);
    } else {
      switch (this.kind) {
        case 'blot':
          this.walk(70);
          break;
        case 'beetle':
          this.walk(95);
          break;
        case 'sentinel':
          this.walk(50);
          break;
        case 'scorpion':
          this.scorpion(dt);
          break;
        case 'drone':
          this.drone(dt);
          break;
        case 'puffer':
          this.puffer(dt);
          break;
        case 'comet':
          this.comet(dt);
          break;
        case 'snapper':
          this.snapper(dt);
          break;
        case 'padlock':
          this.walk(40);
          break;
        case 'moth':
          this.hit.x = this.anchor.x + Math.sin(this.t * 1.1) * 130;
          this.hit.y = this.anchor.y + Math.sin(this.t * 2.6) * 34;
          this.dir = Math.cos(this.t * 1.1) >= 0 ? 1 : -1;
          break;
        case 'megaphone':
          this.dir = this.host.playerX() < this.hit.x ? -1 : 1;
          this.hopTimer -= dt;
          if (this.hopTimer <= 0 && b.blocked.down) {
            b.setVelocityY(-380);
            this.hopTimer = 1.6;
          }
          this.shootTimer -= dt;
          if (this.shootTimer <= 0 && Math.abs(this.host.playerX() - this.hit.x) < 640) {
            this.host.enemyShoot(this, this.dir);
            this.shootTimer = 2.4;
          }
          break;
      }
    }

    if (this.kind === 'drone' || this.kind === 'puffer' || this.kind === 'comet') {
      // drone: arte centrada no corpo, inclina um pouco ao mergulhar
      this.view.setOrigin(0.5, 0.42).setPosition(this.hit.x, this.hit.y).setScale(this.baseScale).setFlipX(this.dir < 0);
      this.view.setAngle(this.kind === 'drone' && this.droneState === 'dive' ? this.dir * 14 : 0);
      return;
    }
    const bottom = this.kind === 'moth' ? this.hit.y + b.height / 2 : b.bottom;
    // a arte desenhada já se move; o "respirar" procedural só entra na arte provisória
    const wobble = this.restored || this.drawn ? 1 : 1 + Math.sin(this.t * 8) * 0.04;
    this.view.setPosition(this.hit.x, bottom + (this.kind === 'moth' ? 6 : 3));
    this.view.setScale(this.baseScale * (2 - wobble), this.baseScale * wobble);
    this.view.setFlipX(this.dir < 0);
  }

  // Drone vigia: patrulha no ar; se Íris passa embaixo, acende o feixe, mira e mergulha.
  droneState: 'patrol' | 'spot' | 'dive' | 'return' = 'patrol';
  private droneT = 0;

  private drone(dt: number) {
    const b = this.body;
    this.droneT -= dt;
    const px = this.host.playerX(), py = this.host.playerY();
    const frame = (f: number) => {
      if (!this.drawn) return;
      this.view.anims.stop();
      this.view.setFrame(String(f));
    };
    switch (this.droneState) {
      case 'patrol':
        this.hit.x = this.anchor.x + Math.sin(this.t * 0.9) * 150;
        this.hit.y = this.anchor.y + Math.sin(this.t * 2.2) * 8;
        this.dir = Math.cos(this.t * 0.9) >= 0 ? 1 : -1;
        b.setVelocity(0, 0);
        if (Math.abs(px - this.hit.x) < 70 && py > this.hit.y && py - this.hit.y < 380) {
          this.droneState = 'spot';
          this.droneT = 0.45; // aviso: feixe aceso antes do mergulho
          frame(3);
        }
        break;
      case 'spot':
        b.setVelocity(0, 0);
        if (this.droneT <= 0) {
          this.droneState = 'dive';
          this.droneT = 0.7;
          const a = Math.atan2(py - this.hit.y, px - this.hit.x);
          b.setVelocity(Math.cos(a) * 420, Math.sin(a) * 420);
          this.dir = Math.cos(a) >= 0 ? 1 : -1;
          frame(2);
        }
        break;
      case 'dive':
        if (this.droneT <= 0 || b.blocked.down || b.blocked.left || b.blocked.right) {
          this.droneState = 'return';
          this.droneT = 1.2;
        }
        break;
      case 'return': {
        // volta subindo para a rota de patrulha
        const tx = this.anchor.x + Math.sin(this.t * 0.9) * 150;
        const k = Math.min(1, dt * 3);
        b.setVelocity(0, 0);
        this.hit.x += (tx - this.hit.x) * k;
        this.hit.y += (this.anchor.y - this.hit.y) * k;
        if (this.droneT <= 0) {
          this.droneState = 'patrol';
          if (this.drawn) this.view.play('drone-move');
        }
        break;
      }
    }
  }

  // Planta mordedora: fica parada; se Íris chega perto, abre a boca e dá um bote.
  private snapT = 0;
  private biting = false;
  private lunging = false;

  private snapper(dt: number) {
    const b = this.body;
    b.setVelocityX(0);
    this.snapT -= dt;
    const dx = this.host.playerX() - this.hit.x;
    if (!this.biting && this.snapT <= 0 && Math.abs(dx) < 170 && Math.abs(this.host.playerY() - this.hit.y) < 110) {
      this.dir = dx < 0 ? -1 : 1;
      this.biting = true;
      this.snapT = 0.35; // boca abrindo: dá tempo de reagir
      if (this.drawn) {
        this.view.anims.stop();
        this.view.setFrame('2');
      }
    } else if (this.biting && this.snapT <= 0 && !this.lunging) {
      // bote: a planta avança na direção de Íris
      this.lunging = true;
      this.hit.x = this.anchor.x + this.dir * 48;
      if (this.drawn) this.view.setFrame('3');
      this.snapT = 0.3;
    } else if (this.biting && this.snapT <= 0) {
      this.lunging = false;
      this.hit.x = this.anchor.x;
      this.biting = false;
      this.snapT = 1.1;
      if (this.drawn) this.view.play('snapper-move');
    }
  }

  // Baiacu: boia no lugar; se Íris chega perto, incha cheio de espinhos por um tempo.
  private puffT = 0;
  private puffState: 'calm' | 'puffed' | 'cool' = 'calm';

  /** Inchado, o baiacu machuca até quem pisa e bloqueia golpes e disparos. */
  get spiky() {
    return this.kind === 'puffer' && this.puffState === 'puffed' && !this.restored;
  }

  private puffer(dt: number) {
    this.body.setVelocity(0, 0);
    this.hit.x = this.anchor.x + Math.sin(this.t * 0.8) * 20;
    this.hit.y = this.anchor.y + Math.sin(this.t * 1.7) * 12;
    this.dir = this.host.playerX() < this.hit.x ? -1 : 1;
    this.puffT -= dt;
    const near = Math.hypot(this.host.playerX() - this.hit.x, this.host.playerY() - this.hit.y) < 170;
    const frame = (f: number) => this.drawn && this.view.setFrame(String(f));
    if (this.puffState === 'calm' && near && this.puffT <= 0) {
      this.puffState = 'puffed';
      this.puffT = 1.5;
      frame(1);
      this.scene.time.delayedCall(120, () => this.puffState === 'puffed' && frame(2));
      this.body.setSize(82, 78);
    } else if (this.puffState === 'puffed' && this.puffT <= 0) {
      this.puffState = 'cool';
      this.puffT = 1.2; // murcho: hora de atacar
      this.body.setSize(58, 54);
      frame(3);
    } else if (this.puffState === 'cool' && this.puffT <= 0) {
      this.puffState = 'calm';
      this.puffT = 0.4;
      frame(0);
    }
  }

  // Cometa de sombra: risca o céu de um lado ao outro da sua faixa, com pausa nas pontas.
  private cometPause = 0;

  private comet(dt: number) {
    const b = this.body;
    const range = 4 * 64;
    if (this.cometPause > 0) {
      this.cometPause -= dt;
      b.setVelocity(0, 0);
      return;
    }
    b.setVelocity(this.dir * 300, 0);
    this.hit.y = this.anchor.y + Math.sin(this.t * 3) * 6;
    if ((this.dir > 0 && this.hit.x > this.anchor.x + range) || (this.dir < 0 && this.hit.x < this.anchor.x - range)) {
      this.dir *= -1;
      this.cometPause = 0.6;
    }
  }

  private walk(speed: number) {
    const b = this.body;
    if (b.blocked.left) this.dir = 1;
    else if (b.blocked.right) this.dir = -1;
    else if (b.blocked.down) {
      // vira na beira da plataforma
      const aheadX = this.hit.x + this.dir * (b.width / 2 + 6);
      if (!this.host.isSolidAt(aheadX, b.bottom + 8)) this.dir *= -1;
    }
    b.setVelocityX(this.dir * speed * Enemy.speedScale);
  }

  /** Devolve true só se o inimigo foi restaurado agora (enterrado ou já restaurado: false). */
  restore(): boolean {
    if (this.restored || !this.exposed) return false;
    this.restored = true;
    this.body.setVelocity(0, -420);
    this.anchor.set(this.hit.x, this.hit.y - 40);
    if (this.drawn) {
      // frame de impacto rapidinho, depois a forma colorida
      this.view.anims.stop();
      this.view.setFrame(String(F.enemy.hit));
      this.scene.time.delayedCall(140, () => this.view.setFrame(String(F.enemy.restored)));
    } else this.view.setFrame(ART[this.kind].fallback + 4);
    this.scene.tweens.add({ targets: this.view, angle: { from: -15, to: 0 }, duration: 500, ease: 'Back.Out' });
    return true;
  }
}
