// Fases são montadas por código com este construtor, numa grade de blocos de 64 px.
// Linhas contam de cima para baixo (linha 0 = topo). Numa fase de 12 linhas,
// chão com altura 2 ocupa as linhas 10 e 11, e quem fica de pé nele está na linha 9.

export enum T {
  Empty = 0,
  Solid = 1,
  OneWay = 2,
  Spike = 3,
}

export type EntityType =
  | 'player'
  | 'coin'
  | 'shard'
  | 'heart'
  | 'blot'
  | 'moth'
  | 'padlock'
  | 'beetle'
  | 'scorpion'
  | 'drone'
  | 'snapper'
  | 'searchlight'
  | 'puffer'
  | 'comet'
  | 'sentinel'
  | 'cracked'
  | 'vent'
  | 'wind'
  | 'megaphone'
  | 'checkpoint'
  | 'exit'
  | 'spring'
  | 'crate'
  | 'mover'
  | 'bump'
  | 'pushbox'
  | 'plate'
  | 'gate'
  | 'portal'
  | 'fakewall'
  | 'guardian'
  | 'boss';

export interface Entity {
  type: EntityType;
  col: number;
  row: number;
  /** Parâmetros extras (ex.: deslocamento de plataformas móveis). */
  data?: Record<string, number>;
}

export interface LevelData {
  id: string;
  name: string;
  world: number;
  cols: number;
  rows: number;
  tiles: T[][];
  entities: Entity[];
  hints: { col: number; row: number; text: string }[];
  /** Fase de chefão: câmera fixa e fundo de arena no lugar do cenário. */
  arena?: string;
  /** Linha a partir da qual tudo fica debaixo d'água (Recife Turquesa). */
  water?: number;
  /** Multiplicador de gravidade (Ilhas do Céu: 0.6). */
  gravity?: number;
}

export class LevelBuilder {
  readonly tiles: T[][];
  readonly entities: Entity[] = [];
  readonly hints: { col: number; row: number; text: string }[] = [];
  arena?: string;
  water?: number;
  gravity?: number;

  constructor(
    readonly id: string,
    readonly name: string,
    readonly world: number,
    readonly cols: number,
    readonly rows = 12,
  ) {
    this.tiles = Array.from({ length: rows }, () => new Array<T>(cols).fill(T.Empty));
  }

  private set(c: number, r: number, t: T) {
    if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) this.tiles[r][c] = t;
  }

  /** Chão das colunas c0..c1 com `height` blocos de altura. */
  ground(c0: number, c1: number, height: number) {
    for (let c = c0; c <= c1; c++) for (let r = this.rows - height; r < this.rows; r++) this.set(c, r, T.Solid);
    return this;
  }

  /** Retângulo sólido (inclusive). */
  block(c0: number, r0: number, c1: number, r1: number) {
    for (let c = c0; c <= c1; c++) for (let r = r0; r <= r1; r++) this.set(c, r, T.Solid);
    return this;
  }

  /** Plataforma atravessável por baixo. */
  oneway(c0: number, c1: number, row: number) {
    for (let c = c0; c <= c1; c++) this.set(c, row, T.OneWay);
    return this;
  }

  spikes(c0: number, c1: number, row: number) {
    for (let c = c0; c <= c1; c++) this.set(c, row, T.Spike);
    return this;
  }

  add(type: EntityType, col: number, row: number) {
    this.entities.push({ type, col, row });
    return this;
  }

  /**
   * Plataforma móvel de `width` blocos que vai e volta `dx`/`dy` blocos a partir de (col, row).
   * `period` é o tempo de ida e volta, em segundos; `phase` (0 a 1) adianta o ciclo,
   * útil para sincronizar duas plataformas em sequência.
   */
  mover(col: number, row: number, dx: number, dy: number, width = 2, period = 4, phase = 0) {
    this.entities.push({ type: 'mover', col, row, data: { dx, dy, width, period, phase } });
    return this;
  }

  /** Gêiser de vapor: em ciclos, lança Íris bem alto. (col, row) é onde ele fica, sobre o chão. */
  vent(col: number, row: number, period = 2.6, phase = 0) {
    this.entities.push({ type: 'vent', col, row, data: { period, phase } });
    return this;
  }

  /** Rajada de areia: área (w x h blocos, canto superior esquerdo em col,row) que empurra para `dir` (-1 ou 1). */
  wind(col: number, row: number, w: number, h: number, dir: -1 | 1, strength = 230) {
    this.entities.push({ type: 'wind', col, row, data: { w, h, dir, strength } });
    return this;
  }

  /**
   * Holofote de vigia preso na linha `row`: o cone ilumina o chão cujo topo é a linha
   * `floorRow` e balança `swing` blocos para cada lado. Encostar na luz machuca.
   */
  searchlight(col: number, row: number, floorRow: number, swing = 3, period = 3.2, phase = 0) {
    // o holofote fica 34 px abaixo do topo da sua linha
    const reach = floorRow - row - 34 / 64;
    this.entities.push({ type: 'searchlight', col, row, data: { reach, swing, period, phase } });
    return this;
  }

  /** Blocos rachados (colunas c0..c1 na linha `row`): sólidos, mas o mergulho estelar os quebra. */
  cracked(c0: number, c1: number, row: number) {
    for (let c = c0; c <= c1; c++) this.entities.push({ type: 'cracked', col: c, row });
    return this;
  }

  /** Bloco de bater com a cabeça. reward: 0 = surpresa (coração se a vida está baixa, senão faíscas), 1 = faíscas, 2 = coração. */
  bump(col: number, row: number, reward = 0) {
    this.entities.push({ type: 'bump', col, row, data: { reward } });
    return this;
  }

  /** Caixa empurrável (cai com a gravidade; volta ao lugar se cair no abismo). */
  pushbox(col: number, row: number) {
    return this.add('pushbox', col, row);
  }

  /** Placa de pressão que mantém abertos os portões de mesmo `id` enquanto houver peso (Íris ou caixa). */
  plate(col: number, row: number, id = 1) {
    this.entities.push({ type: 'plate', col, row, data: { id } });
    return this;
  }

  /** Portão de `h` blocos (col, row = bloco do topo) que abre com a placa de mesmo `id`. */
  gate(col: number, row: number, h: number, id = 1) {
    this.entities.push({ type: 'gate', col, row, data: { id, h } });
    return this;
  }

  /** Entrada secreta para o sub-nível `sub` (0 a 3). */
  portal(col: number, row: number, sub: number) {
    this.entities.push({ type: 'portal', col, row, data: { sub } });
    return this;
  }

  /** Parede falsa (só visual, atravessável) de w x h blocos; o canto inferior esquerdo é (col, row). */
  fakewall(col: number, row: number, w: number, h: number) {
    this.entities.push({ type: 'fakewall', col, row, data: { w, h } });
    return this;
  }

  /** Texto de tutorial flutuando no cenário. */
  hint(col: number, row: number, text: string) {
    this.hints.push({ col, row, text });
    return this;
  }

  coins(c0: number, c1: number, row: number) {
    for (let c = c0; c <= c1; c++) this.add('coin', c, row);
    return this;
  }

  /** Arco de moedas, bom para indicar onde pular. */
  coinArc(c0: number, row: number, count: number) {
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      this.add('coin', c0 + i, row - Math.round(Math.sin(t * Math.PI) * 2));
    }
    return this;
  }

  build(): LevelData {
    return { id: this.id, name: this.name, world: this.world, cols: this.cols, rows: this.rows, tiles: this.tiles, entities: this.entities, hints: this.hints, arena: this.arena, water: this.water, gravity: this.gravity };
  }
}
