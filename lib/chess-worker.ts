import {chooseChessMove} from './chess-ai.mjs';
self.onmessage=(event:MessageEvent<{fen:string,level:number}>)=>{
 try{self.postMessage({move:chooseChessMove(event.data.fen,event.data.level)})}
 catch{self.postMessage({error:true})}
};
