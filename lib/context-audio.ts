type Profile='chess'|'pool'|'xo'|'cards'|'rps';
export type GameSound='click'|'start'|'move'|'capture'|'check'|'win'|'placeX'|'placeO'|'erase'|'cue'|'collision'|'cushion'|'pocket'|'foul'|'deal'|'draw'|'flip'|'shuffle'|'skip'|'reverse'|'color'|'uno'|'count';
/** Small original foley made locally with Web Audio; no samples or network requests. */
export class ContextAudio{
 private ctx:AudioContext|null=null;
 private master:GainNode|null=null;
 private noise:AudioBuffer|null=null;
 private enabled=true;
 private disposed=false;
 constructor(private profile:Profile){}
 async unlock(){
  if(this.disposed)return;
  this.ctx??=new AudioContext();
  if(!this.master){this.master=this.ctx.createGain();this.master.gain.value=this.enabled?.55:0;this.master.connect(this.ctx.destination)}
  await this.ctx.resume();
 }
 setSound(on:boolean){this.enabled=on;if(this.ctx&&this.master)this.master.gain.setValueAtTime(on?.55:0,this.ctx.currentTime)}
 stop(){this.disposed=true;if(this.ctx)void this.ctx.close();this.noise=null}
 private tone(hz:number,duration:number,volume:number,delay=0,type:OscillatorType='sine',end=hz){
  const c=this.ctx!,o=c.createOscillator(),g=c.createGain(),t=c.currentTime+delay;
  o.type=type;o.frequency.setValueAtTime(hz,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),t+.003);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  o.connect(g);g.connect(this.master!);o.start(t);o.stop(t+duration+.02);o.onended=()=>{o.disconnect();g.disconnect()};
 }
 private rustle(duration:number,volume:number,frequency:number,delay=0,q=.7){
  const c=this.ctx!;
  if(!this.noise){this.noise=c.createBuffer(1,Math.ceil(c.sampleRate*.4),c.sampleRate);const a=this.noise.getChannelData(0);let seed=1849;for(let i=0;i<a.length;i++){seed=(seed*1664525+1013904223)>>>0;a[i]=(seed/4294967296)*2-1}}
  const n=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime+delay;
  n.buffer=this.noise;f.type='bandpass';f.frequency.value=frequency;f.Q.value=q;
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+duration);
  n.connect(f);f.connect(g);g.connect(this.master!);n.start(t);n.stop(t+duration);n.onended=()=>{n.disconnect();f.disconnect();g.disconnect()};
 }
 private wood(strength=1,delay=0){this.tone(310,.065,.19*strength,delay,'sine',180);this.tone(960,.026,.07*strength,delay);this.rustle(.035,.19*strength,1900,delay)}
 private paper(delay=0,strength=1){this.rustle(.105,.2*strength,3800,delay,.45);this.tone(530,.023,.035*strength,delay+.065,'triangle',310)}
 async play(event:GameSound,strength=1){
  if(!this.enabled||this.disposed)return;
  try{await this.unlock();if(!this.enabled||this.disposed)return;const v=Math.max(.1,Math.min(1,strength));
   if(this.profile==='rps'){
    if(event==='count'){this.tone(180,.09,.23,0,'sine',70);this.rustle(.05,.12,1100)}
    else if(event==='win'){this.rustle(.1,.17,2500);[523,784,1047,1319].forEach((n,i)=>this.tone(n,.19,.1,i*.085,'triangle'))}
    else if(event==='foul'){this.rustle(.07,.14,1300);this.tone(330,.16,.1,0,'triangle',165);this.tone(147,.18,.07,.13)}
    else if(event==='draw'){this.tone(440,.09,.11);this.tone(440,.09,.11,.12)}
    else this.tone(880,.055,.1,0,'sine',620);
   }else if(this.profile==='pool'){
    if(event==='cue'){this.rustle(.045,.25*v,1600);this.tone(540,.045,.22*v,0,'sine',220)}
    else if(event==='collision'){this.tone(1850,.023,.17*v);this.tone(2870,.013,.09*v);this.rustle(.014,.2*v,4600)}
    else if(event==='cushion'){this.tone(170,.06,.17*v,0,'sine',90);this.rustle(.03,.1*v,800)}
    else if(event==='pocket'){this.tone(180,.12,.27,0,'sine',62);this.rustle(.16,.17,650,.015);this.tone(400,.038,.09,.12)}
    else if(event==='foul'){this.tone(240,.13,.12);this.tone(165,.2,.12,.13)}
    else if(event==='win'){[392,494,587,784].forEach((n,i)=>this.tone(n,.26,.12,i*.12,'triangle'))}
    else this.wood(.45);
   }else if(this.profile==='chess'){
    if(event==='move')this.wood();
    else if(event==='capture'){this.wood(.7);this.wood(1,.075);this.rustle(.06,.08,900,.08)}
    else if(event==='check'){this.wood(.7);this.tone(740,.22,.11,.09);this.tone(1110,.16,.045,.1)}
    else if(event==='win'){[330,440,554,660].forEach((n,i)=>this.tone(n,.38,.11,i*.14));this.wood(.8)}
    else this.wood(.45);
   }else if(this.profile==='xo'){
    if(event==='placeX'){this.rustle(.1,.22,2600);this.rustle(.1,.2,3100,.11)}
    else if(event==='placeO'){this.rustle(.22,.2,2200);this.tone(650,.09,.055,.17,'sine',510)}
    else if(event==='erase')this.rustle(.12,.12,1300);
    else if(event==='win'){[523,659,784,1047].forEach((n,i)=>this.tone(n,.2,.1,i*.11,'triangle'))}
    else if(event==='start'){this.tone(420,.08,.11);this.tone(630,.09,.1,.085)}
    else this.tone(760,.04,.1,0,'sine',510);
   }else{
    if(event==='shuffle'||event==='start'){for(let i=0;i<6;i++)this.paper(i*.055,.6)}
    else if(event==='deal'||event==='draw'){this.paper();if(event==='draw')this.paper(.07,.6)}
    else if(event==='flip'||event==='move'){this.paper(0,.6);this.wood(.3,.08)}
    else if(event==='skip'){this.paper();this.tone(310,.09,.08,.08,'triangle',200)}
    else if(event==='reverse'){this.paper();this.tone(290,.12,.075,.06,'sine',600)}
    else if(event==='color'){this.paper();this.tone(740,.13,.09,.09)}
    else if(event==='uno'){this.tone(660,.12,.13);this.tone(880,.18,.13,.14)}
    else if(event==='win'){this.paper();[440,554,659,880].forEach((n,i)=>this.tone(n,.34,.11,.1+i*.13,'triangle'))}
    else this.paper(0,.4);
   }
  }catch{/* Audio may be unavailable or blocked until the next user gesture. */}
 }
}
