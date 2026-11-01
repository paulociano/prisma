// Dados de cada mundo: nome, cor, posição no mapa-múndi e decoração.
// Os índices de `props` seguem a ordem da imagem props.png do mundo (grade do prompt 4.6).

export interface WorldInfo {
  id: number;
  name: string;
  color: number;
  /** Clareira do mapa-múndi (coordenadas na tela de 1280x720). */
  map: { x: number; y: number };
  decor?: { start: number; end: number; small: number[] };
}

export const WORLDS: WorldInfo[] = [
  { id: 1, name: 'Vale do Coração', color: 0xff4d5e, map: { x: 202, y: 415 }, decor: { start: 0, end: 8, small: [1, 2, 3, 5, 6, 7] } },
  { id: 2, name: 'Cânion do Entardecer', color: 0xff9a3c, map: { x: 367, y: 332 }, decor: { start: 0, end: 8, small: [1, 2, 4, 5, 6, 7] } },
  { id: 3, name: 'Cidade Solar', color: 0xffd93d, map: { x: 496, y: 249 }, decor: { start: 0, end: 5, small: [1, 2, 3, 7, 8, 6] } },
  { id: 4, name: 'Selva Esmeralda', color: 0x5fd068, map: { x: 671, y: 336 }, decor: { start: 4, end: 0, small: [1, 2, 3, 7, 8, 9, 10] } },
  { id: 5, name: 'Recife Turquesa', color: 0x3ccfd8, map: { x: 905, y: 413 }, decor: { start: 3, end: 4, small: [0, 1, 5, 6, 7, 8, 9] } },
  { id: 6, name: 'Ilhas do Céu Anil', color: 0x5b6cff, map: { x: 925, y: 80 }, decor: { start: 4, end: 5, small: [0, 1, 2, 3, 6, 8, 9] } },
  { id: 7, name: 'Cidadela Cinza', color: 0xb15bff, map: { x: 1125, y: 267 }, decor: { start: 1, end: 7, small: [0, 3, 4, 5, 6, 9] } },
];

export const worldInfo = (id: number) => WORLDS[id - 1];
