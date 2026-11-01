import Phaser from 'phaser';

type Body = Phaser.Physics.Arcade.Body;

/** O que a fase oferece ao chefão. */
export interface BossHost {
  /** Íris toma dano vindo de x. */
  hurtPlayer(fromX: number): void;
  playerX(): number;
  playerBody(): Body;
  groundY: number;
  arenaW: number;
  burst(x: number, y: number, n: number): void;
  /** Empurrão horizontal sobre Íris (vento), em px/s; 0 desliga. */
  setWind(v: number): void;
  onBossHp(hp: number, max: number): void;
  onBossDefeated(): void;
}

/** Contrato comum dos chefões, usado pela cena da fase. */
export interface Boss {
  readonly name: string;
  readonly hit: Phaser.GameObjects.Zone;
  readonly view: Phaser.GameObjects.Sprite;
  readonly shots: Phaser.Physics.Arcade.Group;
  readonly body: Body;
  /** Pode levar dano agora. */
  readonly vulnerable: boolean;
  /** Encostar machuca Íris agora. */
  readonly dangerous: boolean;
  start(): void;
  update(dt: number): void;
  /** Íris acertou (golpe ou pisão). Devolve true se contou. */
  takeHit(): boolean;
}
