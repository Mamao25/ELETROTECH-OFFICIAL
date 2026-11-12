import {readFile, writeFile} from 'node:fs/promises';

const read = async name => JSON.parse(await readFile(new URL(`../data/${name}.json`, import.meta.url), 'utf8'));
const [{products}, {pages}, {services}, settings] = await Promise.all(
  ['products', 'pages', 'services', 'site'].map(read),
);

function keyed(items, type) {
  return items.map((item, index) => ({...item, _type: type, _key: item._key ?? item.key ?? `item-${index + 1}`}));
}

const types = {sections: 'pageSection', texts: 'pageText', links: 'pageLink', images: 'pageImage', videos: 'pageVideo'};
const documents = [
  ...products.map(product => ({
    ...product,
    _id: product.id,
    _type: 'product',
    slug: {_type: 'slug', current: product.slug},
    specifications: keyed(product.specifications ?? [], 'specification'),
  })),
  ...pages.map(page => ({
    ...page,
    _id: `page-${page.pageId}`,
    _type: 'sitePage',
    ...Object.fromEntries(Object.entries(types).map(([field, type]) => [
      field, keyed(page[field] ?? [], type).map(({attribute, ...item}) => item),
    ])),
  })),
  ...services.map(service => ({...service, _id: `service-${service.serviceId}`, _type: 'service'})),
  {...settings, _id: 'site-settings', _type: 'siteSettings'},
];

const output = new URL('./initial-content.ndjson', import.meta.url);
await writeFile(output, documents.map(document => JSON.stringify(document, (_, value) =>
  value === null ? undefined : value,
)).join('\n') + '\n');
console.log(`Carga gerada: ${products.length} produtos, ${pages.length} páginas, ${services.length} serviços e dados da empresa.`);
