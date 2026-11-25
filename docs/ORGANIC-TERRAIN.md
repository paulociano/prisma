# PRISMA — Organic Terrain / World Studio (piloto 1)
 
## Uso
- `npm ci`, `npm run assets`, `npm run dev`.
- Abra `/studio.html` para visualizar o mapa final das 28 fases, incluindo `extendLevel` e `autoRamps`.
- Selecione 1-3 (Ponte das Raízes), fase inicial do Studio. Selecione um trecho de 20 colunas (1280 px) para PNG de referência em escala nativa; o panorama inteiro é reduzido se necessário.
- Exporte o JSON da fase (ou todas): grade, entidades, limites de trechos, paredes e escala de 64 px. O intervalo de colunas é [c0,c1), sem sobreposição.
- Abra `/index.html?organic=1` e entre na fase 1-3 (progressão normal). Sem o parâmetro, o renderer anterior permanece intacto.
- O modo orgânico do Studio é esquemático. No jogo, o piloto agrupa paredes e plataformas usando a arte existente; não promete a fidelidade de arte personalizada.
 
## Invariantes
Não alterar colisões, perigos, entidades, mecânicas, dados de fase, progressão, saves ou filtros de cor. Guias estáticos não são hitboxes dinâmicas. Módulos maiores podem ter formas decorativas, mas não devem criar falsos caminhos; validar especialmente paredes escaláveis e passagens secretas.
 
## Próximo gate de arte
Exportar 1-3 e selecionar o trecho do cofre suspenso (procurar entidade chest). Comparar capturas antes/depois. Produzir primeiro uma formação rochosa contínua com raízes, usando PNG técnico como referência de coordenadas e a imagem de direção artística do usuário. Gerar transparência verdadeira; preservar superfícies pisáveis e espaço livre. Exportar partes separadas para terreno, decoração atrás do player, oclusão diante do player. Só depois de medir encaixe e custo de memória ampliar o kit. Não publicar arte definitiva sem playtest.
 
## Verificação
`npm run test:art-geometry`, `npm run test:levels`, `npm run check-levels`, `npm run build`. A/B com `?organic=1` e sem parâmetro. Testar mapa inteiro, exportação PNG/JSON, zoom e trechos, colisões, fragmentos, reset e restauração de cor. Nenhuma alegação de playtest até execução real.

## Automação (piloto 2)
O CI gera os 28 panoramas SVG/PNG e JSON, e todos os chunks da fase 1-3. Localiza o cofre pelo mapa final e cria focus.png, focus.svg e focus-brief.md com coordenadas reais. Tudo fica no artifact prisma-art-packs. O job visual captura o mesmo trecho no renderer legado e orgânico, artifact prisma-pilot-comparison. As capturas são de cenas posicionadas pelo script, não um playtest humano.

O modo orgânico agora recompõe o interior do terreno em faixas de canvas com textura amostrada em coordenadas do mundo, volume e pequenas bordas curvas, mantendo capas, rampas, raízes e colisões atuais. Limite de 64 MiB de pixels de textura estimados; fallback para o renderer legado quando o limite ou a alocação falhar. Não há novos assets autorais nesta etapa. A arte de referência ainda exige refinamento da silhueta e composição.
 
## Piloto 3: composição autoral do cofre
As capturas do piloto 2 revelaram que o contorno retangular persistia. O orçamento anterior também incluía o céu vazio (238 x 22 tiles = cerca de 85,8 MB de pixels RGBA), acionando o fallback. Agora os bounds verticais são recortados por faixa antes de alocar. O script de captura falha se o modo orgânico não estiver realmente ativo. 
HeroCoffer.ts recompõe o C do cofre como uma silhueta única com textura existente, luz e raízes pintadas por código. cofferPlan verifica os 11 blocos, a abertura, a entidade e a vizinhança antes de trocar somente a arte. Caso não haja correspondência, preserva o renderer original. Não é arte generativa final; é uma primeira composição específica para avaliação no runtime.


## Piloto 4: materiais pintados e arte substituível
A inspeção do piloto 3 mostrou raízes vetoriais destoantes. O cofre usa agora decalques pintados existentes (rochas, raízes, musgo) dentro da silhueta única. A composição ainda é derivada do kit, não uma ilustração inédita. Capturas esperam a mesma saturação antes de comparar e registram a origem visual.

Uma ilustração refinada pode ser integrada automaticamente por `assets/raw/w1/organic/coffer.png`: PNG RGBA 832 × 704, sem personagens, UI, paisagem ou objetos dinâmicos. Origem da geometria em (96,96) na imagem, grade de 128 px (2x); roof x=96..608, floor x=96..736 a y=480, parede x=96..224. Câmara transparente, margem de 96 px. O pipeline verifica dimensões, transparência do vão, cobertura de células e cantos. Sem arquivo usa a composição existente. O filtro de cor e a física permanecem no jogo.

