# PRISMA — Prompts: os Desbotados do preconceito e as Bandeirolas

Complementa o `PROMPTS.md`. Cole a **Seção 0 (Guia de Estilo)** do `PROMPTS.md` nas instruções do Projeto, anexe as imagens indicadas em 📎 e cole o **Bloco de sprite sheet** no fim de cada prompt de sheet. Prompts em inglês; explicações em português. Depois de salvar os arquivos, rode `npm run assets`. Enquanto não existirem, o jogo usa arte provisória (os cinzas da ficha `faded` e flâmulas desenhadas por código).

## Princípios (valem para todos os prompts abaixo)
- Cada inimigo é a **personificação de um comportamento** (fofoca, piada, rótulo, olhar, silêncio), **nunca de um grupo de pessoas**. Nada de caricaturas de pessoas reais, nada de ofensas escritas, nada de símbolos de ódio. O vilão é a atitude, e a vitória é devolver a cor, como já é no jogo.
- Seguem a ficha dos **Desbotados**: cinza neutro com leve tom azul frio, fosco, sem cor. Quando restaurados, ficam coloridos, felizes e inofensivos (quadro 6).
- Tom: sério o bastante para ser reconhecível, leve o bastante para ser para todas as idades. Sem sangue, sem armas, sem ameaças realistas.

## Inimigos no jogo (o que já está implementado)
| Arquivo | Nome | O que representa | Comportamento | Onde aparece |
|---|---|---|---|---|
| `label.png` | **Rótulo** | Estereótipo: gente não cabe em caixinha | Anda; se encostar, "gruda etiqueta": Íris fica 35% mais lenta por 3 s | Mundos 1, 3, 6, 7 |
| `joke.png` | **Piada Azeda** | A "brincadeira" que machuca | Pula em direção a Íris em saltos curtos e previsíveis | Mundos 2, 3, 4, 7 |
| `rumor.png` | **Boato** | Fofoca e exposição da vida alheia | Paira no ar e solta anéis lentos de "sussurro" | Mundos 1, 2, 3, 7 |
| `stare.png` | **Olhar Torto** | Julgamento calado | Vigia no ar; se Íris passa embaixo, ele mira e mergulha (aviso antes) | Mundos 4, 6, 7 |
| `silence.png` | **Muro de Silêncio** | Apagamento: fingir que não existe | Anda devagar com o escudo à frente; só se vence pelas costas ou pisando | Mundos 4, 6, 7 |

A primeira vez que Íris devolve a cor a cada um, Faísca explica em duas falas o que ele representa. Os cartões de texto estão em `src/story/pennants.ts`.

Formato de todas as folhas de inimigo: **grade 3×2, 6 quadros**: 1 a 4 = movimento (loop), 5 = atingido, 6 = restaurado (colorido e feliz). Fundo transparente.

---

## A. Os cinco inimigos

📎 `padlock.png` e `megaphone.png` (mesma família de Desbotados), a ficha dos Desbotados do `PROMPTS.md` (1.4)

**A.1 Rótulo** · Paisagem · 💾 `assets/raw/inimigos/label.png`
```
Landscape 1536x1024. Enemy sprite sheet, 3x2 grid, transparent background, one creature,
side view facing right, same size and baseline in every cell.
THE CREATURE "LABEL": a squat, boxy faded-gray creature shaped like a cardboard parcel
with two stubby legs, one big round tired eye, and a long curled sticker-tag tongue that
curls out like a price label (the tag is blank, no text, no symbols). Matte desaturated
gray with a cold blue tint, slightly smug expression, like it is sure it knows everything
about you. Stylized 3D-cartoon, chunky and readable at 70 pixels tall.
frames 1-4: a waddle walk cycle (the tag-tongue swings a little);
frame 5: hit flash, squashed and surprised, the tag peeling off;
frame 6: RESTORED — the same creature now fully colorful (soft rainbow gradient box, the
tag has become a happy rainbow ribbon bow), big smiling eyes, hopping with joy.
```
*(+ SPRITE RULES)*

