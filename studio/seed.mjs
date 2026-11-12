import {readFile, writeFile} from 'node:fs/promises';

const read = async name => JSON.parse(await readFile(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
const {pages} = await read('pages');

function keyed(items, type) {
  return items.map((item, index) => ({...item, _type: type, _key: item._key ?? item.key ?? `item-${index + 1}`}));
}

const types = {sections: 'pageSection', texts: 'pageText', links: 'pageLink', images: 'pageImage', videos: 'pageVideo'};
const documents = [
  ...pages.filter(page => page.pageId === 'home').map(page => ({
    ...page,
    _id: `page-${page.pageId}`,
    _type: 'sitePage',
    ...Object.fromEntries(Object.entries(types).map(([field, type]) => [
      field, keyed(page[field] ?? [], type).map(({attribute, ...item}) => item),
    ])),
  })),
];

const output = new URL('./initial-content.ndjson', import.meta.url);
await writeFile(output, documents.map(document => JSON.stringify(document, (_, value) =>
  value === null ? undefined : value,
)).join('\n') + '\n');
console.log('Carga gerada para a página Início.');
