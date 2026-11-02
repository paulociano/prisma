# PRISMA — Prompts de imagem para o visual 2.5D

Este arquivo lista **só as imagens novas** que o visual 3D (Opções → **Visual 3D (beta)**) precisa para que cada mundo pareça um cenário de verdade em profundidade. Ele complementa o [`PROMPTS.md`](PROMPTS.md), que continua valendo para todo o resto.

## O que já serve e não precisa ser gerado de novo

No 2.5D, **os personagens continuam 2D** (estilo "HD-2D"): Íris, Faísca, inimigos, chefões, guardiões, coletáveis, objetos de fase e a decoração (`props.png`) são desenhados com as artes que já existem. Os fundos `bg_far`, `bg_mid` e `bg_near` também são reaproveitados como camadas em profundidade. **Nada disso precisa ser refeito.**

## O que falta (e por quê)

No 3D, os blocos das fases, as plataformas e o chão das arenas viram **sólidos**, vistos de cima e de frente ao mesmo tempo. Hoje eles usam cores provisórias:

- **O topo de todos os blocos é a mesma grama verde em todos os mundos,** inclusive no deserto do Mundo 2, na cidade do Mundo 3 e na cidadela do Mundo 7.
- **Plataformas atravessáveis, plataformas móveis, blocos quebráveis e caixas** são caixas de cor lisa.
- **O chão das arenas** usa a textura do mundo, que não combina com a arte da arena (por exemplo, o tribunal de pedra do Juiz).
- **A profundidade do cenário** depende só das três camadas de fundo, que são planas. Falta "coisa no meio do caminho": árvores, prédios e rochas soltos em distâncias diferentes, e um primeiro plano na frente da câmera.

## Como usar

1. Use a **mesma conversa e o mesmo Guia de Estilo** do [`PROMPTS.md`](PROMPTS.md) (seção 0) e cole o **briefing do mundo** (seção 3 do `PROMPTS.md`) no início da conversa de cada mundo.
2. Logo depois do briefing, cole o **bloco 2.5D do mundo** (seção C deste arquivo). Ele diz de que material é cada superfície.
3. Use os **prompts da seção B** (iguais para os 7 mundos), um por vez.
4. 📎 **Sempre anexe** o `bg_far.png` e o `tiles_kit.png` aprovados daquele mundo, para manter a paleta e os materiais.
5. Salve com o nome exato em `assets/raw/wN/` (N = número do mundo). Depois me avise: eu registro as imagens no `npm run assets` e ligo cada uma no visual 3D.

> **Atenção às texturas.** O Guia de Estilo pede câmera de lado e fundo transparente. As **texturas** (seção B1 a B4 e A1) são a exceção: são **opacas, sem bordas e vistas de cima ou de frente, encaixando sem emenda**. Os prompts já dizem isso; não remova essas frases.

## Resumo e prioridade

| # | Arquivo | Onde | Para quê no 3D | Prioridade |
|---|---|---|---|---|
| B1 | `ground_top.png` | cada mundo | Topo de todos os blocos do chão e o chão de fundo atrás do caminho | **1ª, maior ganho** |
| B2 | `platform_texture.png` | cada mundo | Plataformas atravessáveis e plataformas móveis | 2ª |
| B3 | `arena_floor.png` | cada mundo | Piso modelado da arena do chefão | 3ª |
| B4 | `breakable_texture.png` | cada mundo | Blocos rachados que Íris quebra | 4ª |
| B5 | `depth_props.png` | cada mundo | Árvores, prédios e rochas em pé a distâncias diferentes, atrás do caminho | 3ª |
| B6 | `front_props.png` | cada mundo | Moitas e pedras bem perto da câmera, na frente do caminho | 5ª |
| A1 | `comum/crate_texture.png` | uma vez | Caixas | 4ª |
| D1 | `w5/water_caustics.png` | só Mundo 5 | Reflexo de luz na água do Recife | 5ª (opcional) |

**Total:** 6 imagens × 7 mundos + 2 = **44 imagens**. Para ver o resultado logo, gere primeiro **B1 dos 7 mundos** (7 imagens): só isso já troca a grama verde por chão de verdade em todo o jogo.

---

## A. Comum a todos os mundos

