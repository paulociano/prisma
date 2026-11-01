import { extendLevel } from './extend';
import type { LevelData } from './LevelBuilder';
import { level1_1, level1_2, level1_3, level1_4 } from './w1';
import { level2_1, level2_2, level2_3, level2_4 } from './w2';
import { level3_1, level3_2, level3_3, level3_4 } from './w3';
import { level4_1, level4_2, level4_3, level4_4 } from './w4';
import { level5_1, level5_2, level5_3, level5_4 } from './w5';
import { level6_1, level6_2, level6_3, level6_4 } from './w6';
import { level7_1, level7_2, level7_3, level7_4 } from './w7';

// Ordem de jogo; o mapa-múndi agrupa por mundo. Cada fase normal ganha um trecho extra
// (extend.ts); o número da fase escolhe a variação, para nenhum trecho repetir igual.
export const BASE: (() => LevelData)[] = [
  level1_1, level1_2, level1_3, level1_4,
  level2_1, level2_2, level2_3, level2_4,
  level3_1, level3_2, level3_3, level3_4,
  level4_1, level4_2, level4_3, level4_4,
  level5_1, level5_2, level5_3, level5_4,
  level6_1, level6_2, level6_3, level6_4,
  level7_1, level7_2, level7_3, level7_4,
];

export const LEVELS: (() => LevelData)[] = BASE.map((build, i) => () => extendLevel(build(), i % 4));

/** Metadados leves (sem montar a grade) para o mapa. */
export const LEVEL_META = LEVELS.map((build, index) => {
  const l = build();
  return { index, id: l.id, name: l.name, world: l.world, boss: !!l.arena };
});

/** Uma fase está liberada se é a primeira ou se a anterior foi concluída. */
export function isUnlocked(index: number, completed: string[]) {
  return index === 0 || completed.includes(LEVEL_META[index - 1].id);
}
