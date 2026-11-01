# PRISMA — Guia do Projeto (nome provisório)

> Plataforma 2D de aventura com temática LGBTQIA+. São 7 mundos, um para cada cor do arco-íris, com fases, chefões e uma história.
> Visual: ilustrações com cara de **render 3D estilizado**, usadas como sprites 2D.
> Tecnologia: **Phaser 3 + TypeScript + Vite**. Roda no navegador (PC e celular) e pode ser publicado no itch.io.
> Arte: **ChatGPT (GPT-Image)**. Os prompts estão em [PROMPTS.md](PROMPTS.md).

---

## 1. Conceito

### História
Prisma é um mundo onde cada pessoa brilha com a própria cor. **Monocromo**, um rei feito de neblina cinza, acredita que a diferença causa caos. Ele lança a **Grande Desbotada**: as cores somem, as pessoas viram silhuetas cinzentas e todos passam a se esconder.

**Íris**, uma pessoa jovem não-binária, ainda tem um brilho. A echarpe que ela usa guarda a última luz do Prisma. Com a ajuda de **Faísca**, um pequeno cristal-fada, Íris atravessa os 7 mundos para devolver cada cor. Em cada mundo existe um guardião aprisionado e um chefão que é a forma de um sentimento que apaga as pessoas: julgamento, vergonha, medo, isolamento, silêncio, dúvida e conformidade.

**Regra central do tom:** Íris não mata ninguém. Quando um inimigo é derrotado, ele **recupera a própria cor** e fica feliz. Os chefões também se transformam no final. É uma história de restauração, não de destruição.

### Os 7 mundos
As cores e os significados vêm da bandeira original de Gilbert Baker.

| # | Cor | Significado | Mundo | Guardião (aliado) | Chefão | Habilidade ganha |
|---|-----|-------------|-------|-------------------|--------|------------------|
| 1 | Vermelho | Vida | **Vale do Coração**: floresta outonal, flores em forma de coração | **Mãe Rubi**, drag queen mentora | **Juiz de Pedra**, golem do Julgamento | Pulo duplo |
| 2 | Laranja | Cura | **Cânion do Entardecer**: deserto, fontes termais | **Sol & Luna**, casal lésbico de curandeiras | **Serpente das Areias**, a Vergonha | Dash |
| 3 | Amarelo | Luz do sol | **Cidade Solar**: telhados, festival, girassóis | **Aurora**, líder intersexo do festival, usa cadeira de rodas | **Holofote Frio**, olho-máquina do Medo | Pulo na parede |
| 4 | Verde | Natureza | **Selva Esmeralda**: cipós, cachoeiras | **Ramo**, jardineiro gay | **Espinheira**, planta do Isolamento | Planar (echarpe) |
| 5 | Azul/Turquesa | Arte e magia | **Recife Turquesa**: corais, galeria submersa | **Marina**, artista trans do mar | **Kraken do Silêncio** | Disparo de prisma |
| 6 | Anil | Serenidade | **Ilhas do Céu Anil**: ilhas flutuantes, observatório | **Bix**, astrônome bissexual | **Eclipse**, mariposa da Dúvida | Mergulho estelar (ground pound) |
| 7 | Violeta | Espírito | **Cidadela Cinza**: o castelo de Monocromo, que vai virando violeta | **Ás**, cavaleiro assexual | **Monocromo** (chefão final, 2 fases) | — |

**Estrutura:** cada mundo tem **3 fases + 1 fase de chefão**, ou seja, 28 fases. O guardião fica preso na fase 3 e dá a nova habilidade ao ser libertado. As habilidades permitem voltar a fases antigas e pegar segredos que antes eram inacessíveis.

### Mecânica central: a cor volta
Toda a arte é gerada **colorida**. O jogo deixa as cenas em escala de cinza por shader, e a cor volta conforme o progresso: cada inimigo restaurado, cada checkpoint ativado e cada fase concluída devolvem um pouco. Isso tem duas vantagens: você gera cada imagem uma vez só, e o efeito visual é forte.

### Controles e sistemas
- **Movimento:** andar, correr, pular (com pulo variável e "coyote time"), além das habilidades de cada mundo.
- **Ataque:** golpe de echarpe (corpo a corpo); a partir do mundo 5, também disparo de prisma.
- **Vida:** 3 corações. Corações extras aparecem nas fases.
- **Coletáveis:** **Faíscas** (valem como moedas; 100 dão uma vida) e **3 Fragmentos de Prisma** escondidos em cada fase (destravam extras e o final verdadeiro).
- **Checkpoints:** bandeiras cinzentas que ganham cor quando tocadas.
- **Mapa-múndi:** um caminho em arco-íris que liga as fases.
- **Save automático** no navegador.
- **Controle:** teclado, gamepad e toque na tela (celular).

