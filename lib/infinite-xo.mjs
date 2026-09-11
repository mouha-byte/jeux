import {LINES,outcome} from './tictactoe.mjs';
export const emptyXO=()=>({board:Array(9).fill(null),queues:{X:[],O:[]}});
export function placeInfinite(state,index,mark){
 if(!['X','O'].includes(mark)||!Number.isInteger(index)||index<0||index>8||state.board[index]||outcome(state.board)?.winner)return null;
 const board=[...state.board],queue=[...state.queues[mark]];
 if(queue.length===3)board[queue.shift()]=null;
 board[index]=mark;queue.push(index);
 return {board,queues:{...state.queues,[mark]:queue}};
}
// Bounded search: unlike classic tic-tac-toe, this game has cycles and no draws.
export function chooseInfinite(state,bot,level=3){
 if(outcome(state.board))return null;
 const other=p=>p==='X'?'O':'X';
 const choices=s=>[4,0,2,6,8,1,3,5,7].filter(i=>!s.board[i]);
 const options=choices(state);
 if(level===1)return options[Math.floor(Math.random()*options.length)];
 const cache=new Map();
 function search(s,turn,depth,alpha,beta){
  const end=outcome(s.board);if(end)return end.winner===bot?1000+depth:-1000-depth;
  if(!depth)return LINES.reduce((v,line)=>{const own=line.filter(i=>s.board[i]===bot).length,opp=line.filter(i=>s.board[i]===other(bot)).length;return v+(!opp?own*own:0)-(!own?opp*opp:0)},0);
  const key=s.queues.X.join('')+'/'+s.queues.O.join('')+turn+depth;
  if(cache.has(key))return cache.get(key);
  let best=turn===bot?-Infinity:Infinity,cut=false;
  for(const i of choices(s)){
   const value=search(placeInfinite(s,i,turn),other(turn),depth-1,alpha,beta);
   best=turn===bot?Math.max(best,value):Math.min(best,value);
   if(turn===bot)alpha=Math.max(alpha,best);else beta=Math.min(beta,best);
   if(beta<=alpha){cut=true;break}
  }
  if(!cut)cache.set(key,best);return best;
 }
 let best=-Infinity,pick=options[0];
 for(const i of options){const value=search(placeInfinite(state,i,bot),other(bot),level===2?2:6,-Infinity,Infinity);if(value>best){best=value;pick=i}}
 return pick;
}
