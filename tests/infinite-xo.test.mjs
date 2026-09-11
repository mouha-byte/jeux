import test from 'node:test';
import assert from 'node:assert/strict';
import {emptyXO,placeInfinite,chooseInfinite} from '../lib/infinite-xo.mjs';
import {outcome} from '../lib/tictactoe.mjs';
test('infinite XO: fourth mark removes the oldest of that player only',()=>{
 let s=emptyXO();for(const [i,p] of [[0,'X'],[1,'O'],[2,'X'],[4,'O'],[3,'X'],[6,'O']])s=placeInfinite(s,i,p);
 const before=JSON.stringify(s),next=placeInfinite(s,8,'X');assert.equal(JSON.stringify(s),before);assert.equal(next.board[0],null);assert.equal(next.board[8],'X');assert.deepEqual(next.queues.X,[2,3,8]);assert.deepEqual(next.queues.O,[1,4,6]);assert.equal(outcome(next.board),null);
 assert.equal(placeInfinite(s,0,'X'),null);assert.equal(placeInfinite(s,9,'X'),null);
});
test('infinite XO: removal happens before win detection, winning line stops play',()=>{
 const s={board:['X','X',null,'X','O',null,'O',null,'O'],queues:{X:[0,1,3],O:[4,6,8]}};
 const next=placeInfinite(s,2,'X');assert.equal(outcome(next.board),null);
 let win=emptyXO();for(const [i,p] of [[0,'X'],[3,'O'],[1,'X'],[4,'O'],[2,'X']])win=placeInfinite(win,i,p);
 assert.equal(outcome(win.board).winner,'X');assert.equal(placeInfinite(win,7,'O'),null);
});
test('infinite XO: hundreds of legal moves remain possible without a draw',()=>{
 let s=emptyXO(),turn='X';for(let n=0;n<200;n++){const candidates=s.board.flatMap((v,i)=>v?[]:[placeInfinite(s,i,turn)]).filter(x=>!outcome(x.board));assert.ok(candidates.length);s=candidates[n%candidates.length];assert.ok(s.queues.X.length<=3&&s.queues.O.length<=3);assert.ok(s.board.filter(Boolean).length<=6);turn=turn==='X'?'O':'X'}
});
test('infinite XO: bot takes immediate win and understands an expiring mark',()=>{
 let s=emptyXO();for(const [i,p] of [[0,'X'],[3,'O'],[1,'X'],[7,'O']])s=placeInfinite(s,i,p);
 assert.equal(chooseInfinite(s,'X',3),2);
 const old={board:['X','X',null,'X','O',null,'O',null,'O'],queues:{X:[0,1,3],O:[4,6,8]}};
 for(const level of [1,2,3]){const move=chooseInfinite(old,'X',level);assert.ok(placeInfinite(old,move,'X'))}
});
