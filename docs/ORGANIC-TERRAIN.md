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
