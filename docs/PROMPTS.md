# PRISMA — Prompts de Arte e Áudio

**Como usar este arquivo**
- Os prompts estão **em inglês** porque o GPT-Image segue instruções técnicas (layout, fundo transparente, grade) com mais precisão nesse idioma. As explicações estão em português.
- **Seção 0** (Guia de Estilo): cole nas *instruções do Projeto* no ChatGPT, ou no início de cada conversa.
- **📎 Anexar:** indica quais imagens já aprovadas você deve anexar junto com o prompt.
- **💾 Salvar como:** nome e pasta exatos do arquivo.
- **📐 Formato:** Quadrado (1024×1024), Paisagem (1536×1024) ou Retrato (1024×1536). Escreva o formato no começo da mensagem, por exemplo "Landscape 1536x1024."
- Gere **na ordem dos lotes**. Cada lote depende das referências aprovadas no lote anterior.

---

## 0. GUIA DE ESTILO (colar uma vez)

```
PRISMA ART STYLE GUIDE — apply to every image in this project.

You are creating production art assets for "PRISMA", an original 2D side-scrolling
platformer video game with a hopeful, celebratory LGBTQIA+ theme.

LOOK
- Stylized 3D render look (pre-rendered 3D characters and props used as 2D sprites),
  with the polish of a premium animated feature film.
- Soft rounded shapes, chunky readable silhouettes, slightly exaggerated proportions
  (big heads, big expressive eyes, small hands/feet).
- Materials: smooth vinyl / soft clay / satin fabric; subtle subsurface scattering on skin;
  gentle iridescence on magical elements.
- Lighting: soft global illumination, gentle ambient occlusion, warm key light from the
  upper left, a colored rim light on the right edge. Never harsh or dark.

CAMERA
- Strict side view for a 2D side-scroller: characters in 3/4 profile facing RIGHT,
  environments seen straight from the side. Orthographic feel, no dramatic perspective,
  no fisheye, no top-down.

COLOR
- Saturated, joyful, high-contrast rainbow palette. Each world is dominated by its color.
- Antagonists ("the Faded") are ALWAYS desaturated neutral gray with a slight cold blue
  tint, matte, colorless — they must contrast strongly with the colorful heroes.

READABILITY
- Every character must stay readable when shrunk to 100 pixels tall: strong silhouette,
  clear shapes, no tiny noisy details, no thin lines.

GAME ASSET RULES (unless the prompt says otherwise)
- Isolated element on a fully TRANSPARENT background (real PNG alpha channel).
- No floor, no cast shadow, no drop shadow, no text, no letters, no numbers, no logos,
  no watermark, no border, no frame, no UI.
- Nothing cropped by the image edges; generous empty padding around every element.
- NO outer glow, bloom, halo, aura or colored haze outside the silhouette: the edge of
  every object must be crisp against pure transparency (the game engine adds glow itself).
- No comic symbols (exclamation marks, sweat drops, motion lines) unless asked.

CONSISTENCY
- Always match the attached reference images exactly: same character design, proportions,
  face, hair, outfit, colors and materials.

TONE
- Warm, hopeful, inclusive. LGBTQIA+ characters are dignified, diverse, heroic and joyful.
  Never caricature, never stereotype, never sexualize. Family-friendly (all ages).
  Original designs only — do not imitate any existing game, film or franchise.
```

### Bloco de sprite sheet (cole no fim de todo prompt que tiver "+ SPRITE RULES")

```
SPRITE RULES: Every frame shows the SAME character at the SAME size and scale, facing
right, centered in its own equal-size cell of the grid. Feet sit on the same baseline
height in every cell. Leave wide empty transparent gaps between frames — figures must
NEVER touch or overlap each other. No motion lines, no frame numbers, no text, no ground,
no shadows, no glow or haze outside the silhouette (crisp edges on pure transparency). Smooth, consistent in-between poses forming a fluid animation loop.
```

---

# LOTE 1: Bíblia visual (gere primeiro e envie para aprovação)

### 1.1 Arte-chave
📐 Paisagem · 💾 `assets/raw/00_estilo/key_art.png` · 📎 nada (esta imagem define o estilo)
```
Landscape 1536x1024. Key art illustration for the video game PRISMA (no text, no logo).
A young non-binary hero, IRIS, leaps joyfully across the frame from left to right,
trailing a long flowing white scarf that leaves a glowing rainbow light-trail behind it.
A tiny floating crystal fairy companion, SPARK, flies beside them.
The left half of the scene is a gray, colorless, foggy world with faded gray blob
creatures; where the rainbow trail passes, the world bursts back into vivid color —
red autumn trees, orange canyons, a yellow sunny town, green jungle, turquoise sea,
indigo starry floating islands and a distant violet castle, arranged like a rainbow arc
on the horizon. Opaque background, full scene. Stylized 3D animated-film render,
cinematic, hopeful, celebratory, extremely polished.
(Description of Iris: about 19 years old, warm medium-brown skin, freckles, big amber
eyes, short fluffy asymmetrical hair in lilac fading to white, yellow cropped jacket
with white trim, purple t-shirt, black shorts over black leggings, chunky white-and-purple
sneakers, long white scarf with an iridescent rainbow edge.)
```

### 1.2 Ficha de Íris (a referência mais importante do jogo)
📐 Paisagem · 💾 `assets/raw/00_estilo/iris_ref_sheet.png` · 📎 `key_art.png`
```
Landscape 1536x1024. Character reference turnaround sheet for IRIS, the protagonist,
matching the attached key art. Transparent background.
Iris: young non-binary hero, about 19, warm medium-brown skin, light freckles, big amber
eyes, friendly confident smile, short fluffy asymmetrical hair in lilac fading to white
with one swoop over the right eye. Outfit inspired by the non-binary flag colors:
yellow cropped jacket with white trim, purple t-shirt, black shorts over black leggings,
chunky white sneakers with purple soles, a small black wristband. A long white scarf
with a glowing iridescent rainbow edge wraps the neck and flows behind them.
Proportions: stylized, about 3.5 heads tall, big head, readable silhouette.
Show 4 full-body views in a row with equal size and wide gaps: side view facing right
(main game view), 3/4 front, front, back. Neutral standing pose.
Below them, a row of 4 head-and-shoulder expression busts: happy, determined, surprised,
sad. Figures never touch. No text, no labels.
```

