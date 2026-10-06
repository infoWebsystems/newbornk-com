const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { Liquid } = require('liquidjs');
const root = path.resolve(__dirname, '../..');
const engine = new Liquid({root:path.join(root,'snippets'),extname:'.liquid',jsTruthy:false});
engine.registerFilter('t',(key,...args)=>key === 'collections.pagination.bar_with_count_html' ? `Viewed ${Object.fromEntries(args || []).current_count} / ${Object.fromEntries(args || []).total_count}` : key);
engine.registerFilter('asset_url',v=>v);
engine.registerFilter('stylesheet_tag',v=>`<link href="${v}">`);
engine.registerFilter('handleize',v=>String(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''));
const section = {id:'test',settings:{enable_progressbar:true}};
const arrivals = {handle:'novi-nadkhodzhennia',url:'/en/collections/novi-nadkhodzhennia'};

test('new arrivals uses the localized collection URL and does not shift mega-menu indexes',async()=>{
 const html=await engine.renderFile('nbk-new-arrivals-link',{collections:{'novi-nadkhodzhennia':arrivals},menu:{links:[]},collection:arrivals,section});
 assert.match(html,/href="\/en\/collections\/novi-nadkhodzhennia"/);
 assert.match(html,/aria-current="page"/);
 assert.match(html,/order: 0/);
 for(const url of ['/collections/novi-nadkhodzhennia','/en/collections/novi-nadkhodzhennia?sort_by=created-descending']){
  assert.equal((await engine.renderFile('nbk-new-arrivals-link',{collections:{'novi-nadkhodzhennia':arrivals},menu:{links:[{url}]},section})).trim(),'');
 }
});

const pagination=(count,total,offset,next)=>engine.renderFile('pagination',{
 collection:{products:Array(count).fill({}),products_count:total},section,section_id:'test',pagination_type:'load_more',append_id:'#products',
 paginate:{items:total,parts:total>16?[1,2]:[],current_offset:offset,next:next?{is_link:true,url:next}:null}
});
test('progress preserves filtered next-page URL, reaches 100%, and hides the final load button',async()=>{
 const initial=await pagination(16,34,0,'?filter.v.availability=1&page=2');
 assert.match(initial,/Viewed 16 \/ 34/);assert.match(initial,/filter.v.availability=1&page=2/);
 const last=await pagination(2,34,32,null);
 assert.match(last,/Viewed 34 \/ 34/);assert.match(last,/width: 100%/);assert.match(last,/loadmore-btn-wrapp/);
 assert.doesNotMatch(last,/<wrapp-hdt-lm-main-url/);
 const single=await pagination(5,5,0,null);assert.match(single,/Viewed 5 \/ 5/);
 const empty=await pagination(0,0,0,null);assert.doesNotMatch(empty,/hdt-lm-bar|NaN|Infinity/);
});

test('Warsaw directory renders all Kyiv menu brands, safe original URLs and non-Latin/numeric groups',async()=>{
 let source=readFileSync(path.join(root,'sections/nbk-brands-directory.liquid'),'utf8');
 const schema=JSON.parse(source.match(/{% schema %}([\s\S]*?){% endschema %}/)[1]);
 const settings=Object.fromEntries(schema.settings.filter(s=>s.id).map(s=>[s.id,s.default]));
 source=source.replace(/{% schema %}[\s\S]*?{% endschema %}/,'');
 const links=Array.from({length:65},(_,i)=>({title:`Brand ${String(i).padStart(2,'0')}`,url:`/en/collections/real-${i}`,type:'collection_link',object:{all_products_count:2}}));
 links.push({title:'032c',url:'/en/collections/032c',object:{all_products_count:1},type:'collection_link'});
 links.push({title:'Їжак',url:'/en/collections/izhak',object:{all_products_count:1},type:'collection_link'});
 links.push({title:'Empty',url:'/collections/empty',object:{all_products_count:0},type:'collection_link'});
 const html=await engine.parseAndRender(source,{section:{id:'test',settings},linklists:{'brands-menu':{links:[]},'top-menu':{links:[{url:'/en/collections/brands',links}]}}});
 assert.equal((html.match(/class="nbk-brand-link"/g)||[]).length,67);
 assert.match(html,/href="\/en\/collections\/real-64"/);
 assert.match(html,/id="NBKLetter-test-other"/);assert.match(html,/Їжак/);
 assert.doesNotMatch(html,/href="\/collections\/empty"/);
 assert.match(html,/nbk_brands.search_label/);
});

 test('brand trademarks survive incorrect legacy menu translations',async()=>{
 for(const [handle,label] of Object.entries({carrots:'CARROTS',rains:'RAINS',pleasures:'PLEASURES',gestalten:'GESTALTEN'})){
  assert.equal((await engine.renderFile('nbk-brand-label',{link:{url:`/en/collections/${handle}`,title:'Incorrect translation'}})).trim(),label);
 }
});
