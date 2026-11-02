# PRISMA — Prompts de cutscenes pós-mundo e transições

**Formato:** paisagem 1536×1024 px, PNG opaco, arte sem textos (a narração é exibida pelo jogo). **13 imagens novas:** 7 epílogos e 6 transições. Gerar **uma imagem por vez**, enviando referências oficiais dos personagens e cenários já criados.

## Prompt mestre (colar no início de cada pedido)

> Cena cinematográfica 3D estilizada premium do jogo original PRISMA, com acabamento suave de animação, materiais arredondados de vinil/argila, personagens expressivos, detalhes ricos porém leitura clara, profundidade, luz volumétrica suave e composição emocional esperançosa. Reproduzir fielmente os designs oficiais de Íris, Faísca, guardiões, chefões e mundos conforme imagens de referência, sem redesenhar, sem inventar roupas ou mudar identidades. Íris: jovem pessoa não-binária de pele morena média, sardas, cabelo curto assimétrico lilás a branco, jaqueta amarela, camiseta roxa, shorts pretos com legging, tênis branco-roxo e cachecol branco com borda arco-íris. Faísca: pequeno prisma-fada rosa brilhante com asas translúcidas. O tema é restauração, reparação e pertencimento; nenhuma violência, cadáver, ferimento ou vilão morto. Cores do mundo restauradas de modo cinematográfico. Imagem horizontal 1536×1024, PNG opaco, SEM texto, letras, marcas, UI, molduras ou balões. **Safe framing:** rostos, mãos, criaturas e arquitetura importante totalmente dentro dos 12% centrais de margem em cada borda; reservar os 25% inferiores para legenda escura sobreposta no jogo; NÃO posicionar elementos narrativos importantes no quarto inferior. Câmera frontal ampla a média, sem cortar personagens. Manter continuidade da cena com a jornada de Íris.

## Instruções de uso

1. Anexe referências oficiais do personagem/chefão e do ambiente correspondente.
2. Cole o prompt mestre e apenas um prompt de cena abaixo.
3. Salve o PNG **exatamente** no caminho indicado na coluna de destino (dentro do repositório PRISMA).
4. Repita para todos os 13 arquivos. O pipeline `npm run assets` detecta as artes opcionais automaticamente.
5. As falas já estão no código em `src/story/cutsceneWorlds.ts`. Não gerar texto sobre a arte.

## Prompts individuais

### 01. Vale do Coração, depois da restauração

**Salvar como:** `assets/raw/cutscenes/w1_outro.png`

**Prompt específico (acrescentar ao mestre):** Grande jardim acolhedor do Vale do Coração em plena primavera vermelha, Mãe Rubi em seu vestido rubi brilhante ao lado do antigo Juiz de Pedra, agora um golem gentil que ajuda habitantes diversos a reconstruir uma pequena ponte e abrir um portão acolhedor. Íris e Faísca observam a cena com alegria discreta. Luz de fim de tarde, telhados vermelhos, flores coração, nenhuma postura ameaçadora. O antigo chefão tem identidade visual reconhecível, agora restaurado e em paz.

### 02. Travessia do Vale para o Cânion

**Salvar como:** `assets/raw/cutscenes/w1_transition.png`

**Prompt específico (acrescentar ao mestre):** Íris e Faísca seguem por trilha de pedras douradas que sai de colinas vermelhas outonais e avança para grandes cânions alaranjados com arcos naturais, vapor de águas termais ao longe e sol de crepúsculo. A paleta muda delicadamente de vermelho para laranja, perspectiva ampla, cachecol flutuando ao vento; sensação de começo de novo capítulo.

### 03. Cânion do Entardecer, depois da cura

**Salvar como:** `assets/raw/cutscenes/w2_outro.png`

**Prompt específico (acrescentar ao mestre):** Sol e Luna, guardiãs com designs oficiais, juntas junto a uma fonte termal turquesa em cânion terracota; a enorme Serpente das Areias restaurada descansa em curva tranquila e ajuda a proteger viajantes da ventania, transformando areia em trilha segura. Íris e Faísca testemunham o reencontro, cactos floridos, tapeçarias laranja e rosa; atmosfera de cura e parceria.

### 04. Do Cânion à Cidade Solar

**Salvar como:** `assets/raw/cutscenes/w2_transition.png`

**Prompt específico (acrescentar ao mestre):** Íris e Faísca alcançam o topo de um arco rochoso laranja e descobrem a Cidade Solar brilhando ao longe: torres creme e amarelas, girassóis, bandeirolas e torre-relógio com sol. Horizonte com transição orgânica do terracota para ouro, caminho claro conduzindo até cidade acessível e festiva.

### 05. Cidade Solar, festival recuperado

**Salvar como:** `assets/raw/cutscenes/w3_outro.png`

**Prompt específico (acrescentar ao mestre):** Aurora, liderança intersexo em cadeira de rodas conforme referência oficial, celebra no centro de uma praça acessível repleta de pessoas de variadas idades, corpos e expressões. O antigo Holofote Frio, agora máquina luminosa acolhedora, ilumina o festival com luz quente sem vigiar ninguém. Íris e Faísca entre os convidados, girassóis, amarelo solar e festa inclusiva, cena de protagonismo e autonomia.