### 1.3 Ficha de Faísca (companheiro)
📐 Quadrado · 💾 `assets/raw/00_estilo/spark_ref_sheet.png` · 📎 `key_art.png`, `iris_ref_sheet.png`
```
Square 1024x1024. Character reference sheet for SPARK, Iris's tiny companion: a floating
faceted prism crystal (size of a fist next to Iris) with a cute minimal face (two big
glossy eyes, small mouth), two tiny translucent dragonfly-like wings, glowing softly from
inside with shifting rainbow refractions, a little sparkle halo. Transparent background.
Show 6 poses in a 3x2 grid, equal size, wide gaps: neutral float, happy, talking,
surprised, worried, excited spinning. Figures never touch. No text.
```

### 1.4 Inimigos-base, "Os Desbotados" (ficha de referência)
📐 Paisagem · 💾 `assets/raw/00_estilo/faded_ref_sheet.png` · 📎 `key_art.png`
```
Landscape 1536x1024. Reference sheet of the 4 basic enemies, "the Faded": creatures made of
colorless gray fog-clay, matte, cold neutral gray with slight blue tint, grumpy but not
scary (family friendly), each with small glowing pale-white eyes. Transparent background.
All in side view facing right, in a row, equal visual weight, wide gaps, never touching:
1) BLOT — a squishy gray blob walker the size of a dog, droopy frown.
2) GRAY MOTH — a flying moth with dusty gray wings and a sleepy face.
3) MEGAPHONE — a hopping gray megaphone creature with tiny legs that shouts sound waves.
4) PADLOCK — a heavy armored gray padlock creature that walks slowly; shackle on top
   like a helmet.
Below each enemy, show the same creature RESTORED: same shape but now colorful,
joyful and smiling (blob = pink, moth = sky blue, megaphone = yellow, padlock = mint green).
No text.
```

### 1.5 Habitantes de Prisma (NPCs genéricos)
📐 Paisagem · 💾 `assets/raw/00_estilo/citizens_ref_sheet.png` · 📎 `key_art.png`, `iris_ref_sheet.png`
```
Landscape 1536x1024. Six diverse citizens of the world of Prisma, same stylized 3D style
and proportions as Iris (attached). Diverse ages, body types, skin tones, genders and
gender expressions: an elderly man with a cane and a rainbow pin, a teen girl with a
skateboard, a plus-size person in a flowy dress and beard, a couple of two women holding
hands (count as one figure), a child on a parent's shoulders, a tall person with
prosthetic leg in sporty clothes. Each wears clothes in one color of the rainbow.
Side view facing right, neutral friendly standing pose, row with wide gaps, never
touching. Transparent background. No text.
```

> ✅ **Pare aqui e envie as 5 imagens.** Depois de aprovadas, elas viram as referências de tudo.

---

# LOTE 2: Fatia vertical (sprites de Íris, objetos, Mundo 1)

> **Canon definido no Lote 1, já aprovado.** Íris tem cabelo lilás com mecha branca, pequenos brincos de cristal, luvas pretas sem dedos, munhequeiras roxas, bolsinha de cinto com cristal, faixas roxas na legging e echarpe iridescente. Faísca é rosa-cristal. Os prompts abaixo seguem essas fichas.
> **Antes do Lote 2:** atualize as instruções do Projeto no ChatGPT com o Guia de Estilo novo da seção 0. Ele ganhou a regra "sem brilho/halo fora da silhueta".

## 2A. Animações de Íris
📎 Em **todas**: `iris_ref_sheet.png`. Use uma conversa só para Íris.

**2A.1 Parado (idle)**: Quadrado · 💾 `assets/raw/personagens/iris_idle.png`
```
Square 1024x1024. Sprite sheet: IRIS (match attached reference exactly) idle breathing
animation, 4 frames in a 2x2 grid (read left-to-right, top-to-bottom): relaxed stance,
slight chest rise, scarf gently floating, tiny blink in frame 3. Transparent background.
+ SPRITE RULES
```

**2A.2 Corrida**: Paisagem · 💾 `assets/raw/personagens/iris_run.png`
```
Landscape 1536x1024. Sprite sheet: IRIS energetic running cycle, 6 frames in a 3x2 grid:
contact, down, passing, up, contact (other leg), passing. Leaning slightly forward, arms
pumping, scarf streaming behind. Transparent background. + SPRITE RULES
```

**2A.3 Pulo**: Paisagem · 💾 `assets/raw/personagens/iris_jump.png`
```
Landscape 1536x1024. Sprite sheet: IRIS jump sequence, 6 frames in a 3x2 grid:
1 crouch anticipation, 2 take-off stretching up, 3 rising with knees tucked, 4 peak
floating with arms out, 5 falling with scarf flaring upward, 6 landing squash.
Transparent background. + SPRITE RULES
```

**2A.4 Ataque com a echarpe**: Paisagem · 💾 `assets/raw/personagens/iris_attack.png`
```
Landscape 1536x1024. Sprite sheet: IRIS melee attack — whips the long white scarf forward
like a ribbon, releasing a crescent arc of rainbow sparkles. 6 frames in a 3x2 grid:
wind-up, swing start, full extension (scarf reaching far to the right with rainbow arc),
follow-through, recover, back to stance. Also include, in frames 3-4, the arc as part of
the image. Transparent background. + SPRITE RULES
```

**2A.5 Dano, derrota e vitória**: Paisagem · 💾 `assets/raw/personagens/iris_hurt_win.png`
```
Landscape 1536x1024. Sprite sheet: IRIS, 6 frames in a 3x2 grid. Top row: 1 hurt recoil
(knocked back, wince), 2 knocked down sitting dazed with little stars, 3 getting up.
Bottom row: 4 victory jump fist in the air, 5 victory pose holding a glowing prism shard
up, 6 waving hello. Transparent background. + SPRITE RULES
```

## 2B. Faísca
💾 `assets/raw/personagens/spark_anim.png` · Quadrado · 📎 `spark_ref_sheet.png`
```
Square 1024x1024. Sprite sheet: SPARK the crystal fairy (match attached reference) hovering
loop, 4 frames in a 2x2 grid: bob up, wings flutter, bob down, sparkle twinkle.
Transparent background. + SPRITE RULES
```

## 2C. Inimigos-base animados
📎 `faded_ref_sheet.png` em todos · Paisagem · 6 frames 3x2: **4 de movimento + 1 levando dano + 1 restaurado (colorido e feliz)**

| Arquivo 💾 `assets/raw/inimigos/` | Movimento a descrever |
|---|---|
| `blot.png` | "BLOT walking by squishing and stretching, 4 frames" |
| `moth.png` | "GRAY MOTH flapping wings while flying, 4 frames" |
| `megaphone.png` | "MEGAPHONE: 2 hop frames, then 2 frames shouting a gray sound-wave ring" |
| `padlock.png` | "PADLOCK slow heavy walk, 4 frames" |

