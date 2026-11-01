import type { Line } from '../scenes/DialogueScene';

// Falas do Mundo 3. Aurora é intersexo, usa cadeira de rodas e organiza o Festival Solar.

export const AURORA_FREED: Line[] = [
  { who: 'aurora', mood: 'grateful', text: 'Que luz boa... Obrigada, Íris. Fiquei tanto tempo no escuro.' },
  { who: 'iris', mood: 'happy', text: 'Aurora! A cidade inteira está esperando o festival.' },
  { who: 'aurora', mood: 'worried', text: 'O Holofote Frio apagou as cores e mandou todo mundo ficar em casa. Disse que quem é diferente não devia ser visto.' },
  { who: 'spark', mood: 'talking', text: 'Mas ser visto do jeito que a gente é é a melhor parte!' },
  { who: 'aurora', mood: 'proud', text: 'Isso mesmo! Íris, quando o caminho for só parede, suba por ela. Nenhum muro é alto demais pra quem sabe quem é.' },
];

export const AURORA_AFTER: Line[] = [
  { who: 'aurora', mood: 'proud', text: 'O Holofote está no palco principal. Eu vou na frente com as fitas: o festival vai acontecer, com ou sem permissão!' },
  { who: 'iris', mood: 'determined', text: 'Então vamos acender esse palco.' },
];

export const SPOTLIGHT_INTRO: Line[] = [
  { who: 'spotlight', mood: 'angry', text: 'TODOS VOCÊS ESTÃO SENDO VISTOS. Cada diferença, cada cor. Escondam-se, ou a luz fria vai encontrar vocês!' },
  { who: 'iris', mood: 'determined', text: 'A gente não tem medo de ser visto. A gente quer ser visto.' },
  { who: 'spotlight', mood: 'angry', text: 'Então sintam o clarão!' },
  { who: 'spark', mood: 'worried', text: 'Depois do clarão, o olho dele superaquece! É aí que a gente ataca!' },
];

export const SPOTLIGHT_RESTORED: Line[] = [
  { who: 'spotlight', mood: 'restored', text: 'Eu achava que a luz servia para vigiar... mas ela serve para iluminar quem dança.' },
  { who: 'iris', mood: 'happy', text: 'Então ilumina o festival pra gente!' },
  { who: 'spotlight', mood: 'restored', text: 'Com todo o meu brilho. Que comece o Festival Solar!' },
  { who: 'spark', mood: 'excited', text: 'O amarelo voltou! Faltam quatro cores!' },
];
