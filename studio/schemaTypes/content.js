import {defineField,defineType} from 'sanity';
import chrome from '../../templates/home-chrome.json';
import {HomeArray, HomeInput} from './HomeArray.jsx';
const field=(name,title,type='string',extra={})=>defineField({name,title,type,...extra});
const required=rule=>rule.required();
const key=field('key','Identificador do campo','string',{readOnly:true,validation:required});
const label=field('label','Campo','string',{readOnly:true});
const image=field('image','Enviar / escolher imagem','image',{options:{hotspot:false}});
const stable=(name,title)=>field(name,title,'string',{readOnly:true,validation:rule=>rule.required().regex(/^[a-z0-9-]+$/)});
const filtered = {
  options: {sortable: false, disableActions: ['add', 'duplicate', 'remove']},
  components: {input: HomeArray},
};
const translated = (name, title, type = 'string') => [
  field(name, title, type),
  field(name + 'Es', title + ' (espanhol)', type),
];
function homeChrome(name, title, withLogo = true) {
  return field(name, title, 'object', {
    group: name,
    options: {collapsible: false},
    description: 'Campos vazios usam o conteúdo atual. Estas opções valem apenas na página Início.',
    fields: [...(withLogo ? [field('logo', 'Trocar logo', 'image')] : []), ...chrome[name].flatMap(([key, label]) => translated(key, label))],
  });
}
const serviceCard = (name, title) => field(name, title, 'object', {
  options: {collapsible: true, collapsed: true},
  fields: [image, ...translated('name', 'Título do card'), ...translated('description', 'Descrição do card', 'text'), ...translated('buttonText', 'Texto do botão de orçamento'), field('alt', 'Descrição acessível da foto')],
});

