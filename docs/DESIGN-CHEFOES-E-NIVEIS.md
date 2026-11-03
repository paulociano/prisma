# Design: chefões, transições, níveis e recompensas

Proposta de design baseada no código atual. Cada seção diz **o que já existe**, **a ideia** e **como entra no código** (arquivos e ganchos reais), com esforço estimado (P/M/G) e risco. Nada aqui está implementado ainda.

Regras que valem para tudo:
- Flashes e raios respeitam `canFlashScreen` (opção "Reduzir flashes"); tremor respeita "Reduzir tremor"; ambiente respeita "Reduzir movimento". Todo efeito de tensão precisa ter uma versão sem flash (escurecer/sacudir suave em vez de piscar).
- Cor é a mecânica central (`ColorRestore`): dano ao chefe = devolver cor ao cenário. Os efeitos abaixo devem reforçar isso, não competir com ele.
- Qualquer fase nova passa por `npm run test:levels` e `npm run check-levels` (alcance com a física real).

---

## 1. Mundo 7 — transição Boss 1 → Boss 2 ("as máscaras caíram")

**Hoje:** `Monochrome.takeHit()` → com `hp<=0` e `phase===1` chama `transform()`: pose `END.cracked`, 700 ms depois `END.crumble` + shake + burst, 1600 ms depois `phase=2`, nome "Monocromo · forma final", `camera.flash`. É uma troca rápida, sem fala e sem o jogador perceber o que mudou na história.

**Ideia — "O Último Rosto" (≈6 s, sem tirar o controle por muito tempo):**

| t | Palco | Efeito |
|---|---|---|
| 0,0 | Último golpe. Tempo "congela" 120 ms (hit-stop), música corta para um drone grave | vinheta escura nas bordas; `state='transform'`; tiros e perigos somem |
| 0,4 | Primeira máscara racha (frame `END.cracked`), fissura de luz branca | 1 raio fino no fundo (`Ambient.lightning`, versão curta), sem flash cheio |
| 1,2 | Dialogue curto (3 falas, auto-avança, pulável com o botão de pular) | cenário vira quase P&B (cor cai a 0 só no fundo) — o oposto de restaurar |
| 2,2 | Máscara cai em pedaços (`END.crumble`): cacos giram em direção à câmera | **rajada de 3 flashes rápidos** (60 ms cada, 150 ms de intervalo) alternando branco/violeta; shake forte |
| 3,0 | Revelação: por baixo, outro "rosto" — o de Íris/Faísca? (o vilão veste as próprias máscaras: as dos amigos que apagou) | escuro total 300 ms, depois raio grande com `fx_ray` varrendo a arena |
| 4,0 | Forma 2 entra (armadura de cristal) | flash final suave (`flash(300, 230,220,255)` já existe) + HUD de HP reenche com animação |
| 5,5 | Controle volta, nome do chefe aparece em letreiro | música da forma 2 |

**Diálogo "as máscaras caíram"** (formato `Line {who, mood, text}` de `src/story/w7.ts`; tom a ajustar pelo roteirista):
1. Mono: "Cada máscara era um mundo que eu aprendi a apagar." 
2. Íris: "Então por que ainda dói te ver cair?" 
3. Spark (Faísca): "Íris… ele não está sem rosto. Está sem *cor*." 
4. Mono (ao revelar): "Sem máscara… eu sou o que sobrou de vocês."

**Gancho de código:** hoje `Boss` não tem como pausar o jogo para falar. Adicionar ao `BossHost` um `host.cinematic(lines, onDone)` que chame o `talk()` já usado em `bossDefeated()`. `transform()` vira uma sequência em passos (`timeline([...])` com `delayedCall`) e chama `host.cinematic` entre as etapas 2 e 3.

**Raios/flashes:** criar `Ambient.stormBurst(count, gap)` reutilizando `lightning` (já existe); chamada via `host.stormFlash()` que checa `canFlashScreen()`. Se desativado: troca por pulso de brilho em `ColorMatrix` (sem piscar branco).

