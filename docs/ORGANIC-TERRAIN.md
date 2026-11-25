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