export const MAX_PULL=150;
export function tubePower(startY,currentY,travel){
 const distance=currentY-startY;
 return distance<4||travel<=0?0:Math.min(1,distance/travel);
}
export function tablePoint(clientX,clientY,rect){
 const u=(clientX-rect.left)/rect.width,v=(clientY-rect.top)/rect.height;
 return rect.width>rect.height?{x:480-v*480,y:u*840}:{x:u*480,y:v*840};
}
export function onCue(point,cue,angle,tolerance=26){
 const dx=point.x-cue.x,dy=point.y-cue.y,along=-(dx*Math.cos(angle)+dy*Math.sin(angle)),across=Math.abs(dx*Math.sin(angle)-dy*Math.cos(angle));
 return (Math.hypot(dx,dy)<=tolerance)||(along>=15&&along<=235&&across<=tolerance);
}
// Project onto the locked cue axis: lateral finger drift never changes aim or power.
export function pullPower(start,current,angle){
 const distance=-((current.x-start.x)*Math.cos(angle)+(current.y-start.y)*Math.sin(angle));
 return distance<6?0:Math.min(1,distance/MAX_PULL);
}
