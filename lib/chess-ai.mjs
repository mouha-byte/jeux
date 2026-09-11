import {Chess} from 'chess.js';
const value={p:100,n:320,b:335,r:500,q:900,k:0};
function evaluate(game){
 let score=0;
 for(const row of game.board())for(const p of row){if(!p)continue;
  const file=p.square.charCodeAt(0)-97,rank=Number(p.square[1])-1;
  const center=3.5-Math.abs(3.5-file)+3.5-Math.abs(3.5-rank);
  const bonus=p.type==='p'?(p.color==='w'?rank:7-rank)*7:p.type==='n'||p.type==='b'?center*9:0;
  score+=(p.color==='w'?1:-1)*(value[p.type]+bonus);
 }
 return score*(game.turn()==='w'?1:-1);
}
// A small, time-bounded search. The browser runs it in a separate worker.
export function chooseChessMove(fen,level=2,budget){
 const game=new Chess(fen),deadline=Date.now()+(budget??[100,300,650][level-1]);
 const initial=game.moves({verbose:true});if(!initial.length)return null;
 let best=initial[0];const timeout=Symbol('timeout');
 const ordered=()=>game.moves({verbose:true}).sort((a,b)=>(value[b.captured]||0)+(b.promotion?800:0)-(value[a.captured]||0)-(a.promotion?800:0));
 function search(depth,alpha,beta,ply){
  if(Date.now()>deadline)throw timeout;
  if(game.isCheckmate())return -100000+ply;
  if(game.isDraw())return 0;
  if(depth===0)return evaluate(game);
  for(const move of ordered()){
   game.move(move);let score;
   try{score=-search(depth-1,-beta,-alpha,ply+1)}finally{game.undo()}
   if(score>=beta)return beta;if(score>alpha)alpha=score;
  }
  return alpha;
 }
 for(let depth=1;depth<=level+1;depth++){
  let candidate=best,score=-Infinity;
  try{for(const move of ordered()){
   game.move(move);let current;
   try{current=-search(depth-1,-Infinity,-score,1)}finally{game.undo()}
   if(current>score){score=current;candidate=move}
  }}catch(error){if(error===timeout)break;throw error}
  best=candidate;if(score>90000)break;
 }
 return {from:best.from,to:best.to,...(best.promotion?{promotion:best.promotion}:{})};
}