## Piloto 5: composição de paisagem
OrganicSurface separa a folhagem da faixa de alvenaria, preserva o ponto de contato e dissolve a borda inferior com alfa variável. OrganicFaces aplica rochas, raízes e vegetação do atlas em coordenadas contínuas, com iluminação local recortada à massa. Faixas mantêm a mesma amostragem e são limitadas em tamanho. O renderer legado continua sendo fallback. A comparação passa por seis posições e o CI exige igualdade entre os corpos estáticos de sólidos, plataformas atravessáveis e perigos. É um teste de paridade geométrica, não um playtest completo.


## Piloto 6: captura determinística e referência de produção
O job de checks do piloto 5 passou; o job visual falhou no baseline por timeout esperando saturação. A captura agora congela física, remove follow de câmera e aplica ColorRestore.complete/update(1) somente pelo script de QA, mantendo a verificação de saturação e paridade física. Não altera a progressão do jogo. O exportador passa a fornecer coffer-mask.png (máscara transparente das células), coffer-guide.png/svg (contatos e abertura) e coffer-placement.json (coordenadas de mundo, escala e contrato do asset). Esses arquivos são guias técnicos e não arte nova. As sombras inferiores são recortadas à massa e os decalques legados não são duplicados sobre o bake. A aprovação permanece condicionada aos testes e inspeção visual.


## Piloto 7: extensão para o Mundo 1
`?organic=1` habilita o renderizador nas três fases de exploração do Vale do Coração. O Tribunal de Pedra conserva a arena já pintada; seu chão faz parte da imagem de fundo. O script valida os quatro mapas, a igualdade dos corpos estáticos, a seleção do renderer e o orçamento de pixels. O relatório world-one-parity.json contém a contagem de superfícies e bytes estimados por fase. Exportação de chunks para as quatro fases. O perfil de borda passa a variar continuamente em coordenadas do mundo, limitado a 10 pixels de projeção decorativa. A versão padrão continua inalterada; não é playtest completo e não contém ilustrações inéditas.


## Piloto 8: primeira ilustração inédita
`assets/raw/w1/organic/coffer.png` é um asset raster gerado para a direção artística do PRISMA, separado do mapa de colisões. A imagem original foi ajustada com remapeamento por trechos para alinhar as alturas de contato e o vão ao gabarito 832×704 RGBA. Validação local do arquivo: 11/11 centros sólidos com alfa >220, 98,97% de amostras transparentes no vão protegido, quatro cantos transparentes. Não contém personagens, HUD ou objetos de interação. O pipeline existente converte para WebP e o renderer HeroCoffer usa o asset somente no modo experimental. A suite visual exige explicitamente organicCofferSource=authored; sem isso a publicação experimental não é aprovada. Os números de alfa não substituem inspeção de alinhamento visual nem playtest.


## Piloto 9: primeira ilha orgânica reutilizável
`assets/raw/w1/organic/island.png`: novo raster gerado, 448×240 RGBA, núcleo horizontal de 384 px (x=32..416), contato y=48. Remapeado por faixas verticais para conservar o volume e alinhar o contato. Verificação local: 99,54% de cobertura alfa >220 no núcleo x=32..415, y=64..159; 9/9 pontos de controle preenchidos, cantos transparentes. O renderer aplica a peça apenas em ilhas sólidas livres de 2–4 células, com margem proporcional e altura fixa de 120 px. Não altera plataformas móveis, atravessáveis ou físicas. O CI verifica o conjunto de posições elegíveis e a utilização de cada asset, além da paridade de colisões. Ainda requer inspeção de capturas para verificar contorno e leitura de superfície; uma variante não resolve toda a repetição.


## Piloto 10: paredão orgânico
`assets/raw/w1/organic/wall.png` (256×512 RGBA) é uma face vertical ilustrada, com transparência nas junções. O núcleo validado tem 100% de amostras alfa >220. O bake desenha trechos de 2–5 células dentro da máscara sólida original, evitando sobreposição de duas faces em pilares estreitos. O CI verifica presença nas três fases de exploração, ausência no modo legado, segmentação e paridade de colisões. Não altera a silhueta física nem substitui inspeção visual e playtest.