Prompt (troque NOME e MOVIMENTO):
```
Landscape 1536x1024. Sprite sheet of the enemy NAME (match attached reference exactly),
6 frames in a 3x2 grid. Frames 1-4: MOVIMENTO. Frame 5: hit reaction, squashed with
cracks of color light showing through. Frame 6: the creature RESTORED — same shape,
now its colorful version from the reference, smiling happily with sparkles.
Transparent background. + SPRITE RULES
```

## 2D. Objetos comuns (todos os mundos)
📎 `key_art.png`

**2D.1 Coletáveis**: Quadrado · 💾 `assets/raw/comum/collectibles.png`
```
Square 1024x1024. Game collectible items, isolated, transparent background, 3x3 grid,
wide gaps, never touching, all slightly floating with soft inner glow:
row 1: SPARK coin — a small rainbow-faceted gem, shown in 3 rotation frames (front, 3/4, edge);
row 2: PRISM SHARD — a larger triangular crystal glowing white-rainbow (big collectible),
a red HEART pickup with glossy shine, a 1-UP: small golden badge shaped like Iris's head;
row 3: a KEY made of rainbow crystal, a TREASURE CHEST closed (purple and gold),
the same chest open with light spilling out. No text.
```

**2D.2 Objetos de fase**: Paisagem · 💾 `assets/raw/comum/level_objects.png`
```
Landscape 1536x1024. Platformer level objects, isolated, transparent background, 4x2 grid,
wide gaps, never touching, side view:
1 CHECKPOINT flag pole with a gray limp banner (inactive), 2 same checkpoint with a
waving rainbow banner glowing (active), 3 a bouncy SPRING mushroom-pad (compressed),
4 same spring extended, 5 a LEVEL EXIT portal — tall arch of crystal with swirling
rainbow light, 6 a wooden SIGN post with a blank board, 7 a breakable gray CRATE,
8 a gray stone BLOCK with a cracked surface (breakable from below). No text.
```

**2D.3 Efeitos**: Paisagem · 💾 `assets/raw/comum/vfx.png`
```
Landscape 1536x1024. Game visual effects sprite sheet, transparent background, 4x3 grid,
wide gaps, never touching, stylized 3D-cartoon VFX with glow:
row 1: 4 frames of a RAINBOW BURST explosion (small to big to dissipating sparkles);
row 2: 4 frames of a DUST PUFF cloud for landing/running (white-beige);
row 3: a HIT SPARK star flash, a gray FOG puff (enemy smoke), a ring SHOCKWAVE,
a cluster of floating colorful CONFETTI sparkles. No text.
```

## 2E. HUD
Quadrado · 💾 `assets/raw/ui/hud.png` · 📎 `collectibles.png`
```
Square 1024x1024. Game HUD icon set, glossy stylized 3D, transparent background,
3x3 grid, wide gaps: full red heart, empty heart (outlined dark socket), half heart,
Iris head portrait icon in a round badge, SPARK coin icon, PRISM SHARD icon (filled),
PRISM SHARD icon (empty silhouette, gray), a round PAUSE button with two bars,
a round gear SETTINGS button. Thick readable shapes, no text, no numbers.
```

## 2F. Mundo 1, Vale do Coração (cenário)
Abra uma conversa nova, cole o **Briefing do Mundo 1** (seção 3) e depois use os **Prompts de Mundo** (seção 4) com 📎 `key_art.png`. Salve em `assets/raw/w1/`.

> ✅ Com o Lote 2 pronto, a fase 1-1 fica jogável com arte final.

---

# LOTE 3: Mundo 1 completo (guardião, inimigo exclusivo, chefão)
Na mesma conversa do Mundo 1, gere os prompts 4.7 a 4.11.

# LOTE 4: Menus e meta-jogo (seção 5)

# LOTES 5 a 10: Mundos 2 a 7
Para cada mundo: conversa nova → colar o briefing → gerar os prompts 4.1 a 4.11 → salvar em `assets/raw/wN/`.
Gere também as **habilidades de Íris** (seção 6) do mundo correspondente.

# LOTE 11: Cutscenes (seção 7) · LOTE 12: Áudio (seção 8)

---

## 3. BRIEFINGS DOS MUNDOS
Cole o briefing do mundo no início da conversa daquele mundo, antes dos prompts.

### Mundo 1: Vale do Coração (Vermelho, Vida)
```
WORLD BRIEF — WORLD 1: HEART VALLEY (color: RED, meaning: LIFE).
Mood: warm, welcoming tutorial world, golden late afternoon.
Environment: rolling hills and a cozy forest of crimson and scarlet autumn trees,
giant heart-shaped red flowers, glowing berry bushes, little red-roofed cottages with
round doors, paper lanterns, a sparkling stream. Palette: crimson, scarlet, coral, warm
gold highlights, cream; small accents of the other rainbow colors.
Ground material: rich soil with a thick top layer of soft red-moss grass and tiny flowers.
Platforms: floating chunks of grassy earth with roots hanging below; wooden plank bridges.
Hazards: thorny gray bramble patches.
Props: heart flowers, mushrooms, lanterns on poles, fences, a cottage, berry bushes, logs.
GUARDIAN: MAMA RUBY — a fabulous, kind drag queen mentor, tall, deep brown skin,
big voluminous curly ruby-red wig, sparkling red sequined gown with a heart-shaped
neckline, long red gloves, holding a large heart-shaped feather fan, warm motherly smile.
WORLD ENEMY: THORN BEETLE — a gray beetle with a bramble shell; it rolls into a spiky ball.
BOSS: THE STONE JUDGE (embodies Judgment) — a huge gray stone golem in a judge's robe
carved from rock, with a gavel-hammer for one hand, cold glowing eyes. Attacks: slams the
gavel causing shockwaves along the ground, throws gray stone blocks, stomps to shake
boulders from the ceiling. Restored form: a gentle mossy red-stone giant with flowers
growing on its shoulders, smiling.
BOSS ARENA: a forest clearing courtroom of gray stone columns overgrown with red ivy.
```

