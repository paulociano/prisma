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