**A.2 Piada Azeda** · Paisagem · 💾 `assets/raw/inimigos/joke.png`
```
Landscape 1536x1024. Enemy sprite sheet, 3x2 grid, transparent background, one creature,
side view facing right, same size and baseline in every cell.
THE CREATURE "SOUR JOKE": a bouncy faded-gray jester-like blob with a wobbly lopsided grin
that looks mocking, a floppy two-pointed hat with tiny gray bells, and a squeaky-toy body
(like a deflating whoopee cushion). No sharp weapons, nothing scary, just smug and
annoying. Matte desaturated gray with cold blue tint. Stylized 3D-cartoon, chunky silhouette.
frames 1-4: a springy hop cycle (squash, stretch, in air, landing);
frame 5: hit flash, hat knocked sideways, grin gone;
frame 6: RESTORED — now colorful and genuinely cheerful, a warm real smile, rainbow hat
with golden bells, laughing WITH you (open happy eyes), bouncing.
```
*(+ SPRITE RULES)*

**A.3 Boato** · Paisagem · 💾 `assets/raw/inimigos/rumor.png`
```
Landscape 1536x1024. Enemy sprite sheet, 3x2 grid, transparent background, one flying
creature, side view facing right, centered in each cell at the same height.
THE CREATURE "RUMOR": a small faded-gray storm-cloud wisp with a tiny pair of narrow
sideways-glancing eyes and a little whispering mouth, trailing two curly wisps like
gossiping tendrils; around it, a few small ring-shaped puffs of mist. Matte desaturated
gray with cold blue tint. Floating, slightly shifty. No text, no speech bubbles with
letters. Stylized 3D-cartoon, soft and readable at 64 pixels.
frames 1-4: a gentle float with the tendrils waving and the mist rings drifting;
frame 5: hit flash, puffed up and startled;
frame 6: RESTORED — now a fluffy colorful pastel cloud with a clear open smile, tendrils
turned into little rainbow ribbons, floating happily.
```
*(+ SPRITE RULES)*

**A.4 Olhar Torto** · Paisagem · 💾 `assets/raw/inimigos/stare.png`
```
Landscape 1536x1024. Enemy sprite sheet, 3x2 grid, transparent background, one flying
creature, side view facing right, centered in each cell at the same height.
THE CREATURE "SIDE-EYE": a faded-gray floating orb with ONE large judgmental eye with a
heavy half-closed eyelid, a raised skeptical eyebrow, and two tiny gray bat-like wings.
It looks down its nose at you. Matte desaturated gray with cold blue tint. Not gory, no
veins, no horror. Stylized 3D-cartoon, readable at 64 pixels.
frames 1-4: hovering flap cycle, the eye drifting sideways;
frame 3 shows the eye widening slightly; frame 4 = the eye locked on
the viewer, a faint beam-like glint (no glow outside the silhouette);
frame 5: hit flash, eyelid slammed open in surprise;
frame 6: RESTORED — a colorful round friendly orb, wide kind eye with long lashes and a
sparkle, bright butterfly wings, smiling.
```
*(+ SPRITE RULES)*

**A.5 Muro de Silêncio** · Paisagem · 💾 `assets/raw/inimigos/silence.png`
```
Landscape 1536x1024. Enemy sprite sheet, 3x2 grid, transparent background, one creature,
side view facing right, same size and baseline in every cell.
THE CREATURE "WALL OF SILENCE": a tall faded-gray stone slab-shaped guardian with a
smooth featureless front like a blank wall, a thick stubby pair of legs, a small closed
sewn-shut mouth stitched with a simple X-less straight line, and two small heavy hands
holding the slab like a shield in front of it. Its back is bare cloth-gray and vulnerable.
Matte desaturated gray with cold blue tint, calm and stubborn, not violent.
Stylized 3D-cartoon, sturdy silhouette readable at 80 pixels tall.
frames 1-4: a slow heavy walk cycle with the slab shield held in front;
frame 5: hit flash from behind, the slab tilting forward in surprise;
frame 6: RESTORED — the slab now a colorful mosaic wall painted with soft rainbow patterns,
the mouth is a wide open friendly smile, arms raised cheering.
```
*(+ SPRITE RULES)*

---

## B. Bandeirolas (flâmulas educativas)

Cada bandeirola é uma flâmula pequena presa a um mastro, com as cores de uma bandeira ou de uma conquista. Aparece em 12 fases (duas por mundo, exceto no mundo 5). Ao tocar, Faísca lê o cartão educativo. O texto de cada uma está em `src/story/pennants.ts`.

