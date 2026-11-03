import Phaser from 'phaser';
import { applyColorblind } from '../systems/Settings';
import { GAME_H, GAME_W } from '../config';
import { has } from '../gfx/art';
import { textStyle } from '../gfx/ui';
import { playMusic, playSfx } from '../systems/Audio';

export interface Slide {
  tex: string;
  text: string;
  /** Mantém o topo da ilustração à vista (quando o detalhe importante está lá em cima). */
  top?: boolean;
  /** Enquadramento: contain preserva toda a arte, cover preenche a tela. */
  fit?: 'contain' | 'cover';
  /** Deslocamento vertical em pixels para ajustes finos. */
  offsetY?: number;
}

// Íris é não-binária: a narração evita adjetivos com gênero para ela.
export const INTRO: Slide[] = [
  { tex: 'cs_intro_1', text: 'Em Prisma, cada pessoa brilhava com a própria cor.\nE ninguém precisava pedir licença para isso.' },
  { tex: 'cs_intro_2', text: 'Até que Monocromo, o rei da névoa, decidiu que a diferença era perigosa.\nUma onda cinza cobriu o mundo, e as cores se apagaram.' },
  { tex: 'cs_intro_3', text: 'Mas a echarpe de Íris guardou a última luz.\nE dessa luz nasceu Faísca.' },
  { tex: 'cs_intro_4', text: 'Sete terras cinzentas. Sete cores para devolver.\nA jornada começa no Vale do Coração.' },
];

export const ENDING: Slide[] = [
  { tex: 'cs_ending_1', text: 'Sob a última máscara, Monocromo era só alguém\ncom medo de ser visto. Íris estendeu a mão.' },
  { tex: 'cs_guardians', text: 'Pelo caminho, Íris tinha encontrado uma família:\ngente que brilha do próprio jeito, e brilha mais junto.' },
  { tex: 'cs_ending_2', text: 'As sete cores voltaram.\nE Prisma fez a maior festa que já existiu.' },
];

export const TRUE_ENDING: Slide = {
  tex: 'cs_ending_true',
  text: 'E no céu, as sete cores formaram uma nova constelação:\num coração, para quem ainda está aprendendo a brilhar.',
  top: true,
};

const AUTO_MS = 8000; // avança sozinho depois desse tempo

// Sequência de ilustrações com narração. Qualquer tecla/clique avança; ESC pula tudo.
export class CutsceneScene extends Phaser.Scene {
  private slides: Slide[] = [];
  private next = '';
  private nextData?: object;
  private index = -1;
  private img?: Phaser.GameObjects.Image;
  private caption!: Phaser.GameObjects.Text;
  private ready = false;
  private autoTimer?: Phaser.Time.TimerEvent;
  private leaving = false;

  constructor() {
    super('Cutscene');
  }

  init(data: { slides: Slide[]; next: string; nextData?: object; music?: string; footer?: string }) {
    this.slides = data.slides.filter((s) => has(this, s.tex));
    this.next = data.next;
    this.nextData = data.nextData;
    this.index = -1;
    this.leaving = false;
    this.img = undefined;
    if (data.music) playMusic(this, data.music);
    this.registry.set('cs-footer', data.footer ?? '');
  }

  create() {
    applyColorblind(this);
    this.cameras.main.setBackgroundColor('#000000');
    this.add.rectangle(0, GAME_H - 110, GAME_W, 220, 0x0a0614, 0.72).setOrigin(0, 0).setDepth(5);
    this.caption = this.add
      .text(GAME_W / 2, GAME_H - 58, '', { ...textStyle(21), align: 'center', lineSpacing: 6, wordWrap: { width: GAME_W - 160 } })
      .setOrigin(0.5)
      .setDepth(6);
    this.add.text(GAME_W - 16, 14, 'ESC pular', textStyle(16)).setOrigin(1, 0).setAlpha(0.7).setDepth(6);

    const footer = this.registry.get('cs-footer') as string;
    if (footer) this.add.text(GAME_W / 2, 18, footer, textStyle(18, '#ffd93d')).setOrigin(0.5, 0).setDepth(6);

    this.input.keyboard!.on('keydown', (ev: KeyboardEvent) => (ev.key === 'Escape' ? this.finish() : this.advance()));
    this.input.on('pointerdown', () => this.advance());
    this.input.gamepad?.on('down', () => this.advance());

    if (!this.slides.length) return this.finish();
    this.advance(true);
  }

  private advance(force = false) {
    if (this.leaving || (!force && !this.ready)) return;
    this.index++;
    if (this.index >= this.slides.length) return this.finish();
    if (!force) playSfx(this, 'dialogue_blip', 0);
    this.show(this.slides[this.index]);
  }

  private show(s: Slide) {
    this.ready = false;
    this.autoTimer?.remove();
    const old = this.img;
    if (old) this.tweens.add({ targets: old, alpha: 0, duration: 500, onComplete: () => old.destroy() });

    // Enquadramento seguro: mostra a arte inteira sem cortar rosto, céu ou detalhes.
    // O painel de narração fica por cima da parte inferior, nunca move a imagem.
    const img = this.add.image(GAME_W / 2, GAME_H / 2 + (s.offsetY ?? 0), s.tex).setAlpha(0);
    const fit = s.fit ?? 'contain';
    const base = fit === 'cover'
      ? Math.max(GAME_W / img.width, GAME_H / img.height)
      : Math.min(GAME_W / img.width, GAME_H / img.height);
    img.setScale(base);
    if (s.top) img.setY(img.displayHeight / 2 + (s.offsetY ?? 0));
    this.tweens.add({ targets: img, alpha: 1, duration: 700 });
    // Somente fade, sem zoom que recorte detalhes durante a leitura.
    this.img = img;

    this.caption.setText(s.text).setAlpha(0);
    this.tweens.add({ targets: this.caption, alpha: 1, duration: 600, delay: 300 });
    this.time.delayedCall(700, () => (this.ready = true));
    this.autoTimer = this.time.delayedCall(AUTO_MS, () => this.advance());
  }

  private finish() {
    if (this.leaving) return;
    this.leaving = true;
    this.autoTimer?.remove();
    this.cameras.main.fadeOut(600);
    this.time.delayedCall(620, () => this.scene.start(this.next, this.nextData));
  }
}
