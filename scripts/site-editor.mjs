import {createDataAttribute, enableVisualEditing} from '@sanity/visual-editing';

const studioUrl = 'https://eletrotech-official.sanity.studio';
const sitePath = '/ELETROTECH-OFFICIAL/';
const pageId = document.querySelector('[data-cms-page]')?.dataset.cmsPage;
const translatedFields = [];

function mark(element, id, type, path, spanishPath) {
  if (!element || !id) return;
  const apply = () => {
    const spanish = document.documentElement.lang.startsWith('es');
    const attribute = createDataAttribute({
      id,
      type,
      path: spanish && spanishPath ? spanishPath : path,
      baseUrl: studioUrl,
    });
    element.setAttribute('data-sanity', attribute.toString());
  };
  apply();
  if (spanishPath) translatedFields.push(apply);
}

const item = (field, element) => `${field}[_key==${JSON.stringify(element.dataset.cmsKey)}]`;

if (pageId) {
  for (const text of document.querySelectorAll('main [data-cms-text][data-cms-key]')) {
    const path = item('texts', text);
    mark(text, pageId, 'sitePage', path + '.pt', path + '.es');
  }
  for (const image of document.querySelectorAll('main [data-cms-image][data-cms-key]')) {
    mark(image, pageId, 'sitePage', item('images', image) + '.image');
  }
  for (const link of document.querySelectorAll('main [data-cms-link][data-cms-key]')) {
    mark(link, pageId, 'sitePage', item('links', link) + '.href');
  }
  for (const video of document.querySelectorAll('main [data-cms-video][data-cms-key]')) {
    const hero = video.closest('.home-hero');
    if (!hero) {
      mark(video, pageId, 'sitePage', item('videos', video) + '.file');
      continue;
    }
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'site-editor-banner';
    edit.textContent = 'Editar fundo do banner';
    hero.append(edit);
    mark(edit, pageId, 'sitePage', item('videos', video) + '.file');
  }
}

function markFields(container, id, type, fields) {
  for (const [selector, path, spanishPath] of fields) {
    mark(container.querySelector(selector), id, type, path, spanishPath);
  }
}

for (const service of document.querySelectorAll('[data-cms-service]')) {
  markFields(service, service.dataset.cmsService, 'service', [
    ['.service-photo', 'image'],
    ['h3 [data-pt]', 'name', 'nameEs'],
    ['.service-description [data-pt]', 'description', 'descriptionEs'],
  ]);
}
for (const product of document.querySelectorAll('[data-cms-product]')) {
  markFields(product, product.dataset.cmsProduct, 'product', [
    ['.product-image img, .gallery-main img', 'image'],
    ['.product-body h3 [data-pt], .product-summary h1 [data-pt]', 'name', 'nameEs'],
    ['.product-body > p [data-pt], .product-lead [data-pt]', 'description', 'descriptionEs'],
    ['.product-info-grid section:first-child p [data-pt]', 'details', 'detailsEs'],
    ['.product-stock [data-pt]', 'stock'],
  ]);
}
for (const logo of document.querySelectorAll('.brand img,.footer-brand img')) {
  mark(logo, 'site-settings', 'siteSettings', 'logo');
}
mark(document.querySelector('.footer-grid>div:first-child>p [data-pt]'),
  'site-settings', 'siteSettings', 'footerPt', 'footerEs');

new MutationObserver(() => translatedFields.forEach(update => update()))
  .observe(document.documentElement, {attributes: true, attributeFilter: ['lang']});

enableVisualEditing({
  history: {
    subscribe(navigate) {
      const report = () => navigate({type: 'replace', url: location.href});
      report();
      addEventListener('popstate', report);
      addEventListener('hashchange', report);
      return () => {
        removeEventListener('popstate', report);
        removeEventListener('hashchange', report);
      };
    },
    update({type, url}) {
      const next = new URL(url, location.href);
      if (next.origin !== location.origin || !next.pathname.startsWith(sitePath) || next.href === location.href) return;
      if (type === 'replace') location.replace(next);
      else location.assign(next);
    },
  },
  refresh: ({source}) => source === 'mutation' ? Promise.resolve() : false,
});
