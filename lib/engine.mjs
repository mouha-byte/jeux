export const PATH = [[6,1],[6,2],[6,3],[6,4],[6,5],[5,6],[4,6],[3,6],[2,6],[1,6],[0,6],[0,7],[0,8],[1,8],[2,8],[3,8],[4,8],[5,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[7,14],[8,14],[8,13],[8,12],[8,11],[8,10],[8,9],[9,8],[10,8],[11,8],[12,8],[13,8],[14,8],[14,7],[14,6],[13,6],[12,6],[11,6],[10,6],[9,6],[8,5],[8,4],[8,3],[8,2],[8,1],[8,0],[7,0],[6,0]];
export const SAFE = [0,8,13,21,26,34,39,47];
export const HOME = [ [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6]], [[1,7],[2,7],[3,7],[4,7],[5,7],[6,7]], [[7,13],[7,12],[7,11],[7,10],[7,9],[7,8]], [[13,7],[12,7],[11,7],[10,7],[9,7],[8,7]] ];
export const BASE = [[[2,2],[2,4],[4,2],[4,4]],[[2,11],[2,13],[4,11],[4,13]],[[11,11],[11,13],[13,11],[13,13]],[[11,2],[11,4],[13,2],[13,4]]];
export const globalIndex=(c,p)=>(c*13+p)%52;
export const coordinate=(c,p,i)=>p<0?BASE[c][i].map(v=>v-.5):p>=51?HOME[c][p-51]:PATH[globalIndex(c,p)];
export const legal=(tokens,c,d)=>tokens[c].flatMap((p,i)=>(p===-1?d===6:p<56&&p+d<=56)?[i]:[]);
export function automaticPawn(tokens,c,d){
 if(d<1||d>=6)return null;
 const choices=legal(tokens,c,d);
 return choices.length===1?choices[0]:null;
}
export function advance(tokens,c,i,d){
 const next=tokens.map(a=>[...a]); const p=next[c][i]===-1?0:next[c][i]+d; next[c][i]=p; let captured=0;
 if(p<51&&!SAFE.includes(globalIndex(c,p)))next.forEach((a,k)=>{if(k!==c)a.forEach((v,j)=>{if(v>=0&&v<51&&globalIndex(k,v)===globalIndex(c,p)){next[k][j]=-1;captured++;}})});
 return {tokens:next,captured,finished:p===56,winner:next[c].every(v=>v===56)};
}