### Mundo 2: Cânion do Entardecer (Laranja, Cura)
```
WORLD BRIEF — WORLD 2: SUNSET CANYON (color: ORANGE, meaning: HEALING).
Mood: wide open, warm desert at sunset, peaceful and spiritual.
Environment: towering layered orange and terracotta sandstone canyons, natural rock
arches, steaming turquoise hot-spring pools, cacti in bloom, hanging woven tapestries,
wind chimes, adobe healing huts carved into cliffs. Palette: tangerine, amber, terracotta,
peach, rose-pink highlights (inspired by the lesbian flag tones), dusky purple shadows.
Ground material: smooth layered sandstone with fine orange sand on top.
Platforms: sandstone ledges, wooden scaffold walkways with ropes, crumbling rock pillars.
Hazards: quicksand pits, gray sandstorm gusts.
Props: blooming cacti, herb pots, healing crystals, woven baskets, wind chimes, hot spring rocks.
GUARDIANS: SOL & LUNA — a loving lesbian couple of healers. SOL: sturdy butch woman,
short spiky orange hair, freckled tan skin, rolled-up overalls with a belt of herb
pouches, confident grin. LUNA: soft femme woman, long wavy dark hair with pink flowers,
deep brown skin, flowing pink-and-orange poncho, holding a glowing clay healing bowl.
WORLD ENEMY: DUNE SCORPION — a gray sand scorpion that burrows and pops up.
BOSS: THE SAND SERPENT (embodies Shame) — an enormous gray sandstone serpent that hides
its face behind its own coils, made of cracked desert rock and swirling gray sand.
Attacks: dives in and out of the sand in arcs, spits balls of gray sand, creates a
sandstorm that pushes the player. Restored form: a radiant orange-and-pink feathered
desert serpent, proudly showing its face, smiling.
BOSS ARENA: a circular canyon basin with sand floor and stone ledges around.
```

### Mundo 3: Cidade Solar (Amarelo, Luz do Sol)
```
WORLD BRIEF — WORLD 3: SOLAR CITY (color: YELLOW, meaning: SUNLIGHT).
Mood: bright, festive, busy rooftops on the day of a big pride festival.
Environment: a sunny hillside city of yellow and cream buildings with terracotta roofs,
rooftop gardens of giant sunflowers, festival bunting flags in every rainbow color,
string lights, balconies, water towers, ramps and elevators for accessibility,
a grand sun-shaped clock tower. Palette: lemon, sunflower yellow, gold, cream,
with purple accents (inspired by the intersex flag).
Ground material: sun-warmed cobblestone streets and tiled rooftops.
Platforms: rooftops, awnings (bouncy fabric canopies), balconies, flagpoles.
Hazards: gray spotlight beams that reveal you to enemies, falling flower pots.
Props: sunflowers, festival stalls, bunting, lamp posts, benches, chimneys, water towers.
GUARDIAN: AURORA — the joyful intersex leader of the Solar Festival, a wheelchair user.
Warm olive skin, curly golden hair in a big bun, round glasses, bright yellow jacket
with a purple circle emblem on the back, sunflower brooch; a decorated wheelchair with
golden wheels and ribbons. Radiant, confident, organizing the festival.
WORLD ENEMY: WATCHER DRONE — a gray flying security-camera drone that sweeps a beam.
BOSS: THE COLD SPOTLIGHT (embodies Fear of being seen) — a giant gray mechanical eye
mounted on a stage rig with long crane arms holding spotlights. Attacks: sweeping
freezing spotlight beams, drops gray metal spotlights, fires flash bursts.
Restored form: a warm golden sun-lantern with a friendly face, lighting a festival stage.
BOSS ARENA: the main festival stage at night, gray scaffolding and empty seats.
```

### Mundo 4: Selva Esmeralda (Verde, Natureza)
```
WORLD BRIEF — WORLD 4: EMERALD JUNGLE (color: GREEN, meaning: NATURE).
Mood: lush, mysterious, alive, humid morning light rays through the canopy.
Environment: a dense rainforest of giant emerald trees, enormous leaves, hanging vines,
multi-level waterfalls, glowing mushrooms, ancient mossy stone ruins, tree houses with
rope bridges, butterflies. Palette: emerald, jade, lime, teal, deep forest green, white
blossoms, touches of blue (inspired by the gay men's flag tones).
Ground material: dark rich earth covered with thick moss and ferns.
Platforms: giant leaves (bouncy), tree branches, mossy stone ruins, rope bridges, vines.
Hazards: gray thorn vines, poison-gray swamp water.
Props: ferns, giant mushrooms, flowers, ruins, tree houses, vines, waterfalls, logs.
GUARDIAN: BRANCH — a gentle gay gardener in his 50s, broad and soft-bodied, dark skin,
neat salt-and-pepper beard, wide straw hat with a flower band, green-and-teal apron over
a white shirt, watering can in hand, kind eyes, a small leaf pin.
WORLD ENEMY: SNAP PLANT — a gray carnivorous plant in the ground that lunges and bites.
BOSS: THE THORNWEED (embodies Isolation) — a giant gray thorny plant monster whose
vines wall itself off from everything, with a closed flower-bud head. Attacks: thorn
vines erupting from the ground, spits seed bullets, builds thorn walls that close in.
Restored form: a huge blooming green tree-flower full of birds and butterflies.
BOSS ARENA: a jungle temple courtyard ringed by gray thorn walls.
```

### Mundo 5: Recife Turquesa (Azul/Turquesa, Arte e Magia)
```
WORLD BRIEF — WORLD 5: TURQUOISE REEF (color: BLUE/TURQUOISE, meaning: ART & MAGIC).
Mood: dreamy, magical, underwater wonder with floating light.
Environment: a coral reef and an underwater art gallery: sculptures and mosaics on the
sea floor, giant painted shells, kelp forests, glowing jellyfish, bubble columns,
sunken amphitheater, schools of colorful fish. Palette: turquoise, aqua, cyan, sky blue,
with soft pink and white accents (inspired by the trans flag tones).
Ground material: pale sand with coral and shells, smooth sea-glass rocks.
Platforms: coral shelves, giant clam shells (open/close), floating bubbles, sculpture pedestals.
Hazards: gray sea urchins, strong currents, gray ink clouds.
Props: corals, kelp, sculptures, mosaic pillars, painted shells, anchors, treasure.
GUARDIAN: MARINA — a trans woman sea artist, tall and graceful, warm light-brown skin,
long wavy hair in light blue and pink, white-and-pink painter's smock over a light blue
wetsuit, a giant paintbrush that paints with glowing light, kind expressive smile.
WORLD ENEMY: GRAY PUFFER — a gray pufferfish that inflates with spikes.
BOSS: THE KRAKEN OF SILENCE (embodies Silencing) — a colossal gray octopus that covers
murals with gray ink and holds a finger-tentacle over its own mouth. Attacks: tentacle
slams from the sides, gray ink clouds that block vision, whirlpool pulling the player.
Restored form: a turquoise-and-pink octopus painting a beautiful mural with all 8 arms.
BOSS ARENA: a sunken circular gallery with faded mural walls.
```