**Esforço:** M · **Risco:** fotossensibilidade (mitigado pelas opções) · **Teste:** snapshot da pose e do estado (`phase`, `hp`) após `transform()`.

---

## 2. Chefões × cenário

**Hoje:** o chefe e as fases só se encontram pelo chão da arena (`ARENA_FLOOR`) e por `host.burst`. O cenário é só fundo.

**Ideias (uma por chefe, reaproveitando entidades que já existem):**

- **Poder muda o chão:** ataque que *racha* plataformas — usa `cracked` em runtime (hoje só é criado em `buildEntities`). Novo `host.crackTile(col,row)` cria o bloco e o jogador o destrói com mergulho (`poundImpact`) ou o chão cai após 1 s.
- **Cenário como arma do jogador:** caixas (`crates`) e blocos rachados ficam pendurados; o jogador os derruba sobre o chefe (overlap caixa × `boss.hit`) = dano extra/vulnerabilidade, em vez de só atirar.
- **Escuridão/ luz (Mono, M7):** o chefe apaga um trecho da arena (`ColorRestore` local: faixa em P&B que bloqueia visão); a faísca do jogador reacende o trecho, e só ali o chefe fica vulnerável.
- **Clima da arena reage ao dano:** `arenaFx` ganha parâmetro `intensity` (0..1) ligado ao HP do chefe: mais névoa/raios quando ele está bem, céu limpando conforme cai. Custa quase nada (alpha dos layers do `Ambient`).
- **Correntes e vento:** o chefe gera `vent` (já existe como entidade) temporário que lança o jogador para cima/alto — abre acesso a plataformas altas onde fica o ponto fraco.

**Gancho:** `BossHost` ganha `spawnProp(type,col,row,ttl)` e `crackTile`. **Esforço:** M–G (por chefe) · **Prioridade:** começar com "caixas caem no chefe" (barato, valor alto).

---

## 3. Dano visual progressivo e derrota explosiva

**Hoje:** sprites `w7_boss_p{1,2}_{idle,attack,end}`; `END.cracked/crumble/burst/restored` só aparecem no hit final/derrota. Em hit normal usa `END.cracked` por 0,9 s ("hurt").

**Ideia — rachaduras acumulativas, sem arte nova obrigatória:**
1. **Camada de rachaduras por shader/sprite:** textura procedural `fx_crack` (linhas ramificadas, gerada em `gfx/fx.ts`) desenhada sobre o chefe com `setMask` do sprite; a opacidade/quantidade de linhas = `1 - hp/maxHp`.
2. **Peças se soltando:** a cada hit, 3–6 "cacos" (recortes do próprio sprite via `Phaser.GameObjects.Image.setCrop` ou partículas com o frame) caem do corpo com física leve e somem.
3. **Cor vazando:** das rachaduras sai luz arco-íris (`RAINBOW` de `config.ts`), uma cor por hit, usando `fx_glow` + partículas — liga a mecânica de cor ao dano.
4. **Tremida/cambaleio:** `view.x` jitter proporcional ao dano.
5. **Derrota:** `defeat()` já faz cracked→crumble→burst→restored. Adicionar: explosão em *anel* arco-íris (7 partículas, uma por cor), `cameras.main.flash` suave, câmera lenta de 400 ms (`time.timeScale`/`physics.world.timeScale`), cacos coloridos subindo e virando as faíscas do cenário, cenário recuperando cor (`color.complete()` já faz).

**Acessibilidade:** a luz vazando respeita `reduceFlashes` (sem pulsar rápido); `reduceMotion` reduz número de partículas.

**Esforço:** M · **Risco:** performance (limitar a 40 partículas simultâneas).

---

## 4. Layouts variados

**Hoje:** `LevelBuilder` (tiles de 64 px, 12 linhas × ~130 colunas) e `scripts/reach-check.ts` assumem fases horizontais; a câmera segue o jogador em x.

