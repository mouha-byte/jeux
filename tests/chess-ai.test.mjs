import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Chess} from 'chess.js';
import {chooseChessMove} from '../lib/chess-ai.mjs';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
test('all three computer levels return a legal move without altering the position',()=>{
 const game=new Chess();game.move('e4');const fen=game.fen();
 for(const level of [1,2,3]){const start=Date.now(),move=chooseChessMove(fen,level);assert.ok(game.moves({verbose:true}).some(m=>m.from===move.from&&m.to===move.to));assert.equal(game.fen(),fen);assert.ok(Date.now()-start<2500)}
});
test('the computer finds checkmate in one',()=>{
 const game=new Chess();for(const move of ['f3','e5','g4'])game.move(move);
 game.move(chooseChessMove(game.fen(),2,1000));assert.equal(game.isCheckmate(),true);
});
test('the computer escapes check and supports promotion',()=>{
 const checked=new Chess('4k3/8/8/8/8/8/4R3/4K3 b - - 0 1');assert.equal(checked.isCheck(),true);
 const move=chooseChessMove(checked.fen(),2);assert.doesNotThrow(()=>checked.move(move));
 const promotion=new Chess('7k/P7/8/8/8/8/8/7K w - - 0 1');const promoted=chooseChessMove(promotion.fen(),2);
 assert.equal(promoted.promotion,'q');promotion.move(promoted);assert.equal(promotion.get('a8').type,'q');
});
test('terminal positions return no move',()=>{assert.equal(chooseChessMove('7k/6Q1/5K2/8/8/8/8/8 b - - 0 1'),null)});
test('the published worker is standalone JavaScript and returns a winning move',()=>{
 let response;const scope={postMessage:value=>{response=value}};
 runInNewContext(readFileSync(new URL('../public/chess-worker.js',import.meta.url),'utf8'),{self:scope});
 const game=new Chess();for(const move of ['f3','e5','g4'])game.move(move);
 scope.onmessage({data:{fen:game.fen(),level:2}});
 assert.ok(response.move);game.move(response.move);assert.equal(game.isCheckmate(),true);
});
