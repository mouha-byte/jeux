export const LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export function outcome(board){
 for(const line of LINES)if(board[line[0]]&&line.every(i=>board[i]===board[line[0]]))return {winner:board[line[0]],line};
 return board.every(Boolean)?{winner:'draw',line:[]}:null;
}
export function place(board,index,player){
 if(!Number.isInteger(index)||index<0||index>8||board[index]||outcome(board))return null;
 return board.map((v,i)=>i===index?player:v);
}
export function chooseMark(board,bot,level=3){
 if(outcome(board))return null;
 const choices=[4,0,2,6,8,1,3,5,7].filter(i=>!board[i]);
 if(level===1)return choices[Math.floor(Math.random()*choices.length)];
 const opponent=bot==='X'?'O':'X';
 if(level===2){
  for(const player of [bot,opponent])for(const i of choices)if(outcome(place(board,i,player))?.winner===player)return i;
  return choices[0];
 }
 const cache=new Map();
 function score(cells,turn,depth){
  const result=outcome(cells);if(result)return result.winner==='draw'?0:result.winner===bot?10-depth:depth-10;
  const key=cells.map(v=>v||'-').join('')+turn;if(cache.has(key))return cache.get(key);
  const values=cells.flatMap((p,i)=>p?[]:[score(place(cells,i,turn),turn==='X'?'O':'X',depth+1)]);
  const value=turn===bot?Math.max(...values):Math.min(...values);cache.set(key,value);return value;
 }
 let best=choices[0],value=-Infinity;
 for(const i of choices){const next=score(place(board,i,bot),opponent,0);if(next>value){value=next;best=i}}
 return best;
}
