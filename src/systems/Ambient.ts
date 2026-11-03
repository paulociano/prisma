import Phaser from 'phaser';
import { GAME_H, GAME_W } from '../config';
import { ensureFxTextures } from '../gfx/fx';
import { canFlashScreen, getSettings } from './Settings';

// Efeitos ambientes em movimento: água, cachoeiras, névoa, fumaça, brilhos, folhas, bolhas…
// Tudo é desenhado em espaço de tela, por cima da arte (mapas) ou entre o fundo e a fase (jogo),
// sem arquivos novos: as texturas nascem em `gfx/fx.ts`. A opção "Reduzir movimento" desliga tudo.
//
// Os efeitos têm dois temperamentos, ligados à cor devolvida ao mundo (ColorRestore):
//  - 'haze' (neblina, fumaça): fica mais carregado enquanto o mundo está desbotado e afina com a cor;
//  - 'life' (vaga-lumes, folhas, bolhas, brilhos): cresce com a cor, o mundo volta a "respirar";
//  - 'fixed': não depende da cor (luz do sol, estrelas).

type Container = Phaser.GameObjects.Container;
type Emitter = Phaser.GameObjects.Particles.ParticleEmitter;
type Particle = Phaser.GameObjects.Particles.Particle;
type EmitterConfig = Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;

export type Kind = 'haze' | 'life' | 'fixed';
export interface Box { x: number; y: number; w: number; h: number }
type Pair = [number, number];

/** Opções comuns a todo efeito. */
export interface Opt {
  kind?: Kind;
  depth?: number;
  /** Coloca o efeito dentro de um contêiner (ex.: o fundo, que perde a cor junto com a arte). */
  into?: Container;
  alpha?: number;
  tint?: number;
  /** Phaser.BlendModes: ADD para luz, NORMAL (padrão) para névoa/fumaça. */
  blend?: number;
}

type Tick = (dt: number, dCam: number, t: number) => void;

const { FloatBetween: rnd, Between: int } = Phaser.Math;
const ADD = Phaser.BlendModes.ADD;
const zone = (b: Box) => ({ type: 'random', source: new Phaser.Geom.Rectangle(b.x, b.y, b.w, b.h) }) as Phaser.Types.GameObjects.Particles.EmitZoneData;
/**
 * Tamanho da imagem repetida de uma camada de paralaxe (imagem + cópia espelhada). O TileSprite troca
 * a textura por uma interna do tamanho da tela, então a largura real vem de `setData('period', …)`.
 */
function period(layer: Phaser.GameObjects.TileSprite) {
  return { P: (layer.getData('period') as number | undefined) ?? layer.frame.width, H: (layer.getData('height') as number | undefined) ?? layer.frame.height };
}
const range = (v: number | Pair): Pair => (typeof v === 'number' ? [v, v] : v);

export class Ambient {
  /** Falso quando o jogador pediu "Reduzir movimento": nenhum efeito é criado. */
  readonly on: boolean;
  private layers = new Map<string, Container>();
  private hazeLayers: Container[] = [];
  private lifeLayers: Container[] = [];
  private emitters: { e: Emitter; kind: Kind; base: number }[] = [];
  private ticks: Tick[] = [];
  private color = -1;
  private camX?: number;
  private t = 0;

  /** `baseDepth`: profundidade usada quando o efeito não pede uma (mapas: logo acima da arte). */
  constructor(readonly scene: Phaser.Scene, private baseDepth = 1) {
    this.on = !getSettings().reduceMotion;
    if (this.on) ensureFxTextures(scene);
  }

  // ---------- ciclo de vida ----------

  /** Chame a cada quadro. `camX` (rolagem da câmera) move os efeitos que têm paralaxe. */
  update(dt: number, camX = 0, color = 1) {
    if (!this.on) return;
    const d = this.camX === undefined ? 0 : camX - this.camX;
    this.camX = camX;
    this.t += dt;
    for (const f of this.ticks) f(dt, d, this.t);
    if (Math.abs(color - this.color) > 0.004) this.setColor(color);
  }

  /** `v` de 0 (mundo cinza) a 1 (cores de volta). */
  setColor(v: number) {
    this.color = v;
    const haze = 1 - 0.45 * v, life = 0.3 + 0.7 * v;
    for (const c of this.hazeLayers) c.setAlpha(haze);
    for (const c of this.lifeLayers) c.setAlpha(life);
    for (const m of this.emitters) m.e.setAlpha(m.base * (m.kind === 'haze' ? haze : m.kind === 'life' ? life : 1));
  }

  // ---------- infraestrutura ----------