## Piloto 11: caminhos ilustrados contínuos
`assets/raw/w1/organic/ground.png` é uma quarta ilustração inédita, 1024×320 RGBA, com contato em y=96 e escala de 0,5. O recorte central e remapeamento alinham o caminho à linha física. Validação local: 100% de cobertura alfa >220 em x=0..1023, y=100..219; margem superior inteiramente transparente. OrganicGround amostra a peça em coordenadas do mundo e alterna reflexão horizontal para obter junções de pixels idênticos; a reflexão pode inverter a direção da luz, uma limitação a rever visualmente. Aplica apenas a superfícies sólidas de ao menos três células, em chunks de no máximo 512×160 pixels, com máscara de profundidade por coluna e transição inferior para o bake. As colisões, rampas, ilhas, plataformas móveis e perigos mantêm o código anterior. O CI exige uso do módulo nas três fases de exploração e paridade física. Não substitui inspeção de screenshots e playtest.


## Piloto 12: transições naturais
OrganicTransitions reaproveita o caminho ilustrado nas rampas completas de duas células, com cisalhamento alinhado à inclinação física, margem decorativa de 24 px e sem rotação do material. Nos cantos internos, um decalque pintado de raiz é recortado à união de três células sólidas e fundido à massa por alfa radial. O vão permanece livre. Não há PNG novo nesta etapa: reutilização deliberada para manter identidade artística. O CI compara a utilização das rampas com os pares do mapa e amostra seis pontos da função física rampSurface, além da paridade dos corpos estáticos. A aprovação visual e o playtest continuam necessários.


## Piloto 13: profundidade atmosférica
OrganicAtmosphere cria duas texturas Canvas estáticas de 640×360, reutilizadas entre cenas (1,76 MiB de pixels RGBA estimados, não medição GPU). A luz quente fica antes do plano médio e a névoa entre a arquitetura/vegetação próxima e o fundo. Ambas entram no container de fundo antes de ColorRestore, sem cobrir jogador, perigos ou HUD. Média tem opacidade reduzida; Baixa não adiciona efeitos. Não introduz movimento nem flashes, e mantém a regra de redução de movimento da folhagem existente. A arena e subníveis não recebem o efeito. O CI exige duas camadas nas três fases orgânicas, zero na arena/legado/baixa, e compara os corpos estáticos também na qualidade baixa. Capturas não são medição de FPS nem playtest. A iluminação é atmosférica, não iluminação 3D dinâmica.


## Piloto 14: iluminação localizada e contato arquitetônico
OrganicLighting usa o centro luminoso estimado dos pixels quentes do frame pintado da lanterna, com fallback de âncora estática. Um halo de 128×128 compartilhado (64 KiB RGBA de pixels) é desenhado atrás de cada lanterna elegível e dentro do container que recebe ColorRestore. Casas e arcos recebem uma sombra de contato discreta. Não há luzes dinâmicas, novos colliders, flashes ou atualização por frame; qualidade média reduz a intensidade e baixa desativa o efeito. Arena, subníveis e modo legado permanecem inalterados. A suite de runtime verifica cobertura dos props, desligamento nas configurações e paridade física. Não garante precisão fotométrica nem avaliação estética sem capturas.


## Piloto 15: marcos ancorados à paisagem
OrganicVista seleciona um trecho de chão contínuo de 5 ou 7 células com quatro células de altura livres, evitando entidades críticas e preferindo a região central da fase. Recompõe o landmark pintado existente e quatro elementos de vegetação da mesma paleta, em coordenadas do mundo, atrás da geometria e dentro de ColorRestore. O landmark antigo é ocultado somente quando a nova composição funciona. Sem local adequado ou sem textura, conserva o original. Baixa qualidade, arena, subníveis e modo legado mantêm o comportamento anterior. A comparação captura o local selecionado, testa a presença da composição e a paridade de colisões. Não é uma nova ilustração nem uma garantia de legibilidade estética sem inspeção das capturas.


## Piloto 16: primeiro plano legível e revisão de cenas completas
OrganicForeground recompõe as faixas de folhagem pintadas já existentes: a faixa superior ocupa no máximo 96 px da altura lógica e a inferior 72 px. Quando Íris se aproxima das bordas, a opacidade diminui suavemente; qualidade média reduz intensidade, baixa e redução de movimento mantêm a desativação original. Não há nova ilustração nem alteração de física. A suite de geometria verifica a função de opacidade; a captura verifica configuração e limites das faixas. O novo script build-comparison-sheets.mjs gera quatro JPEGs lado a lado (original/orgânico), um por fase, com todas as posições correspondentes e índice, dentro de .debug/shots/review. A geração falha se houver pares ausentes. A revisão visual humana ainda é necessária e as capturas continuam não equivalendo a playtest.


