# PRISMA — Plano de próximas melhorias

Atualizado em **02/11/2026** após a integração dos PRs **#1 a #18**.

## Estado do projeto

- **Base existente:** 7 mundos, 28 fases, mapa-múndi e mapas internos, 7 chefões, habilidades progressivas, save local, teclado/gamepad, HUD, diálogos e cutscenes.
- **Qualidade automatizada:** build TypeScript/Vite, preparação de assets, testes de save, input e regras de fases no workflow `Quality`.
- **Melhorias recentes:** espaçamento de checkpoints gerados; ajustes do mapa e do HUD; onboarding; orientações de habilidades; avisos de vulnerabilidade e preparação de golpes; README visual.
- **Limite da validação atual:** CI verde **não substitui** playtest. Ainda não existe evidência registrada de teste jogável completo em navegador, nem confirmação documental de publicação pública do Pages.

## Ordem proposta e critérios para concluir

| Etapa | Prioridade | Trabalho | Critério de aceite verificável |
|---|---|---|---|
| **19** | P0 | **Smoke test de publicação e navegação**: confirmar GitHub Pages, carregamento de assets/áudio, início, opções, mapas, retorno e reinício em desktop | URL acessível; nenhuma falha bloqueadora de console ou asset; relatório com navegador, viewport e evidências |
| **20** | P0 | **Revisão visual dos sete mapas**: clareiras, token de Íris, nomes de fases, marcadores, áreas seguras e navegação mouse/teclado/gamepad | Capturas dos 7 mapas em 1280×720 e janela reduzida; sem textos cortados ou elementos duplicados |
| **21** | P0 | **Playtest funcional de fases e checkpoints**: amostrar níveis de todos os mundos, testar morte/respawn, dois checkpoints, saída, persistência de fragmentos | Registro por fase, problemas reproduzíveis e correções em PRs isolados; validar ao menos um checkpoint por mundo |
| **22** | P0 | **Encontros de chefões**: checar antecipação de ataques, indicadores `CUIDADO`/`ATACAR`, vulnerabilidade, dano, vitória e retorno ao mapa | Testar 7 arenas; nenhum indicador encobre Íris/HUD; avisos aparecem antes ou durante o preparo, não após o golpe |
| **23** | P1 | **Ensino das habilidades**: criar oportunidades seguras de praticar cada habilidade após o desbloqueio; revisar dicas iniciais dos mundos | Um percurso demonstrável por habilidade, sem exigir leitura longa ou input não desbloqueado |
| **24** | P1 | **Acessibilidade e controles**: contraste e legibilidade em telas diferentes; revisar tremor/flashes, sinais redundantes, gamepad e possíveis ajustes touch | Checklist por opção e modalidade de controle, com falhas classificadas por severidade |
| **25** | P1 | **Progressão e balanceamento**: revisar curva de desafio, posição de checkpoints, densidade de inimigos, recuperação e recompensas | Relatório por mundo com ajustes justificados por playtest, sem alterar todas as fases de uma vez |
| **26** | P1 | **Pipeline de release**: artefato versionado, smoke test após deploy, instruções de rollback e identificação da versão em execução | Release reproduzível, URL testada, build rastreável ao commit e plano de recuperação |
| **27** | P2 | **Polimento narrativo e audiovisual**: ritmo de diálogos/cutscenes, feedback de restauração de cores, mix de áudio e consistência dos guardiões | Revisão de cenas com evidências de teste e sem regressões de acessibilidade |
| **28** | P2 | **Preparação de demonstração pública**: instruções, feedback de jogadores, checklist de lançamento e comunicação | Build público avaliado com fluxo completo de introdução, primeira fase, mapa e salvamento |

## Trilha visual (terreno, profundidade e dinâmicas)

Plano separado, em paralelo às etapas acima. Estado em 12/11/2026:

