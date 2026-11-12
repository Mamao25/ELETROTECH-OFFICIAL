import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, writeFile, readFile, cp, access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {canonicalJson, mergeRoutes} from '../../scripts/publication-state.mjs';

test('Automatic publication ignores object key order and preserves previously deployed CMS routes', () => {
  assert.equal(canonicalJson({b: 2, a: [{y: 1, x: 0}]}), canonicalJson({a: [{x: 0, y: 1}], b: 2}));
  assert.notEqual(canonicalJson([1, 2]), canonicalJson([2, 1]));
  const local = {'product-1': 'motores-hercules'};
  const merged = mergeRoutes(local, {...local, 'cms-new': 'novo-produto'});
  assert.equal(merged['cms-new'], 'novo-produto');
  assert(!('cms-new' in local));
  assert.throws(() => mergeRoutes(local, {'product-1': 'alterado'}));
  assert.throws(() => mergeRoutes(local, {'cms-new': 'motores-hercules'}));
  assert.throws(() => mergeRoutes(local, {'cms-new': '../invalido'}));
});

test('Public package removes old admin artifacts and excludes CMS exports and secrets', async () => {
  const root = await mkdtemp(join(tmpdir(), 'eletrotech-package-test-'));
  for (const dir of ['assets','css','js','images','videos','produtos','data','private-tools','_site/admin']) await mkdir(join(root, dir), {recursive: true});
  await writeFile(join(root, '_site/admin/index.html'), 'obsolete admin');
  await writeFile(join(root, 'private-tools/secret.json'), 'private');
  await writeFile(join(root, '.env'), 'TOKEN=private');
  await writeFile(join(root, 'data/private-export.ndjson'), 'private export');
  await writeFile(join(root, 'index.html'), '<link href="css/styles.css"><script src="js/script.js"></script>');
  await writeFile(join(root, 'produtos/example.html'), '<link href="../css/styles.css">');
  await writeFile(join(root, 'css/styles.css'), 'body{color:black}');
  await writeFile(join(root, 'js/script.js'), 'void 0;');
  for (const file of ['products.json','site.json','product-routes.json']) await writeFile(join(root, 'data', file), '{}');
  await cp(resolve('scripts/prepare-site.mjs'), join(root, 'prepare-site.mjs'));
  execFileSync(process.execPath, [join(root, 'prepare-site.mjs')], {cwd: root});
  assert.equal(await readFile(join(root, '_site/data/products.json'), 'utf8'), '{}');
  const first=await readFile(join(root,'_site/index.html'),'utf8');
  assert.match(first,/css\/styles\.css\?v=[a-f0-9]{12}/);
  assert.match(first,/js\/script\.js\?v=[a-f0-9]{12}/);
  assert.match(await readFile(join(root,'_site/produtos/example.html'),'utf8'),/\.\.\/css\/styles\.css\?v=[a-f0-9]{12}/);
  execFileSync(process.execPath,[join(root,'prepare-site.mjs')],{cwd:root});
  assert.equal(await readFile(join(root,'_site/index.html'),'utf8'),first,'Unchanged assets keep the same revision');
  await writeFile(join(root,'css/styles.css'),'body{color:blue}');
  execFileSync(process.execPath,[join(root,'prepare-site.mjs')],{cwd:root});
  const updated=await readFile(join(root,'_site/index.html'),'utf8');
  assert.notEqual(updated.match(/styles\.css\?v=([a-f0-9]+)/)[1],first.match(/styles\.css\?v=([a-f0-9]+)/)[1]);
  assert.equal(updated.match(/script\.js\?v=([a-f0-9]+)/)[1],first.match(/script\.js\?v=([a-f0-9]+)/)[1]);
  for (const entry of ['admin','private-tools','.env','data/private-export.ndjson']) await assert.rejects(access(join(root, '_site', entry)));
});