### Mundo 6: Ilhas do Céu Anil (Anil, Serenidade)
```
WORLD BRIEF — WORLD 6: INDIGO SKY ISLANDS (color: INDIGO, meaning: SERENITY).
Mood: calm, vast, starry twilight, low gravity, dreamlike.
Environment: floating islands in an indigo night sky full of stars and nebulae, a
crescent moon, crystal observatories with brass telescopes, waterfalls falling off
island edges into clouds, floating lanterns, constellations that form paths.
Palette: indigo, deep violet-blue, royal blue, magenta-pink accents (inspired by the
bisexual flag tones), silver starlight.
Ground material: dark blue stone with glowing star-crystals and silver grass.
Platforms: floating rock islands, cloud platforms, constellation star-steps, moving moons.
Hazards: gray void holes, shooting gray comets.
Props: telescopes, star crystals, lanterns, clouds, small moons, astrolabes, benches.
GUARDIAN: BIX — a cheerful bisexual astronomer, short and energetic, light skin with
rosy cheeks, curly hair dyed pink-to-purple-to-blue, brass goggles on the forehead,
long indigo coat covered with embroidered constellations, carrying a star map.
WORLD ENEMY: SHADOW COMET — a gray comet creature that dashes across the screen.
BOSS: ECLIPSE (embodies Doubt) — a giant gray moth whose wings are made of eclipse
shadow, eating the starlight. Attacks: wing gusts, dives across the arena, drops dark
orbs, darkens the whole arena leaving only small lights. Restored form: a luminous
indigo-and-pink luna moth whose wings show a beautiful galaxy.
BOSS ARENA: a large flat floating island under a gray eclipsed moon.
```

### Mundo 7: Cidadela Cinza (Violeta, Espírito)
```
WORLD BRIEF — WORLD 7: THE GRAY CITADEL (color: VIOLET, meaning: SPIRIT).
Mood: epic final world; starts oppressive and gray, gradually filled with violet hope.
Environment: an immense gothic castle of identical gray blocks, endless uniform
staircases, rows of identical gray statues, clocks, chains, banners of a gray "equal
sign" emblem; cracks where violet light and flowers break through. Palette: neutral
grays and black, with growing violet, purple, lavender and white light (inspired by
the asexual flag tones: black, gray, white, purple).
Ground material: polished uniform gray stone tiles.
Platforms: stone ledges, chained floating blocks, gears, moving conveyor floors.
Hazards: gray crushers, spikes, gray laser beams of "conformity".
Props: statues, chandeliers, banners, clocks, chains, broken mirrors, violet flowers.
GUARDIAN: ACE — an asexual knight, calm and noble, androgynous, pale skin, short black
hair with a silver streak, armor in black, gray, white and purple layers, a purple
cape, a black ring on the right middle finger, carrying a shield with a heart-of-spades
emblem.
WORLD ENEMY: GRAY SENTINEL — a hollow gray suit of armor that marches and blocks.
FINAL BOSS: MONOCHROME (embodies Conformity) — a towering king made of gray fog and
uniform gray masks, wearing a crown shaped like a gray square, cape of fog.
PHASE 1: seated on a gray throne, attacks with mask projectiles, summons Faded enemies,
gray beams. PHASE 2: the masks fall and he becomes a huge swirling storm of gray fog
with one cold eye, chasing Iris upward through the tower.
Restored form: his last mask falls, revealing a small, shy, colorful being who had
simply been afraid; Iris offers a hand.
BOSS ARENA: the throne room (phase 1); the open top of the tower in a gray storm (phase 2).
```

---

## 4. PROMPTS DE MUNDO (iguais para os 7 mundos)
Use na conversa em que você colou o briefing. 📎 Sempre anexe `key_art.png`. A partir do segundo prompt, anexe também o `bg_far` aprovado daquele mundo para manter a paleta. Salve em `assets/raw/wN/` (N = número do mundo).

**4.1 Fundo distante**: Paisagem · 💾 `bg_far.png`
```
Landscape 1536x1024. FAR BACKGROUND layer for a side-scrolling platformer, for the world
in the WORLD BRIEF above. Opaque, full image: sky and very distant scenery only (horizon,
far mountains / skyline / far shapes), soft atmospheric perspective, low contrast so
gameplay reads on top. Horizontally seamless: the left and right edges must match so it
can tile. No characters, no text. Stylized 3D render.
```

**4.2 Fundo médio**: Paisagem · 💾 `bg_mid.png`
```
Landscape 1536x1024. MID BACKGROUND parallax layer for the same world: a horizontal band
of mid-distance scenery (trees / buildings / rocks typical of the world) occupying the
lower 60% of the image, TRANSPARENT background above and between shapes so the far
layer shows through. Medium contrast, slightly hazy. Horizontally seamless left/right
edges. No characters, no text.
```

**4.3 Primeiro plano**: Paisagem · 💾 `bg_near.png`
```
Landscape 1536x1024. FOREGROUND parallax layer for the same world: a few large close-up
framing elements (big leaves / rocks / pillars / flowers typical of the world) only
along the bottom edge and corners, slightly darker and slightly blurred, everything else
fully TRANSPARENT. Horizontally seamless. No characters, no text.
```

**4.4 Kit de plataformas**: Paisagem · 💾 `tiles_kit.png`
```
Landscape 1536x1024. Platformer TERRAIN KIT for the same world, isolated pieces on a
transparent background, side view, wide gaps, never touching, consistent scale
(each ground block is a perfect square, roughly 180x180 px):
row 1: ground TOP-LEFT corner block, ground TOP-MIDDLE block (seamless left/right),
ground TOP-RIGHT corner block, a FILL block (seamless on all sides, no top grass);
row 2: a small floating platform (1 block wide), a medium floating platform (3 blocks
wide), a thin one-way platform (wooden/ledge style), a slope going up to the right;
row 3: a hazard strip (spikes/thorns typical of the world), a moving platform piece,
a breakable block, a decorative ledge edge. No text.
```

**4.5 Textura do chão**: Quadrado · 💾 `ground_texture.png`
```
Square 1024x1024. Perfectly SEAMLESS TILEABLE texture (tiles on all four sides) of the
ground interior material of this world, as seen from the side (soil / stone / sand
strata), stylized 3D render, no top surface, no objects, no text, opaque.
```

**4.6 Props decorativos**: Paisagem · 💾 `props.png`
```
Landscape 1536x1024. Decorative PROPS set for the same world (use the props list in the
WORLD BRIEF), 8 to 10 objects of varied sizes, side view, isolated on transparent
background, wide gaps, never touching, grounded objects with a flat bottom so they
can sit on platforms. No text.
```

