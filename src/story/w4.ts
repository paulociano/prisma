import type { Line } from '../scenes/DialogueScene';

// Falas do Mundo 4. Ramo é um jardineiro gay, cuidador da Selva Esmeralda.

export const BRANCH_FREED: Line[] = [
  { who: 'branch', mood: 'grateful', text: 'Ah, criança... Sentir o vento de novo. Obrigado.' },
  { who: 'iris', mood: 'happy', text: 'Você é o Ramo, o jardineiro? As árvores estão com saudade de você.' },
  { who: 'branch', mood: 'worried', text: 'A Espinheira cercou a selva de espinhos. Ela acha que, sozinha, ninguém pode machucá-la. Mas também ninguém pode chegar perto.' },
  { who: 'spark', mood: 'talking', text: 'Ninguém floresce sozinho!' },
  { who: 'branch', mood: 'proud', text: 'Sábio, esse cristalzinho. Íris, leve a leveza das sementes: abra a echarpe e plane sobre os abismos.' },
];

export const BRANCH_AFTER: Line[] = [
  { who: 'branch', mood: 'proud', text: 'Meu marido dizia que todo espinho protege uma flor com medo. Vá com carinho, Íris.' },
  { who: 'iris', mood: 'determined', text: 'Vou mostrar pra ela que não precisa ficar sozinha.' },
];

export const THORNWEED_INTRO: Line[] = [
  { who: 'thornweed', mood: 'angry', text: 'Fiquem longe! Meus espinhos me protegem. Sozinha, ninguém me fere!' },
  { who: 'iris', mood: 'determined', text: 'Sozinha, ninguém te abraça também.' },
  { who: 'thornweed', mood: 'angry', text: 'SAIAM DO MEU JARDIM!' },
  { who: 'spark', mood: 'worried', text: 'Quando os cipós dela ficarem presos no chão, a flor fica aberta! Essa é a hora!' },
];

export const THORNWEED_RESTORED: Line[] = [
  { who: 'thornweed', mood: 'restored', text: 'Os espinhos... sumiram. E está tudo bem. Ninguém me machucou.' },
  { who: 'iris', mood: 'happy', text: 'A selva toda quer crescer com você.' },
  { who: 'thornweed', mood: 'restored', text: 'Então que floresçamos juntos.' },
  { who: 'spark', mood: 'excited', text: 'O verde voltou! Faltam três cores!' },
];