**B.1 Folha de bandeirolas** · Paisagem · 📎 `collectibles.png` (mesmo acabamento) · 💾 `assets/raw/comum/pennants.png`
```
Landscape 1536x1024. Collectible pennant flag sprite sheet, 4x3 grid, wide gaps, never
touching, strict side view, transparent background. Each item is a SMALL swallow-tailed
(two-pointed) triangular-ish pennant flag hanging from a slim silver-lilac pole with a
small golden finial ball on top, the cloth waving gently as if in a light breeze. Soft
satin fabric, clean crisp stripes with sharp color edges, NO text, NO symbols, NO
letters. Same size and same pole height in every cell. Stylized 3D-cartoon, chunky and
readable at 100 pixels tall. Stripe colors from top to bottom:
1 rainbow: red, orange, yellow, green, blue, violet;
2 progress: black, brown, light blue, light pink, white, then red, orange, yellow, green, blue;
3 lesbian: dark orange, light orange, white, pink, dark rose;
4 bisexual: magenta, magenta, purple, blue, blue;
5 trans: light blue, light pink, white, light pink, light blue;
6 non-binary: yellow, white, purple, dark gray;
7 asexual: black, gray, white, purple;
8 intersex: yellow field with a single purple ring in the middle;
9 pansexual: pink, yellow, cyan;
10 rainbow with a small calendar-page mark on the pole base (a soft round badge, no numbers);
11 sky blue, white, sky blue, with a small balanced scales badge on the pole base;
12 red, gold, red, with two small interlocked rings badge on the pole base.
```
*(+ SPRITE RULES, ignorando "facing right": são objetos)*

📐 Ordem dos quadros (esquerda→direita, cima→baixo) = índice no jogo: `arco-iris`, `progresso`, `lesbica`, `bissexual`, `trans`, `nao-binarie`, `assexual`, `intersexo`, `pansexual`, `17-maio`, `stf-2019`, `casamento`. **Não troque a ordem.**

---

## C. Cuidados editoriais (para quem revisar a arte e os textos)
- Confira as cores de cada bandeira antes de aprovar o quadro; as listras precisam estar certas.
- Os textos citam fatos verificáveis: Gilbert Baker 1978 (arco-íris), Daniel Quasar 2018 (progresso), Michael Page 1998 (bissexual), Monica Helms 1999 (trans), Kye Rowan 2014 (não-binária), Morgan Carpenter 2013 (intersexo), 17/05/1990 (OMS), união estável em 2011 e casamento em 2013 (STF/CNJ), criminalização em 2019 (STF), nome e gênero sem cirurgia em 2018 (STF), CFP 1999. Revise com uma pessoa da comunidade antes de publicar.
- Se algum desses textos precisar de ajuste, edite só `src/story/pennants.ts`.

---

## D. Pergaminho do cartão da bandeirola
Imagem única (não é sprite sheet) usada como fundo do cartão que abre ao pegar uma bandeirola. O texto, o título e a flâmula são desenhados pelo jogo por cima, então a arte **não pode ter texto, letras nem bandeira**.

📎 Anexe a imagem de estilo do jogo (mesma referência das outras artes).
💾 Salve como `assets/raw/comum/pergaminho.png` (PNG com fundo transparente; ~1100×680 px ou maior, mesma proporção).
📐 Área útil de texto: retângulo central ocupando ~87% da largura e ~82% da altura, margens internas livres de qualquer detalhe. Rolos de madeira ficam colados em cima e embaixo, saindo um pouco para os lados.

```
A large horizontal parchment scroll for a 2D game dialog card, front view, perfectly flat and symmetrical, landscape ratio about 11:7. A wooden roll with warm carved end caps along the top edge and an identical one along the bottom edge, each slightly wider than the paper. Between them a sheet of aged cream-yellow paper with subtle fibers, soft darker stained edges, tiny worn corners and a few faint rainbow-tinted watercolor specks at the extreme corners only. The whole center of the paper is a clean, empty, evenly lit area with no marks, ready to hold text; keep at least 8% of clean margin inside the paper edges. Soft drop shadow under the scroll. Warm storybook painted style matching the reference image, crisp clean outline, high resolution, transparent background. NO text, NO letters, NO symbols, NO flag, NO characters, NO frame decorations inside the writing area.
```

💡 Se a arte não existir, o jogo desenha um pergaminho simples por código; ao colocar o PNG na pasta e rodar `npm run assets`, ele passa a usar a arte automaticamente.