**4.7 Guardião (ficha)**: Paisagem · 💾 `guardian_ref.png` · 📎 + `iris_ref_sheet.png` (para manter as proporções)
```
Landscape 1536x1024. Character reference sheet of the GUARDIAN from the WORLD BRIEF,
same stylized 3D style and proportions as Iris (attached). Transparent background.
Top row: 3 full-body views with wide gaps — side view facing LEFT (they will face Iris),
3/4 front, front. Bottom row: 4 head-and-shoulders expression busts for dialogue:
happy, proud/inspiring, worried, emotional grateful. Also 1 extra full-body pose:
TRAPPED — curled up, faded to gray, inside a gray crystal cage.
Figures never touch. No text.
```

**4.8 Inimigo exclusivo**: Paisagem · 💾 `enemy.png` · 📎 + `faded_ref_sheet.png`
```
Landscape 1536x1024. Sprite sheet of the WORLD ENEMY from the WORLD BRIEF, matching the
gray "Faded" enemy style (attached), 6 frames in a 3x2 grid: frames 1-4 its movement /
attack loop described in the brief, frame 5 hit reaction with cracks of color light,
frame 6 its RESTORED colorful happy version in this world's color.
Transparent background. + SPRITE RULES
```

**4.9 Chefão: parado**: Quadrado · 💾 `boss_idle.png`
```
Square 1024x1024. Sprite sheet of the BOSS from the WORLD BRIEF, huge and imposing but
family friendly, gray Faded style, side view facing LEFT, idle menacing loop,
4 frames in a 2x2 grid (breathing, shifting weight, eyes glowing). The boss fills most
of each cell. Transparent background. + SPRITE RULES
```

**4.10 Chefão: ataques**: Paisagem · 💾 `boss_attack.png` · 📎 + `boss_idle.png` aprovado
```
Landscape 1536x1024. Sprite sheet of the same BOSS (match attached exactly), facing LEFT,
6 frames in a 3x2 grid showing its attacks from the WORLD BRIEF: frames 1-3 the main
attack (anticipation, strike, recover), frames 4-6 the second attack (anticipation,
strike, recover). Do not draw the projectiles separately; include only effects attached
to the boss body. Transparent background. + SPRITE RULES
```

**4.11 Chefão: derrota e transformação**: Paisagem · 💾 `boss_end.png` · 📎 + `boss_idle.png`
```
Landscape 1536x1024. Sprite sheet of the same BOSS, facing LEFT, 4 frames in a 2x2 grid:
1 heavily hurt (cracks with rainbow light shining through), 2 collapsing, gray crust
shattering, 3 burst of color, 4 its RESTORED form from the WORLD BRIEF, peaceful and
smiling. Transparent background. + SPRITE RULES
```

**4.12 Projéteis do chefão**: Quadrado · 💾 `boss_projectiles.png`
```
Square 1024x1024. The BOSS's projectiles and attack effects from the WORLD BRIEF
(e.g. thrown blocks, sand balls, beams, ink clouds, orbs), 6 separate items, gray Faded
style, isolated on transparent background, 3x2 grid, wide gaps. No text.
```

**4.13 Arena do chefão**: Paisagem · 💾 `boss_arena.png`
```
Landscape 1536x1024. Opaque full background for the BOSS ARENA described in the WORLD
BRIEF, side view, a wide flat playable floor area along the bottom 20%, dramatic but
readable, desaturated gray mood with hints of this world's color, no characters, no text.
```

> Mundo 7: gere **4.9, 4.10 e 4.11 duas vezes**, uma para cada fase de Monocromo (`boss_p1_*.png` e `boss_p2_*.png`), e **duas arenas** (`boss_arena_p1.png` e `boss_arena_p2.png`).

---

## 5. MENUS E META-JOGO (Lote 4)
📎 `key_art.png`, `iris_ref_sheet.png`. Salve em `assets/raw/ui/`.

**5.1 Logo**: Paisagem · 💾 `logo.png` *(o único prompt com texto; troque PRISMA pelo nome final)*
```
Landscape 1536x1024. Video game LOGO reading exactly "PRISMA" in big chunky rounded 3D
letters, glossy candy/crystal material, each letter one color of the rainbow (red,
orange, yellow, green, turquoise, indigo, violet), soft white outline, a small crystal
prism replacing the dot/accent, sparkles. Transparent background. Spelling must be
exactly P-R-I-S-M-A. Nothing else written.
```
> Se as letras vierem erradas, gere de novo ou me avise. Eu posso fazer o logo em código com uma fonte.

**5.2 Fundo da tela título**: Paisagem · 💾 `title_bg.png`
```
Landscape 1536x1024. Title screen background: a hill at twilight overlooking the world of
Prisma, with a rainbow arc of the 7 worlds on the horizon (red forest, orange canyon,
yellow city, green jungle, turquoise sea, indigo sky islands, violet-gray castle).
Iris sits on the hilltop on the right third, scarf in the wind, Spark beside them,
looking at the horizon. Leave the upper-center area calm and empty for the logo.
Opaque. No text.
```

**5.3 Mapa-múndi**: Paisagem · 💾 `world_map.png`
```
Landscape 1536x1024. Illustrated WORLD MAP of Prisma, seen from slightly above like a
diorama board, stylized 3D: seven regions connected by a winding path, arranged left to
right in rainbow order — Heart Valley (red autumn forest), Sunset Canyon (orange),
Solar City (yellow), Emerald Jungle (green), Turquoise Reef (turquoise sea), Indigo Sky
Islands (floating above clouds), the Gray Citadel (gray castle with violet glow).
Leave small empty round clearings along the path for level markers. Opaque. No text.
```

**5.4 Marcadores do mapa**: Quadrado · 💾 `map_icons.png`
```
Square 1024x1024. World map UI icons, glossy stylized 3D, transparent background, 3x3
grid, wide gaps: level node locked (gray stone disc with padlock), level node available
(glowing white disc), level node completed (rainbow disc with a star), boss node
(skull-free: a gray crown disc), boss node defeated (colorful crown disc), a small
Iris figure map token, a waypoint flag, a sparkle path dot, a shard counter icon.
No text, no numbers.
```

**5.5 Painéis de interface**: Paisagem · 💾 `ui_panels.png`
```
Landscape 1536x1024. Game UI kit, soft glossy stylized 3D, rounded, friendly, white and
lavender with rainbow trims, transparent background, wide gaps, no text: a large
DIALOGUE BOX panel (wide rectangle, empty), a portrait frame (rounded square), a
large menu panel (empty), 3 button states (normal, hover glowing, pressed), a toggle
switch on and off, a slider bar with knob, a checkbox empty and checked, an arrow icon.
```

---