  /** Uma camada (contêiner) por tipo/profundidade: a opacidade por cor é aplicada nela. */
  private layer(o: Opt): Container {
    const kind = o.kind ?? 'life', depth = o.depth ?? this.baseDepth;
    const key = `${kind}:${depth}:${o.into ? 'in' : 'out'}`;
    let c = this.layers.get(key);
    if (!c) {
      c = this.scene.add.container(0, 0).setScrollFactor(0).setDepth(depth);
      if (o.into) o.into.add(c);
      this.layers.set(key, c);
      if (kind === 'haze') this.hazeLayers.push(c);
      else if (kind === 'life') this.lifeLayers.push(c);
    }
    return c;
  }

  private put<T extends Phaser.GameObjects.GameObject>(obj: T, o: Opt): T {
    this.layer(o).add(obj);
    return obj;
  }

  private emit(tex: string, cfg: EmitterConfig, o: Opt): Emitter | undefined {
    if (!this.on) return undefined;
    const e = this.scene.add.particles(0, 0, tex, { blendMode: o.blend ?? 0, ...cfg });
    e.setScrollFactor(0).setDepth(o.depth ?? this.baseDepth).setAlpha(o.alpha ?? 1);
    this.emitters.push({ e, kind: o.kind ?? 'life', base: o.alpha ?? 1 });
    return e;
  }

  // ---------- névoa e nuvens ----------

  /** Faixa larga de névoa que desliza (e acompanha a câmera com `parallax`). `speed` em px/s, + = para a direita. */
  fogBand(o: Opt & { y: number; h: number; speed?: number; parallax?: number; scale?: number; x?: number; w?: number }) {
    if (!this.on) return;
    const s = (o.h / 256) * (o.scale ?? 1);
    const ts = this.scene.add.tileSprite(o.x ?? 0, o.y, o.w ?? GAME_W, o.h, 'fx_fog').setOrigin(0, 0);
    ts.setTileScale(s, s).setTint(o.tint ?? 0xffffff).setAlpha(o.alpha ?? 0.5).setBlendMode(o.blend ?? 0);
    ts.tilePositionX = rnd(0, 1024);
    this.put(ts, { kind: 'haze', ...o });
    const speed = o.speed ?? 10, par = o.parallax ?? 0;
    this.ticks.push((dt, dCam) => {
      ts.tilePositionX += (dCam * par - speed * dt) / s;
    });
  }

  /** Nuvens/névoa em manchas: sobem e descem devagar numa região (bordas sempre macias). */
  puffs(o: Opt & { area: Box; count: number; size: Pair; drift?: number; period?: Pair }) {
    if (!this.on) return;
    const drift = o.drift ?? 60, period = o.period ?? [9, 16];
    for (let i = 0; i < o.count; i++) {
      const base = o.alpha ?? 0.4;
      const sz = rnd(o.size[0], o.size[1]) / 128;
      const p = this.scene.add.image(o.area.x + rnd(0, o.area.w), o.area.y + rnd(0, o.area.h), 'fx_puff').setScale(sz * rnd(1.1, 1.8), sz).setAlpha(base * rnd(0.55, 1)).setTint(o.tint ?? 0xffffff);
      if (o.blend) p.setBlendMode(o.blend);
      this.put(p, { kind: 'haze', ...o });
      const dur = rnd(period[0], period[1]) * 1000;
      this.scene.tweens.add({ targets: p, x: p.x + rnd(-drift, drift), duration: dur, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: rnd(0, dur) });
      this.scene.tweens.add({ targets: p, alpha: p.alpha * rnd(0.4, 0.7), scaleX: p.scaleX * rnd(0.9, 1.15), duration: dur * rnd(0.6, 0.9), yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: rnd(0, dur) });
    }
  }

  /** Vapor/fumaça subindo de um ponto: fontes termais, chaminés, bocas de gêiser. */
  steam(o: Opt & { x: number; y: number; w?: number; size?: number; rise?: number; rate?: number; life?: number }) {
    const size = (o.size ?? 60) / 128, rise = o.rise ?? 1, life = o.life ?? 2600;
    this.emit(
      'fx_puff',
      {
        x: { min: o.x - (o.w ?? 10) / 2, max: o.x + (o.w ?? 10) / 2 },
        y: o.y,
        speedY: { min: -46 * rise, max: -22 * rise },
        speedX: { min: -12, max: 14 },
        lifespan: { min: life * 0.8, max: life * 1.1 },
        scale: { start: size * 0.35, end: size * 1.5 },
        alpha: { values: [0, o.alpha ?? 0.45, 0] },
        rotate: { min: -40, max: 40 },
        tint: o.tint ?? 0xffffff,
        frequency: o.rate ?? 320,
        advance: life,
      },
      { kind: 'haze', ...o, alpha: 1 },
    );
  }

