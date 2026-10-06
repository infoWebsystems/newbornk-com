const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Liquid}=require('liquidjs');
const path=require('node:path');
const engine=new Liquid({root:path.resolve(__dirname,'../../snippets'),extname:'.liquid',jsTruthy:false});
engine.registerFilter('t',key=>({'nbk_collection_editorial.heading':'Про колекцію','general.read_more':'Детальніше','general.read_less':'Згорнути'}[key]||key));
const render=description=>engine.renderFile('nbk-collection-editorial',{collection:{title:'RAINS',description},section_id:'collection-test'});
test('short editorial stays fully visible without unnecessary controls',async()=>{
 const html=await render('<p>First paragraph.</p><p>Second paragraph.</p>');
 assert.doesNotMatch(html,/<details/);assert.match(html,/<p>Second paragraph\.<\/p>/);
 assert.match(html,/aria-labelledby="CollectionEditorial-collection-test"/);
});
test('long editorial keeps its lead and links exactly once in native disclosure',async()=>{
 const lead='<p dir="ltr">The visible introduction.</p>';
 const body='<h3>Details</h3><p>'+('word '.repeat(130))+'<a href="/collections/gramicci">Gramicci</a></p>';
 const html=await render(lead+body);
 assert.equal(html.split(lead).length-1,1);assert.equal(html.split(body).length-1,1);
 assert.ok(html.indexOf(lead)<html.indexOf('<details'));
 assert.match(html,/<summary>/);assert.match(html,/Детальніше/);assert.match(html,/Згорнути/);
});
test('empty description produces no empty heading or disclosure',async()=>{
 assert.equal((await render('')).trim(),'');
});