## 6. HABILIDADES DE ÍRIS (gere junto com o mundo correspondente)
📎 `iris_ref_sheet.png`, `iris_run.png` · Paisagem · 6 frames 3x2 · `+ SPRITE RULES` · 💾 `assets/raw/personagens/`

| Mundo | Arquivo | O que pedir |
|---|---|---|
| 1 | `iris_doublejump.png` | "mid-air somersault double jump: 6 frames of a forward flip with a ring of rainbow light under the feet in frame 2" |
| 2 | `iris_dash.png` | "horizontal air/ground DASH: 2 anticipation frames, 2 frames streaking forward with a rainbow afterimage trail, 2 braking frames" |
| 3 | `iris_wall.png` | "WALL SLIDE and WALL JUMP: frames 1-2 sliding down against a wall on the right (one hand and foot touching, no wall drawn), frames 3-6 kicking off and leaping to the left-up" |
| 4 | `iris_glide.png` | "GLIDE: holding the scarf above the head like a glowing kite/parachute, 6 frames of gentle floating loop" |
| 5 | `iris_shoot.png` | "PRISM SHOT: thrusting a palm forward and firing; frames 1-4 the pose, frames 5-6 a separate small glowing rainbow-prism projectile (2 frames)" |
| 6 | `iris_pound.png` | "STAR DIVE ground pound: 2 frames spinning in mid-air, 2 frames diving straight down with a starry trail, 2 frames impact crouch with starburst" |
| 5 | `iris_swim.png` | "SWIMMING underwater: 6 frames of a graceful swim cycle, scarf flowing" |

---

## 5c. MAPA DE CADA MUNDO (7 imagens)
Paisagem · uma conversa por mundo (ou a conversa do próprio mundo) · 📎 `key_art.png` e o `bg_far.png` daquele mundo (para manter a paleta) · 💾 `assets/raw/wN/world_map.png`

As 4 clareiras **precisam ficar nesses pontos aproximados**, porque o jogo coloca os ícones das fases ali. Se a imagem sair diferente, eu ajusto as posições no código.

Prompt base (troque **MUNDO** pela descrição da tabela abaixo):
```
Landscape 1536x1024. Illustrated LEVEL MAP for one world of the video game PRISMA,
seen from slightly above like a cozy diorama board game, stylized 3D render, opaque,
no text, no letters, no numbers, no characters, no UI.
WORLD: MUNDO
A clear winding path (dotted or paved) connects FOUR round empty clearings, read left to
right, at these exact positions of the image:
clearing 1 at 13% from the left and 66% from the top,
clearing 2 at 37% from the left and 44% from the top,
clearing 3 at 62% from the left and 62% from the top,
clearing 4 (bigger, dramatic, the boss lair) at 86% from the left and 38% from the top.
Each clearing is an empty flat circular spot about 8% of the image wide, for a level icon.
Keep the top 10% and the bottom 18% of the image calm and simple (space for the title and
the info panel). Rich decorated scenery between the clearings, matching the world palette.
The world is still partly gray and faded, with its color glowing along the path.
```

| Arquivo | MUNDO |
|---|---|
| `w1/world_map.png` | `HEART VALLEY: rolling red autumn hills, heart-shaped flowers, cozy red-roof cottages, a stream; the boss clearing is a ring of gray stone courtroom columns.` |
| `w2/world_map.png` | `SUNSET CANYON: layered orange sandstone canyons, rock arches, steaming turquoise hot springs, blooming cacti; the boss clearing is a sandy circular canyon basin.` |
| `w3/world_map.png` | `SOLAR CITY: sunny yellow rooftops, sunflower gardens, festival bunting, a sun-shaped clock tower; the boss clearing is the main festival stage with gray spotlights.` |
| `w4/world_map.png` | `EMERALD JUNGLE: giant emerald trees, waterfalls, vines, mossy ruins, glowing mushrooms; the boss clearing is a temple courtyard ringed with gray thorns.` |
| `w5/world_map.png` | `TURQUOISE REEF: an underwater coral reef seen through clear water, kelp, sculptures, giant shells, bubbles; the boss clearing is a sunken circular art gallery.` |
| `w6/world_map.png` | `INDIGO SKY ISLANDS: floating islands in a starry indigo night sky, observatories, waterfalls into clouds, the path made of glowing star-steps; the boss clearing is a high island under an eclipsed moon.` |
| `w7/world_map.png` | `THE GRAY CITADEL: a huge gothic castle of gray stone with violet cracks and flowers breaking through, endless stairs and bridges climbing up; the boss clearing is the throne at the top of the tower.` |

> Depois de salvar, rode `npm run assets`. Enquanto a imagem de um mundo não existir, o mapa dele usa o cenário do mundo com um caminho desenhado.

---

## 5b. ÍCONES DA TELA DE CARREGAMENTO
Quadrado · 💾 `assets/raw/ui/loading_icons.png` · 📎 `key_art.png`, `spark_ref_sheet.png`
```
Square 1024x1024. Loading-screen icon sheet for the game PRISMA, glossy stylized 3D,
transparent background, a strict 4x4 grid of 16 equal cells, each item centered in its
cell with wide empty gaps, nothing touching, no text, no numbers, no glow outside the
silhouettes.
ROW 1 and the first three cells of ROW 2 — seven faceted prism gems, same cut and same size,
each one a single rainbow color, glowing softly from inside, in this exact order:
1 ruby red (with a tiny heart facet), 2 tangerine orange (tiny sun facet),
3 sunflower yellow (tiny star facet), 4 emerald green (tiny leaf facet),
5 turquoise (tiny wave facet), 6 deep indigo (tiny crescent-moon facet),
7 violet purple (tiny spade facet).
ROW 2, last cell — the same gem shape EMPTY: dull matte gray stone, no glow, no color.
ROW 3 — four animation frames of SPARK (match the attached reference: tiny pink crystal
fairy with dragonfly wings) flying to the right while carrying a short rainbow ribbon:
wings up, wings mid, wings down, wings mid; small bob between frames.
ROW 4 — four frames of a magical sparkle burst for when a gem lights up: a tiny white
twinkle, a bigger four-point star with rainbow rays, a ring of small rainbow sparkles
expanding, fading sparkle dust.
```
> Depois de salvar, rode `npm run assets`. O carregamento passa a mostrar as sete gemas acendendo em arco-íris, com a Faísca voando por cima e dicas trocando embaixo.

---

## 6b. PEDIDOS EXTRAS DO MUNDO 2