  // ---------- água ----------

  /**
   * Cachoeira: fios de água caindo por cima da arte, com névoa e respingos na base.
   * (x, y) é o centro do topo da queda; `w` e `h` o tamanho da queda.
   */
  waterfall(o: Opt & { x: number; y: number; w: number; h: number; speed?: number; mist?: boolean }) {
    if (!this.on) return;
    const ts = this.scene.add.tileSprite(o.x, o.y, o.w, o.h, 'fx_fall').setOrigin(0.5, 0);
    ts.setTileScale(Math.max(0.35, o.w / 64), 1).setAlpha(o.alpha ?? 0.55).setBlendMode(o.blend ?? ADD);
    ts.setTint(o.tint ?? 0xe6faff);
    ts.tilePositionY = rnd(0, 256);
    this.put(ts, { kind: 'fixed', ...o });
    this.scene.tweens.add({ targets: ts, tilePositionY: ts.tilePositionY - 256, duration: (256 / (o.speed ?? 170)) * 1000, repeat: -1 });

    if (o.mist === false) return;
    const base = o.y + o.h, wide = Math.max(o.w, 22);
    this.emit(
      'fx_puff',
      {
        x: { min: o.x - wide * 0.45, max: o.x + wide * 0.45 },
        y: { min: base - 6, max: base + 4 },
        speedY: { min: -22, max: -6 },
        speedX: { min: -16, max: 16 },
        lifespan: { min: 1500, max: 2600 },
        scale: { start: (wide * 0.9) / 128, end: (wide * 2.1) / 128 },
        alpha: { values: [0, 0.4, 0] },
        tint: 0xf4fcff,
        frequency: 240,
        advance: 2000,
      },
      { kind: 'haze', depth: o.depth, into: undefined },
    );
    this.emit(
      'fx_glow',
      {
        x: { min: o.x - wide * 0.4, max: o.x + wide * 0.4 },
        y: base - 2,
        speedY: { min: -150, max: -60 },
        speedX: { min: -50, max: 50 },
        gravityY: 330,
        lifespan: { min: 500, max: 900 },
        scale: { start: 0.2, end: 0.05 },
        alpha: { start: 0.9, end: 0 },
        tint: 0xffffff,
        frequency: 85,
      },
      { kind: 'life', depth: o.depth, blend: ADD },
    );
  }

  /** Ondulações que se abrem e somem: poças, remansos, fontes. */
  ripples(o: Opt & { points: Pair[]; size: number; period?: number }) {
    if (!this.on) return;
    const period = (o.period ?? 2.6) * 1000;
    o.points.forEach(([x, y], i) => {
      for (const phase of [0, 0.5]) {
        const r = this.scene.add.image(x, y, 'fx_ripple').setScale(0.2).setAlpha(0).setTint(o.tint ?? 0xffffff).setBlendMode(o.blend ?? ADD);
        this.put(r, { kind: 'life', ...o });
        const s = o.size / 96;
        this.scene.tweens.add({ targets: r, scale: { from: s * 0.25, to: s }, alpha: { from: o.alpha ?? 0.6, to: 0 }, duration: period, repeat: -1, delay: period * (phase + i * 0.23), ease: 'Sine.out' });
      }
    });
  }

  /** Cintilar do sol/lua sobre a água: pontos de luz que acendem e apagam numa região. */
  glitter(o: Opt & { area: Box; rate?: number; size?: Pair; life?: Pair }) {
    const size = o.size ?? [0.14, 0.3], life = o.life ?? [900, 1800];
    this.emit(
      'fx_star',
      {
        emitZone: zone(o.area),
        lifespan: { min: life[0], max: life[1] },
        scale: { min: size[0], max: size[1] },
        alpha: { values: [0, 0.95, 0] },
        speedX: { min: -4, max: 4 },
        speedY: { min: -3, max: 3 },
        tint: o.tint ?? 0xffffff,
        frequency: o.rate ?? 120,
        advance: life[1],
      },
      { blend: ADD, ...o, alpha: 1 },
    );
  }

  /** Linha de brilho que desliza na superfície da água. */
  waveLine(o: Opt & { x?: number; y: number; w: number; scale?: number; period?: number }) {
    if (!this.on) return;
    const sc = o.scale ?? 1;
    const ts = this.scene.add.tileSprite(o.x ?? 0, o.y - 8 * sc, o.w, 16 * sc, 'fx_wave').setOrigin(0, 0).setTileScale(sc, sc);
    ts.setAlpha(o.alpha ?? 0.55).setTint(o.tint ?? 0xe8fbff).setBlendMode(o.blend ?? ADD);
    this.put(ts, { kind: 'fixed', ...o });
    this.scene.tweens.add({ targets: ts, tilePositionX: 128, duration: (o.period ?? 3.4) * 1000, repeat: -1 });
  }

