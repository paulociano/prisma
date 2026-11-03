import type { Line } from '../scenes/DialogueScene';

// Falas do Mundo 7. Ás é cavaleiro(a) assexual da Cidadela; as falas evitam marcas de gênero sem precisar de linguagem neutra.

export const ACE_FREED: Line[] = [
  { who: 'ace', mood: 'grateful', text: 'Íris... Você chegou até aqui. Até o coração do cinza.' },
  { who: 'iris', mood: 'happy', text: 'Ás! Todo mundo me falou de você pelo caminho.' },
  { who: 'ace', mood: 'worried', text: 'Monocromo diz que ninguém deve ser diferente. Que existe um jeito "certo" de amar, de sentir, de ser. Eu nunca coube nesse jeito.' },
  { who: 'spark', mood: 'talking', text: 'E nem precisa caber! Você é do jeito que é, e isso já basta!' },
  { who: 'ace', mood: 'proud', text: 'Então leve meu escudo no coração, Íris. Com ele, você aguenta um golpe a mais.' },
];

export const ACE_AFTER: Line[] = [
  { who: 'ace', mood: 'proud', text: 'Monocromo espera no trono. Todos os guardiões estão com você: Rubi, Sol e Luna, Aurora, Ramo, Marina, Bix... e eu.' },
  { who: 'iris', mood: 'determined', text: 'Então vamos em frente, lado a lado. Por todas as cores.' },
];

export const MONO_INTRO: Line[] = [
  { who: 'mono', mood: 'angry', text: 'Pequena luz. Você devolveu seis cores e chama isso de vitória. Eu chamo de caos.' },
  { who: 'iris', mood: 'determined', text: 'Não é caos. É gente sendo quem é.' },
  { who: 'mono', mood: 'angry', text: 'Iguais estão seguros. Iguais não sofrem. TODOS SERÃO IGUAIS!' },
  { who: 'spark', mood: 'worried', text: 'Quando ele carregar energia e o brilho estourar, o núcleo fica exposto! É agora ou nunca, Íris!' },
];

export const MONO_RESTORED: Line[] = [
  { who: 'mono', mood: 'restored', text: 'Eu... tinha tanto medo de ser diferente que quis que ninguém fosse.' },
  { who: 'iris', mood: 'happy', text: 'Você pode ter todas as cores que quiser. Ninguém vai te deixar de fora.' },
  { who: 'mono', mood: 'restored', text: 'Todas as cores... Elas ficam bonitas juntas, não ficam?' },
  { who: 'spark', mood: 'excited', text: 'O VIOLETA VOLTOU! O arco-íris está completo, Íris!' },
  { who: 'iris', mood: 'happy', text: 'Prisma está brilhando de novo. Do jeito que sempre devia ter sido.' },
];

/** Entre a forma 1 e a forma final: a máscara cai e o medo aparece. */
export const MONO_MASKS: Line[] = [
  { who: 'mono', mood: 'angry', text: 'Pare! Sem a máscara... eu não sei o que sobra de mim.' },
  { who: 'iris', mood: 'determined', text: 'Sobra você. Só você. Isso nunca foi o problema.' },
  { who: 'spark', mood: 'worried', text: 'Íris, olha a luz nas rachaduras! São as cores dele tentando sair!' },
  { who: 'mono', mood: 'angry', text: 'NÃO! Se eu mostrar quem sou, vão me deixar sozinho! Última armadura... e ninguém mais vai me ver!' },
];
