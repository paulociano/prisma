# PRISMA no itch.io — guia de publicação

## 1. Arquivo para enviar
`release/prisma-itch.zip` (≈ 48 MB, `index.html` na raiz). Para gerar de novo:
```
npm run assets && npm run build
cd dist && zip -r ../release/prisma-itch.zip .
```
No itch.io: **Create new project** → *Kind of project*: **HTML** → envie o `.zip` e marque **"This file will be played in the browser"**.

## 2. Configurações da página (Embed options)
- **Viewport dimensions:** 1280 × 720
- **Mobile friendly:** ligado, orientação **Landscape** (há controles de toque)
- **Fullscreen button:** ligado
- **Automatically start on page load:** desligado (o navegador só libera o som depois de um clique)
- **SharedArrayBuffer:** desligado · **Scrollbars:** desligado
- **Classificação:** Everyone (sem violência explícita; combate não letal)
- **Genre:** Platformer · **Tags:** `platformer`, `2d`, `colorful`, `lgbtq`, `queer`, `singleplayer`, `story-rich`, `cute`, `accessible`, `controller`, `touch-friendly`, `pixel-free` (ou `hand-painted`), `portuguese`
- **Languages:** Português (Brasil) · **Made with:** Phaser
- **Pricing:** grátis (ou "Pay what you want", com mínimo R$ 0, se quiser aceitar apoio)
- **Visibilidade:** comece em **Draft/Restricted**, teste o link e só depois mude para **Public**

## 3. Textos da página

### Título
PRISMA

### Resumo curto (campo "Short description or tagline", até 100 caracteres)
Aventura de plataforma sobre cor, coragem e pertencimento. Jogue grátis no navegador.

### Descrição (cole no editor; o itch.io aceita Markdown)
```
# Devolva as cores ao mundo 🌈

**PRISMA** é uma aventura de plataforma 2D, pintada à mão e feita para jogar no navegador, sobre cor, coragem e o direito de ser quem você é.

O mundo de Prisma começou a desbotar. Monocromo, o rei da névoa, decidiu que a diferença era perigosa, e as cores sumiram. **Íris**, uma pessoa jovem não binária, parte com **Faísca**, seu pequeno companheiro prismático, para trazer cada cor de volta.

Aqui ninguém precisa ser derrotado: **os Desbotados não são inimigos a eliminar, são seres que podem recuperar suas cores.** Pule neles, golpeie com a echarpe e veja a cor voltar ao cenário.

## O que você vai encontrar
- 🌈 **7 mundos** inspirados nas cores do arco-íris: do Vale do Coração à Cidadela Cinza
- 🗺️ **28 fases**: 21 de exploração e 7 encontros com chefões
- 💎 **63 fragmentos de prisma**, câmaras secretas, portais ocultos e baús para quem gosta de explorar
- ✨ **Habilidades que crescem com a história**: pulo duplo, dash, pulo na parede, planar, disparo e mergulho estelar
- 🏳️‍🌈 **Bandeirolas educativas**: 12 flâmulas escondidas em fases, cada uma conta um pouco de história e como respeitar e ajudar. Você pode relê-las numa galeria no mapa
- 🧠 **Preconceitos do dia a dia como inimigos**, com falas curtas que explicam o que cada um representa
- 🎨 Direção de arte de livro ilustrado, trilha própria para cada mundo e câmaras secretas com música especial

## Feito para todo mundo jogar
- Teclado, gamepad e **controles de toque** (celular e tablet, em paisagem)
- Três dificuldades: Tranquilo, Normal e Desafiador
- Modos para daltonismo (protanopia, deuteranopia, tritanopia), redução de flashes, tremor e movimento, sinais visuais extras
- Texto grande, diálogo automático e volumes separados de música e efeitos
- Progresso salvo no navegador

## Controles
| Ação | Teclado | Gamepad | Toque |
|---|---|---|---|
| Andar | ← → ou A D | analógico / direcional | ◀ ▶ |
| Pular (segure para ir mais alto) | Espaço, Z ou ↑ | A | PULAR |
| Golpe de echarpe | X ou J | X | GOLPE |
| Tiro | C ou I | B | TIRO |
| Dash | Shift ou L | Y ou R1 | DASH |
| Pausa | P ou Esc | Start | II |

## Dicas
- Segure pular para ir mais alto.
- Três fragmentos de prisma se escondem em cada fase. Junte todos para ver o final verdadeiro.
- Bandeiras de checkpoint enchem seus corações.
- Alguns blocos escondem portais: preste atenção nas faíscas.

> PRISMA é uma história sobre diversidade, amizade, acolhimento e a liberdade de existir em todas as nossas cores. Ninguém precisa se apagar para caber.

**Desenvolvido por Paulo Henrique Graciano.**
Feito com Phaser 3 e TypeScript. Código e documentação: https://github.com/paulociano/prisma

Gostou? Deixe um comentário. Seu feedback ajuda a melhorar o jogo!
```