  /** Luz que dança no fundo do mar: duas camadas de cáusticas deslizando em sentidos opostos. */
  caustics(o: Opt & { area: Box; fade?: number; scale?: number; speed?: number; /** false: só uma camada (bem mais barato) */ both?: boolean }) {
    if (!this.on) return;
    const steps = 3, fade = o.fade ?? 0, a = (o.alpha ?? 0.3) / steps;
    const sc = o.scale ?? 1.6, speed = o.speed ?? 14;
    const strips: Phaser.GameObjects.TileSprite[] = [];
    for (const [dir, k] of (o.both === false ? [[1, 1]] : [[1, 1], [-1, 0.62]]) as [number, number][]) {
      for (let i = 0; i < steps; i++) {
        // cada faixa cobre da sua altura até a base: a soma dá um degradê suave no topo
        const top = o.area.y + (fade * (steps - 1 - i)) / steps;
        const ts = this.scene.add.tileSprite(o.area.x, top, o.area.w, o.area.y + o.area.h - top, 'fx_caustic').setOrigin(0, 0);
        ts.setTileScale(sc * k, sc * k).setAlpha(a).setTint(o.tint ?? 0xcff6ff).setBlendMode(ADD);
        this.put(ts, { kind: 'life', ...o });
        strips.push(ts);
        ts.setData({ dir, k, top });
      }
    }
    this.ticks.push((_dt, dCam, t) => {
      for (const ts of strips) {
        const dir = ts.getData('dir') as number, k = ts.getData('k') as number, top = ts.getData('top') as number;
        // mantém as faixas alinhadas entre si: a posição do padrão depende da altura de cada uma
        ts.tilePositionX = (dir * t * speed - dCam * 0) / (sc * k) + 40 * dir;
        ts.tilePositionY = (t * speed * 0.6 * dir + (top - o.area.y)) / (sc * k);
      }
    });
  }

  // ---------- luz ----------

  /** Feixes de luz inclinados que balançam e respiram (clareiras, mar, vitrais). */
  shafts(o: Opt & { xs: number[]; y: number; w: number; h: number; angle?: number; sway?: number; period?: number }) {
    if (!this.on) return;
    o.xs.forEach((x, i) => {
      const r = this.scene.add.image(x, o.y, 'fx_ray').setOrigin(0.5, 0).setBlendMode(o.blend ?? ADD).setTint(o.tint ?? 0xfff2c8);
      r.setScale((o.w * rnd(0.8, 1.25)) / 128, (o.h * rnd(0.85, 1.1)) / 512);
      const ang = (o.angle ?? 0) + rnd(-3, 3);
      r.setAngle(ang).setAlpha(0);
      this.put(r, { kind: 'fixed', ...o });
      const per = (o.period ?? 7) * 1000 * rnd(0.8, 1.3);
      const a = o.alpha ?? 0.3;
      this.scene.tweens.add({ targets: r, angle: ang + (o.sway ?? 4) * (i % 2 ? 1 : -1), duration: per * 1.4, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: rnd(0, per) });
      this.scene.tweens.add({ targets: r, alpha: { from: a * 0.35, to: a }, duration: per, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: rnd(0, per) });
    });
  }

