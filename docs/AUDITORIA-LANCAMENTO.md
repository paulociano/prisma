# PRISMA — Auditoria de lançamento (03/11/2026)

Escopo: código (≈11 mil linhas de TypeScript), build, assets, 28 fases, UI/UX, acessibilidade, jogabilidade, design e pipeline de publicação. Método: leitura do código, `tsc`, build, `check-levels`, testes automáticos (6 save / 3 input / 11 levels, todos passando) e captura de telas no navegador (desktop e celular em paisagem).

Limite da auditoria: o navegador de teste usa renderização por software, então **FPS e consumo de GPU não foram medidos** (os números dali não valem). Também não foi possível ouvir o áudio nem jogar as 28 fases de ponta a ponta com uma pessoa.

Legenda: 🔴 bloqueia o lançamento · 🟠 importante · 🟡 polimento · ✅ já está bom.

---

## 1. Resumo
O jogo está **sólido em conteúdo e em qualidade técnica** (todas as fases passam na checagem de alcance, save e entrada têm testes, boas opções de acessibilidade). Os riscos de lançamento estão em **três frentes**: (1) peso de download e tempo de carregamento, (2) ausência de controle por toque, (3) ensino e configuração de controles. Nenhum deles é difícil, mas os dois primeiros decidem se o jogo será jogado no celular e por quem tem internet média.

---

## 2. Desempenho e entrega

| # | Achado | Nível | Recomendação |
|---|---|:-:|---|
| 2.1 | O jogo baixa **tudo de uma vez**: ≈219 MB (181 MB de imagens, 38 MB de áudio) antes da tela título. O `BootScene` carrega o manifest inteiro. | 🔴 | Carregar por mundo: só `comum` + mundo 1 no início; mundos seguintes carregam em segundo plano ou ao entrar no mapa do mundo. Meta: **< 25 MB até o primeiro jogo**. |
| 2.2 | PNGs enormes: `w3_boss_attack` 5,4 MB, vários de 4–5 MB; fundos `*_bg_mid` ≈ 4,5 MB. Mundo 7 sozinho = 33 MB. | 🔴 | Converter para **WebP** (qualidade 80–85, costuma ficar 70–85% menor), reduzir resolução dos fundos para o tamanho real de uso e quantizar sprites. Meta: sprites ≈ 40–50 MB no total. |
| 2.2b | Áudio: 33 MB de música em MP3 (≈4 MB por faixa). | 🟠 | Reencodar em **OGG/MP3 96–128 kbps** (≈ 2 MB por faixa) e carregar a música do mundo sob demanda. |
| 2.3 | Sem cache/versão de assets: ao publicar de novo, o navegador pode servir arquivos antigos. | 🟠 | Adicionar hash ao nome dos assets processados (ou `?v=`) e fixar um `version` no manifest. |
| 2.4 | Filtro de cor (`postFX.addColorMatrix`) aplicado ao mundo inteiro, mais avisos de "GPU stall due to ReadPixels" durante o jogo. | 🟠 | Medir em celular real de entrada. Se o FPS cair, desligar o filtro em modo "Reduzir movimento" ou usar tint por camada. Localizar a origem do `readPixels` (provavelmente texturas geradas em tempo de execução) e fazer isso só uma vez no carregamento. |
| 2.5 | O bundle JS tem 1,7 MB (Phaser inteiro). | 🟡 | Aceitável. Se quiser ganhar, importar só os módulos usados do Phaser (build custom). |
| 2.6 | Sem WebGL a tela ficava preta. | ✅ corrigido | Agora aparece uma mensagem explicando como ativar a aceleração. |
| 2.7 | GitHub Pages: deploy automático e checagem de artefatos no workflow. | ✅ | Acrescentar `npm run test:*` e `check-levels` ao `deploy-pages.yml` antes do build, para nunca publicar com teste quebrado. |

---

## 3. Entrada e controles

