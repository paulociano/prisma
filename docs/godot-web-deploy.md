# Publicação Web do PRISMA

O GitHub Pages usa o workflow "Deploy PRISMA to GitHub Pages", na branch main, para construir o Godot a partir de godot-remaster. O endereço permanece https://paulociano.github.io/prisma/.

Cada publicação processa as artes, exporta Godot 4.4.1 Web sem threads e testa a inicialização e a primeira fase no Chromium. Só depois envia o artefato ao Pages. Para publicar novas alterações de godot-remaster, abra Actions > Deploy PRISMA to GitHub Pages > Run workflow, selecione main e godot. Um push em main também executa a publicação padrão.

Reversão: no mesmo workflow, selecione main e phaser. Os arquivos e a lógica do Phaser continuam na branch main. A reversão vale até a próxima publicação Godot. O save Phaser não é migrado automaticamente para Godot. O remaster contém o Mundo 1 e os outros mundos estão em desenvolvimento.
