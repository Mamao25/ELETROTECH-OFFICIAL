import {defineConfig} from 'sanity';
import {ptBRLocale} from '@sanity/locale-pt-br';
import {structureTool} from 'sanity/structure';
import project from './project.json' with {type: 'json'};
import {schemaTypes} from './schemaTypes/index.js';

const settingsId = 'site-settings';
const managedTypes = ['siteSettings', 'sitePage'];

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
