export type SoundName = 'btnSound'|'diceRoll'|'tokenMove'|'tokenKill'|'tokenHome'|'safePoint'|'startGame';
const names: (SoundName|'bgMusic')[]=['btnSound','diceRoll','tokenMove','tokenKill','tokenHome','safePoint','startGame','bgMusic'];

/** Original reference audio, decoded once and mixed through separate music/SFX buses. */
export class GameAudio {
 private context:AudioContext|null=null;
 private effects:GainNode|null=null;
 private music:GainNode|null=null;
 private loop:AudioBufferSourceNode|null=null;
 private buffers=new Map<string,AudioBuffer>();
 private files=new Map<string,Promise<ArrayBuffer|null>>();
 private ready:Promise<void>|null=null;
 private enabled=true;
 private musicEnabled=false;
 private disposed=false;
 constructor(requested:(SoundName|'bgMusic')[]=names){for(const name of requested)this.files.set(name,fetch(`/audio/${name}.mp3`).then(r=>r.ok?r.arrayBuffer():null).catch(()=>null));}
 async unlock(){
  if(this.disposed)return;
  this.context??=new AudioContext();
  if(!this.effects){this.effects=this.context.createGain();this.effects.connect(this.context.destination);this.music=this.context.createGain();this.music.gain.value=.28;this.music.connect(this.context.destination);this.effects.gain.value=this.enabled?.85:0;}
  await this.context.resume();
  this.ready??=Promise.all(names.map(async name=>{const bytes=await this.files.get(name);if(bytes&&!this.disposed){try{this.buffers.set(name,await this.context!.decodeAudioData(bytes.slice(0)))}catch{}}})).then(()=>{});
  await this.ready;
  if(this.musicEnabled)this.startMusic();
 }
 async play(name:SoundName){if(!this.enabled||this.disposed)return;try{await this.unlock();const buffer=this.buffers.get(name);if(!buffer||!this.enabled||this.disposed)return;const source=this.context!.createBufferSource();source.buffer=buffer;source.connect(this.effects!);source.start();}catch{}}

 setSound(enabled:boolean){this.enabled=enabled;if(this.effects&&this.context)this.effects.gain.setValueAtTime(enabled?.85:0,this.context.currentTime);}
 setMusic(enabled:boolean){this.musicEnabled=enabled;if(!enabled){this.loop?.stop();this.loop=null;}else if(this.context)void this.unlock();}
 private startMusic(){if(this.loop||!this.buffers.has('bgMusic')||this.disposed)return;this.loop=this.context!.createBufferSource();this.loop.buffer=this.buffers.get('bgMusic')!;this.loop.loop=true;this.loop.connect(this.music!);this.loop.start();}
 stop(){this.disposed=true;this.loop?.stop();this.loop=null;if(this.context)void this.context.close();}
}
