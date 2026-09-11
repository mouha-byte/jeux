import {TABLE,POCKETS} from './pool-engine.mjs';
export const BALL_COLORS=['#fff7db','#f6be17','#196ee1','#ee3934','#9245cb','#fa862a','#28a366','#a94334','#151921','#f6be17','#196ee1','#ee3934','#9245cb','#fa862a','#28a366','#a94334'];
export function drawPool(ctx:CanvasRenderingContext2D,balls:any[],angle:number,power:number,aim:boolean,inHand:boolean,pull=0){
 const {width:w,height:h,radius:r}=TABLE;
 ctx.clearRect(0,0,w,h);ctx.save();
 ctx.fillStyle='#141b26';ctx.beginPath();ctx.roundRect(8,8,w-16,h-16,30);ctx.fill();
 const wood=ctx.createLinearGradient(10,0,45,0);wood.addColorStop(0,'#4a130d');wood.addColorStop(.45,'#a93521');wood.addColorStop(.8,'#652317');wood.addColorStop(1,'#321711');
 ctx.fillStyle=wood;ctx.strokeStyle='#cb9660';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(17,17,w-34,h-34,24);ctx.fill();ctx.stroke();
 const felt=ctx.createRadialGradient(215,365,20,240,420,500);felt.addColorStop(0,'#249db4');felt.addColorStop(.55,'#14869f');felt.addColorStop(1,'#09526e');
 ctx.fillStyle=felt;ctx.fillRect(36,36,408,768);
 // Cushions and fine cloth weave are drawn once per frame with no textures to download.
 ctx.strokeStyle='#58c3d1';ctx.lineWidth=6;ctx.strokeRect(39,39,402,762);
 ctx.strokeStyle='#ffffff05';ctx.lineWidth=1;ctx.beginPath();for(let y=45;y<798;y+=5){ctx.moveTo(43,y);ctx.lineTo(437,y)}ctx.stroke();
 ctx.strokeStyle='#e3fcff26';ctx.beginPath();ctx.moveTo(43,628);ctx.lineTo(437,628);ctx.stroke();
 ctx.fillStyle='#e5f8f940';ctx.beginPath();ctx.arc(240,230,3,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.translate(240,420);ctx.rotate(-Math.PI/2);ctx.textAlign='center';ctx.font='bold 29px Arial';ctx.fillStyle='#bff2ff10';ctx.fillText('PROXPLAY',0,9);ctx.restore();
 for(const [x,y] of POCKETS){ctx.fillStyle='#091017';ctx.strokeStyle='#5d5360';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,23,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle='#010608';ctx.beginPath();ctx.arc(x,y-2,18,0,Math.PI*2);ctx.fill()}
 ctx.fillStyle='#ffe8a7';for(const x of [25,455])for(const y of [160,285,555,680]){ctx.beginPath();ctx.arc(x,y,2,0,7);ctx.fill()}
 const cue=balls.find(b=>b.id===0);
 if(aim&&cue&&!cue.potted){
  const dx=Math.cos(angle),dy=Math.sin(angle);let length=1300,hit:any=null;
  for(const b of balls){if(b.id===0||b.potted)continue;const bx=b.x-cue.x,by=b.y-cue.y,t=bx*dx+by*dy,side=bx*bx+by*by-t*t;if(t>0&&side<4*r*r){const contact=t-Math.sqrt(4*r*r-side);if(contact>0&&contact<length){length=contact;hit=b}}}
  const walls=[dx>0?(434-cue.x)/dx:dx<0?(46-cue.x)/dx:Infinity,dy>0?(794-cue.y)/dy:dy<0?(46-cue.y)/dy:Infinity];
  if(Math.min(...walls)<length){length=Math.min(...walls);hit=null}
  const tx=cue.x+dx*length,ty=cue.y+dy*length;
  ctx.strokeStyle='#f7ffedbb';ctx.lineWidth=1.7;ctx.setLineDash([8,6]);ctx.beginPath();ctx.moveTo(cue.x,cue.y);ctx.lineTo(tx,ty);ctx.stroke();ctx.setLineDash([]);
  ctx.beginPath();ctx.arc(tx,ty,r,0,7);ctx.stroke();
  if(hit){const hx=hit.x-tx,hy=hit.y-ty;ctx.strokeStyle='#ffe68bbb';ctx.beginPath();ctx.moveTo(hit.x,hit.y);ctx.lineTo(hit.x+hx*3,hit.y+hy*3);ctx.stroke()}
  ctx.save();ctx.translate(cue.x,cue.y);ctx.rotate(angle);const back=25+pull;ctx.strokeStyle='#e0b572';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-back,0);ctx.lineTo(-back-155,0);ctx.stroke();ctx.strokeStyle='#563224';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(-back-90,0);ctx.lineTo(-back-180,0);ctx.stroke();ctx.strokeStyle='#8ef4f9';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-back,0);ctx.lineTo(-back-5,0);ctx.stroke();ctx.restore();
 }
 for(const b of balls){if(b.potted)continue;ctx.save();ctx.translate(b.x,b.y);
  ctx.shadowColor='#001520aa';ctx.shadowBlur=4;ctx.shadowOffsetY=3;
  ctx.fillStyle=b.id>8?'#fff9e5':BALL_COLORS[b.id];ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  ctx.save();ctx.beginPath();ctx.arc(0,0,r,0,7);ctx.clip();
  if(b.id>8){ctx.fillStyle=BALL_COLORS[b.id];ctx.fillRect(-r,-r*.58,r*2,r*1.16)}
  const gloss=ctx.createRadialGradient(-3,-4,0,0,1,12);gloss.addColorStop(0,'#ffffffa0');gloss.addColorStop(.4,'#ffffff08');gloss.addColorStop(1,'#00000088');ctx.fillStyle=gloss;ctx.fillRect(-r,-r,2*r,2*r);ctx.restore();
  if(b.id){ctx.fillStyle='#fff9e9';ctx.beginPath();ctx.arc(0,0,4.8,0,7);ctx.fill();ctx.fillStyle='#202026';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 7px Arial';ctx.fillText(String(b.id),0,.5)}
  if(!b.id&&inHand){ctx.strokeStyle='#ffe576';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.arc(0,0,17,0,7);ctx.stroke();ctx.setLineDash([])}ctx.restore();
 }
 ctx.restore();
}