| # | Achado | Nível | Recomendação |
|---|---|:-:|---|
| 3.1 | **Não existe controle por toque.** O `viewport` do HTML já pensa em celular, mas só há teclado e gamepad. No celular o jogo abre e não dá para jogar. | 🔴 | Controles de tela: direcional esquerdo (←/→ + ↓), botões à direita (Pular, Golpe, Dash, Tiro), pausa no canto. Botões ≥ 56 px lógicos, zona de pulo grande, opção de trocar de lado. Ligam em `Controls.ts` sem mexer no `Player`. Se o público do lançamento for desktop, declare "melhor no computador" na página. |
| 3.2 | Textos de dica dizem só teclas ("ESPAÇO pular", "X golpe") mesmo com gamepad conectado. | 🟠 | Trocar o texto conforme o último dispositivo usado (A/X/B/Y no gamepad; ícones de toque no celular). |
| 3.3 | Não há **tela de controles** nem remapeamento. O jogador só aprende na fase 1-1 e não consegue rever depois. | 🟠 | Adicionar "Controles" em Opções e na Pausa (lista de teclas/botões). Remapeamento pode ficar para depois. |
| 3.4 | Opções não têm **volume** (só mudo com a tecla M). | 🟠 | Sliders de música e efeitos (0–100%), salvos em `Settings`. |
| 3.5 | Teclado: múltiplas teclas por ação (Z/Espaço/↑/W/K etc.), bom. Gamepad: A pula, X golpe, B tiro, R1/Y dash. | ✅ | Documentar no jogo. |
| 3.6 | Dica de navegação nos menus ("↑ ↓ escolher · ENTER confirmar") não aparece em toque/gamepad e é pequena. | 🟡 | Mostrar a dica certa por dispositivo; em toque, esconder. |

---

## 4. UI / UX

| # | Achado | Nível | Recomendação |
|---|---|:-:|---|
| 4.1 | Textos pequenos para telas pequenas: legendas de menu em 16–18 px do canvas 1280×720 viram ≈ 7–8 px em um celular em paisagem. | 🟠 | Mínimo de 22 px no canvas para qualquer texto informativo; botões das Opções com texto ≥ 26 px. Já foi aplicado auto-ajuste no pergaminho; falta nas notas de dificuldade/daltonismo e nos avisos do mapa. |
| 4.2 | Opções ocupam toda a altura em tela baixa (6 controles empilhados). | 🟡 | Dividir em abas (Jogo / Acessibilidade / Som) quando entrar volume e controles. |
| 4.3 | Telas principais (título, Opções, Pausa, pergaminho, créditos) estão **consistentes e bonitas**; hierarquia clara, botões com estado. | ✅ | — |
| 4.4 | Sem confirmação em "Reiniciar fase" e "Mapa do mundo" na Pausa. | 🟡 | Confirmar só quando houver progresso na fase (fragmentos/checkpoint). |
| 4.5 | O save não tem tela de "continuar/apagar" clara no título (aparece "Continuar" quando há progresso). | 🟡 | Incluir "Novo jogo (apaga progresso)" com confirmação dupla nas Opções. |
| 4.6 | Pergaminho de bandeirola: texto longo se ajusta sozinho; não há botão de "reler" depois. | 🟡 | Galeria "Bandeirolas coletadas (n/12)" no mapa-múndi, para reler (o save já guarda `p:<id>`). |

---

## 5. Acessibilidade
✅ Pontos fortes: modo daltônico (3 tipos), reduzir flashes, tremor, movimento, sinais visuais extras, dificuldade Tranquilo/Normal/Desafiador, respeito a `reduceMotion` na vinheta de risco.

| # | Achado | Nível | Recomendação |
|---|---|:-:|---|
| 5.1 | Legendas e diálogos: sem opção de **tamanho do texto** nem de velocidade/auto-avanço. | 🟠 | Opção "Texto grande" (+25%) e "Diálogo automático". |
| 5.2 | Sons importantes (perigo, chefe) dependem de áudio; há sinais visuais extras, mas sem legenda de som. | 🟡 | Ícone/legenda curta para: aviso de fissura, tiro de inimigo, chefe atacando. |
| 5.3 | Contraste do texto sobre as artes (créditos, hints) usa contorno; está ok. Verificar contraste do roxo `#7a3c8a` sobre o pergaminho (≈ 5:1, ok). | ✅ | — |
| 5.4 | Conteúdo sensível: as bandeirolas citam fatos (datas, nomes, leis) **não verificados por fonte externa**. | 🟠 | Revisão por pessoas da comunidade antes de lançar (e checagem das datas do STF/OMS/CFP). |

---

## 6. Jogabilidade, níveis e fases

Dados: 7 mundos × 4 fases = 28 (21 de exploração, 7 chefões). Fases 244–272 colunas de largura (≈ 4–5 min cada), com variantes altas (22 linhas). Mundo 5 (água) tem 3 fases baixas e sem extensões/bandeirolas.