**Luna (a ficha do guardião veio só com a Sol).** Use a conversa do Mundo 2. Paisagem · 💾 `assets/raw/w2/luna_ref.png` · 📎 `w2/guardian_ref.png` (para ela combinar com a Sol) e `iris_ref_sheet.png`
```
Landscape 1536x1024. Character reference sheet of LUNA, Sol's girlfriend (match the style,
proportions and palette of the attached Sol sheet). LUNA: a soft femme lesbian healer,
long wavy dark hair with small pink desert flowers, deep brown skin, warm gentle eyes,
flowing pink-and-orange poncho with sun and wave patterns, small earrings, holding a
glowing clay healing bowl with turquoise water. Transparent background.
Top row: 3 full-body views with wide gaps — side view facing LEFT, 3/4 front, front.
Bottom row: 4 head-and-shoulders expression busts in a row: happy, proud/inspiring,
worried, emotional grateful. Figures never touch. No text.
```
> Quando ela existir, o reencontro Sol & Luna entra sozinho no diálogo depois do resgate.

**Dash de Íris** (opcional; hoje o dash usa o frame de corrida com rastro colorido). 📎 `iris_ref_sheet.png`, `iris_run.png` · Paisagem · 💾 `assets/raw/personagens/iris_dash.png`: veja a linha "2 · iris_dash" da seção 6.

---

## 7. CUTSCENES (Lote 11)
Opaco · Paisagem · 📎 `key_art.png`, `iris_ref_sheet.png`, `spark_ref_sheet.png` · 💾 `assets/raw/cutscenes/`. Sem texto (as falas entram pelo jogo).

| Arquivo | Prompt (comece com "Landscape 1536x1024. Cinematic story illustration, stylized 3D animated film still, no text.") |
|---|---|
| `intro_1.png` | "The world of Prisma at its most joyful: a colorful pride-like festival in a valley town, diverse people of all ages dancing under rainbow bunting, Iris laughing among friends." |
| `intro_2.png` | "MONOCHROME, a towering gray king of fog and masks with a square crown, rises over the town; a wave of gray fog washes the color away, people turning into gray silhouettes and hiding." |
| `intro_3.png` | "Iris alone in the gray town, kneeling; their white scarf still glows with a faint rainbow edge; a tiny crystal fairy, Spark, appears in a burst of light in front of their face." |
| `intro_4.png` | "Iris standing on a cliff at dawn, determined, scarf flowing, Spark on their shoulder, looking at the seven gray lands they must restore." |
| `guardians.png` | "Iris and the seven freed guardians standing together as a found family: Mama Ruby, Sol & Luna, Aurora in her wheelchair, Branch, Marina, Bix and Ace, all smiling, rainbow sky." |
| `ending_1.png` | "Inside a gray throne room the last gray mask falls from Monochrome, revealing a small shy colorful creature; Iris kneels and offers a hand gently." |
| `ending_2.png` | "The whole world restored: a huge festival across all seven lands, everyone in their own colors, the shy creature on Iris's shoulder with Spark, fireworks in rainbow colors." |
| `ending_true.png` | "(Final verdadeiro, com todos os fragmentos) Iris and friends looking at the night sky where the seven colors form a new constellation shaped like a heart; peaceful and emotional." |

---

## 8. ÁUDIO (Lote 12)
O GPT-Image não gera áudio. Use estas ferramentas:

### Música: Suno (suno.com) ou Udio
Ative o modo **Instrumental**. Salve em `assets/audio/musica/` como `.mp3`. Peça faixas que **dão loop**, com 1 a 2 minutos.

| Arquivo | Prompt de estilo |
|---|---|
| `title.mp3` | "uplifting orchestral pop, hopeful, glockenspiel and strings, warm synth pads, cinematic video game title theme, 100 bpm, instrumental, loopable" |
| `map.mp3` | "cheerful light adventure, marimba, pizzicato strings, soft drums, video game world map, 110 bpm, instrumental, loopable" |
| `w1.mp3` | "cozy folk adventure, acoustic guitar, flute, warm autumn, gentle and bouncy platformer music, 120 bpm, instrumental, loopable" |
| `w2.mp3` | "desert sunset, soft hand percussion, kalimba, warm guitar, healing and calm yet adventurous, 105 bpm, instrumental, loopable" |
| `w3.mp3` | "bright festive city pop, brass section, funky bass, claps, joyful pride parade energy, 124 bpm, instrumental, loopable" |
| `w4.mp3` | "lush jungle adventure, tribal-free organic percussion, wooden flutes, marimba, birds ambience, 115 bpm, instrumental, loopable" |
| `w5.mp3` | "dreamy underwater ambient, harp, soft synth arpeggios, airy pads, magical and artistic, 90 bpm, instrumental, loopable" |
| `w6.mp3` | "serene starry space, music box, celesta, slow synth swells, floating and peaceful, 85 bpm, instrumental, loopable" |
| `w7.mp3` | "epic dark gothic, pipe organ and choir pads slowly turning hopeful with strings, tense platformer, 128 bpm, instrumental, loopable" |
| `boss.mp3` | "intense boss battle, driving drums, orchestral hits, electric guitar, synth bass, heroic, 150 bpm, instrumental, loopable" |
| `boss_final.mp3` | "epic final boss, full orchestra and choir, synthwave elements, emotional and heroic climax, 160 bpm, instrumental" |
| `victory.mp3` | "short triumphant fanfare jingle, brass and bells, 5 seconds" |
| `ending.mp3` | "emotional celebratory pop ballad, piano and strings building to a joyful anthem, instrumental" |

### Efeitos sonoros: ElevenLabs Sound Effects ou jsfxr (sfxr.me, grátis)
Salve em `assets/audio/sfx/` como `.mp3` ou `.wav`:
`jump`, `double_jump`, `land`, `attack_whip`, `hit_enemy`, `enemy_restored` (cristalino, alegre), `coin` (faísca), `shard` (fragmento, brilhante e longo), `heart`, `hurt`, `death`, `checkpoint`, `spring`, `dash`, `glide_loop`, `shoot`, `ground_pound`, `break_block`, `door_portal`, `boss_roar`, `boss_hit`, `boss_restored`, `menu_move`, `menu_select`, `pause`, `dialogue_blip`.
Exemplo de prompt no ElevenLabs: *"cute sparkly crystal chime, magical pickup sound for a video game coin, short"*.

---

## Resumo da contagem
| Lote | Imagens |
|---|---|
| 1. Bíblia visual | 5 |
| 2. Fatia vertical | ~19 |
| 3. Mundo 1 completo | ~7 |
| 4. Menus | 5 |
| 5–10. Mundos 2–7 | ~13 cada (≈ 80) |
| 6. Habilidades | 7 |
| 11. Cutscenes | 8 |
| **Total** | **≈ 130 imagens + 13 músicas + 27 efeitos** |
