// Estatísticas locais (só neste navegador): onde Íris cai. Servem para calibrar a dificuldade
// e para o jogador mandar um relatório junto com o feedback. Nada é enviado sem a pessoa decidir.
const KEY = 'prisma-stats-v1';
const LEVEL_ID = /^[1-7]-[1-4]$/;

export interface Stats {
  /** mortes por fase e por trecho de 10 colunas: deaths["1-2"]["12"] = 3 */
  deaths: Record<string, Record<string, number>>;
}

function load(): Stats {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Stats>;
    const out: Stats = { deaths: {} };
    for (const [id, cols] of Object.entries(v.deaths ?? {})) {
      if (!LEVEL_ID.test(id) || typeof cols !== 'object' || !cols) continue;
      out.deaths[id] = {};
      for (const [c, n] of Object.entries(cols)) if (/^\d{1,3}$/.test(c) && typeof n === 'number' && n > 0) out.deaths[id][c] = Math.min(9999, Math.trunc(n));
    }
    return out;
  } catch {
    return { deaths: {} };
  }
}

export function recordDeath(levelId: string, col: number) {
  if (!LEVEL_ID.test(levelId)) return;
  const s = load();
  const bucket = String(Math.max(0, Math.floor(col / 10)) * 10);
  s.deaths[levelId] ??= {};
  s.deaths[levelId][bucket] = (s.deaths[levelId][bucket] ?? 0) + 1;
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // sem armazenamento: não faz mal
  }
}

export function totalDeaths(): number {
  return Object.values(load().deaths).reduce((a, cols) => a + Object.values(cols).reduce((x, y) => x + y, 0), 0);
}

/** Link para abrir uma issue no GitHub já com o resumo de mortes (a pessoa revisa antes de enviar). */
export function feedbackUrl(): string {
  const d = load().deaths;
  const rows = Object.entries(d)
    .map(([id, cols]) => `${id}: ${Object.entries(cols).map(([c, n]) => `col ${c}+ ×${n}`).join(', ')}`)
    .join('\n');
  const body = `O que achou do jogo?\n\n(escreva aqui)\n\n---\nResumo automático (pode apagar):\nMortes: ${totalDeaths()}\n${rows}`;
  return `https://github.com/paulociano/prisma/issues/new?title=${encodeURIComponent('Feedback do jogo')}&body=${encodeURIComponent(body)}`;
}
