# Eletrotech

Front-end estático em HTML, CSS e JavaScript. O conteúdo é mantido nos arquivos locais, sem painel ou API de conteúdo.

## Desenvolvimento

Requer Node.js 24 ou superior.

```sh
npm ci
npm run dev
```

Abra http://127.0.0.1:5500.

## Conteúdo e publicação

Edite textos e serviços em data/pages.json e data/services.json; catálogo em data/products.json; contatos e identidade em data/site.json. Os modelos das páginas ficam em templates/pages/. Alterações diretas nos HTML gerados podem ser sobrescritas pelo build. Preserve data/product-routes.json para manter as URLs.

```sh
npm test
npm run build
```

O build usa dados locais e prepara _site/. A publicação pelo GitHub Pages ocorre por push na main ou execução manual do workflow.

CSS, JavaScript, imagens e vídeos permanecem em css/, js/, images/, assets/ e videos/.

## Painel Sanity

O [Painel Eletrotech](https://eletrotech-official.sanity.studio/) está hospedado no Sanity e usa o projeto `lwmn9kat` com o dataset `production`.

### Conectar pela primeira vez

1. Em [Sanity Manage](https://www.sanity.io/manage), crie o projeto Eletrotech na sua conta e um dataset público chamado `production`. Esse dataset contém o conteúdo público do site.
2. Preencha o `projectId` em `studio/project.json`. O ID é público e serve tanto para o painel quanto para o build do site.
3. Na pasta `studio`, instale as dependências, autentique com a conta dona do projeto e carregue o conteúdo:

```sh
npm ci
npx sanity login
npm run seed
npx sanity datasets import initial-content.ndjson --dataset production --missing
npm run dev
```

Abra http://localhost:3333. Se o Studio solicitar CORS, adicione essa origem com credenciais permitidas no Sanity Manage. A opção `--missing` preserva documentos que já existem.

### Testar e publicar

No Studio, abra **Editar pelo site** para navegar pela versão publicada e clicar em textos, imagens e links editáveis. Na home, **Editar fundo do banner** abre o campo do vídeo. As alterações aparecem nessa prévia depois que o GitHub Pages publica a nova versão.

Na pasta principal, rode `npm ci`, `npm run sanity:pull`, `npm run build` e `npm run dev`. O comando de sincronização atualiza os JSON locais para a prévia. Use os dados importados e edite o conteúdo pelo Studio. Use **Publicar** no Studio para enviar a versão pública. Preserve os slugs já publicados e desative produtos que saírem do catálogo.

Para disponibilizar o painel online, execute `npm run deploy` na pasta `studio` após fazer login no Sanity CLI. O Studio exige acesso de editor ao projeto.

Envie os arquivos do projeto para a branch `main` e selecione **GitHub Actions** como fonte de publicação em **Settings → Pages**. O workflow **Publicar site** busca o conteúdo publicado antes de gerar as páginas. Ele pode rodar manualmente e verifica mudanças duas vezes por hora. O agendamento pode atrasar no GitHub. Se a busca ou a validação falhar, a publicação anterior continua no ar.

Imagens enviadas pelo Studio devem ser PNG, JPEG, WebP ou SVG e ter até 20 MB. Para vídeo, use MP4 ou WebM de até 80 MB.