**A1. Textura de caixa**: Quadrado · 💾 `assets/raw/comum/crate_texture.png` · 📎 `key_art.png`
```
Square 1024x1024. EXCEPTION to the style guide camera and transparency rules: this is an
opaque square TEXTURE for one face of a wooden crate in a 3D game. The crate face fills
the whole image edge to edge, seen straight from the front, perfectly flat and
orthographic: chunky rounded wooden planks with a thick frame around the border and a
diagonal brace, warm honey wood, soft painted look matching the PRISMA stylized 3D
style, a small rainbow-colored star stamp in the center. Even soft lighting with no
directional shadow (the game lights it). No perspective, no background, no text.
```

---

## B. Prompts por mundo (iguais para os 7 mundos)

Cole na conversa em que você já colou o briefing do mundo e o bloco 2.5D dele (seção C). Os prompts usam os termos `GROUND TOP`, `PLATFORM`, `ARENA FLOOR`, `BREAKABLE`, `DEPTH PROPS` e `FRONT PROPS`, que o bloco 2.5D define para cada mundo.

**B1. Topo do chão**: Quadrado · 💾 `ground_top.png`
```
Square 1024x1024. EXCEPTION to the style guide camera and transparency rules: this is an
opaque, perfectly SEAMLESS TILEABLE texture (it must tile on all four sides with no
visible seam) of the GROUND TOP material described in the 2.5D NOTES, seen from DIRECTLY
ABOVE (top-down, orthographic). It covers the walkable top of every terrain block and
the floor behind the play area. Even density with no single large feature, no
directional shadows, no vignette, no horizon, no objects bigger than a fist, no
characters, no text. Stylized 3D render matching the attached world art and palette.
Keep contrast moderate so characters stand out on top of it.
```

**B2. Plataforma**: Quadrado · 💾 `platform_texture.png`
```
Square 1024x1024. EXCEPTION to the style guide camera and transparency rules: opaque,
SEAMLESS TILEABLE texture (tiles on all four sides) of the PLATFORM material described in
the 2.5D NOTES, seen from directly above (top-down, orthographic). It is used on thin
floating ledges and moving platforms, so the pattern must read clearly as "you can stand
here" (planks, slabs or panels running left to right). No directional shadows, no
vignette, no objects, no text. Stylized 3D render matching the attached world art.
```

**B3. Piso da arena**: Quadrado · 💾 `arena_floor.png` · 📎 + `boss_arena.png` daquele mundo
```
Square 1024x1024. EXCEPTION to the style guide camera and transparency rules: opaque,
SEAMLESS TILEABLE texture (tiles on all four sides) of the ARENA FLOOR material described
in the 2.5D NOTES, seen from directly above (top-down, orthographic). It must look like
the floor of the attached boss arena painting: same material, same colors, same mood.
It is used on the top AND the front of the arena floor slab. No directional shadows,
no vignette, no objects, no characters, no text. Stylized 3D render.
```
**B4. Bloco quebrável**: Quadrado · 💾 `breakable_texture.png`
```
Square 1024x1024. EXCEPTION to the style guide camera and transparency rules: opaque
square TEXTURE for one face of a BREAKABLE block in a 3D game, made of the BREAKABLE
material described in the 2.5D NOTES. The block face fills the whole image edge to
edge, seen straight from the front, flat and orthographic, with a chunky beveled border
and big friendly cracks through the middle where this world's rainbow color glows from
inside. Even soft lighting, no directional shadow, no perspective, no background,
no text. Stylized 3D render matching the attached world art.
```

**B5. Cenário em profundidade**: Paisagem · 💾 `depth_props.png`
```
Landscape 1536x1024. Set of 6 LARGE standalone scenery elements for the DEPTH PROPS
described in the 2.5D NOTES, to be placed standing at different distances BEHIND the
play area of a 2.5D side-scroller (like cardboard cut-outs in a diorama). Side view,
same light direction as the world art (warm key light from the upper left). 3x2 grid,
each element centered in its own cell, wide transparent gaps, never touching. Each one
is TALL (fills most of its cell's height) with a FLAT BOTTOM edge so it can stand on the
ground, and is complete (not cropped). Varied silhouettes and heights. Transparent
background, crisp edges, no glow outside the silhouette, no ground, no shadow, no text.
```

