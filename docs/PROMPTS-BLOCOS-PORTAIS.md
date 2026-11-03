# PRISMA — Prompts: blocos, caixas e portais secretos

Complementa o `PROMPTS.md`. Mesmas regras: cole a **Seção 0 (Guia de Estilo)** do `PROMPTS.md` nas instruções do Projeto, anexe as imagens indicadas em 📎 e use o **Bloco de sprite sheet** no fim de cada prompt de sheet. Prompts em inglês; explicações em português.

Enquanto as imagens não existem, o jogo usa texturas desenhadas por código (`src/gfx/blocks.ts`), então nada quebra. Depois de gerar, rode `npm run assets`.

## Como os portais ficam escondidos (para o prompt acertar o clima)
- **Bloco invisível**: nada aparece até Íris bater a cabeça no lugar; só uma fileira de faíscas no alto dá a dica. O bloco "fantasma" aparece, vira cinza e o portal surge.
- **Parede de caixas**: o portal fica emparedado por caixas seladas; quebrar uma (echarpe, tiro ou mergulho) o revela.
- **Piso rachado** (mundo 7): uma câmara sob lajes rachadas; o mergulho estelar quebra a laje e Íris cai dentro.

---

## A. Blocos e mecanismos

**A.1 Folha de blocos** · Paisagem · 📎 `level_objects.png`, `collectibles.png` · 💾 `assets/raw/comum/level_blocks.png`
```
Landscape 1536x1024. Platformer interactive block sprite sheet, 4x3 grid, wide gaps,
never touching, strict side view, every item fits a square 64-unit tile (blocks are
perfect squares, chunky, with a clearly lit top edge). Match the attached references.
row 1:
1 BUMP BLOCK — a warm golden-amber stone cube with a glossy four-point star carved on
  its face, slightly glowing, rivets at the corners;
2 the same block USED — dull gray, star faded and flat, no glow;
3 PUSH BOX — a chunky lavender-gray stone crate with rounded corners and a rainbow
  crystal inlay on each face, looks heavy but pushable (slightly rounded bottom corners);
4 PRESSURE PLATE (raised) — a flat wide stone slab with a glowing violet rune ring in
  the center, standing slightly above the floor.
row 2:
5 the same PRESSURE PLATE pressed down flat, rune ring bright white-violet;
6 GATE SEGMENT — a vertical tileable pillar of crystal bars set in a stone frame,
  violet glow between the bars (top and bottom edges must tile seamlessly);
7 STONE WEIGHT — a hanging stone counterweight shaped like a chunky cone with an iron
  ring on top and a short chain stub, gray with violet moss;
8 CRACKED FLOOR TILE — a stone cube whose top and face are covered by glowing violet
  cracks, edges chipped, clearly fragile.
row 3:
9 SEALED CRATE — a gray wooden crate wrapped by a rainbow wax seal with a star knot;
10 GHOST BLOCK — the translucent revealed outline of an invisible block: soft
  iridescent shimmer, faint star in the middle (this one may be semi-transparent);
11 CHAMBER WALL TILE — a seamless tileable dark speckled rock square with tiny violet
  crystal flecks (no bright details, it must hide a secret chamber);
12 RUBBLE — a small pile of stone and wood fragments with a few violet crystal chips.
No text.
```
*(colar o Bloco de sprite sheet no final)*

📐 Ordem dos quadros (esquerda→direita, cima→baixo): `bump`, `bump_used`, `pushbox`, `plate`, `plate_down`, `gate`, `weight`, `cracked`, `crate_sealed`, `ghost`, `wall`, `rubble`.

---

## B. Portais secretos

**B.1 Portal secreto** · Paisagem · 📎 `level_objects.png` (portal de saída, para NÃO copiar) · 💾 `assets/raw/comum/secret_portals.png`
```
Landscape 1536x1024. Secret portal sprite sheet, 4x2 grid, wide gaps, never touching,
strict side view, each portal is a tall narrow oval doorway about 2:3 (width:height),
WHITE-pearl and soft-silver light only (the game tints it per world), smaller and
more mysterious than a level exit, NOT an arch, NOT a crystal gate — a shimmering
rift of folded light with tiny drifting sparkles.
row 1 (it opens): 1 a faint vertical SEAM of light, barely visible; 2 the seam widening
into a thin slit; 3 an oval opening with a swirling pearl interior; 4 fully open, bright
soft core, spiraling ribbons of light.
row 2 (idle loop, 4 smooth frames): the fully open portal with the swirl rotating a
quarter turn each frame, sparkles drifting inward, ending where it starts.
No text, no frame, no floor.
```
*(colar o Bloco de sprite sheet no final)*

📐 Ordem: `seam`, `slit`, `oval`, `open`, `loop1`..`loop4`.

**B.2 Variações de mundo (opcional)**, use o mesmo prompt com a frase extra, mantendo as mesmas 8 poses: `Tint the light toward <cor do mundo>: red, orange, yellow, green, turquoise, indigo, violet.` Salve como `secret_portals_w1.png` … `_w7.png`.

---

## C. Peças de cenário para os esconderijos

**C.1 Câmara secreta** · Paisagem · 💾 `assets/raw/comum/secret_chamber.png`
```
Landscape 1536x1024. Hidden underground chamber props, transparent background, 3x2 grid,
wide gaps, never touching, side view: 1 a stone block mound cross-section tile with a
hollow dark pocket, 2 a dark alcove back wall tile with faint violet rune scratches,
3 a small stone step, 4 a cracked stone LID slab (two cracks glowing), 5 a pile of loose
rubble, 6 a tiny glowing violet crystal cluster. Match the gray stone of the attachment.
```

---

## D. Portas das salas conectadas (falta gerar)

Usadas nas salas do alto de cada mundo: tocar numa porta leva à outra de mesmo par. Duas versões por folha: fechada (parada) e acesa (quando Íris chega perto).

**D.1 Portas** · Paisagem · 📎 `level_blocks.png` e `secret_chamber.png` (mesma pedra cinza-violeta) · 💾 `assets/raw/comum/doors.png`
```
Landscape 1536x1024. Platformer doorway sprite sheet, transparent background, 2x1 grid,
very wide gaps, never touching, strict side view, each door is a tall stone ARCHWAY
about 2:3 (width:height) set into a short stone frame so it can stand alone on the floor,
same gray-violet carved stone, chunky chipped edges and tiny violet crystal flecks as the
attached reference sheets. The doorway opening is a rounded arch.
1 DOOR (idle): the opening is a deep dark violet-indigo gradient with a faint star-shaped
  keyhole glyph carved above the arch; a tiny brass knob on the right side;
2 DOOR (active): same door, the opening now glows with soft warm gold-and-lilac light and
  the carved star above is lit; do not change the shape or size.
No text, no ground, no shadow.
```
*(colar o Bloco de sprite sheet no final)*

📐 Ordem: `door`, `door_active`.

## E. Peças da câmara secreta (já geradas)
Ordem da folha `secret_chamber.png`: 1 poço de pedra com cavidade, 2 fundo da alcova com runas, 3 degrau, 4 laje rachada, 5 entulho, 6 cristal violeta.