  /** Leque de raios saindo de um ponto (o sol da ilustração). */
  sunRays(o: Opt & { x: number; y: number; count?: number; len: number; width?: number; spread?: number; facing?: number }) {
    if (!this.on) return;
    const n = o.count ?? 5, spread = o.spread ?? 90, facing = o.facing ?? 0;
    for (let i = 0; i < n; i++) {
      const ang = facing + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread);
      const r = this.scene.add.image(o.x, o.y, 'fx_ray').setOrigin(0.5, 0.02).setBlendMode(ADD).setTint(o.tint ?? 0xfff0b8).setAngle(ang + 180 * 0);
      r.setScale(((o.width ?? 150) * rnd(0.8, 1.2)) / 128, (o.len * rnd(0.8, 1.1)) / 512).setAlpha(0);
      this.put(r, { kind: 'fixed', ...o });
      const per = rnd(4200, 7600);
      this.scene.tweens.add({ targets: r, angle: ang + rnd(3, 6) * (i % 2 ? 1 : -1), duration: per * 1.5, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.scene.tweens.add({ targets: r, alpha: { from: (o.alpha ?? 0.3) * 0.3, to: o.alpha ?? 0.3 }, duration: per, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: rnd(0, per) });
    }
  }

  /** Halo que pulsa (sol, lanternas, cristais, vitrais). `flicker` deixa o ritmo irregular, como chama. */
  pulse(o: Opt & { x: number; y: number; size: number; min?: number; max?: number; period?: number; flicker?: boolean; squash?: number }) {
    if (!this.on) return;
    const g = this.scene.add.image(o.x, o.y, 'fx_glow').setBlendMode(o.blend ?? ADD).setTint(o.tint ?? 0xffe0a0);
    const s = o.size / 64;
    g.setScale(s, s * (o.squash ?? 1));
    const lo = o.min ?? 0.25, hi = o.max ?? 0.7, per = (o.period ?? 2.4) * 1000;
    g.setAlpha(lo);
    this.put(g, { kind: 'life', ...o });
    this.scene.tweens.add({ targets: g, alpha: hi, scaleX: s * 1.12, scaleY: s * (o.squash ?? 1) * 1.12, duration: per * 0.5, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: rnd(0, per) });
    if (o.flicker) this.scene.tweens.add({ targets: g, alpha: lo * 0.8, duration: rnd(90, 160), yoyo: true, repeat: -1, repeatDelay: rnd(150, 700), delay: rnd(0, 800) });
  }

  /** Brilhinhos em estrela que acendem de vez em quando, nos pontos dados (cristais, estrelas, trilha). */
  twinkles(o: Opt & { points: Pair[]; size?: Pair; every?: Pair; hold?: Pair }) {
    if (!this.on) return;
    const size = o.size ?? [0.5, 0.9], every = o.every ?? [500, 4200], hold = o.hold ?? [420, 900];
    for (const [x, y] of o.points) {
      const s = rnd(size[0], size[1]);
      const st = this.scene.add.image(x, y, 'fx_star').setBlendMode(ADD).setTint(o.tint ?? 0xffffff).setAlpha(0).setScale(s * 0.3);
      this.put(st, { kind: 'life', ...o });
      this.scene.tweens.add({
        targets: st,
        alpha: o.alpha ?? 0.95,
        scale: s,
        angle: rnd(-12, 12),
        duration: rnd(hold[0], hold[1]),
        yoyo: true,
        repeat: -1,
        repeatDelay: rnd(every[0], every[1]),
        delay: rnd(0, every[1]),
        ease: 'Sine.inOut',
      });
    }
  }

  // ---------- partículas soltas ----------

  /** Pontinhos de luz flutuando: vaga-lumes, poeira dourada, plâncton, cinzas. */
  motes(o: Opt & { area: Box; rate?: number; size?: Pair; life?: Pair; vx?: Pair; vy?: Pair; tex?: string }) {
    const size = o.size ?? [0.1, 0.22], life = o.life ?? [4200, 8000];
    this.emit(
      o.tex ?? 'fx_glow',
      {
        emitZone: zone(o.area),
        lifespan: { min: life[0], max: life[1] },
        scale: { min: size[0], max: size[1] },
        alpha: { values: [0, 0.95, 0.6, 0.95, 0] },
        speedX: { min: o.vx?.[0] ?? -14, max: o.vx?.[1] ?? 14 },
        speedY: { min: o.vy?.[0] ?? -20, max: o.vy?.[1] ?? 6 },
        accelerationX: { min: -6, max: 6 },
        tint: o.tint ?? 0xfff4b0,
        frequency: o.rate ?? 160,
        advance: life[1],
      },
      { blend: ADD, ...o, alpha: 1 },
    );
  }

  /** Folhas e pétalas caindo de lado, rodopiando. `wind` empurra para a direita (+) ou esquerda (−). */
  leaves(o: Opt & { area: Box; rate?: number; wind?: number; fall?: Pair; size?: Pair; colors: number[] }) {
    const fall = o.fall ?? [50, 100], wind = o.wind ?? 40, size = o.size ?? [0.7, 1.3];
    const life = (o.area.h / ((fall[0] + fall[1]) / 2)) * 1000;
    this.emit(
      'fx_leaf',
      {
        emitZone: zone({ x: o.area.x - 80, y: o.area.y, w: o.area.w + 160, h: 8 }),
        speedY: { min: fall[0], max: fall[1] },
        speedX: { min: wind - 24, max: wind + 34 },
        accelerationX: { min: -26, max: 26 },
        lifespan: { min: life * 0.9, max: life * 1.2 },
        scale: { min: size[0], max: size[1] },
        scaleY: { onEmit: () => 1, onUpdate: (p: Particle, _k: string, t: number) => (0.25 + 0.75 * Math.abs(Math.sin(t * 15 + p.x * 0.013))) * p.scaleX },
        rotate: { start: 0, end: 540 },
        alpha: { values: [0, 0.95, 0.95, 0] },
        tint: o.colors,
        frequency: o.rate ?? 340,
        advance: life,
      },
      { ...o, alpha: 1 },
    );
  }

  /** Bolhas de ar subindo, com leve ondulação. */
  bubbles(o: Opt & { area: Box; rate?: number; size?: Pair }) {
    const size = o.size ?? [0.3, 0.75];
    this.emit(
      'fx_bubble',
      {
        emitZone: zone(o.area),
        speedY: { min: -92, max: -38 },
        speedX: { min: -10, max: 10 },
        accelerationX: { min: -14, max: 14 },
        lifespan: { min: 4200, max: 7600 },
        scale: { min: size[0], max: size[1] },
        alpha: { values: [0, 0.85, 0.85, 0] },
        tint: o.tint ?? 0xeafcff,
        frequency: o.rate ?? 260,
        advance: 6000,
      },
      { ...o, alpha: 1 },
    );
  }

  /** Riscos de vento/poeira cruzando a tela na horizontal. */
  streaks(o: Opt & { area: Box; dir?: number; rate?: number; speed?: Pair }) {
    const dir = o.dir ?? 1, sp = o.speed ?? [320, 560];
    this.emit(
      'fx_glow',
      {
        emitZone: zone(o.area),
        speedX: { min: dir * sp[0], max: dir * sp[1] },
        speedY: { min: -14, max: 14 },
        lifespan: { min: 1300, max: 2300 },
        scaleX: { start: 1.8, end: 0.8 },
        scaleY: 0.07,
        alpha: { values: [0, 0.4, 0] },
        tint: o.tint ?? 0xf6d9ac,
        frequency: o.rate ?? 110,
        advance: 2000,
      },
      { kind: 'haze', ...o, alpha: 1 },
    );
  }

  // ---------- bichos e céu ----------

  /** Silhuetas que cruzam a tela sem parar (cardumes, pássaros). `flap` bate asas/cauda. */
  private crossers(tex: string, o: Opt & { y: Pair; count: number; speed: Pair; dir?: number; size: Pair; flap?: number; gap?: Pair; bob?: number; spread?: number }) {
    if (!this.on) return;
    const dir = o.dir ?? 1, gap = o.gap ?? [0, 0];
    const leader = { y: rnd(o.y[0], o.y[1]) };
    for (let i = 0; i < o.count; i++) {
      const sz = rnd(o.size[0], o.size[1]);
      const sp = this.scene.add.image(0, 0, tex).setScale(sz * dir, sz).setAlpha(o.alpha ?? 0.5).setTint(o.tint ?? 0x0b4f66);
      this.put(sp, { kind: 'life', ...o });
      const spd = rnd(o.speed[0], o.speed[1]);
      const off = (o.spread ?? 80) * rnd(-1, 1), offY = (o.spread ?? 80) * 0.5 * rnd(-1, 1);
      const x0 = dir > 0 ? -60 : GAME_W + 60, x1 = dir > 0 ? GAME_W + 60 : -60;
      const dist = Math.abs(x1 - x0);
      const run = (from: number) => {
        sp.setPosition(from + off, leader.y + offY);
        this.scene.tweens.add({
          targets: sp,
          x: x1 + off,
          duration: (Math.abs(x1 + off - from - off) / spd) * 1000,
          onComplete: () => {
            if (!sp.scene) return;
            leader.y = rnd(o.y[0], o.y[1]);
            const wait = rnd(gap[0], gap[1]) * 1000;
            sp.setVisible(false);
            this.scene.time.delayedCall(wait, () => {
              if (!sp.scene) return;
              sp.setVisible(true);
              run(x0);
            });
          },
        });
      };
      run(x0 + dir * dist * rnd(0, 1));
      if (o.flap) this.scene.tweens.add({ targets: sp, scaleY: sz * 0.45, duration: o.flap * rnd(0.85, 1.2), yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: rnd(0, o.flap) });
      if (o.bob) this.scene.tweens.add({ targets: sp, y: sp.y + o.bob * rnd(0.6, 1.2), duration: rnd(900, 1700), yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
  }

  /** Cardume de peixinhos cruzando. */
  fish(o: Opt & { y: Pair; count?: number; speed?: Pair; dir?: number; size?: Pair; spread?: number; gap?: Pair }) {
    this.crossers('fx_fish', { speed: [40, 70], size: [0.5, 0.85], flap: 0, bob: 14, gap: [3, 9], ...o, count: o.count ?? 6 });
  }

  /** Pássaros ao longe. */
  birds(o: Opt & { y: Pair; count?: number; speed?: Pair; dir?: number; size?: Pair; spread?: number; gap?: Pair }) {
    this.crossers('fx_bird', { speed: [60, 90], size: [0.55, 0.9], flap: 320, bob: 10, gap: [6, 16], alpha: 0.7, tint: 0x4a3358, ...o, count: o.count ?? 3 });
  }

  /** Estrela cadente de tempos em tempos. */
  shootingStars(o: Opt & { area: Box; every?: Pair }) {
    if (!this.on) return;
    const every = o.every ?? [5, 11];
    const fire = () => {
      this.scene.time.delayedCall(rnd(every[0], every[1]) * 1000, () => {
        if (!this.scene.sys.isActive()) return;
        const x = o.area.x + rnd(0, o.area.w), y = o.area.y + rnd(0, o.area.h), ang = rnd(18, 32), len = rnd(360, 520);
        const rad = Phaser.Math.DegToRad(ang);
        const trail = this.scene.add.image(x, y, 'fx_glow').setBlendMode(ADD).setTint(o.tint ?? 0xdfe8ff).setScale(2.6, 0.1).setRotation(rad).setOrigin(1, 0.5).setAlpha(0);
        const head = this.scene.add.image(x, y, 'fx_star').setBlendMode(ADD).setTint(0xffffff).setScale(0.55).setAlpha(0);
        this.put(trail, { kind: 'fixed', ...o });
        this.put(head, { kind: 'fixed', ...o });
        this.scene.tweens.add({ targets: [trail, head], x: x + Math.cos(rad) * len, y: y + Math.sin(rad) * len, duration: 850, ease: 'Sine.in' });
        this.scene.tweens.add({ targets: [trail, head], alpha: { from: 0, to: 0.9 }, duration: 260, yoyo: true, hold: 120, onComplete: () => { trail.destroy(); head.destroy(); } });
        fire();
      });
    };
    fire();
  }

  /** Clarão de relâmpago distante (respeita "Reduzir flashes"). */
  lightning(o: Opt & { every?: Pair; strength?: number }) {
    if (!this.on) return;
    const every = o.every ?? [9, 20];
    const flash = this.scene.add.rectangle(0, 0, GAME_W, GAME_H, o.tint ?? 0xd9c8ff, 1).setOrigin(0).setScrollFactor(0).setDepth(o.depth ?? 20).setBlendMode(ADD).setAlpha(0);
    const next = () => {
      this.scene.time.delayedCall(rnd(every[0], every[1]) * 1000, () => {
        if (!this.scene.sys.isActive()) return;
        if (canFlashScreen()) {
          const a = o.strength ?? 0.1;
          this.scene.tweens.chain({
            targets: flash,
            tweens: [
              { alpha: a, duration: 60 },
              { alpha: a * 0.2, duration: 90 },
              { alpha: a * 0.8, duration: 70 },
              { alpha: 0, duration: 420, ease: 'Quad.out' },
            ],
          });
        }
        next();
      });
    };
    next();
  }

  // ---------- efeitos presos à arte de um fundo com paralaxe ----------

  /**
   * Prende um efeito a um ponto da arte de uma camada de paralaxe (TileSprite com a imagem + cópia
   * espelhada). `u` e `v` são frações da imagem original (0..1); o efeito acompanha a rolagem do
   * fundo e aparece nas duas metades (normal e espelhada). `offY` é o deslocamento vertical da camada.
   */
  pin(layer: Phaser.GameObjects.TileSprite, offY: number, u: number, v: number, build: (c: Container, mirrored: boolean) => void, o: Opt = {}) {
    if (!this.on) return;
    const { P, H } = period(layer), half = P / 2;
    ([[u * half, false], [P - u * half, true]] as const).forEach(([tx, mirrored]) => {
      const c = this.scene.add.container(0, offY + v * H);
      build(c, mirrored);
      this.put(c, { kind: 'fixed', ...o });
      this.ticks.push(() => {
        let x = (((tx - layer.tilePositionX) % P) + P) % P;
        if (x > P - 320) x -= P;
        c.x = x;
        c.setVisible(x > -320 && x < GAME_W + 320);
      });
    });
  }

  /** Cachoeira presa ao fundo: de `v0` a `v1` (frações da altura), largura `w` em pixels. */
  pinFall(layer: Phaser.GameObjects.TileSprite, offY: number, u: number, v0: number, v1: number, w: number, o: Opt & { speed?: number } = {}) {
    if (!this.on) return;
    const h = (v1 - v0) * period(layer).H;
    this.pin(
      layer,
      offY,
      u,
      v0,
      (c) => {
        const ts = this.scene.add.tileSprite(0, 0, w, h, 'fx_fall').setOrigin(0.5, 0);
        ts.setTileScale(Math.max(0.35, w / 64), 1).setAlpha(o.alpha ?? 0.5).setBlendMode(ADD).setTint(o.tint ?? 0xe6faff);
        ts.tilePositionY = rnd(0, 256);
        this.scene.tweens.add({ targets: ts, tilePositionY: ts.tilePositionY - 256, duration: (256 / (o.speed ?? 150)) * 1000, repeat: -1 });
        // névoa na base da queda
        const mist = this.scene.add.image(0, h, 'fx_puff').setScale((w * 2.2) / 128, (w * 0.9) / 128).setAlpha(0.35).setTint(0xf4fcff);
        this.scene.tweens.add({ targets: mist, alpha: 0.12, scaleX: mist.scaleX * 1.25, duration: rnd(1600, 2600), yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: rnd(0, 1200) });
        c.add([ts, mist]);
      },
      { ...o, kind: 'fixed' },
    );
  }

  /** Halo que pulsa preso ao fundo (sol, lanternas, janelas, luas). */
  pinPulse(layer: Phaser.GameObjects.TileSprite, offY: number, u: number, v: number, size: number, o: Opt & { min?: number; max?: number; period?: number; flicker?: boolean } = {}) {
    if (!this.on) return;
    this.pin(
      layer,
      offY,
      u,
      v,
      (c) => {
        const g = this.scene.add.image(0, 0, 'fx_glow').setBlendMode(ADD).setTint(o.tint ?? 0xffe0a0);
        const s = size / 64, lo = o.min ?? 0.2, hi = o.max ?? 0.6, per = (o.period ?? 2.6) * 1000;
        g.setScale(s).setAlpha(lo);
        c.add(g);
        this.scene.tweens.add({ targets: g, alpha: hi, scale: s * 1.1, duration: per * 0.5, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: rnd(0, per) });
        if (o.flicker) this.scene.tweens.add({ targets: g, alpha: lo * 0.7, duration: rnd(90, 160), yoyo: true, repeat: -1, repeatDelay: rnd(200, 800), delay: rnd(0, 800) });
      },
      { kind: 'life', ...o },
    );
  }

  /** Brilho em estrela preso ao fundo (cristais). */
  pinTwinkle(layer: Phaser.GameObjects.TileSprite, offY: number, u: number, v: number, o: Opt & { size?: number } = {}) {
    if (!this.on) return;
    this.pin(
      layer,
      offY,
      u,
      v,
      (c) => {
        const st = this.scene.add.image(0, 0, 'fx_star').setBlendMode(ADD).setTint(o.tint ?? 0xffffff).setAlpha(0).setScale(0.2);
        c.add(st);
        const s = o.size ?? 0.8;
        this.scene.tweens.add({ targets: st, alpha: 0.95, scale: s, angle: rnd(-14, 14), duration: rnd(500, 900), yoyo: true, repeat: -1, repeatDelay: rnd(500, 3200), delay: rnd(0, 3000), ease: 'Sine.inOut' });
      },
      { kind: 'life', ...o },
    );
  }

  /** Fumaça/vapor subindo de um ponto da arte (chaminés, fontes termais). */
  pinSteam(layer: Phaser.GameObjects.TileSprite, offY: number, u: number, v: number, o: Opt & { size?: number; rise?: number; rate?: number } = {}) {
    if (!this.on) return;
    const { P, H } = period(layer), half = P / 2;
    const size = (o.size ?? 50) / 128, rise = o.rise ?? 1, life = 2600;
    for (const tx of [u * half, P - u * half]) {
      const e = this.emit(
        'fx_puff',
        {
          x: 0,
          y: 0,
          speedY: { min: -40 * rise, max: -20 * rise },
          speedX: { min: -8, max: 14 },
          lifespan: { min: life * 0.8, max: life * 1.1 },
          scale: { start: size * 0.35, end: size * 1.4 },
          alpha: { values: [0, o.alpha ?? 0.4, 0] },
          rotate: { min: -40, max: 40 },
          tint: o.tint ?? 0xffffff,
          frequency: o.rate ?? 380,
        },
        { kind: 'haze', ...o, alpha: 1 },
      );
      if (!e) continue;
      const y = offY + v * H;
      this.ticks.push(() => {
        let x = (((tx - layer.tilePositionX) % P) + P) % P;
        if (x > P - 320) x -= P;
        e.setPosition(x, y);
        e.active = x > -200 && x < GAME_W + 200;
        e.visible = e.active;
      });
    }
  }
}