| # | Achado | Nível | Recomendação |
|---|---|:-:|---|
| 6.1 | Todas as fases passam em `check-levels` (alcançáveis com a física real). | ✅ | Rodar no CI. |
| 6.2 | Curva de dificuldade: sobe só +0,25 por mundo na seleção de trechos e +5% de velocidade dos inimigos por mundo. A diferença entre mundo 1 e 2 é pequena; pico real está nos chefões. | 🟡 | Playtest com 3–5 pessoas novatas; medir mortes por trecho (telemetria local) e achatar picos. Considerar +0,35 por mundo. |
| 6.3 | A fase 1-1 ensina bem (uma ideia por trecho). Habilidades novas (parede, planar, mergulho, dash) são introduzidas ao longo dos mundos. | ✅ | Garantir que cada habilidade tenha um "momento de ensino" seguro antes do primeiro uso obrigatório. |
| 6.4 | Chefões: ataques legíveis, mas fissuras/espinhos precisavam de arte (agora com arte). | ✅ corrigido | Validar nos 7 chefões que o aviso (≈ 1,2 s) é suficiente no "Desafiador". |
| 6.5 | Sem **telemetria/feedback** do jogador (onde morre, onde desiste). | 🟠 | Contador local de mortes por fase/trecho + botão "enviar feedback" (link para formulário). Ajuda a calibrar o item 6.2. |
| 6.6 | Quedas e espinhos ficam legíveis (perigos fora do filtro de cor). Checkpoints curam no Normal. | ✅ | — |
| 6.7 | Colecionáveis: 63 fragmentos, 12 bandeirolas, câmaras secretas, baús. Recompensa por explorar é boa. | ✅ | Mostrar no mapa quais fases têm itens faltando (ícone). |
| 6.8 | Duração total estimada: 28 fases × 4–5 min ≈ 2–2,5 h, mais secretos. Bom para um jogo de navegador. | ✅ | — |

---

## 7. Design e arte
✅ Direção de arte coerente (storybook pintado), personagens e cenários fortes, pergaminho e créditos agora integrados.

| # | Achado | Nível | Recomendação |
|---|---|:-:|---|
| 7.1 | Algumas peças ainda procedurais (caixa selada, entulho, bump fantasma etc.) misturadas com arte pintada. | 🟡 | Ligar `caixa selada` e `entulho` (já gerados em `level_blocks`) e revisar o resto em jogo. |
| 7.2 | Fundos `mid` pesam muito para o ganho visual. | 🟠 | Ver 2.2. |
| 7.3 | Logo, favicon e imagens de compartilhamento: `<title>Prisma</title>` e sem ícone, sem `og:image`/descrição. | 🟠 | Favicon (gema), `meta description`, `og:title/og:image` com a key art, `theme-color`. |

---

## 8. Qualidade e manutenção
| # | Achado | Nível | Recomendação |
|---|---|:-:|---|
| 8.1 | `GameScene.ts` com 2 200 linhas. | 🟡 | Extrair por responsabilidade (portais/portas, baús, bandeirolas, chefes) quando houver tempo; não bloqueia lançamento. |
| 8.2 | Testes cobrem save, entrada e níveis; não cobrem cenas/UI. | 🟡 | Um teste de fumaça com Playwright (abre título → inicia 1-1 → anda → pausa) no CI. |
| 8.3 | Save em `localStorage` com validação e `try/catch`. | ✅ | Considerar exportar/importar progresso (texto) para quem troca de aparelho. |
| 8.4 | Sem tratamento global de erro em produção. | 🟡 | `window.onerror` que mostra "Algo deu errado, recarregue" e preserva o save. |

---

## 9. Lista priorizada para o lançamento

**Antes de publicar (bloqueadores)**
1. Carregamento por mundo + imagens em WebP + áudio mais leve (itens 2.1, 2.2, 2.2b). Meta < 25 MB iniciais.
2. Controles de toque **ou** aviso claro de "jogue no computador" (3.1).
3. Revisão por pessoas da comunidade dos textos das bandeirolas (5.4).

**Logo em seguida (alto impacto, baixo esforço)**
4. Volume música/efeitos + tela de controles (3.3, 3.4).
5. Dicas por dispositivo (3.2) e texto mínimo de 22 px (4.1).
6. Favicon, descrição e imagem de compartilhamento (7.3).
7. Testes e `check-levels` no workflow de deploy (2.7); versão/hash dos assets (2.3).

**Depois do lançamento**
8. Telemetria local de mortes e botão de feedback (6.5) para calibrar a curva (6.2).
9. Galeria de bandeirolas (4.6), opções de texto grande/diálogo automático (5.1), legenda de sons (5.2).
10. Refatorar `GameScene` (8.1) e teste de fumaça de UI (8.2).

## 10. Já corrigido nesta auditoria
- Aviso amigável quando o navegador não tem WebGL (antes: tela preta).