### 4.1 Fases verticais ("A Torre", "O Poço")
- **Dados:** `LevelData` aceita `rows` grande (ex.: 60×20). `rows` já é lido por `checkLevel` (simulação), então o validador funciona sem mudança.
- **Câmera:** hoje `cam.scrollX` guia o parallax (ver `Ambient`/`buildBackground`). Criar `level.axis: 'x' | 'y' | 'both'`; para `y`, o parallax usa `scrollY` e o TileSprite vertical.
- **Mecânicas que fazem sentido:**
  - *Subida*: molas (`spring`), correntes (`vent`), wall-jump entre paredes, plataformas que somem (`cracked`) — o "chão" sobe junto com a pressão.
  - *Descida*: queda controlada com planar (`glide`), mergulho (`pound`) para quebrar o piso, espinhos laterais.
  - *Perseguição*: água/escuridão que sobe (usa a ColorMatrix: faixa P&B que sobe e "apaga" o jogador se alcançar).
- **Checkpoints:** a cada ~15 linhas.

### 4.2 Mapas mesclados (híbridos)
- Estrutura em **salas conectadas** (estilo metroidvania leve): cada sala é um `LevelBuilder` de 40×24; portas com ids ligam salas; o jogo carrega a sala vizinha sem fade longo.
- **Navegação:** minimapa simples no HUD (salas visitadas), atalhos que só abrem depois (interruptor/chave) para encorajar voltar.
- **Primeira entrega:** 1 fase por mundo com um "braço vertical" no meio (em L), usando o gerador `extend.ts` com um bloco novo `shaft` (poço de 12 linhas) — barato e testável.

**Esforço:** G (câmera + dados + validador) · **Risco:** alto (câmera, parallax, save/checkpoint). Fazer em ordem: `shaft` dentro de fase horizontal → fase vertical completa → salas conectadas.

---

## 5. Exploração oculta

- **Entradas secretas:**
  - parede de `cracked` que só aparece quebrada com mergulho (pista: rachadura + brilho tênue + uma moeda "mostrando" o caminho);
  - cano/porta atrás de um *falso fundo* (tile que vira transparente quando o jogador chega perto — alpha tween);
  - pulo de fé: moedas em arco que acabam no vazio levam a uma plataforma oculta;
  - interruptor em local arriscado que revela a entrada em outro ponto da fase (som e câmera indicam).
- **Sub-níveis (cápsulas de 20–40 colunas):** `LevelData` curtas (`sub: true`) carregadas como cena filha ou mesmo `GameScene` com `parent`: mini-desafios temáticos (só moedas, só puzzle de caixas, speed-run de 20 s, parkour de espinhos). Saem num ponto equivalente na fase principal.
- **Recompensa:** fragmento extra (o jogo já tem `shards` 3 por fase) — por exemplo um **quarto fragmento secreto** por fase, que conta para um final alternativo; ou coração máximo (`extraHeart` em `Save.ts` já existe como habilidade).
- **Save:** `save.secrets[levelId] = string[]`; mostrar no cartão da fase no mapa (`◆ 3/3  ✦ 1/1`).

**Esforço:** M (entradas) + M (sub-níveis) · **Risco:** retorno ao ponto correto e checkpoint dentro do sub-nível.

---

## 6. Densidade de plataforma, blocos interativos e puzzles

**Hoje:** `extend.ts` monta trechos com "beats" (mountain, islands, crates, tower, twoRoutes, pit, vent, mover, chimney, searchlight). Entidades: `crate`, `cracked`, `spring`, `mover`, `vent`, `checkpoint`.

