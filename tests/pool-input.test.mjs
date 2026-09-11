import test from 'node:test';
import assert from 'node:assert/strict';
import {tablePoint,onCue,pullPower,tubePower} from '../lib/pool-input.mjs';
import {rack,shoot,moving} from '../lib/pool-engine.mjs';
test('cue: pointer coordinates map correctly in portrait and rotated landscape',()=>{
 const portrait={left:10,top:20,width:240,height:420},landscape={left:10,top:20,width:420,height:240};
 assert.deepEqual(tablePoint(130,334,portrait),{x:240,y:628});
 assert.deepEqual(tablePoint(324,140,landscape),{x:240,y:628});
});
test('cue: grabbing behind the ball preserves aim; pointing ahead is aiming',()=>{
 const cue={x:240,y:628},angle=-Math.PI/2;
 assert.ok(onCue({x:245,y:720},cue,angle));
 assert.ok(onCue(cue,cue,angle));
 assert.equal(onCue({x:240,y:420},cue,angle),false);
 assert.equal(onCue({x:320,y:710},cue,angle),false);
});
test('cue: precise axial power, sideways drift ignored, forward motion cancels',()=>{
 const start={x:240,y:650},angle=-Math.PI/2;
 assert.equal(pullPower(start,{x:240,y:725},angle),.5);
 assert.ok(Math.abs(pullPower(start,{x:290,y:725},angle)-.5)<1e-12);
 assert.equal(pullPower(start,{x:240,y:900},angle),1);
 assert.equal(pullPower(start,{x:240,y:654},angle),0);
 assert.equal(pullPower(start,{x:240,y:620},angle),0);
 assert.equal(pullPower({x:0,y:0},{x:-75,y:0},0),.5);
});
test('cue: zero power never shoots and half power gives half launch speed',()=>{
 const a=rack(),b=rack();assert.equal(shoot(a,0,0),false);assert.equal(moving(a),false);
 assert.equal(shoot(a,0,NaN),false);assert.equal(shoot(a,NaN,1),false);
 shoot(a,0,.5);shoot(b,0,1);assert.equal(a[0].vx,b[0].vx/2);
});

test('power tube: downward drag scales precisely; taps and upward drags cannot fire',()=>{
 assert.equal(tubePower(100,200,200),.5);
 assert.equal(tubePower(100,400,200),1);
 assert.equal(tubePower(100,102,200),0);
 assert.equal(tubePower(100,80,200),0);
 assert.equal(tubePower(100,200,0),0);
});
