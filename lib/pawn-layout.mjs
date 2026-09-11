import {coordinate} from './engine.mjs';

// Group by board square: different colors use different progress counters.
export function pawnLayout(tokens,active){
 const groups=new Map();
 tokens.forEach((pieces,color)=>{
  if(!active.includes(color))return;
  pieces.forEach((progress,index)=>{
   const [row,col]=coordinate(color,progress,index),key=`${row},${col}`;
   if(!groups.has(key))groups.set(key,[]);
   groups.get(key).push({color,index,row,col});
  });
 });
 const result={};
 for(const group of groups.values()){
  const columns=Math.min(group.length,4),rows=Math.ceil(group.length/columns);
  group.forEach((pawn,slot)=>{
   const row=Math.floor(slot/columns),rowSize=Math.min(columns,group.length-row*columns);
   result[`${pawn.color}-${pawn.index}`]={
    row:pawn.row+(row-(rows-1)/2)*.85,
    col:pawn.col+(slot%columns-(rowSize-1)/2)*.62,
    stacked:group.length>1,
   };
  });
 }
 return result;
}
