import type { Line } from '../scenes/DialogueScene';

// Falas do Mundo 1. Íris é uma pessoa não-binária: as falas para Íris evitam
// adjetivos com gênero ("meu bem", "minha estrela", "criança" em vez de "querida/querido").

export const RUBY_FREED: Line[] = [
  { who: 'ruby', mood: 'grateful', text: 'Ai, meu bem... Achei que ninguém mais ia me ver brilhar.' },
  { who: 'iris', mood: 'happy', text: 'Mãe Rubi! Você está bem?' },
  { who: 'ruby', mood: 'happy', text: 'Agora estou. O Juiz de Pedra me trancou aqui por ser "demais". Demais de cor, de brilho... demais de mim.' },
  { who: 'spark', mood: 'talking', text: 'Ninguém é "demais" por ser quem é!' },
  { who: 'ruby', mood: 'proud', text: 'Exatamente, cristalzinho. Íris, leve um pouco do meu brilho com você.' },
  { who: 'ruby', mood: 'proud', text: 'Quando o chão faltar, pule de novo. No ar, com fé.' },
];

export const RUBY_AFTER: Line[] = [
  { who: 'ruby', mood: 'proud', text: 'O Juiz está no Tribunal de Pedra, logo adiante. Mostre a ele que viver em cores não é crime.' },
  { who: 'iris', mood: 'determined', text: 'Pode deixar, Mãe Rubi.' },
];

export const JUDGE_INTRO: Line[] = [
  { who: 'judge', mood: 'angry', text: 'ORDEM NO TRIBUNAL! Cada coisa no seu lugar. E o lugar de todos é o cinza.' },
  { who: 'iris', mood: 'determined', text: 'Ninguém precisa caber num lugar que apaga quem a gente é.' },
  { who: 'judge', mood: 'angry', text: 'Então o veredito está dado: CINZA!' },
  { who: 'spark', mood: 'worried', text: 'Cuidado com o martelo! Quando ele ficar preso no chão, é a nossa chance!' },
];

export const JUDGE_RESTORED: Line[] = [
  { who: 'judge', mood: 'restored', text: 'Eu... passei tanto tempo julgando que esqueci como é sentir.' },
  { who: 'iris', mood: 'happy', text: 'Nunca é tarde para recomeçar.' },
  { who: 'judge', mood: 'restored', text: 'O Vale é de vocês. Que cada cor floresça do jeito que quiser.' },
  { who: 'spark', mood: 'excited', text: 'O vermelho voltou! Faltam seis cores!' },
];
