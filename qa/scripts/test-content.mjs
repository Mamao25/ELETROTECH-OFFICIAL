import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {load} from 'cheerio';
import {renderPage,validLink,localMedia} from '../../scripts/cms-render.mjs';
const read=async p=>JSON.parse(await readFile(p,'utf8'));
const defaults=await read('data/cms-defaults.json');
const site=await read('data/site-defaults.json');
const icons=await read('templates/service-icons.json');
const template=await readFile('templates/pages/home.html','utf8');
const options={services:defaults.services,icons,defaults:site,pages:defaults.pages};

test('CMS edits remain escaped; section order, visibility and video changes survive rendering',()=>{
  const page=structuredClone(defaults.pages.find(p=>p.pageId==='home'));
  const heading=page.texts.find(t=>t.pt.includes('Energia para seguir'));
  assert(heading);heading.pt='<script>alert(1)</script> & Novo título';heading.es='Título en español';
  page.sections[1].enabled=false;
  const first=page.sections.shift();page.sections.push(first);
  page.videos[0].enabled=false;page.videos[0].playbackRate=1;page.videos[0].loop=false;
  const html=renderPage(template,page,site,options),$=load(html);
  assert.equal($(`[data-cms-text="${heading.key}"]`).text(),heading.pt);
  assert.equal($(`[data-cms-text="${heading.key}"]`).attr('data-es'),'Título en español');
  assert.equal($('script').filter((_,el)=>$(el).text().includes('alert(1)')).length,0);
  assert(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.equal($('main>[data-cms-section]').last().attr('data-cms-section'),first.key);
  assert.equal($('main>[data-cms-section][hidden]').length,1);
  assert.equal($('video').attr('data-video-enabled'),'false');
  assert.equal($('video').attr('data-playback-rate'),'1');assert(!$('video').attr('loop'));
  assert.equal(renderPage(template,page,site,options),html,'Rendering is deterministic');
});

test('Services can be created, reordered and hidden without changing stable links',()=>{
  const page=defaults.pages.find(p=>p.pageId==='home');
  const added={...defaults.services[0],serviceId:'cms-new',name:'Novo serviço <seguro>',order:-1,showOnHome:true};
  const services=[...defaults.services.map((s,i)=>i===0?{...s,active:false}:s),added];
  const $=load(renderPage(template,page,site,{...options,services}));
  assert.equal($('.service-card').first().attr('id'),'cms-new');
  assert.equal($('#cms-new h3').text(),added.name);
  assert.equal($(`#${services[0].serviceId}[hidden]`).length,1);
  assert.equal($('#cms-new [data-whatsapp]').attr('href'),`https://wa.me/${site.whatsapp}`);
  assert.throws(()=>renderPage(template,page,site,{...options,services:[added,added]}),/duplicado/);
});

test('Shared branding/contact settings update every generated page without touching form behavior',async()=>{
  const config={...site,name:'Loja Teste',whatsapp:'5545999999999',phone:'+5545888888888',phoneLabel:'+55 45 88888-8888',email:'contato@example.com',instagram:'https://instagram.com/lojateste',instagramLabel:'@lojateste',footerPt:'Uma nova descrição',footerStart:'#abcdef',footerEnd:'#eeeeee',businessHours:'Segunda a sexta'};
  for(const page of defaults.pages){
    const source=await readFile(`templates/pages/${page.pageId}.html`,'utf8');
    const $=load(renderPage(source,page,config,options));
    assert.equal($('.brand img').attr('alt'),'Loja Teste');
    assert($('.site-footer').attr('style').includes('#abcdef'));
    assert($('.footer-grid>div:first-child>p').text().includes('Uma nova descrição'));
    $('a[href^="mailto:"]').each((_,el)=>assert.equal($(el).attr('href'),'mailto:contato@example.com'));
    $('a[href^="tel:"]').each((_,el)=>assert.equal($(el).attr('href'),'tel:+5545888888888'));
    $('a[href^="https://wa.me/"]').each((_,el)=>assert.equal(new URL($(el).attr('href')).pathname,'/5545999999999'));
    if(page.pageId==='contact'){
      assert.equal($('#quote-form').length,1);assert.equal($('#contact-message').attr('minlength'),'10');
      assert.equal($('.contact-hours').text(),'Segunda a sexta');
    }
  }
});

test('Local content rejects unsafe links and media paths',()=>{
  for(const href of ['javascript:alert(1)','data:text/html,hello','//evil.example','../outside.html']) assert.throws(()=>validLink(href));
  assert.equal(validLink('produtos.html#catalogo'),'produtos.html#catalogo');
  assert.throws(()=>localMedia('images/../secret.jpg'));
});
