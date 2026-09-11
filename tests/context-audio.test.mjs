import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildSync} from 'esbuild';
import {readFileSync} from 'node:fs';
const source=buildSync({entryPoints:[new URL('../lib/context-audio.ts',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1')],bundle:true,format:'cjs',platform:'node',write:false}).outputFiles[0].text;
function harness(){const trace=[],contexts=[];
 const param=()=>({value:0,setValueAtTime:(...a)=>trace.push(['set',...a]),exponentialRampToValueAtTime:(...a)=>{assert.ok(a[0]>0&&Number.isFinite(a[0]));trace.push(['ramp',...a])}});
 const node=type=>({type,gain:param(),frequency:param(),Q:{value:0},connect(){},disconnect(){},start(...a){trace.push(['start',type,...a])},stop(...a){trace.push(['stop',type,...a])}});
 class AudioContext{currentTime=0;sampleRate=44100;destination={};constructor(){contexts.push(this)}resume(){return Promise.resolve()}close(){this.closed=true;return Promise.resolve()}createGain(){return node('gain')}createOscillator(){return node('oscillator')}createBufferSource(){return node('noise')}createBiquadFilter(){return node('filter')}createBuffer(ch,length){return {getChannelData:()=>new Float32Array(length)}}}
 const module={exports:{}};vm.runInNewContext(source,{module,exports:module.exports,AudioContext,Float32Array});return {Audio:module.exports.ContextAudio,trace,contexts};
}
test('context sounds: each profile renders distinct valid envelopes with no media fetch',async()=>{
 const signatures=[];
 for(const [profile,event] of [['chess','move'],['pool','collision'],['xo','placeX'],['cards','deal']]){const {Audio,trace}=harness(),audio=new Audio(profile);await audio.play(event);assert.ok(trace.some(e=>e[0]==='start'));signatures.push(JSON.stringify(trace));audio.stop()}
 assert.equal(new Set(signatures).size,4);
 for(const profile of ['chess','pool','xo','cards']){const {Audio,trace}=harness();const audio=new Audio(profile);await audio.play('win');assert.ok(trace.filter(e=>e[0]==='start').length>=4);audio.stop()}
});
test('context sounds: mute blocks events, unmute resumes, disposal blocks future work',async()=>{
 const {Audio,trace,contexts}=harness(),audio=new Audio('pool');audio.setSound(false);await audio.play('collision');assert.equal(contexts.length,0);
 audio.setSound(true);await audio.play('cue',.5);assert.ok(trace.length);audio.setSound(false);const before=trace.length;await audio.play('pocket');assert.equal(trace.length,before);
 audio.stop();assert.equal(contexts[0].closed,true);audio.setSound(true);const after=trace.length;await audio.play('win');assert.equal(trace.length,after);
});
test('other games no longer import or request Ludo audio',()=>{
 for(const name of ['app/pool/page.tsx','app/xo/page.tsx','app/uno/page.tsx','lib/chess-sound.ts']){const text=readFileSync(new URL('../'+name,import.meta.url),'utf8');assert.equal(/GameAudio|game-audio|tokenMove|tokenKill|tokenHome|btnSound/.test(text),false,name)}
});