**B6. Primeiro plano**: Paisagem · 💾 `front_props.png`
```
Landscape 1536x1024. Set of 5 FOREGROUND clumps for the FRONT PROPS described in the
2.5D NOTES, to be placed very close to the camera IN FRONT of the play area, along the
bottom of the screen, partially framing the view (like the leaves at the edge of a
diorama). Side view, slightly darker and softer than the gameplay layer, rich and lush.
3x2 grid with one empty cell, each clump centered in its own cell, wide transparent gaps,
never touching. Each clump is WIDER than tall, with a FLAT BOTTOM edge, and complete
(not cropped). Transparent background, crisp edges, no glow, no ground, no shadow,
no text.
```

---

## C. Blocos 2.5D de cada mundo (colar depois do briefing)

### Mundo 1: Vale do Coração
```
2.5D NOTES — WORLD 1: HEART VALLEY.
GROUND TOP: soft red-moss grass seen from above, with scattered tiny red and cream
flowers, a few heart-shaped clover leaves and small patches of warm soil.
PLATFORM: warm wooden plank bridge boards running left to right, rounded edges, small
iron nails, slightly worn honey-brown wood.
ARENA FLOOR: weathered gray courtroom flagstones with thin red ivy creeping in the gaps
(matches the Stone Judge's forest clearing courtroom).
BREAKABLE: a block of red-brown packed soil and stones wrapped in roots.
DEPTH PROPS: tall crimson autumn trees, a giant heart-shaped red flower, a red-roofed
cottage with a round door, a lantern post with paper lanterns, a mossy rock with a
waterfall trickle, a windmill.
FRONT PROPS: clumps of red-moss grass with heart flowers, glowing berry bushes,
round mossy stones, a fallen log with mushrooms.
```

### Mundo 2: Cânion do Entardecer
```
2.5D NOTES — WORLD 2: SUNSET CANYON.
GROUND TOP: fine orange sand seen from above with gentle wind ripples, a few smooth
pebbles and cracked terracotta clay patches.
PLATFORM: sun-bleached wooden scaffold planks bound with rope, running left to right.
ARENA FLOOR: packed orange sand with circular wind-swept patterns and flat sandstone
slabs (matches the circular canyon basin arena).
BREAKABLE: a block of layered sandstone with orange and cream strata.
DEPTH PROPS: tall sandstone rock pillars, a natural stone arch, an adobe healing hut
carved into a cliff, a tall cactus with flowers, wind chimes on a wooden post,
a hot spring with rising steam.
FRONT PROPS: dry orange grass tufts, rounded desert rocks, small flowering cacti,
a sun-bleached wooden fence.
```

### Mundo 3: Cidade Solar
```
2.5D NOTES — WORLD 3: SOLAR CITY.
GROUND TOP: sun-warmed cobblestone street seen from above, rounded cream and golden
stones in a fan pattern, a few tiny painted sun tiles.
PLATFORM: terracotta rooftop tiles in neat rows running left to right.
ARENA FLOOR: wooden festival stage floorboards with faded painted star marks, under a
gray night mood (matches the festival stage arena).
BREAKABLE: a block of yellow painted bricks with a cream mortar pattern.
DEPTH PROPS: a tall row house with balconies and flower boxes, a sun-shaped clock
tower, a street lamp with bunting flags, a market stall with a striped awning,
a big sunflower in a pot, a fountain.
FRONT PROPS: flower pots with sunflowers, a café table with chairs, a stack of
crates with lemons, a low hedge.
```

### Mundo 4: Selva Esmeralda
```
2.5D NOTES — WORLD 4: EMERALD JUNGLE.
GROUND TOP: thick emerald moss seen from above with small ferns, fallen leaves and
dark rich earth showing through.
PLATFORM: a giant green leaf surface with clear veins running left to right.
ARENA FLOOR: mossy ancient temple stone tiles with vines in the gaps, framed by gray
thorns (matches the jungle temple courtyard arena).
BREAKABLE: a block of mossy carved temple stone with a glyph.
DEPTH PROPS: a giant jungle tree with buttress roots, a vine-covered stone temple
ruin, a treehouse, a waterfall rock, a cluster of giant ferns, a tall flowering
bromeliad.
FRONT PROPS: huge fern fronds, broad tropical leaves, mossy roots, bright jungle
flowers.
```

