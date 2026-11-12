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

const query = `*[_type == "sitePage" && _id == "page-home"][0]{
    sections[]{key, title, enabled}, texts[]{key, label, pt, es}, links[]{key, label, href, whatsappTopic},
    images[]{key, label, src, altPt, altEs, "imageUrl": image.asset->url},
    videos[]{key, label, src, poster, enabled, loop, playbackRate,
      "videoUrl": file.asset->url, "posterUrl": posterImage.asset->url},
    header{..., "logoUrl": logo.asset->url},
    footer{..., "logoUrl": logo.asset->url},
    homeServices{paineis{..., "imageUrl": image.asset->url}, automacao{..., "imageUrl": image.asset->url}, instalacoes{..., "imageUrl": image.asset->url}}
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
if (!result || !localPages.some(page => page.pageId === 'home')) {
  throw Error('A página Início ainda não está publicada no Sanity.');
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

const {images, videos, header, footer, homeServices, ...page} = result;
const home = {...localPages.find(item => item.pageId === 'home'), ...page, images: [], videos: []};
for (const item of images ?? []) home.images.push(await mapImage(item));
for (const {videoUrl, posterUrl, ...video} of videos ?? []) {
  if (videoUrl) video.src = await download(videoUrl, 'video');
  if (posterUrl) video.poster = await download(posterUrl);
  home.videos.push(video);
}
for (const [key, value] of Object.entries({header, footer})) {
  if (!value) continue;
  const {logo, logoUrl, ...fields} = value;
  if (logoUrl) fields.logoSrc = await download(logoUrl);
  home[key] = fields;
}
if (homeServices) {
  home.homeServices = {};
  for (const [key, value] of Object.entries(homeServices)) {
    if (!value || key.startsWith('_')) continue;
    const {image, ...fields} = value;
    home.homeServices[key] = await mapImage(fields);
  }
}
const pages = localPages.map(item => item.pageId === 'home' ? home : item);
await writeFile(resolve(root, 'data/pages.json'), JSON.stringify({pages}, null, 2) + '\n');
console.log('Página Início sincronizada com o Sanity.');