### Aviso de acessibilidade / conteúdo (campo "Content" ou texto no fim da descrição)
Jogo com temática LGBTQIA+ e conscientização contra o preconceito. Sem violência gráfica, sem linguagem ofensiva. Contém efeitos de luz e flashes: use a opção "Reduzir flashes" em Opções > Acessibilidade.

### Mensagem de lançamento (devlog / post de divulgação)
```
PRISMA já está no ar! 🌈

Uma aventura de plataforma gratuita, no navegador, sobre devolver as cores ao mundo e o direito de ser quem você é. São 7 mundos, 28 fases, câmaras secretas e bandeirolas que contam um pouco de história e como respeitar e ajudar.

Funciona no computador e no celular (em paisagem). Se tiver um minuto, me conte o que achou nos comentários.

Obrigado por jogar!
```

## 4. Imagens necessárias (itch.io)

| Imagem | Tamanho | Observação |
|---|---|---|
| **Capa (Cover image)** | **630 × 500** px (mín. 315×250, proporção 21:17) | Aparece nas listagens e buscas. É a mais importante. |
| **Banner/fundo da página** (opcional) | 1600 × 400 ou maior, bem repetível | Pano de fundo no topo da página. |
| **Prints (Screenshots)** | 3 a 5 imagens, de 1280×720 (ou 16:9) | Use capturas reais do jogo (veja a lista abaixo). |
| **GIF** (opcional, ótimo) | 630×500, até ~3 MB | Íris pulando e restaurando um Desbotado. |

### Prompt — Capa 630×500
📎 Anexe `assets/raw/00_estilo/key_art.png` e `assets/raw/00_estilo/iris_ref_sheet.png` (estilo e personagem) · 💾 salve como `release/itch_capa.png` e reduza para 630×500 (o gerador deve produzir a mesma proporção, ex.: 1260×1000).
```
Cover art for a colorful 2D platformer game called PRISMA, landscape ratio 21:17 (about 1260x1000). Match the attached key art and character reference exactly: warm storybook painted style, crisp clean outline, glossy gem-like rainbow highlights. Composition: Íris, the young non-binary hero with short lavender-white curly hair, yellow-and-purple jacket and a flowing translucent rainbow scarf, leaps joyfully toward the viewer in the lower-right foreground, mid-jump, one arm stretched forward; Faísca, a small glowing prismatic winged companion, flies beside her. Behind them a huge vivid rainbow arcs across the sky over a layered landscape that is gray and faded on the left side and bursts into full saturated color toward the right: red heart-shaped hills, orange canyon arches, golden festival rooftops, a green waterfall jungle, turquoise coral reefs, floating blue sky islands and a violet citadel on the horizon. A soft golden sunrise glow behind Íris. In the upper-left area leave a calm, clean sky space (about 45% width, 30% height) for the title logo to be added later. Dynamic diagonal composition, strong focal point on Íris, clear silhouettes, high contrast, joyful and inclusive mood. No text, no letters, no logo, no watermark, no UI.
```
💡 Depois de gerada, coloque o logo do jogo (`assets/raw/ui/logo.png`, se existir) no espaço vazio do canto superior esquerdo e exporte em 630×500.

### Prompt — Banner/fundo da página (opcional) 1600×400
📎 `assets/raw/00_estilo/key_art.png` · 💾 `release/itch_banner.png`
```
Ultra-wide panoramic banner for a game page, ratio 4:1 (about 2400x600). Same warm storybook painted style as the attached key art. A continuous landscape seen from the side, left to right: a faded gray misty valley that gradually blooms into saturated rainbow colors — red hills with small cozy houses, orange canyon arches, golden rooftops, emerald jungle with waterfalls, turquoise reef, floating blue islands and a distant violet citadel — under a soft rainbow arc. The left and right 15% edges are calm and low-detail so the image can fade into a plain dark purple background (#120d1a). No characters in the center, no text, no logo, no UI.
```

### Prints sugeridos (capture no jogo, 1280×720)
1. Tela título com a key art.
2. Fase 1-1 em ação (Íris pulando, cenário parcialmente colorido).
3. Chefão (ex.: Tribunal de Pedra ou Sala do Trono), com a fissura de cristais.
4. Pergaminho de bandeirola aberto (ex.: Orgulho Não-Binário).
5. Mapa do mundo ou galeria de bandeirolas.
Dica: para cada print, deixe a vinheta/HUD visíveis; evite capturar com texto de diálogo cortado.