const fieldTitles = {
  'text-005': 'Banner · Primeira linha do título',
  'text-006': 'Banner · Segunda linha do título',
  'text-007': 'Banner · Primeira linha da descrição',
  'text-008': 'Banner · Segunda linha da descrição',
  'text-014': 'Serviços · Nome da seção',
  'text-015': 'Serviços · Título principal',
  'text-016': 'Serviços · Descrição da seção',
  'text-018': 'Equipamentos · Nome da seção',
  'text-019': 'Equipamentos · Título principal',
  'text-020': 'Equipamentos · Descrição da seção',
  'text-021': 'Motores Hércules · Título do card',
  'text-022': 'Motores Hércules · Descrição do card',
  'text-023': 'Motores Hércules · Texto do botão',
  'text-024': 'Linha Zagonel · Título do card',
  'text-025': 'Linha Zagonel · Descrição do card',
  'text-026': 'Linha Zagonel · Texto do botão',
  'text-027': 'Materiais elétricos · Título do card',
  'text-028': 'Materiais elétricos · Descrição do card',
  'text-029': 'Materiais elétricos · Texto do botão',
  'text-031': 'OxiLife Fish · Selo acima do título',
  'text-032': 'OxiLife Fish · Título principal',
  'text-033': 'OxiLife Fish · Descrição',
  'text-039': 'OxiLife Fish · Legenda da imagem',
  'image-001': 'Motores Hércules · Foto do card',
  'image-002': 'Linha Zagonel · Foto do card',
  'image-003': 'Materiais elétricos · Foto do card',
  'image-004': 'OxiLife Fish · Imagem principal',
};
function namedPreview(subtitle, media) {
  return {
    select: {key: 'key', label: 'label', subtitle, ...(media ? {media} : {})},
    prepare: ({key, label, subtitle, media}) => ({title: fieldTitles[key] ?? label, subtitle, media}),
  };
}
const pageText=defineType({name:'pageText',title:'Texto',type:'object',fields:[key,label,field('pt','Português','text',{rows:3}),field('es','Espanhol','text',{rows:3})],preview:namedPreview('pt')});
const pageImage=defineType({name:'pageImage',title:'Imagem',type:'object',fields:[key,label,field('src','Arquivo atual','string',{readOnly:true}),image,field('altPt','Descrição acessível em português'),field('altEs','Descrição acessível em espanhol')],preview:namedPreview('src','image')});
const pageVideo=defineType({name:'pageVideo',title:'Vídeo de banner',type:'object',fields:[key,label,field('enabled','Reproduzir vídeo','boolean'),field('src','Vídeo atual','string',{readOnly:true}),field('file','Enviar / escolher vídeo MP4 ou WebM','file',{options:{accept:'video/mp4,video/webm'},description:'Use um vídeo curto e comprimido. Limite de publicação: 80 MB.'}),field('poster','Imagem alternativa atual','string',{readOnly:true}),field('posterImage','Enviar imagem alternativa','image'),field('loop','Repetir continuamente','boolean'),field('playbackRate','Velocidade de reprodução','number',{validation:rule=>rule.min(.25).max(2),description:'1 = normal; 0,75 = suave. Movimento reduzido e economia de dados são respeitados.'})],preview:{select:{title:'label',subtitle:'src'}}});
const pageLink=defineType({name:'pageLink',title:'Link ou botão',type:'object',fields:[key,label,field('href','Destino','string',{validation:rule=>rule.required(),description:'https://..., arquivo.html#secao, #secao, mailto: ou tel:.'}),field('whatsappTopic','Assunto do WhatsApp','string',{description:'Preencha para usar o número global. Deixe vazio para usar somente o destino.'})],preview:{select:{title:'label',subtitle:'href'}}});
const pageSection=defineType({name:'pageSection',title:'Seção',type:'object',fields:[key,field('title','Nome da seção','string',{readOnly:true}),field('enabled','Exibir no site','boolean')],preview:{select:{title:'title',enabled:'enabled'},prepare:({title,enabled})=>({title,subtitle:enabled===false?'Oculta':'Visível'})}});
const sitePage=defineType({name:'sitePage',title:'Página Início',type:'document',components:{input:HomeInput},groups:[
  {name:'services',title:'Serviços ELETROTECH',default:true},
  {name:'equipment',title:'Equipamentos Eletrotech'}, {name:'oxifish',title:'INICIO OXIFISH'},
  {name:'texts',title:'Textos em geral'}, {name:'header',title:'Cabeçalho'}, {name:'media',title:'Vídeo do banner'},
  {name:'links',title:'Links e botões'}, {name:'footer',title:'Rodapé'}, {name:'general',title:'Ordem e visibilidade'},
],fields:[
  field('pageId','Identificador','string',{readOnly:true,hidden:true}),field('file','Endereço','string',{readOnly:true,hidden:true}),field('title','Página','string',{readOnly:true,hidden:true}),field('showInMenu','Exibir no menu','boolean',{hidden:true}),field('menuTitle','Nome no menu','string',{hidden:true}),field('menuTitleEs','Nome no menu em espanhol','string',{hidden:true}),
  homeChrome('header', 'Cabeçalho da página Início'),
  homeChrome('footer', 'Rodapé da página Início'),
  field('homeServices','Cards de serviços da página Início','object',{
    group:'services',
    options:{collapsible:false},
    description:'Campos vazios usam o conteúdo atual de cada card.',
    fields:[serviceCard('paineis','Painéis elétricos'), serviceCard('automacao','Automação'), serviceCard('instalacoes','Instalações residenciais')],
  }),
  field('sections','Seções — arraste para ordenar','array',{group:'general',of:[{type:'pageSection'}],options:{disableActions:['add','duplicate','remove']},description:'Ative ou oculte seções existentes. O visual de cada seção é preservado.'}),
  field('images','Fotos','array',{group:['equipment','oxifish'],of:[{type:'pageImage'}],...filtered}),
  field('texts','Textos','array',{group:['services','equipment','oxifish','texts'],of:[{type:'pageText'}],...filtered,description:'Abra o texto pelo nome e altere apenas o trecho desejado.'}),
  homeChrome('equipment', 'Rótulos dos cards de equipamentos', false),
  field('videos','Fundo do banner','array',{group:'media',of:[{type:'pageVideo'}],...filtered}),
  field('links','Destinos dos links e botões','array',{group:['services','equipment','oxifish','links'],of:[{type:'pageLink'}],...filtered}),
],preview:{select:{title:'title',subtitle:'file'}}});
const service=defineType({name:'service',title:'Serviço',type:'document',initialValue:()=>({serviceId:'service-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),active:true,showOnHome:false,order:10,icon:'paineis'}),fields:[stable('serviceId','Identificador único'),field('name','Nome em português','string',{validation:required}),field('nameEs','Nome em espanhol'),field('description','Descrição em português','text',{validation:required,rows:3}),field('descriptionEs','Descrição em espanhol','text',{rows:3}),field('active','Exibir serviço','boolean'),field('showOnHome','Exibir também na home','boolean'),field('order','Ordem','number',{validation:rule=>rule.min(0).integer()}),field('category','Categoria / aplicação'),field('src','Imagem existente','string',{description:'Caminho em images/. Um upload abaixo tem prioridade.'}),image,field('alt','Descrição da imagem'),field('whatsappTopic','Assunto no WhatsApp'),field('note','Legenda da imagem'),field('noteEs','Legenda em espanhol'),field('icon','Ícone','string',{options:{list:[{title:'Painel / energia',value:'paineis'},{title:'Automação',value:'automacao'},{title:'Residencial',value:'instalacoes'},{title:'Motores',value:'motores'},{title:'Bombas',value:'bombas'},{title:'Zagonel',value:'zagonel'}]}})],validation:rule=>rule.custom(doc=>doc?.src||doc?.image?.asset?true:'Escolha uma imagem para o serviço.'),preview:{select:{title:'name',media:'image',active:'active'},prepare:({title,media,active})=>({title,media,subtitle:active===false?'Oculto':'Publicado no catálogo de serviços'})}});
export const cmsSettingsFields=[field('phone','Telefone com DDI e DDD'),field('phoneLabel','Telefone como aparece no site'),field('instagram','Link do Instagram','url'),field('instagramLabel','Nome de usuário do Instagram'),field('logoSrc','Logo existente','string',{readOnly:true}),field('logo','Enviar / escolher logo','image'),field('footerPt','Descrição do rodapé em português','text',{rows:3}),field('footerEs','Descrição do rodapé em espanhol','text',{rows:3}),field('businessHours','Horários / informação de atendimento','text',{rows:2}),field('businessHoursEs','Horários em espanhol','text',{rows:2}),field('footerStart','Fundo do rodapé — cor inicial','string',{validation:rule=>rule.regex(/^#[a-fA-F0-9]{6}$/),description:'Cor hexadecimal, por exemplo #e4f1ff.'}),field('footerEnd','Fundo do rodapé — cor final','string',{validation:rule=>rule.regex(/^#[a-fA-F0-9]{6}$/)})];
export const cmsSchemaTypes=[pageText,pageImage,pageVideo,pageLink,pageSection,sitePage,service];
