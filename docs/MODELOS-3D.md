# PRISMA — Modelos 3D (visual 3D beta)

O visual 3D (Opções → **Visual 3D (beta)**) desenha cada objeto do jogo com uma forma provisória. Quando existe um modelo `.glb` com o nome certo, ele toma o lugar da forma, sem mudar nenhuma linha de código. Assim os modelos podem entrar **um de cada vez**.

## Como adicionar um modelo

1. Salve o arquivo em `assets/models/<nome>.glb` (ou `.gltf`). Os nomes estão na tabela abaixo.
2. Rode `npm run assets`. Ele copia os modelos para `public/assets/models` e os lista no `manifest.json`.
3. Rode `npm run dev`, ligue **Visual 3D (beta)** nas Opções e entre numa fase em que o objeto apareça.

Se o arquivo estiver quebrado, o jogo segue com a forma provisória e escreve um aviso `[3D]` no console do navegador.

## Nomes dos arquivos

| Objeto | Arquivo |
|---|---|
| Íris | `iris.glb` |
| Faísca | `faisca.glb` |
| Inimigos | `enemy-<tipo>.glb`: `blot`, `moth`, `megaphone`, `padlock`, `beetle`, `scorpion`, `drone`, `snapper`, `puffer`, `comet`, `sentinel` |
| Chefões | `boss-<mundo>.glb`: `boss-1` (Juiz de Pedra) até `boss-7` (Monocromo) |
| Coletáveis | `pickup-coin.glb`, `pickup-shard.glb`, `pickup-heart.glb` |
| Objetos de fase | `prop-checkpoint.glb`, `prop-exit.glb`, `prop-spring.glb` |
| Outros | `crate.glb`, `cracked.glb`, `mover.glb`, `cage.glb`, `shot.glb` |

As regras ficam em [`src/render3d/models.ts`](../src/render3d/models.ts) e são cobertas por `npm run test:render3d`.

## Como o modelo deve vir

- **Eixos:** Y para cima, olhando para **+Z** (o padrão do glTF e do Blender ao exportar com "+Y Up"). O jogo gira o modelo para olhar para a direita e o gira de volta para a esquerda quando o objeto vira. Por isso as costas também precisam ficar boas.
- **Escala:** qualquer uma. O jogo redimensiona o modelo para a **altura do corpo de colisão** do objeto e apoia os pés na base dele. Por isso o modelo não deve ter nada muito acima da cabeça (como um balão de texto), ou o corpo encolhe.
- **Origem:** tanto faz; o jogo centraliza pelo contorno do modelo.
- **Peso:** em torno de 5 mil a 20 mil triângulos por personagem. Use texturas de até 1024 px e de no máximo 2 MB por arquivo. Comprima com:
  ```bash
  npx @gltf-transform/cli optimize entrada.glb assets/models/iris.glb --compress meshopt --texture-compress webp
  ```
  O jogo já lê malhas comprimidas com meshopt.

## Animações

Os clipes são escolhidos pelo **nome**, igual ao do 2D. Faltou algum? O jogo usa o mais parecido, então um modelo só com `idle`, `run` e `jump` já funciona com todas as habilidades.

| Clipe | Quando toca | Se faltar, usa |
|---|---|---|
| `idle` | parada | o primeiro clipe do arquivo |
| `run` | correndo | `walk`, `idle` |
| `jump` | no ar | `idle` |
| `doublejump`, `wallkick` | pulo duplo, pulo na parede | `jump` |
| `wallslide`, `glide`, `pound` | deslizando na parede, planando, mergulho estelar | `fall`, `jump` |
| `dash` | dash | `run` |
| `attack`, `shoot` | golpe de echarpe, disparo | um ao outro, `idle` |
| `swim` | nadando | `run` |
| `hurt`, `win` | dano, vitória | `idle` |
| `move` | inimigos andando | `run`, `walk` |

Os **chefões** usam o estado da luta como nome do clipe, por exemplo `idle`, `slamWind`, `throwWind`, `stompWind`, `stuck`, `hurt`, `leap` e `defeated` no Juiz de Pedra (veja o tipo `State` em `src/objects/<Chefão>.ts`). O estado `*Wind` é a preparação do golpe e precisa deixar claro o ataque que vem a seguir.

## Caminho sugerido para criar os modelos

1. **Base:** gere o modelo a partir das folhas de referência (`assets/raw/00_estilo/iris_ref_sheet.png`, `spark_ref_sheet.png`, guardiões e chefões) num gerador imagem→3D, como Meshy, Tripo, Rodin ou Hunyuan3D, ou modele no Blender.
2. **Limpeza no Blender:** feche buracos, reduza triângulos (modificador *Decimate*), confira a escala e a direção (+Z na frente).
3. **Esqueleto e animações:** para personagens humanoides, use o Mixamo para ter `idle`, `run` e `jump`. Renomeie os clipes no Blender (NLA ou Action Editor) para os nomes da tabela. As habilidades específicas (dash, planar, mergulho) se animam à mão.
4. **Exportar:** *File → Export → glTF 2.0 (.glb)*, com "+Y Up" e animações incluídas. Depois rode o comando de compressão acima.
5. **Conferir:** rode `npm run assets`, ligue o Visual 3D e entre numa fase.

Mantenha o estilo das artes oficiais. O modelo é a mesma personagem, não uma reinterpretação.
