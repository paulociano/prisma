import type { Line } from '../scenes/DialogueScene';

// Falas do Mundo 5. Marina é uma artista trans do recife.

export const MARINA_FREED: Line[] = [
  { who: 'marina', mood: 'grateful', text: 'Que alívio... Eu já nem lembrava a cor da minha própria voz.' },
  { who: 'iris', mood: 'happy', text: 'Marina! Seus murais ainda estão lá, esperando você.' },
  { who: 'marina', mood: 'worried', text: 'O Kraken cobriu tudo de tinta cinza. Disse que a arte de quem é como eu era "barulhenta demais" e mandou o recife ficar em silêncio.' },
  { who: 'spark', mood: 'talking', text: 'Silêncio nenhum! A gente quer ouvir você!' },
  { who: 'marina', mood: 'proud', text: 'Então vamos pintar alto. Íris, leve meu pincel de luz: aperte C e dispare um prisma.' },
];

export const MARINA_AFTER: Line[] = [
  { who: 'marina', mood: 'proud', text: 'O Kraken está na galeria afundada. Quando ele se cansar, mostre que nenhuma tinta apaga uma cor verdadeira.' },
  { who: 'iris', mood: 'determined', text: 'Vamos devolver a voz ao recife.' },
];

export const KRAKEN_INTRO: Line[] = [
  { who: 'kraken', mood: 'angry', text: 'Shhhh... Aqui ninguém fala, ninguém pinta, ninguém se mostra. É mais seguro assim.' },
  { who: 'iris', mood: 'determined', text: 'Seguro pra quem? Calar alguém não protege ninguém.' },
  { who: 'kraken', mood: 'angry', text: 'Então afunde no silêncio!' },
  { who: 'spark', mood: 'worried', text: 'Depois da varrida, ele fica sem fôlego! Nade e ataque!' },
];

export const KRAKEN_RESTORED: Line[] = [
  { who: 'kraken', mood: 'restored', text: 'Eu calava os outros porque nunca deixaram eu falar... Posso pintar também?' },
  { who: 'iris', mood: 'happy', text: 'Com oito braços? Vai ser o mural mais lindo do mar.' },
  { who: 'kraken', mood: 'restored', text: 'Então que o recife cante em todas as cores.' },
  { who: 'spark', mood: 'excited', text: 'O azul voltou! Faltam duas cores!' },
];
