import type { Line } from '../scenes/DialogueScene';

// Bandeirolas educativas. Cada uma é uma flâmula com as cores de uma bandeira ou de uma conquista de direitos.
// Faísca lê o cartão em duas falas: "o que é" e "como respeitar / o que fazer". Textos curtos e sem rótulos
// pesados; os fatos foram escolhidos por serem consolidados (datas, decisões e autores públicos).

export interface Pennant {
  id: string;
  title: string;
  /** cores das listras da flâmula, de cima para baixo */
  colors: number[];
  what: string;
  how: string;
}

export const PENNANTS: Pennant[] = [
  {
    id: 'arco-iris', title: 'Bandeira do Arco-Íris',
    colors: [0xe40303, 0xff8c00, 0xffed00, 0x008026, 0x004dff, 0x750787],
    what: 'Criada por Gilbert Baker em 1978, em San Francisco. Cada cor lembra que existem muitas formas de ser e de amar, e que todas cabem no mesmo mundo.',
    how: 'Orgulho não é ser melhor que ninguém: é poder existir sem medo. Quando alguém te contar quem é, ouça com respeito e guarde segredo se for pedido.',
  },
  {
    id: 'progresso', title: 'Bandeira do Progresso',
    colors: [0x000000, 0x784f17, 0x5bcefa, 0xf5a9b8, 0xffffff, 0xe40303, 0xff8c00, 0xffed00, 0x008026, 0x004dff],
    what: 'Criada por Daniel Quasar em 2018. Além do arco-íris, ela inclui o preto e o marrom (pessoas negras e racializadas) e as cores da bandeira trans.',
    how: 'Preconceitos se somam: uma pessoa LGBTQIA+ negra, pobre ou com deficiência pode enfrentar mais barreiras. Incluir de verdade é olhar para quem está sobrando de fora.',
  },
  {
    id: 'lesbica', title: 'Orgulho Lésbico',
    colors: [0xd52d00, 0xff9a56, 0xffffff, 0xd362a4, 0xa30262],
    what: 'Mulheres lésbicas amam e se relacionam com outras mulheres. Existem várias versões da bandeira lésbica, feitas pela própria comunidade.',
    how: 'Lésbicas ainda são alvo de piadas e de fetiche. Respeitar é não sexualizar, não perguntar quem "faz o papel de homem" e reconhecer o amor delas como amor completo.',
  },
  {
    id: 'bissexual', title: 'Orgulho Bissexual',
    colors: [0xd60270, 0xd60270, 0x9b4f96, 0x0038a8, 0x0038a8],
    what: 'Criada por Michael Page em 1998. Pessoas bissexuais podem se interessar por mais de um gênero. O roxo é a mistura do rosa e do azul.',
    how: 'Bissexualidade não é fase, indecisão nem "meio caminho". Muita gente bi ouve que sua identidade não existe; acreditar no que a pessoa diz já ajuda muito.',
  },
  {
    id: 'trans', title: 'Orgulho Trans',
    colors: [0x5bcefa, 0xf5a9b8, 0xffffff, 0xf5a9b8, 0x5bcefa],
    what: 'Criada por Monica Helms em 1999. Pessoas trans se reconhecem num gênero diferente do que lhes foi atribuído ao nascer. Ser trans não é doença.',
    how: 'Chame a pessoa pelo nome e pelos pronomes que ela usa. Em 2018 o STF decidiu que pessoas trans podem mudar nome e gênero no registro civil sem cirurgia e sem laudo.',
  },
  {
    id: 'nao-binarie', title: 'Orgulho Não-Binário',
    colors: [0xfcf434, 0xffffff, 0x9c59d1, 0x2c2c2c],
    what: 'Criada por Kye Rowan em 2014. Pessoas não-binárias não se identificam apenas como homem ou apenas como mulher. Podem usar pronomes como "ele", "ela" ou "elu".',
    how: 'Se não souber os pronomes, pergunte com gentileza e use os que a pessoa pedir. Errou? Corrija sem drama e siga em frente: o esforço conta.',
  },
  {
    id: 'assexual', title: 'Orgulho Assexual',
    colors: [0x000000, 0xa3a3a3, 0xffffff, 0x800080],
    what: 'Criada em 2010 pela comunidade assexual. Pessoas assexuais sentem pouca ou nenhuma atração sexual, e muitas ainda amam, namoram e formam famílias.',
    how: 'Não é falta de "a pessoa certa" nem problema a ser curado. Respeite o limite de quem diz não, e não use a frase "você só não conheceu ninguém".',
  },
  {
    id: 'intersexo', title: 'Orgulho Intersexo',
    colors: [0xffd800, 0xffd800, 0x7902aa, 0xffd800, 0xffd800],
    what: 'Criada por Morgan Carpenter em 2013, sem as cores "de menino" ou "de menina". Pessoas intersexo nascem com variações nas características sexuais do corpo. Isso não é doença.',
    how: 'Intersexo não é o mesmo que ser trans. Cirurgias em bebês sem necessidade de saúde são muito debatidas; a pessoa deve poder participar das decisões sobre o próprio corpo.',
  },
  {
    id: 'pansexual', title: 'Orgulho Pansexual',
    colors: [0xff218c, 0xffd800, 0x21b1ff],
    what: 'Pessoas pansexuais se interessam por pessoas independentemente do gênero. Rosa, amarelo e azul representam essa liberdade de sentir.',
    how: 'Não é "gostar de tudo". Pergunte com curiosidade respeitosa e evite piadas: a identidade da pessoa não é uma brincadeira.',
  },
  {
    id: '17-maio', title: '17 de maio',
    colors: [0xe40303, 0xff8c00, 0xffed00, 0x008026, 0x004dff, 0x750787],
    what: 'Em 17 de maio de 1990, a Organização Mundial da Saúde retirou a homossexualidade da lista de doenças. Por isso a data é o Dia Internacional contra a LGBTfobia.',
    how: 'Orientação sexual não se cura. No Brasil, o Conselho Federal de Psicologia proíbe psicólogas e psicólogos de oferecerem "cura gay" desde 1999.',
  },
  {
    id: 'stf-2019', title: 'LGBTfobia é crime',
    colors: [0x5b6cff, 0xffffff, 0x5b6cff],
    what: 'Em 2019, o Supremo Tribunal Federal decidiu que a homofobia e a transfobia são crimes, enquadradas na lei que pune o racismo.',
    how: 'Sofreu ou viu discriminação? Procure a delegacia, a Defensoria Pública ou o Disque 100. Guarde prints, nomes e datas: provas ajudam.',
  },
  {
    id: 'casamento', title: 'Casar também é direito',
    colors: [0xff4d5e, 0xffd93d, 0xff4d5e],
    what: 'Em 2011, o STF reconheceu a união estável entre pessoas do mesmo sexo. Em 2013, o CNJ determinou que os cartórios não podem recusar casamento civil entre elas.',
    how: 'Família é quem cuida. Se alguém da sua vida foi excluído em casa, ofereça escuta e um lugar seguro: acolhimento muda destinos.',
  },
];

