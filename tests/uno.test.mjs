import test from 'node:test';
import assert from 'node:assert/strict';
import {deck,newUno,canPlay,playCard,drawCard,passTurn,chooseUno,sayUno,catchUno} from '../lib/uno.mjs';
const c=(id,color,value)=>({id,color,value});
const fixture=(hand,top=c('top','red','5'),players=4)=>({...newUno(players),hands:[hand,...Array.from({length:players-1},(_,i)=>[c('other'+i,'blue','1'),c('spare'+i,'green','8')])],discard:[top],color:top.color});
const rng=seed=>()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
test('UNO: 108 unique cards, seven-card hands, immutable legal play and +4 restriction',()=>{
 assert.equal(deck().length,108);assert.equal(new Set(deck().map(c=>c.id)).size,108);
 const s=newUno(4,rng(5));assert.ok(s.hands.every(h=>h.length===7));assert.equal(s.stock.length,79);
 const a=fixture([c('r','red','2'),c('b','blue','5'),c('w',null,'wild4')]);
 assert.ok(canPlay(a,0,a.hands[0][0]));assert.ok(canPlay(a,0,a.hands[0][1]));assert.equal(canPlay(a,0,a.hands[0][2]),false);
 const before=JSON.stringify(a),next=playCard(a,0,'r');assert.equal(JSON.stringify(a),before);assert.equal(next.turn,1);assert.equal(next.hands[0].length,2);assert.equal(playCard(a,1,'r'),null);
});
test('UNO: skip, reverse for two/four players, draw penalties and last-card win',()=>{
 for(const players of [2,4]){let s=fixture([c('r','red','reverse'),c('b','blue','9')],undefined,players),r=playCard(s,0,'r',null,true);assert.equal(r.direction,-1);assert.equal(r.turn,players===2?0:3);
 s=fixture([c('s','red','skip'),c('b','blue','9')],undefined,players);r=playCard(s,0,'s',null,true);assert.equal(r.turn,players===2?0:2)}
 let s=fixture([c('d','red','draw2')]),r=playCard(s,0,'d');assert.equal(r.hands[1].length,4);assert.equal(r.winner,0);
 s=fixture([c('w',null,'wild4'),c('b','blue','9')]);assert.equal(playCard(s,0,'w'),null);r=playCard(s,0,'w','green',true);assert.equal(r.color,'green');assert.equal(r.hands[1].length,6);assert.equal(r.turn,2);
});
test('UNO: only the drawn card can be played, with optional pass',()=>{
 const s=fixture([c('r','red','7'),c('b','blue','1')]);s.stock=[c('drawn','red','8')];const d=drawCard(s,0);
 assert.equal(d.turn,0);assert.equal(d.drawnId,'drawn');assert.equal(canPlay(d,0,d.hands[0][0]),false);assert.ok(canPlay(d,0,d.hands[0][2]));assert.equal(drawCard(d,0),null);assert.equal(passTurn(d,0).turn,1);assert.equal(playCard(d,0,'drawn').turn,1);
 s.stock=[c('unplayable','blue','8')];assert.equal(drawCard(s,0).turn,1);
});
test('UNO: announcement window blocks play and forgotten UNO costs two cards',()=>{
 const s=fixture([c('r','red','7'),c('b','blue','1')]);const next=playCard(s,0,'r');assert.equal(next.unoPlayer,0);assert.equal(drawCard(next,next.turn),null);
 assert.equal(sayUno(next,0).unoPlayer,null);assert.equal(sayUno(next,1),null);const caught=catchUno(next);assert.equal(caught.hands[0].length,3);assert.equal(caught.turn,next.turn);assert.equal(caught.unoPlayer,null);
});
test('UNO: recycling preserves the top card and cannot lose or duplicate cards',()=>{
 const s=fixture([c('h','blue','9')]);s.stock=[];s.discard=[c('old','green','9'),c('top','red','5')];const d=drawCard(s,0);assert.equal(d.discard.at(-1).id,'top');assert.ok(d.hands[0].some(c=>c.id==='old'));assert.equal(s.discard.length,2);
});
test('UNO: complete bot matches terminate with all 108 cards conserved',()=>{
 for(const count of [2,4])for(let seed=1;seed<=12;seed++){const random=rng(seed);let s=newUno(count,random);
  for(let turn=0;turn<1500&&s.winner===null;turn++){
   const pick=chooseUno(s,s.turn),next=pick?playCard(s,s.turn,pick.id,pick.color,true,random):s.hasDrawn?passTurn(s,s.turn):drawCard(s,s.turn,random);assert.ok(next);s=next;
   const all=[...s.hands.flat(),...s.stock,...s.discard];assert.equal(all.length,108);assert.equal(new Set(all.map(c=>c.id)).size,108);
  }
  assert.notEqual(s.winner,null);assert.equal(s.hands[s.winner].length,0);
 }
});
