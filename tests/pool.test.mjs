import test from 'node:test';
import assert from 'node:assert/strict';
import {rack,newShot,shoot,step,moving,settleShot,botAim,respot,canPlace,POCKETS} from '../lib/pool-engine.mjs';
const ball=(id,x,y,vx=0,vy=0)=>({id,x,y,vx,vy,potted:false});
test('pool: rack, head-on collision, cushions and bounded settling',()=>{
 const rackBalls=rack();assert.equal(new Set(rackBalls.map(b=>b.id)).size,16);
 const pair=[ball(0,200,400,400),ball(1,225,400)],shot=newShot();for(let i=0;i<10;i++)step(pair,1/240,shot);
 assert.equal(shot.first,1);assert.ok(pair[1].vx>300);assert.ok(pair[0].vx<25);
 const rail=[ball(0,433,300,300)];step(rail,1/120,newShot());assert.ok(rail[0].vx<0);
 const full=rack(),s=newShot();shoot(full,-Math.PI/2,1);for(let i=0;i<6000&&moving(full);i++)step(full,1/240,s);
 assert.equal(moving(full),false);assert.equal(s.first,1);assert.ok(s.impacts>5);assert.ok(full.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)));
});
test('pool: every pocket captures, cue can be safely returned',()=>{
 for(const [x,y] of POCKETS){const b=[ball(0,x,y)],s=newShot();step(b,1/240,s);assert.deepEqual(s.potted,[0]);assert.ok(b[0].potted)}
 const b=rack();b[0].potted=true;respot(b);assert.ok(canPlace(b,b[0].x,b[0].y));assert.equal(b[0].potted,false);
});
test('pool: groups, own pots and fouls determine the next turn',()=>{
 const b=rack();b.find(v=>v.id===2).potted=true;
 let r=settleShot(b,{first:2,potted:[2],rail:false},0,[null,null]);assert.deepEqual(r.groups,['solid','stripe']);assert.equal(r.turn,0);
 r=settleShot(b,{first:9,potted:[],rail:true},0,['solid','stripe']);assert.equal(r.turn,1);assert.equal(r.ballInHand,true);
 r=settleShot(b,{first:1,potted:[],rail:false},0,['solid','stripe']);assert.equal(r.ballInHand,true);
 r=settleShot(b,{first:1,potted:[0],rail:true},0,['solid','stripe']);assert.equal(r.ballInHand,true);
 r=settleShot(b,{first:1,potted:[2],rail:false},0,[null,null],true);assert.deepEqual(r.groups,[null,null]);assert.equal(r.turn,0);
});
test('pool: premature eight loses, legal eight wins, scratch loses and break eight respots',()=>{
 const b=rack();b.find(v=>v.id===8).potted=true;
 assert.equal(settleShot(b,{first:8,potted:[8],rail:false},0,['solid','stripe']).winner,1);
 for(const v of b)if(v.id>0&&v.id<8)v.potted=true;
 assert.equal(settleShot(b,{first:8,potted:[8],rail:false},0,['solid','stripe']).winner,0);
 assert.equal(settleShot(b,{first:8,potted:[8,0],rail:false},0,['solid','stripe']).winner,1);
 assert.equal(settleShot(b,{first:7,potted:[7,8],rail:false},0,['solid','stripe']).winner,1);
 assert.equal(settleShot(b,{first:1,potted:[8],rail:false},0,[null,null],true).respotEight,true);
});
test('pool: bot produces a finite playable shot, including last eight',()=>{
 const b=rack();for(const group of [null,'solid','stripe']){const aim=botAim(b,group);assert.ok(Number.isFinite(aim.angle));assert.ok(aim.power>0&&aim.power<=1)}
 for(const v of b)if(v.id>0&&v.id<8)v.potted=true;
 assert.ok(Number.isFinite(botAim(b,'solid').angle));
});