### Mundo 5: Recife Turquesa
```
2.5D NOTES — WORLD 5: TURQUOISE REEF.
GROUND TOP: pale sea sand seen from above with soft ripple lines, small shells, bits of
sea-glass and tiny coral fragments.
PLATFORM: a smooth coral shelf surface in turquoise and coral pink, porous texture,
running left to right.
ARENA FLOOR: a sunken gallery floor of turquoise mosaic tiles, faded and cracked
(matches the sunken circular gallery arena).
BREAKABLE: a block of compacted coral and sea-glass.
DEPTH PROPS: tall branching coral trees, a giant open clam shell, a sunken
amphitheater column, a kelp forest cluster, a sculpture on a pedestal, a sea-glass
rock arch.
FRONT PROPS: anemones, sea grass, rounded coral heads, clusters of shells and pearls.
```

### Mundo 6: Ilhas do Céu Anil
```
2.5D NOTES — WORLD 6: INDIGO SKY ISLANDS.
GROUND TOP: dark blue stone seen from above with silver grass tufts and small glowing
star-crystals embedded in it.
PLATFORM: soft cloud surface with a faint silver constellation pattern, running left
to right.
ARENA FLOOR: smooth dark indigo stone with a large faint star-map engraving, under a
gray eclipse mood (matches the floating island arena).
BREAKABLE: a block of dark blue stone with glowing star-crystal veins.
DEPTH PROPS: a small floating rock island with a tree, a tall crystal spire, an
observatory dome, a cloud bank, a giant crescent moon ornament on a pole, a
waterfall pouring off an island edge.
FRONT PROPS: silver grass clumps, small glowing crystals, soft cloud puffs, indigo
stones with tiny stars.
```

### Mundo 7: Cidadela Cinza
```
2.5D NOTES — WORLD 7: THE GRAY CITADEL.
GROUND TOP: polished uniform gray stone tiles seen from above, with a few cracks where
violet light and tiny violet flowers break through.
PLATFORM: gray riveted metal panels running left to right, with thin violet glow lines
in the seams.
ARENA FLOOR: gray throne room marble with a rigid geometric pattern and violet cracks
(match the attached boss arena painting).
BREAKABLE: a block of gray stone with the "equal sign" emblem, cracked with violet light.
DEPTH PROPS: a tall gray tower with identical windows, a giant gear wall, a statue
with a blank face, a column with chains, a gray banner on a pole, a cracked wall with
violet flowers growing through.
FRONT PROPS: gray rubble, broken pillar stumps, chains on the ground, a patch of violet
flowers breaking through stone.
```

---

## D. Extra do Mundo 5

**D1. Brilho da água**: Quadrado · 💾 `assets/raw/w5/water_caustics.png` *(opcional)*
```
Square 1024x1024. EXCEPTION to the style guide camera and transparency rules: opaque,
SEAMLESS TILEABLE texture (tiles on all four sides) of underwater light CAUSTICS: soft
bright white wavy light lines on a pure black background, organic net pattern, even
density, no objects, no text. It will be added on top of the water to make light ripple.
```

---

## Checklist

| Mundo | B1 | B2 | B3 | B4 | B5 | B6 |
|---|---|---|---|---|---|---|
| 1 Vale do Coração | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2 Cânion do Entardecer | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 Cidade Solar | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 Selva Esmeralda | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 Recife Turquesa | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 6 Ilhas do Céu Anil | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |
| 7 Cidadela Cinza | ☐ | ☐ | ☐ | ☐ | ☐ | ☐ |

Comuns: ☐ A1 `crate_texture.png` · ☐ D1 `water_caustics.png` (opcional)

## O que acontece depois (parte do código)

Quando as imagens estiverem nas pastas, eu:
1. Registro cada uma no `npm run assets`. As texturas são reduzidas para 512 px, e os conjuntos B5 e B6 são recortados em quadros, como já acontece com o `props.png`.
2. Troco no visual 3D as cores provisórias pelas texturas: topo dos blocos e chão de fundo (B1), plataformas (B2), piso das arenas (B3), blocos quebráveis (B4) e caixas (A1).
3. Espalho os elementos de B5 em pé atrás do caminho, a distâncias diferentes, e os de B6 na frente da câmera, sempre abaixo da linha do chão para nunca cobrir a jogabilidade. A posição de cada um é sorteada de forma fixa por fase, como a decoração atual.
4. Testo as 28 fases e mostro capturas.

Se alguma imagem ainda não existir, o jogo segue usando a cor provisória daquela peça. Dá para entregar os mundos aos poucos.
