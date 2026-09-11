import {coordinate} from './engine.mjs';
// Read the result without changing game state: captured pieces remain visible until the return ends.
export function capturedPieces(before,result,color){
 return before.flatMap((pieces,c)=>c===color?[]:pieces.flatMap((p,index)=>p>=0&&result.tokens[c][index]===-1?[{color:c,index,from:coordinate(c,p,index),to:coordinate(c,-1,index)}]:[]));
}
export const motionTiming=fast=>({roll:fast?280:440,step:fast?115:200,impact:fast?180:290,return:fast?400:700});
