import {test} from 'node:test';
import assert from 'node:assert/strict';
import {LINES,outcome,place,chooseMark} from '../lib/tictactoe.mjs';
test('all eight winning lines and a full-board draw are detected',()=>{
 for(const line of LINES){const board=Array(9).fill(null);line.forEach(i=>board[i]='X');assert.deepEqual(outcome(board),{winner:'X',line})}
 assert.equal(outcome(['X','O','X','X','O','O','O','X','X']).winner,'draw');
});
test('occupied, invalid and finished boards reject further moves',()=>{
 const board=['X',null,null,null,null,null,null,null,null];
 assert.equal(place(board,0,'O'),null);assert.equal(place(board,1.5,'O'),null);assert.equal(place(board,9,'O'),null);
 const next=place(board,1,'O');assert.equal(board[1],null);assert.equal(next[1],'O');
 assert.equal(place(['X','X','X',null,null,null,null,null,null],3,'O'),null);
});
test('normal computer takes a win and blocks an immediate loss',()=>{
 assert.equal(chooseMark(['O','O',null,'X',null,'X',null,null,null],'O',2),2);
 assert.equal(chooseMark(['X','X',null,null,'O',null,null,null,null],'O',2),2);
});
test('expert computer cannot lose, playing either X or O',()=>{
 for(const bot of ['X','O']){
  let terminals=0;
  function playAll(board,turn){
   const end=outcome(board);if(end){assert.notEqual(end.winner,bot==='X'?'O':'X');terminals++;return}
   if(turn===bot){const index=chooseMark(board,bot,3);assert.equal(board[index],null);playAll(place(board,index,bot),turn==='X'?'O':'X')}
   else for(let i=0;i<9;i++)if(!board[i])playAll(place(board,i,turn),bot);
  }
  playAll(Array(9).fill(null),'X');assert.ok(terminals>10);
 }
});
