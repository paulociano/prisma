import type { Line } from '../scenes/DialogueScene';

// Falas do Mundo 6. Bix é astrônome bissexual das Ilhas do Céu (falas sem gênero).

export const BIX_FREED: Line[] = [
  { who: 'bix', mood: 'grateful', text: 'Uau... As estrelas! Eu achei que nunca mais ia ver o céu inteiro.' },
  { who: 'iris', mood: 'happy', text: 'Bix! O observatório ficou quietinho sem você.' },
  { who: 'bix', mood: 'worried', text: 'O Eclipse vive dizendo que eu preciso escolher uma estrela só. Que gostar de mais de uma é "indecisão". Aí ele apagou o céu.' },
  { who: 'spark', mood: 'talking', text: 'O céu tem lugar pra todas as estrelas!' },
  { who: 'bix', mood: 'proud', text: 'Tem mesmo! Íris, toma esse impulso de estrela cadente: no ar, aperte ↓ e despenque com tudo. Quebra até bloco rachado!' },
];

export const BIX_AFTER: Line[] = [
  { who: 'bix', mood: 'proud', text: 'O Eclipse está na ilha mais alta. Quando ele mergulhar e cair tonto, é a sua chance.' },
  { who: 'iris', mood: 'determined', text: 'Vamos acender esse céu de novo.' },
];

export const ECLIPSE_INTRO: Line[] = [
  { who: 'eclipse', mood: 'angry', text: 'Tantas luzes... tanta dúvida. Escolha uma! Ou fique no escuro para sempre.' },
  { who: 'iris', mood: 'determined', text: 'Ninguém precisa caber numa escolha só. O céu é grande.' },
  { who: 'eclipse', mood: 'angry', text: 'Então eu apago todas!' },
  { who: 'spark', mood: 'worried', text: 'Quando ele mergulhar e cair no chão, fica tonto! Ataque nessa hora!' },
];

export const ECLIPSE_RESTORED: Line[] = [
  { who: 'eclipse', mood: 'restored', text: 'Minhas asas... têm todas as cores. Eu não precisava escolher.' },
  { who: 'iris', mood: 'happy', text: 'Nunca precisou.' },
  { who: 'eclipse', mood: 'restored', text: 'Então que o céu brilhe inteiro, de ponta a ponta.' },
  { who: 'spark', mood: 'excited', text: 'O anil voltou! Só falta uma cor... a Cidadela Cinza nos espera.' },
];