| Etapa | Trabalho | Estado |
|---|---|---|
| V0 | `npm run shots` (capturas automáticas) e desenho do terreno separado em `src/gfx/Terrain.ts` | Feito; verificado por capturas antes/depois |
| V1 | Terreno sem repetição: interior e grama variados, ilhas com raízes, sombras de volume e projetadas | Feito; verificado por capturas nos mundos 1, 4 e 5. **Sem playtest** |
| V2 | Profundidade: névoa entre fundo e jogo, sombras de contato, brilho nos fragmentos, parallax vertical, zonas de câmera com zoom | Feito, menos o primeiro plano (depende de arte) |
| V3 | Portão: aprovação visual do padrão na fase 1-1 | Pendente |
| V4 | Cor como mecânica: flor-ponte, plataforma desbotada e porta de cor (`src/systems/ColorMechanics.ts`), em rotas opcionais das fases 1-1, 1-2 e 1-3 | Feito; verificado por simulação no navegador. **Sem playtest** |
| V5 | Gerador por mundo: dois desafios de assinatura por mundo (14 no total) sempre presentes no trecho gerado, com encontros desenhados (dupla chão + ar) | Feito; `check-levels` passa nos mundos 1 a 4, 6 e 7. O mundo 5 (nado livre) não é coberto pelo verificador. **Sem playtest** |
| V6 | Arte nova integrada nos 7 mundos: interior pintado sem repetição, variações de topo, paredes, parte de baixo dos blocos, decalques, primeiro plano, um marco por fase e os objetos de cor pintados | Feito; verificado por capturas nos mundos 1 a 7. **Sem playtest** e sem medição de FPS (sprites processados foram de 31 MB para 37 MB) |
| V7 | Qualidade gráfica em Opções → Imagem (Baixa, Média, Alta); telas de toque começam em Baixa | Feito; verificado por capturas dos três níveis. **Ganho de FPS não medido** |
| V8 | Maré no Recife: na fase 5-2 a água sobe e desce em ciclo, com aviso antes; na seca anda-se pelos corais e os baiacus ficam inofensivos, na cheia nada-se | Feito; `check-levels` confirma o caminho a pé na seca; ciclo conferido no navegador. **Sem playtest** |
| V9 | Gravidade invertida nas Ilhas do Céu: campos em que Íris cai para cima e anda no teto, nas fases 6-2 e 6-3 (rota alternativa sobre o abismo e sobre os espinhos) | Feito; travessia simulada quadro a quadro no navegador com teclas reais nas duas fases. **Sem playtest**; pisão invertido não testado |
| V10 | Tempestade de areia no Cânion: no fim da fase 2-2, um paredão de areia persegue Íris do checkpoint até a saída | Feito; um corredor automático atravessa o trecho sem ser alcançado e sobrevive a uma parada de 4 s. **Sem playtest** |
| V11 | Rampas de verdade: blocos de rampa (sobem 1 bloco em 2 colunas) com física própria para Íris e a peça pintada do kit 2; um passe automático troca por rampa os degraus de 1 bloco com espaço livre (10 rampas em 6 fases) | Feito; subir, descer, parar e pular na rampa simulados quadro a quadro. **Sem playtest** |
| V12+ | Cantos internos do kit parte 2 (ainda sem uso), mais rampas desenhadas à mão nas fases, trechos gerados curtos entre as partes autorais | Não iniciado |

## Regras de execução

1. **Priorizar defeitos reais:** bugs bloqueadores de jogo, save ou navegação vêm antes de conteúdo novo.
2. **Um problema por PR sempre que possível:** incluir reprodução, causa, mudança e validação.
3. **Verificação em duas camadas:** manter CI obrigatório e registrar teste visual/manual quando a mudança envolver HUD, sprite, mapa ou combate.
4. **Sem progresso fictício:** marcar como concluído apenas com link de PR/commit e evidência de verificação; diferenciar testes automatizados de playtest.
5. **Preservar os pilares de PRISMA:** narrativa de inclusão, restauração sem violência letal, artes oficiais consistentes e informação acessível além da cor.
6. **Não prometer compatibilidade não testada:** celular, gamepad físico e diferentes navegadores exigem teste próprio.

## Matriz mínima de QA para cada release candidata

- **Fluxo:** título → opções → mapa-múndi → mapa do mundo → fase → pause/restart → conclusão → mapa.
- **Persistência:** fechar/reabrir, progressão, coletáveis, configurações e comportamento sob storage indisponível.
- **Jogabilidade:** colisões, morte, respawn, checkpoints, habilidades adquiridas, controles por teclado/gamepad.
- **Apresentação:** HUD, textos, dicas, mapas, anúncios dos chefões, efeitos visuais e áudio.
- **Ambientes:** desktop 1280×720; viewport menor; Firefox/Chromium quando disponíveis.
- **Performance:** registrar travamentos, consumo excessivo e quedas severas de FPS em cenas representativas.

## Próxima ação

Começar pela **etapa 19**, produzindo um relatório objetivo de execução real. Se o GitHub Pages não estiver publicado, corrigir a configuração/deploy antes de iniciar polimento visual. Em seguida executar **etapas 20–22** com evidência e abrir PRs de correção conforme os problemas encontrados.

> Este é um plano de execução, não um registro de playtests já realizados.
