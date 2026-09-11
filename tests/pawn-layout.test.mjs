import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pawnLayout} from '../lib/pawn-layout.mjs';
import {coordinate,advance} from '../lib/engine.mjs';
const fresh=()=>Array.from({length:4},()=>[-1,-1,-1,-1]);

test('opposing pawns sharing a safe square have distinct positions',()=>{
 const tokens=fresh();tokens[3][0]=26;tokens[1][3]=0;
 const layout=pawnLayout(tokens,[1,3]);
 assert.equal(layout['3-0'].stacked,true);
 assert.equal(layout['1-3'].stacked,true);
 assert.notEqual(layout['3-0'].col,layout['1-3'].col);
 assert.deepEqual(coordinate(3,26,0),coordinate(1,0,3));
 const moved=advance(tokens,3,0,1);
 assert.equal(moved.tokens[3][0],27);
 assert.equal(moved.tokens[1][3],0);
 assert.equal(moved.captured,0);
});
test('every pawn in a mixed-color stack gets a distinct position',()=>{
 const tokens=[[13,13,13,13],[0,0,0,0],[39,39,39,39],[26,26,26,26]];
 const layout=pawnLayout(tokens,[0,1,2,3]);
 assert.equal(new Set(Object.values(layout).map(p=>`${p.row},${p.col}`)).size,16);
});
test('unstacked and base pawns keep their positions; inactive colors are ignored',()=>{
 const tokens=fresh();tokens[3][0]=26;tokens[1][0]=0;
 const before=structuredClone(tokens),layout=pawnLayout(tokens,[3]);
 for(let i=0;i<4;i++){
  const [row,col]=coordinate(3,tokens[3][i],i);
  assert.deepEqual(layout[`3-${i}`],{row,col,stacked:false});
 }
 assert.equal(Object.keys(layout).length,4);
 assert.deepEqual(tokens,before);
});
