import {defineConfig} from 'sanity';
import {ptBRLocale} from '@sanity/locale-pt-br';
import {structureTool} from 'sanity/structure';
import project from './project.json' with {type: 'json'};
import {schemaTypes} from './schemaTypes/index.js';

const homeId = 'page-home';

export default defineConfig({
  name: 'eletrotech',
  title: 'Painel Eletrotech',
  ...project,
  plugins: [
    ptBRLocale(),
    structureTool({
      structure: S => S.list().title('Conteúdo do site').items([
        S.listItem().id(homeId).title('Página Início').child(
          S.document().schemaType('sitePage').documentId(homeId).title('Página Início'),
        ),
      ]),
    }),
  ],
  schema: {
    types: schemaTypes.filter(type => type.type !== 'document' || type.name === 'sitePage'),
    templates: [],
  },
  document: {
    actions: (actions, {schemaType}) => schemaType === 'sitePage'
      ? actions.filter(({action}) => ['publish', 'discardChanges', 'restore'].includes(action))
      : actions,
  },
});
