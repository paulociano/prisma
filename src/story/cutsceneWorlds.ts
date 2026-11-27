import type { Slide } from '../scenes/CutsceneScene';

/** Epílogos pós-chefão e passagem para o mundo seguinte.
 * As imagens cs_wN_outro / cs_wN_reward / cs_wN_transition são opcionais até serem geradas.
 * Enquanto ausentes, o mapa ilustrado oficial de cada mundo mantém a história jogável.
 */
const STORIES: { outro: string; reward?: string; bridge?: string }[] = [
  { outro: 'No Vale do Coração, o Juiz de Pedra deixou de condenar quem era diferente. Agora ajudava Mãe Rubi a construir um lugar onde cada pessoa pudesse chegar e ficar.', reward: "Mãe Rubi entregou a Íris um pequeno coração de cristal, para lembrar que, mesmo nos caminhos mais difíceis, ninguém precisa deixar de ser quem é.", bridge: 'Íris e Faísca seguiram além das colinas vermelhas. O calor do Cânion do Entardecer anunciava que até feridas antigas podiam encontrar cura.' },
  { outro: 'A Serpente das Areias já não se escondia atrás da vergonha. Junto de Sol e Luna, transformou as antigas rajadas em trilhas seguras para quem precisava recomeçar.', reward: "Sol e Luna ofereceram uma faixa tecida nas cores do entardecer. Íris levaria consigo a certeza de que o amor nunca precisa se esconder.", bridge: 'O caminho levou Íris até a Cidade Solar. Entre girassóis e bandeirolas, uma luz insistia em voltar, mesmo depois de tanta sombra.' },
  { outro: 'O Holofote Frio deixou de vigiar e passou a iluminar o festival de Aurora. As ruas da Cidade Solar ficaram abertas para cada corpo, voz e jeito de existir.', reward: "Aurora entregou uma insígnia dourada, feita para brilhar sem medo. A luz não existia para vigiar, mas para revelar a beleza de cada pessoa.", bridge: 'Depois da festa, Íris ouviu o chamado da Selva Esmeralda. Entre raízes e cascatas, a próxima cor aguardava cuidado.' },
  { outro: 'A Espinheira aprendeu que proteger não era isolar. Com Ramo, abriu caminhos vivos pela floresta, onde a natureza podia crescer sem impedir a passagem de ninguém.', reward: "Ramo preparou um manto com fibras mágicas da floresta, leves como sementes e resistentes às águas. Íris descobriu que proteger também significa permitir que a vida siga livre.", bridge: 'A água das cachoeiras conduziu Íris e Faísca até o Recife Turquesa, onde histórias guardadas no silêncio ainda esperavam ser ouvidas.' },
  { outro: 'O Kraken do Silêncio agora protegia a galeria de Marina. No recife, obras e vozes antes escondidas podiam finalmente ocupar seu espaço.', reward: "Marina moldou um bracelete com a luz das marés. Dentro dele, viajavam as histórias e as vozes que o silêncio nunca mais conseguiria apagar.", bridge: 'Uma corrente de luz levou Íris para cima das nuvens. Nas Ilhas do Céu Anil, as estrelas pareciam pedir outra forma de coragem.' },
  { outro: 'O Eclipse já não precisava apagar as estrelas para sentir que pertencia ao céu. Ao lado de Bix, ajudou a desenhar constelações que acolhiam todas as dúvidas.', reward: "Bix presenteou Íris com botas que carregavam o brilho das constelações. Não importava quantas estrelas existissem: todas tinham seu lugar no céu.", bridge: 'A última trilha apontava para a Cidadela Cinza. Íris e Faísca seguiram juntas, levando consigo um pouco de cada mundo restaurado.' },
  { outro: 'Na Cidadela Cinza, Monocromo enfim pôde abandonar suas máscaras. Ás abriu os portões, e a cor voltou sem exigir que ninguém deixasse de ser quem era.' },
];

export function worldEpilogue(world: number): Slide[] {
  const story = STORIES[world - 1];
  if (!story) return [];
  const outro: Slide = { tex: `cs_w${world}_outro`, text: story.outro, fit: 'contain' };
  const reward: Slide[] = story.reward
    ? [{ tex: `cs_w${world}_reward`, text: story.reward, fit: 'contain' }]
    : [];
  const bridge: Slide[] = story.bridge
    ? [{ tex: `cs_w${world}_transition`, text: story.bridge, fit: 'contain' }]
    : [];
  return [outro, ...reward, ...bridge];
}

/** Arte de fallback registrada no carregador: retorna os mapas quando as cutscenes ainda não existem. */
export function worldEpilogueWithFallback(world: number, exists: (tex: string) => boolean): Slide[] {
  const slides = worldEpilogue(world);
  return slides.map((slide) => {
    if (exists(slide.tex)) return slide;
    // The reward belongs to the restored world, even if its artwork is missing.
    const outro = `cs_w${world}_outro`;
    if (slide.tex.endsWith('_reward') && exists(outro)) return { ...slide, tex: outro };
    // Next world's map may not yet be loaded; keep the current-world map then.
    const nextMap = `w${world + 1}_map`;
    const map = slide.tex.endsWith('_transition') && exists(nextMap) ? nextMap : `w${world}_map`;
    return { ...slide, tex: map };
  });
}