## Piloto 18: Santuário das Raízes, composição exclusiva
`assets/raw/w1/organic/root_sanctuary.png` é uma ilustração inédita de árvore ancestral, rocha, raízes e folhagem rubra, 1536×1024 RGBA. Núcleo esquerdo e região aberta à direita passaram nas verificações locais de alfa (100% em ambas as amostras). A composição usa o gabarito da Ponte das Raízes: cofre em col 182 / row 13, piso em row 20, arte em 960×640 px ancorada ao mapa final, sem depender de coluna absoluta. RootSanctuary exige uma prateleira sólida de 15 células e recorta o vão do cofre e sua entrada com alfa zero e transição de 28 px. Desenha atrás do terreno, dentro de ColorRestore, sem novos corpos físicos. Qualidade baixa e legado não recebem a camada. O CI verifica âncora, ordem de desenho, amostra de alfa zero e paridade física. O resultado é uma composição de fundo estrutural, não substitui a silhueta das colisões. Inspeção visual e playtest ainda necessários.


## Piloto 27: macrocomposições ancoradas
Dois agrupamentos ambientais secundários por fase quando houver prateleiras seguras próximas de 19% e 76% da extensão final. O planejador reserva o marco principal e o Santuário, exige ar livre e piso sólido, e limita a proximidade entre cenas. Composições assimétricas com assets existentes, atrás do gameplay, no mesmo ColorRestore. Não são pinturas inéditas nem cobertura integral do mapa. Teste determinístico de separação e imutabilidade; inspeção visual pendente.


## Piloto 28: produção de massas de terreno (escopo corrigido)
Preservar bg_far, bg_mid, bg_near e foreground existentes. As pinturas panorâmicas anteriores são referências estéticas, não substitutos da geometria. O exportador gera chunk_NNN-terrain-mask.png e chunk_NNN-terrain-placement.json por trecho de 20 colunas nas fases de exploração do mundo 1, com escala 1:1 e recorte vertical. A máscara cobre somente sólidos e rampas; vãos, espinhos e plataformas atravessáveis ficam transparentes. Contrato proposto para ilustrações em assets/raw/w1/organic/terrain/<fase>/<chunk>.png: rocha, musgo, raízes e transições pintadas como uma massa única, respeitando a máscara, alinhamento e bordas comuns. Não pintar fundos, HUD, entidades nem pontes sobre vãos. A importação no renderer não está implementada neste commit; primeiro validar as artes contra as máscaras e verificar continuidade. Arena permanece intacta.


## Piloto 29: importação experimental de placas estruturais
Use ?organic=1&plates=1. O pipeline de assets reconhece arquivos PNG RGBA em assets/raw/w1/organic/terrain/<fase>/chunk_NNN.png e converte para WebP. O contrato de dimensão é compartilhado com o exportador. TerrainPlates verifica a textura carregada contra a máscara dos sólidos/rampas: cobertura de ao menos 98% por célula, transparência no espaço livre fora da margem decorativa (até 32px acima e 10px laterais), ausência de arte sobre espinhos/plataformas atravessáveis. Só substitui o renderer nas colunas aceitas e isoladas de vizinhos; recusa trechos conectados e área do Santuário. Sem asset ou com rejeição, preserva a apresentação anterior. A física, os fundos, o primeiro plano e os objetos continuam independentes. A integração de placas contíguas exige um contrato de emenda futuro. O PNG inicial ajustado localmente não está incluído neste commit; deve ser colocado no caminho exato antes da validação de runtime.


## Piloto 31: continuidade entre placas
O exportador indica conexões laterais e áreas protegidas. TerrainPlates agrupa trechos adjacentes conectados pela geometria; todos os PNGs do grupo devem existir, passar na validação dimensional/de alfa e apresentar bordas compatíveis em Y de mundo (diferença premultiplicada máxima 48 e média 18, limites iniciais para WebP). Se um falhar, o grupo inteiro mantém a apresentação anterior; nenhuma placa parcial é aplicada. Santuário continua protegido. Testes puros de agrupamento, transparência e descontinuidade; não equivale a validação visual de emendas pintadas. As artes conectadas ainda precisam ser produzidas.


## Piloto 32: duas massas pintadas da Trilha das Lanternas
O particionamento de placas prefere vãos físicos entre 12 e 20 colunas, mantendo o limite de 1280 px. Gabaritos gerais de câmera continuam fixos; gabaritos de placas usam terrainArtChunks. A fase 1-2 recebe dois PNGs inéditos: chunk_001 (1024×160, 13 células sólidas) e chunk_002 (1280×160, 12 células sólidas), originados da mesma folha de arte, rocha violeta acinzentada, raízes e musgo frio. Remapeamento por coluna preserva o contato y=1280 no mundo; cobertura alfa local de 100% no núcleo e zero pixels fora do vão. Os PNGs são registrados juntos, sem alterar fundos, física ou arena. QA adicional exige ambos carregados e compara corpos estáticos; capturas em três posições. Os conjuntos longos ainda precisam de arte e inspeção das emendas.
