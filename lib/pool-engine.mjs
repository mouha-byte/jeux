// Portrait table, fixed world coordinates. No rendering or browser dependencies.
export const TABLE={width:480,height:840,left:36,right:444,top:36,bottom:804,radius:10};
export const POCKETS=[[36,36],[444,36],[28,420],[452,420],[36,804],[444,804]];
export const groupOf=id=>id===0||id===8?null:id<8?'solid':'stripe';
export function rack(){
 const balls=[{id:0,x:240,y:628,vx:0,vy:0,potted:false}],order=[1,9,2,10,8,3,4,11,5,12,13,6,14,7,15];
 let i=0;for(let row=0;row<5;row++)for(let col=0;col<=row;col++)balls.push({id:order[i++],x:240+(col-row/2)*20.3,y:230-row*17.59,vx:0,vy:0,potted:false});
 return balls;
}
export const newShot=()=>({first:null,potted:[],rail:false,impacts:0,impact:0,cushions:0});
export const moving=balls=>balls.some(b=>!b.potted&&(b.vx!==0||b.vy!==0));
export function shoot(balls,angle,power){const cue=balls.find(b=>b.id===0);if(!cue||cue.potted||moving(balls))return false;if(!Number.isFinite(power)||!Number.isFinite(angle)||power<=0)return false;const speed=Math.min(1,power)*1180;cue.vx=Math.cos(angle)*speed;cue.vy=Math.sin(angle)*speed;return true}
export function step(balls,dt,shot){
 const R=TABLE.radius;
 for(const b of balls){if(b.potted)continue;b.x+=b.vx*dt;b.y+=b.vy*dt;
  if(POCKETS.some(([x,y])=>Math.hypot(b.x-x,b.y-y)<21)){b.potted=true;b.vx=b.vy=0;shot.potted.push(b.id);continue}
  let hit=false;
  if(b.x<TABLE.left+R){b.x=TABLE.left+R;b.vx=Math.abs(b.vx)*.84;hit=true}if(b.x>TABLE.right-R){b.x=TABLE.right-R;b.vx=-Math.abs(b.vx)*.84;hit=true}
  if(b.y<TABLE.top+R){b.y=TABLE.top+R;b.vy=Math.abs(b.vy)*.84;hit=true}if(b.y>TABLE.bottom-R){b.y=TABLE.bottom-R;b.vy=-Math.abs(b.vy)*.84;hit=true}
  if(hit){shot.cushions=(shot.cushions||0)+1;if(shot.first!==null)shot.rail=true;}
 }
 for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){
  const a=balls[i],b=balls[j];if(a.potted||b.potted)continue;
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d>=R*2)continue;
  const nx=d?dx/d:1,ny=d?dy/d:0,overlap=(R*2-d)/2+.005;
  a.x-=nx*overlap;a.y-=ny*overlap;b.x+=nx*overlap;b.y+=ny*overlap;
  const speed=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;
  if(speed>0){const impulse=speed*.97;a.vx-=impulse*nx;a.vy-=impulse*ny;b.vx+=impulse*nx;b.vy+=impulse*ny;shot.impacts++;shot.impact=Math.max(shot.impact||0,speed);
   if(shot.first===null&&(a.id===0||b.id===0))shot.first=a.id===0?b.id:a.id;
  }
 }
 for(const b of balls){if(b.potted)continue;const speed=Math.hypot(b.vx,b.vy),next=Math.max(0,speed-115*dt);if(next<7){b.vx=b.vy=0}else{b.vx*=next/speed;b.vy*=next/speed}}
}
export function remaining(balls,group){return balls.filter(b=>!b.potted&&groupOf(b.id)===group).length}
export function settleShot(balls,shot,player,groups,breaking=false){
 const assigned=[...groups],own=groups[player];
 // The eight is legal only if the group was cleared BEFORE the shot began.
 const ownBefore=own?remaining(balls,own)+shot.potted.filter(id=>groupOf(id)===own).length:7;
 const firstLegal=shot.first!==null&&(own?(ownBefore===0?shot.first===8:groupOf(shot.first)===own):shot.first!==8);
 const foul=shot.potted.includes(0)||!firstLegal||(!shot.potted.length&&!shot.rail);
 if(breaking&&shot.potted.includes(8))return {groups:assigned,turn:foul?1-player:player,ballInHand:foul,winner:null,respotEight:true,message:foul?'FAUTE · BILLE EN MAIN':'LA 8 REVIENT'};
 if(shot.potted.includes(8)){const won=!!own&&ownBefore===0&&!foul;return {groups:assigned,turn:player,ballInHand:false,winner:won?player:1-player,respotEight:false,message:won?'LA 8 !':'8 TROP TÔT !'}}
 if(!own&&!breaking&&!foul){const first=shot.potted.find(id=>groupOf(id));if(first){assigned[player]=groupOf(first);assigned[1-player]=groupOf(first)==='solid'?'stripe':'solid'}}
 const scored=shot.potted.some(id=>id!==0&&id!==8&&(!assigned[player]||groupOf(id)===assigned[player]));
 return {groups:assigned,turn:!foul&&scored?player:1-player,ballInHand:foul,winner:null,respotEight:false,message:foul?'FAUTE · BILLE EN MAIN':scored?'BIEN JOUÉ !':'À VOUS !'};
}
export function canPlace(balls,x,y,id=0){return x>=46&&x<=434&&y>=46&&y<=794&&!POCKETS.some(([px,py])=>Math.hypot(x-px,y-py)<30)&&!balls.some(b=>b.id!==id&&!b.potted&&Math.hypot(b.x-x,b.y-y)<21)}
export function respot(balls,id=0){const b=balls.find(b=>b.id===id);for(let y=id===8?230:620;y<790;y+=23)for(let x=240;x<435;x+=23)if(canPlace(balls,x,y,id)){Object.assign(b,{x,y,vx:0,vy:0,potted:false});return}for(let y=55;y<790;y+=23)for(let x=55;x<435;x+=23)if(canPlace(balls,x,y,id)){Object.assign(b,{x,y,vx:0,vy:0,potted:false});return}}
function clearPath(balls,from,to,excluded){const dx=to.x-from.x,dy=to.y-from.y,l=dx*dx+dy*dy;return !balls.some(b=>{if(b.potted||excluded.includes(b.id))return false;const t=Math.max(0,Math.min(1,((b.x-from.x)*dx+(b.y-from.y)*dy)/l));return Math.hypot(b.x-from.x-t*dx,b.y-from.y-t*dy)<21})}
export function botAim(balls,group){
 const cue=balls.find(b=>b.id===0),targets=balls.filter(b=>!b.potted&&b.id!==0&&(group?(remaining(balls,group)?groupOf(b.id)===group:b.id===8):b.id!==8));
 let best=null;
 for(const b of targets)for(const [px,py] of POCKETS){const d=Math.hypot(px-b.x,py-b.y),gx=b.x-(px-b.x)/d*20,gy=b.y-(py-b.y)/d*20;
  const distance=Math.hypot(gx-cue.x,gy-cue.y),dot=((gx-cue.x)*(px-b.x)+(gy-cue.y)*(py-b.y))/(distance*d);
  if(dot<.2||!canPlace(balls,gx,gy,b.id)||!clearPath(balls,cue,{x:gx,y:gy},[0,b.id])||!clearPath(balls,b,{x:px,y:py},[0,b.id]))continue;
  const cost=distance+d+(1-dot)*600;if(!best||cost<best.cost)best={angle:Math.atan2(gy-cue.y,gx-cue.x),power:Math.min(.83,.27+(distance+d)/1500),cost};
 }
 if(best)return best;
 const b=targets.sort((a,b)=>Math.hypot(a.x-cue.x,a.y-cue.y)-Math.hypot(b.x-cue.x,b.y-cue.y))[0];
 return {angle:b?Math.atan2(b.y-cue.y,b.x-cue.x):-Math.PI/2,power:.6};
}