### Acessibilidade (obrigatório num jogo sobre cores)
- **Nenhuma mecânica depende só de cor.** Tudo tem forma, ícone ou som diferente.
- Modo daltônico e opção de alto contraste.
- **Modo Assistido:** invencibilidade, pulo infinito e velocidade reduzida. Não penaliza o jogador e não muda o final.
- Teclas remapeáveis, legendas em todos os diálogos e opção de reduzir tremor de tela e flashes.
- Idiomas: PT-BR (principal) e EN.

---

## 2. Especificações técnicas dos assets

| Item | Valor |
|------|-------|
| Resolução do jogo | 1280×720 (escala para qualquer tela) |
| Grade de fase | Blocos de 64 px |
| Altura de Íris na tela | ~110 px |
| Formato | **PNG** |
| Fundo | **Transparente** em sprites, objetos e camadas de parallax próximas. Opaco só no céu distante, nas cutscenes e nas telas cheias |
| Tamanhos do ChatGPT | Quadrado 1024×1024 · Paisagem 1536×1024 · Retrato 1024×1536 |

**Você não precisa redimensionar nem recortar nada.** Eu vou escrever um script que:
1. remove resto de fundo e limpa as bordas;
2. separa os frames de cada sprite sheet automaticamente, detectando cada figura;
3. alinha os pés na mesma linha e redimensiona tudo na escala do jogo;
4. monta os atlas de textura que o Phaser usa.

Para isso funcionar, há **uma regra que não pode ser quebrada: nos sprite sheets, as figuras não podem se tocar.** Se encostarem, gere de novo.

### Nome dos arquivos
Salve cada imagem **com o nome exato** indicado em PROMPTS.md, na pasta indicada. Exemplo: `assets/raw/personagens/iris_run.png`.
Se gerar mais de uma versão, use `_v2`, `_v3`. Eu uso sempre a de número mais alto.

---

## 3. Como usar o ChatGPT para manter a consistência

Manter o mesmo personagem em todas as imagens é o maior desafio de arte com IA. Siga este método:

1. **Crie um Projeto no ChatGPT** chamado "PRISMA – Arte". Nas *instruções do projeto*, cole o **Guia de Estilo** (seção 0 do PROMPTS.md). Assim ele vale para todas as conversas do projeto.
2. **Abra uma conversa nova para cada grupo de assets**: uma para Íris, uma para o Mundo 1, e assim por diante. Conversas muito longas perdem consistência.
3. **Sempre anexe as imagens de referência** indicadas no prompt, com o botão de clipe. Por exemplo, todo sprite de Íris leva anexado o `iris_ref_sheet.png` aprovado.
4. Para corrigir algo, **não reescreva o prompt inteiro**. Peça a mudança específica, por exemplo: *"Same image, but the scarf must be white, and the characters must not touch each other."*
5. Se o fundo vier quadriculado ou branco em vez de transparente, peça: *"Regenerate with a real transparent background (PNG alpha)."*
6. **Aprove o estilo antes de gerar em massa.** Os assets 00_estilo definem todo o resto. Se eles não estiverem ótimos, nada mais vai ficar.

---

## 4. Passo a passo completo

### ETAPA 0: Preparação (você, ~30 min)
- [ ] Instalar o **Node.js LTS**: https://nodejs.org
- [ ] Instalar o **VS Code** (opcional, para abrir os arquivos)
- [ ] Criar o Projeto "PRISMA – Arte" no ChatGPT com o Guia de Estilo nas instruções
- [ ] Decidir o nome final do jogo. "PRISMA" é provisório e o logo depende dele

### ETAPA 1: Bíblia visual (você; 5 imagens)
Gere o **Lote 1** do PROMPTS.md: a arte-chave, a ficha de Íris, a ficha de Faísca, a ficha dos inimigos-base e a dos habitantes.
- [ ] Envie as imagens aqui para eu avaliar consistência, legibilidade em tamanho pequeno e contraste.
- [ ] Ajuste até aprovar. **Daqui em diante, essas imagens são as referências de tudo.**

### ETAPA 2: Base do jogo (eu; pode começar em paralelo à Etapa 1)
Enquanto você gera arte, eu monto o jogo com **formas provisórias**:
- [ ] Projeto Phaser 3 + TypeScript + Vite
- [ ] Física do jogador (pulo variável, coyote time, buffer de pulo), câmera e fases montadas por dados
- [ ] Shader de dessaturação e restauração de cor
- [ ] Pipeline de assets (o script da seção 2)
- [ ] Uma fase de teste jogável no navegador

### ETAPA 3: Fatia vertical, a Fase 1-1 completa (você + eu)
Você gera o **Lote 2** (sprites de Íris, objetos comuns, Mundo 1, HUD). Eu integro tudo.
- [ ] Você joga a fase 1-1 e me diz o que sentiu: pulo pesado ou leve, dificuldade, câmera.
- [ ] Ajustamos até ficar **gostoso de jogar**. Isso vem antes de qualquer conteúdo novo, porque é a base de tudo.

