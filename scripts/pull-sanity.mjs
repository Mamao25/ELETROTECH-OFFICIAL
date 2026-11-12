import {access, readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const {projectId, dataset} = await read('studio/project.json');
if (!projectId) {
  console.log('Sanity ainda não conectado. O site continua usando os dados locais.');
  process.exit(0);
}
if (!/^[a-z0-9-]{5,32}$/.test(projectId) || !/^[a-z0-9][a-z0-9_-]*$/.test(dataset)) {
  throw Error('Confira o Project ID e o dataset em studio/project.json.');
}

const query = `{
  "products": *[_type == "product"] | order(order asc, _id asc) {
    _id, id, "slug": slug.current, active, order, featured, name, nameEs, category,
    brand, model, sku, description, descriptionEs, details, detailsEs, src, alt, illustration,
    gallery, "imageUrl": image.asset->url, "galleryUrls": galleryImages[].asset->url,
    price, salePrice, stock, lowStock, variations,
    specifications[]{label, value, labelEs, valueEs}, seoTitle, seoDescription
  },
  "site": *[_type == "siteSettings" && _id == "site-settings"][0] {
    name, url, whatsapp, email, phone, phoneLabel, instagram, instagramLabel,
    logoSrc, "logoUrl": logo.asset->url, footerPt, footerEs, businessHours,
    businessHoursEs, footerStart, footerEnd
  },
  "pages": *[_type == "sitePage"] | order(_id asc) {
    _id, showInMenu, menuTitle, menuTitleEs,
    sections[]{_key, key, title, enabled}, texts[]{_key, key, label, pt, es}, links[]{_key, key, label, href, whatsappTopic},
    images[]{_key, key, label, src, altPt, altEs, "imageUrl": image.asset->url},
    videos[]{_key, key, label, src, poster, enabled, loop, playbackRate,
      "videoUrl": file.asset->url, "posterUrl": posterImage.asset->url}
  },
  "services": *[_type == "service"] | order(order asc, _id asc) {
    _id, serviceId, name, nameEs, description, descriptionEs, active, showOnHome, order, category,
    src, alt, whatsappTopic, note, noteEs, icon, "imageUrl": image.asset->url
  }
}`;
const url = new URL(`https://${projectId}.api.sanity.io/v2025-02-19/data/query/${dataset}`);
url.searchParams.set('perspective', 'published');
url.searchParams.set('query', query);
const response = await fetch(url, {signal: AbortSignal.timeout(30_000)});
if (!response.ok) {
  throw Error(`O Sanity retornou HTTP ${response.status}. Confira o projeto e se o dataset production é público.`);
}
const {result} = await response.json();
const {pages: localPages} = await read('data/pages.json');
const {schemaVersion} = await read('data/products.json');
const siteDefaults = await read('data/site-defaults.json');
if (!result?.site || !result.products?.length || !result.services?.length ||
    !localPages.every(page => result.pages?.some(item => item._id === `page-${page.pageId}`))) {
  throw Error('A carga inicial está incompleta. Importe os dados pelo procedimento do README antes de publicar.');
}

async function download(source, kind = 'image') {
  const asset = new URL(source);
  const isVideo = kind === 'video';
  const prefix = `/${isVideo ? 'files' : 'images'}/${projectId}/${dataset}/`;
  const filename = asset.pathname.slice(prefix.length);
  const format = isVideo ? /\.(mp4|webm)$/ : /\.(png|jpe?g|webp|svg)$/;
  if (asset.origin !== 'https://cdn.sanity.io' || !asset.pathname.startsWith(prefix) ||
      !/^[a-z0-9-]+\.[a-z0-9]+$/i.test(filename) || !format.test(filename) ||
      asset.username || asset.password || asset.search || asset.hash) {
    throw Error('Formato de mídia inválido ou arquivo fora deste projeto Sanity.');
  }

  const local = `${isVideo ? 'videos' : 'images'}/sanity-${filename}`;
  const target = resolve(root, local);
  try {
    await access(target);
    return local;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const media = await fetch(asset, {redirect: 'error', signal: AbortSignal.timeout(60_000)});
  if (!media.ok) throw Error(`Falha ao baixar mídia do Sanity (HTTP ${media.status}).`);
  const limit = (isVideo ? 80 : 20) * 1024 * 1024;
  const chunks = [];
  let size = 0;
  for await (const chunk of media.body) {
    size += chunk.length;
    if (size > limit) throw Error(`Arquivo ${filename} excede o limite de publicação.`);
    chunks.push(chunk);
  }
  await writeFile(target, Buffer.concat(chunks));
  return local;
}

async function mapImage({imageUrl, ...item}) {
  if (imageUrl) item.src = await download(imageUrl);
  return item;
}

const products = [];
for (const {galleryUrls, ...document} of result.products) {
  const product = await mapImage(document);
  product.gallery = [...(product.gallery ?? [])];
  for (const asset of (galleryUrls ?? []).filter(Boolean)) product.gallery.push(await download(asset));
  product.variations ??= [];
  product.specifications ??= [];
  product.order ??= 0;
  products.push(product);
}

const pages = [];
for (const local of localPages) {
  const {_id, images, videos, ...page} = result.pages.find(item => item._id === `page-${local.pageId}`);
  const merged = {...local, ...page, images: [], videos: []};
  for (const item of images ?? []) merged.images.push(await mapImage(item));
  for (const {videoUrl, posterUrl, ...video} of videos ?? []) {
    if (videoUrl) video.src = await download(videoUrl, 'video');
    if (posterUrl) video.poster = await download(posterUrl);
    merged.videos.push(video);
  }
  pages.push(merged);
}

const services = [];
for (const document of result.services) services.push(await mapImage(document));
const {logoUrl, ...settings} = result.site;
const site = {...siteDefaults, ...Object.fromEntries(Object.entries(settings).filter(([, value]) => value != null))};
if (logoUrl) site.logoSrc = await download(logoUrl);

for (const [name, content] of Object.entries({products: {schemaVersion, products}, site, pages: {pages}, services: {services}})) {
  await writeFile(resolve(root, `data/${name}.json`), JSON.stringify(content, null, 2) + '\n');
}
console.log(`Conteúdo publicado no Sanity recebido: ${products.length} produtos, ${pages.length} páginas e ${services.length} serviços.`);