### 06. Da cidade à Selva Esmeralda

**Salvar como:** `assets/raw/cutscenes/w3_transition.png`

**Prompt específico (acrescentar ao mestre):** Íris e Faísca atravessam uma antiga porta de jardim que liga a cidade dourada a árvores gigantes esmeralda, cipós, cascatas e pontes de raízes. Raios solares atravessam folhas e deixam trilha verde viva. A cidade aparece pequena no horizonte, o novo mundo se revela sem ameaça.

### 07. Selva Esmeralda em reconexão

**Salvar como:** `assets/raw/cutscenes/w4_outro.png`

**Prompt específico (acrescentar ao mestre):** Ramo, jardineiro gay mais velho de chapéu de palha e avental verde-azulado, cuida de um viveiro compartilhado com a antiga Espinheira agora uma planta gigante amigável de flores vibrantes que forma um arco de passagem, não uma prisão. Íris e Faísca ajudam a plantar, moradores diversos cruzam a ponte viva, floresta gigante, cascata e cogumelos delicados; pertencimento à natureza.

### 08. Da floresta ao Recife Turquesa

**Salvar como:** `assets/raw/cutscenes/w4_transition.png`

**Prompt específico (acrescentar ao mestre):** Íris e Faísca seguem a água de uma grande cachoeira esmeralda até uma enseada turquesa translúcida, onde se avistam corais, conchas gigantes, esculturas subaquáticas e um arco de pedra. Composição de transição de verde exuberante para azul-turquesa, reflexos mágicos na água, aventura serena.

### 09. Recife Turquesa, vozes devolvidas

**Salvar como:** `assets/raw/cutscenes/w5_outro.png`

**Prompt específico (acrescentar ao mestre):** Marina, artista trans dos mares conforme referência oficial, reabre uma galeria de esculturas submersas iluminada por corais turquesa e conchas; o antigo Kraken do Silêncio, reconhecível porém restaurado, usa delicadamente seus tentáculos para sustentar obras e proteger a arte. Íris e Faísca apreciam as peças, cardumes coloridos, água límpida, cena de expressão livre e escuta.

### 10. Do Recife ao céu Anil

**Salvar como:** `assets/raw/cutscenes/w5_transition.png`

**Prompt específico (acrescentar ao mestre):** Íris e Faísca sobem por uma espiral mágica de água e nuvens que emerge do Recife Turquesa em direção a ilhas flutuantes de céu índigo. Cascatas parecem subir e cair entre nuvens, observatórios e pontos de estrelas ao fundo. Cor turquesa em baixo, azul-anil no alto, sensação sublime de descoberta.

### 11. Ilhas do Céu Anil e Eclipse transformado

**Salvar como:** `assets/raw/cutscenes/w6_outro.png`

**Prompt específico (acrescentar ao mestre):** Bix, astrônome bissexual de design oficial, guia uma observação coletiva em observatório numa ilha flutuante. O antigo Eclipse, agora uma mariposa celeste restaurada e tranquila, abre as asas revelando padrões de constelações sem ocultar a lua. Íris e Faísca acompanham a cena, telescópios, escadas de estrelas, céu índigo, clima de liberdade para duvidar e aprender.

### 12. Última viagem à Cidadela Cinza

**Salvar como:** `assets/raw/cutscenes/w6_transition.png`

**Prompt específico (acrescentar ao mestre):** Íris e Faísca na borda de uma ilha índigo contemplam a enorme Cidadela Cinza à distância, com torres góticas, rachaduras violeta e pequenas flores surgindo nas pedras. A trilha estelar segue pelo ar até os portões. Luz de esperança contrasta com a névoa, clima decisivo porém sem terror, cachecol arco-íris trazendo cor ao primeiro plano.

### 13. Cidadela Cinza, depois da transformação

**Salvar como:** `assets/raw/cutscenes/w7_outro.png`

**Prompt específico (acrescentar ao mestre):** Grande salão da Cidadela Cinza agora com pedras cinza-violeta restauradas, flores e luz prismática pelas janelas. Monocromo desarmado, sem máscara ameaçadora, reconhecível como alguém acolhido pela própria diferença, aceita a mão estendida de Íris; Ás, cavaleiro assexual conforme design oficial, observa com serenidade, Faísca ilumina discretamente o encontro. Atmosfera de reconciliação, sem violência e sem apagar a identidade de ninguém.

## Integração no jogo

- Os arquivos esperados têm chaves `cs_w1_outro` até `cs_w7_outro` e `cs_w1_transition` até `cs_w6_transition`.
- Ao completar um chefão dos mundos 1–6, o jogo reproduz epílogo e viagem antes de voltar ao mapa; no mundo 7, o epílogo entra antes do final existente.
- Se alguma imagem ainda não foi gerada, o jogo mantém a sequência com o mapa oficial do mundo (fallback), sem bloquear gameplay.
- O enquadramento padrão usa **contain**, sem zoom progressivo e com legenda inferior sobreposta; nunca colocar detalhes principais na área de legenda.
