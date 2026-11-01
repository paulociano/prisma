import Phaser from 'phaser';

// A mecânica central: o cenário começa quase sem cor e ganha saturação
// a cada inimigo restaurado, checkpoint, faísca e fragmento.
// Íris, Faísca e os restaurados ficam fora do filtro e brilham sempre.
export class ColorRestore {
  private fxs: Phaser.FX.ColorMatrix[] = [];
  private gained = 0;
  private target: number;
  value: number;

  constructor(
    targets: Phaser.GameObjects.Container[],
    private total: number,
    private base = 0.08, // um restinho de cor desde o início
  ) {
    this.value = this.target = base;
    for (const t of targets) {
      const fx = t.postFX?.addColorMatrix();
      if (fx) this.fxs.push(fx);
    }
    this.apply();
  }

  /** Durante a fase a cor chega a 85%; o restante vem ao concluir. */
  add(points: number) {
    this.gained += points;
    this.target = Math.max(this.target, this.base + (0.85 - this.base) * Math.min(1, this.gained / this.total));
  }

  complete() {
    this.target = 1;
  }

  update(dt: number) {
    if (Math.abs(this.target - this.value) < 0.001) return;
    this.value += (this.target - this.value) * Math.min(1, dt * 2.5);
    this.apply();
  }

  private apply() {
    for (const fx of this.fxs) {
      fx.saturate(-(1 - this.value));
      // o cinza fica levemente mais escuro e frio
      fx.brightness(0.82 + 0.18 * this.value, true);
    }
  }
}