### ETAPA 4: Mundo 1 completo + Chefão 1
- [ ] Lote 3: Mãe Rubi, inimigo exclusivo do mundo, Juiz de Pedra e arena do chefão
- [ ] Eu crio as fases 1-2, 1-3 e a luta do chefão, o diálogo e o ganho do pulo duplo

### ETAPA 5: Menus e meta-jogo
- [ ] Lote 4: tela título, logo, mapa-múndi, caixas de diálogo e botões
- [ ] Eu crio menu, mapa, pausa, opções (com acessibilidade), save e seleção de idioma

### ETAPA 6: Mundos 2 a 7 (um lote por mundo)
Para cada mundo: você gera o lote do mundo (cerca de 12 imagens) e eu crio 3 fases, o chefão e a nova habilidade.
- [ ] Mundo 2 · [ ] Mundo 3 · [ ] Mundo 4 · [ ] Mundo 5 · [ ] Mundo 6 · [ ] Mundo 7 + final

### ETAPA 7: História e áudio
- [ ] Lote de cutscenes (abertura e final)
- [ ] Músicas no Suno e efeitos sonoros (prompts na seção de áudio do PROMPTS.md)
- [ ] Eu integro música por mundo, efeitos e transições

### ETAPA 8: Polimento e lançamento
- [ ] Partículas, tremor de tela, "hit-stop" e balanço de dificuldade
- [ ] Testes com 3 a 5 pessoas jogando
- [ ] Ícone, capa e screenshots para o itch.io
- [ ] Publicação (eu gero o build; você sobe na sua conta)

---

## 5. Como rodar o jogo

Na pasta `C:\Projetos\jogo`:

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências (só na primeira vez) |
| `npm run assets` | Processa as imagens novas de `assets/raw` e gera os sprites do jogo. **Rode sempre que salvar imagens novas** |
| `npm run dev` | Abre o jogo em http://localhost:5173 (recarrega sozinho quando o código muda) |
| `npm run build` | Gera a versão final em `dist/` para publicar |

**Controles:** ← → ou A/D andam · Espaço, Z ou ↑ pula (segure para ir mais alto) · X ou J dá o golpe de echarpe · SHIFT ou L dá o dash (depois do Mundo 2) · encostar numa parede no ar e pular = pulo na parede (depois do Mundo 3) · segurar pular caindo = planar (depois do Mundo 4) · C ou I dispara um prisma (depois do Mundo 5) · ↓ no ar = mergulho estelar (depois do Mundo 6) · debaixo d'água, cada pulo é uma braçada · ESC ou P pausa · M liga/desliga o som · dificuldade e modo daltônico em **Opções** (tela título ou pausa)

**Faíscas e fragmentos:** a cada 50 faíscas numa fase, +1 coração (com todos cheios, vira um coração extra). Ao juntar 21 e 42 fragmentos no total, +1 coração máximo permanente em cada marco; com os 63, o final verdadeiro. · R reinicia a fase · gamepad também funciona.

**Atalhos de teste (só no `npm run dev`):** dentro de uma fase, as teclas **1 a 9** pulam direto para as fases 1-1 a 3-1 (as demais pelo mapa). O progresso (próxima fase, pulo duplo, fragmentos) fica salvo no navegador. Para recomeçar do zero, apague os dados do site no navegador.

**Sons:** salve músicas em `assets/audio/musica/` e efeitos em `assets/audio/sfx/` com os nomes da seção 8 do PROMPTS.md (mp3, ogg ou wav) e rode `npm run assets`. Cada som já está ligado ao seu evento no jogo; arquivo que ainda não existe é simplesmente ignorado.

Se o `npm run assets` avisar *"esperava N figuras, encontrei M"*, alguma figura do sheet está encostando em outra. Gere a imagem de novo.

### Estrutura do código
| Pasta | Conteúdo |
|---|---|
| `src/config.ts` | Toda a física e o balanceamento (altura do pulo, velocidade, etc.) |
| `src/levels/` | As fases, montadas por código (`w1.ts` = Mundo 1) |
| `src/objects/` | Íris (`Player.ts`) e os Desbotados (`Enemy.ts`) |
| `src/systems/` | Controles e o sistema de restauração de cor |
| `src/scenes/` | Carregamento, fase e HUD |
| `src/gfx/textures.ts` | Arte provisória usada até a arte final chegar |
| `scripts/process-assets.mjs` | O pipeline de imagens |

---

## 6. O que eu ainda preciso de você
1. **Nome do jogo** (para o logo).
2. **Aprovação dos personagens e guardiões** da tabela da seção 1. Quer trocar alguma identidade, nome ou papel?
3. **Imagens do Lote 1** assim que ficarem prontas.
4. Se quer narração ou vozes (é opcional; pode ser só texto com "falas" sonoras curtas).
