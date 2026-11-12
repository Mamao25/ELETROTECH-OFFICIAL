import {defineConfig} from 'sanity';
import {ptBRLocale} from '@sanity/locale-pt-br';
import {defineDocuments, presentationTool} from 'sanity/presentation';
import {structureTool} from 'sanity/structure';
import project from './project.json' with {type: 'json'};
import {schemaTypes} from './schemaTypes/index.js';

const settingsId = 'site-settings';
const managedTypes = ['siteSettings', 'sitePage'];
const site = new URL('https://mamao25.github.io/ELETROTECH-OFFICIAL/');
const pages = {
  '': 'home',
  'index.html': 'home',
  'produtos.html': 'catalog',
  'como-trabalhamos.html': 'process',
  'oxilife-fish.html': 'oxilife',
  'contato.html': 'contact',
  'portfolio.html': 'portfolio',
};
const mainDocuments = defineDocuments([
  ...Object.entries(pages).map(([file, page]) => ({
    route: site.pathname + file,
    filter: `_type == "sitePage" && _id == "page-${page}"`,
  })),
  {
    route: site.pathname + 'produtos/:slug.html',
    filter: '_type == "product" && slug.current == $slug',
  },
]);

export default defineConfig({
  name: 'eletrotech',
  title: 'Painel Eletrotech',
  ...project,
  plugins: [
    ptBRLocale(),
    structureTool({
      structure: S => S.list().title('Conteúdo do site').items([
        S.documentTypeListItem('product').title('Produtos'),
        S.documentTypeListItem('service').title('Serviços'),
        S.documentTypeListItem('sitePage').title('Páginas'),
        S.listItem().id(settingsId).title('Dados da empresa').child(
          S.document().schemaType('siteSettings').documentId(settingsId),
        ),
      ]),
    }),
    presentationTool({
      title: 'Editar pelo site',
      previewUrl: site.href,
      resolve: {mainDocuments},
    }),
  ],
  schema: {
    types: schemaTypes,
    templates: templates => templates.filter(template => !managedTypes.includes(template.schemaType)),
  },
  document: {
    actions: (actions, {schemaType}) => managedTypes.includes(schemaType)
      ? actions.filter(({action}) => ['publish', 'discardChanges', 'restore'].includes(action))
      : actions,
  },
});