/** Quebra o texto em falas curtas (cabem na caixa de diálogo), sempre no fim de uma frase. */
function chunks(text: string, max = 135): string[] {
  const parts = text.match(/[^.!?]+[.!?]+\s*/g) ?? [text];
  const out: string[] = [];
  for (const part of parts) {
    const last = out[out.length - 1];
    if (last && (last + part).length <= max) out[out.length - 1] = last + part;
    else out.push(part);
  }
  return out.map((t) => t.trim());
}

export function pennantLines(p: Pennant): Line[] {
  return [
    ...chunks(`${p.title}. ${p.what}`).map((text): Line => ({ who: 'spark', mood: 'talking', text })),
    ...chunks(p.how).map((text): Line => ({ who: 'spark', mood: 'happy', text })),
  ];
}

// O que cada Desbotado de preconceito representa (aparece como aviso na primeira vez que Íris devolve a cor a um deles).
export const LESSONS: Record<string, { name: string; text: string }> = {
  label: { name: 'Rótulo', text: 'Estereótipo: gente não cabe em caixinha. Ele gruda etiquetas e te deixa mais lenta.' },
  joke: { name: 'Piada Azeda', text: 'A "brincadeira" que machuca. Rir de alguém não é o mesmo que rir com alguém.' },
  rumor: { name: 'Boato', text: 'Fofoca e invenção sobre a vida dos outros. Revelar quem a pessoa é, sem ela querer, faz mal de verdade.' },
  stare: { name: 'Olhar Torto', text: 'O julgamento calado: quem é olhado de cima aprende a se esconder.' },
  silence: { name: 'Muro de Silêncio', text: 'Apagamento: fingir que certas pessoas não existem. Falar sobre o assunto é o primeiro passo.' },
};

export function lessonLines(kind: string): Line[] {
  const l = LESSONS[kind];
  if (!l) return [];
  return chunks(`${l.name} devolveu a cor! ${l.text}`).map((text): Line => ({ who: 'spark', mood: 'talking', text }));
}
