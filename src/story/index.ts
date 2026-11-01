import type { Line } from '../scenes/DialogueScene';
import { JUDGE_INTRO, JUDGE_RESTORED, RUBY_AFTER, RUBY_FREED } from './w1';
import { LUNA_REUNION, SERPENT_INTRO, SERPENT_RESTORED, SOL_AFTER, SOL_FREED } from './w2';

import { AURORA_AFTER, AURORA_FREED, SPOTLIGHT_INTRO, SPOTLIGHT_RESTORED } from './w3';
import { BRANCH_AFTER, BRANCH_FREED, THORNWEED_INTRO, THORNWEED_RESTORED } from './w4';

import { KRAKEN_INTRO, KRAKEN_RESTORED, MARINA_AFTER, MARINA_FREED } from './w5';
import { BIX_AFTER, BIX_FREED, ECLIPSE_INTRO, ECLIPSE_RESTORED } from './w6';

import { ACE_AFTER, ACE_FREED, MONO_INTRO, MONO_RESTORED } from './w7';

export type Ability = 'doubleJump' | 'dash' | 'wallJump' | 'glide' | 'shot' | 'pound' | 'extraHeart';

// O que acontece em cada mundo: falas do guardião e do chefão e o poder ganho.
export interface WorldStory {
  guardianFreed: Line[];
  /** Falas depois do aviso de novo poder; `extra` entra quando a arte opcional existe. */
  guardianAfter: Line[];
  extra?: { tex: string; lines: Line[] };
  ability: Ability;
  abilityToast: string;
  bossIntro: Line[];
  bossRestored: Line[];
  nextWorld: string;
}

export const STORY: Record<number, WorldStory> = {
  1: {
    guardianFreed: RUBY_FREED,
    guardianAfter: RUBY_AFTER,
    ability: 'doubleJump',
    abilityToast: 'Novo poder: PULO DUPLO!\nAperte pular de novo no ar.',
    bossIntro: JUDGE_INTRO,
    bossRestored: JUDGE_RESTORED,
    nextWorld: 'Cânion do Entardecer',
  },
  2: {
    guardianFreed: SOL_FREED,
    guardianAfter: SOL_AFTER,
    extra: { tex: 'w2_luna', lines: LUNA_REUNION },
    ability: 'dash',
    abilityToast: 'Novo poder: DASH!\nAperte SHIFT (ou L) para avançar rápido.\nNo dash, nada te machuca.',
    bossIntro: SERPENT_INTRO,
    bossRestored: SERPENT_RESTORED,
    nextWorld: 'Cidade Solar',
  },
  3: {
    guardianFreed: AURORA_FREED,
    guardianAfter: AURORA_AFTER,
    ability: 'wallJump',
    abilityToast: 'Novo poder: PULO NA PAREDE!\nEncoste numa parede no ar e pule de novo.',
    bossIntro: SPOTLIGHT_INTRO,
    bossRestored: SPOTLIGHT_RESTORED,
    nextWorld: 'Selva Esmeralda',
  },
  4: {
    guardianFreed: BRANCH_FREED,
    guardianAfter: BRANCH_AFTER,
    ability: 'glide',
    abilityToast: 'Novo poder: PLANAR!\nSegure pular enquanto cai\n(depois do pulo duplo, vai mais longe).',
    bossIntro: THORNWEED_INTRO,
    bossRestored: THORNWEED_RESTORED,
    nextWorld: 'Recife Turquesa',
  },
  5: {
    guardianFreed: MARINA_FREED,
    guardianAfter: MARINA_AFTER,
    ability: 'shot',
    abilityToast: 'Novo poder: DISPARO DE PRISMA!\nAperte C para disparar um cristal.',
    bossIntro: KRAKEN_INTRO,
    bossRestored: KRAKEN_RESTORED,
    nextWorld: 'Ilhas do Céu Anil',
  },
  6: {
    guardianFreed: BIX_FREED,
    guardianAfter: BIX_AFTER,
    ability: 'pound',
    abilityToast: 'Novo poder: MERGULHO ESTELAR!\nNo ar, aperte ↓ para despencar\ne quebrar blocos rachados.',
    bossIntro: ECLIPSE_INTRO,
    bossRestored: ECLIPSE_RESTORED,
    nextWorld: 'Cidadela Cinza',
  },
  7: {
    guardianFreed: ACE_FREED,
    guardianAfter: ACE_AFTER,
    ability: 'extraHeart',
    abilityToast: 'Escudo de Ás: +1 CORAÇÃO!',
    bossIntro: MONO_INTRO,
    bossRestored: MONO_RESTORED,
    nextWorld: '',
  },
};