### Novos blocos (todos em `LevelBuilder` + `GameScene.buildEntities`)
| Bloco | Comportamento | Base no código |
|---|---|---|
| **Bloco-surpresa** (`bump`) | Cabeçada de baixo: bloco sobe 8 px, solta moeda/coração/faísca e vira "vazio" | colisão do `player` com `body.blocked.up` + tween; usa `pickup()` já existente |
| **Bloco de peso** (`weight`) | Cai ao ser pisado/atingido pelo mergulho; abre passagem | `poundImpact` já detecta alvo abaixo |
| **Caixa empurrável** (`pushbox`) | Arcade body dinâmico, `drag`; vira escada ou pesa um botão | físico simples |
| **Botão de pressão** (`plate`) + **portão** (`gate`) | Plate segura aberto enquanto há peso (caixa/jogador) | overlap + estado |
| **Interruptor atirável** (`target`) | Tiro de prisma ativa (cor + som) | `pshots` overlap já existe |
| **Esteira/gelo** | Atrito alterado | `PHYS` por tile |
| **Plataforma temporizada** | Aparece/desaparece em ritmo, com aviso visual | similar a `mover` |

### Puzzles físicos simples (3 padrões reutilizáveis)
1. **Ponte de caixas:** empurre/empilhe para atravessar um vão de 4 blocos sem pulo duplo.
2. **Placa + portão:** a caixa fica sobre a placa; o jogador atravessa; se a caixa cair, o portão fecha.
3. **Contrapeso:** dois botões, um perto e outro longe; o tiro ativa o longe.

### Aumentando a densidade
- No `extend.ts`, dar a cada beat uma variante "desafio" (+ blocos acima do chão com moedas em risco, saltos encadeados).
- Regra: a cada 20 colunas, **um** micro-desafio opcional (recompensa) e **um** obrigatório (progresso). Medir com `npm run check-levels`.

**Esforço:** M por bloco; começar por `bump` + `pushbox/plate/gate`. **Risco:** `reach-check` precisa tratar o novo bloco como "quebrável/atravessável" (conservador).

---

## 7. Recompensas dinâmicas e corações

**Hoje:** `heart` é uma coleta fixa no mapa; `crate` dá cor; `extraHeart` é desbloqueio permanente.

**Ideias (todas recompensam risco, não grind):**
- **Bloco-surpresa** (6): o conteúdo muda com a *situação* — se a vida está baixa, vem coração; senão moeda/faísca. Evita "cura no fim da fase" mas ajuda quem está mal.
- **Coração-risco:** corações em lugares perigosos (ilha sobre espinho, depois do salto de fé). Brilho suave que aparece quando o jogador está com 1 coração (hint de risco/recompensa).
- **Corrente de combo:** restaurar 5 inimigos sem tomar dano faz o próximo inimigo soltar um coração (contador no HUD, some ao ser atingido).
- **Cofre do cenário:** o mini-puzzle (placa + portão) abre um baú com coração + fragmento extra.
- **Chuva de cura no chefe:** ao ficar com 1 coração no boss, 1 vez por luta, cai um coração do céu em ponto aleatório da arena (indicado por sombra) — consolo justo.
- **Faísca (companheira):** se o jogador ficar parado por X s em lugar seguro, a Faísca "encontra" uma moeda escondida (sinal sonoro).

**Esforço:** P–M · **Dependências:** `bump` e `plate/gate`.

---

## 8. Ordem sugerida de implementação

1. **Fase 1 (baixo risco, alto efeito):** dano visual progressivo + derrota arco-íris (seção 3); `stormBurst` e flashes com opção (seção 1, só efeitos).
2. **Fase 2:** transição M7 completa com diálogo (`host.cinematic`) e arte do "último rosto".
3. **Fase 3:** `bump`, `pushbox`, `plate/gate` + recompensas dinâmicas (6 e 7) e densidade no `extend.ts`.
4. **Fase 4:** entradas secretas e sub-níveis curtos (5).
5. **Fase 5:** `shaft` e fases verticais; por fim salas conectadas (4).

## 9. Perguntas em aberto
- Qual é a identidade do rosto sob a máscara (Íris/Faísca/outro)? Isso define as falas do item 1.
- Fases verticais: câmera que segue o jogador ou "rolante" (pressão)?
- Fragmento secreto muda o final do jogo ou só conta como colecionável?
- Quanto de arte nova (rachaduras, sprites de blocos) vem do pipeline de assets e quanto fica procedural?
