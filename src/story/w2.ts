import type { Line } from '../scenes/DialogueScene';

// Falas do Mundo 2. Sol e Luna são um casal lésbico de curandeiras do cânion.
// A Luna só aparece se a arte dela existir (w2_luna); sem ela, a Sol fala da Luna.

export const SOL_FREED: Line[] = [
  { who: 'sol', mood: 'grateful', text: 'Ufa... Achei que ia ficar presa nesse cristal pra sempre.' },
  { who: 'iris', mood: 'happy', text: 'Você é a Sol, né? A Luna está te procurando pelo cânion inteiro!' },
  { who: 'sol', mood: 'worried', text: 'A Serpente me prendeu quando eu fui proteger a Luna. Disse que a gente devia se esconder, que o nosso amor era "motivo de vergonha".' },
  { who: 'spark', mood: 'talking', text: 'Vergonha nenhuma! Amor é amor!' },
  { who: 'sol', mood: 'proud', text: 'É isso aí, cristalzinho. Íris, leva um pouco da minha força: quando precisar, avança como um raio de sol!' },
];

export const SOL_AFTER: Line[] = [
  { who: 'sol', mood: 'proud', text: 'A Serpente está na Arena das Areias. Ela esconde o próprio rosto... acho que ninguém nunca olhou pra ela com carinho.' },
  { who: 'iris', mood: 'determined', text: 'Então vai ser a primeira vez.' },
];

export const LUNA_REUNION: Line[] = [
  { who: 'luna', mood: 'happy', text: 'Sol! Você está bem!' },
  { who: 'sol', mood: 'happy', text: 'Agora estou, meu amor.' },
  { who: 'luna', mood: 'proud', text: 'Obrigada, Íris. Nossas fontes vão voltar a curar o cânion.' },
];

export const SERPENT_INTRO: Line[] = [
  { who: 'serpent', mood: 'angry', text: 'Ssshh... Não olhe para mim. Ninguém deve ser visto. Escondam-se, como eu me escondo!' },
  { who: 'iris', mood: 'determined', text: 'Ninguém devia ter vergonha de existir.' },
  { who: 'serpent', mood: 'angry', text: 'Então a areia vai cobrir você também!' },
  { who: 'spark', mood: 'worried', text: 'Quando ela sair da areia, fica tonta! Essa é a nossa chance!' },
];

export const SERPENT_RESTORED: Line[] = [
  { who: 'serpent', mood: 'restored', text: 'Faz tanto tempo que eu não mostrava o meu rosto... O sol é quentinho.' },
  { who: 'iris', mood: 'happy', text: 'Seu rosto é lindo, sabia?' },
  { who: 'serpent', mood: 'restored', text: 'Sem vergonha, sem esconderijo. O cânion pode brilhar de novo.' },
  { who: 'spark', mood: 'excited', text: 'O laranja voltou! Faltam cinco cores!' },
];
