'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,Bot,Users,Crown,Volume2,VolumeX,HelpCircle,Pause,Play,RotateCcw,Trophy} from 'lucide-react';
import {TABLE,rack,newShot,moving,shoot,step,settleShot,respot,canPlace,botAim} from '../../lib/pool-engine.mjs';
import {tablePoint,onCue,pullPower,tubePower,MAX_PULL} from '../../lib/pool-input.mjs';
import {drawPool,BALL_COLORS} from '../../lib/pool-draw';
import {ContextAudio} from '../../lib/context-audio';
import '../arcade.css';
import './pool.css';

export default function Pool(){
 const canvas=useRef<HTMLCanvasElement>(null),balls=useRef(rack()),shot=useRef(newShot()),audio=useRef<ContextAudio|null>(null),frame=useRef(0);
 const [playing,setPlaying]=useState(false),[mode,setMode]=useState<'bot'|'local'>('bot'),[turn,setTurn]=useState(0),[groups,setGroups]=useState<(string|null)[]>([null,null]),[busy,setBusy]=useState(false),[inHand,setInHand]=useState(false),[winner,setWinner]=useState<number|null>(null),[message,setMessage]=useState('À VOUS DE CASSER !'),[dialog,setDialog]=useState(''),[muted,setMuted]=useState(false),[angle,setAngle]=useState(-Math.PI/2),[power,setPower]=useState(0),[potted,setPotted]=useState<number[]>([]),[revision,setRevision]=useState(0),[pulling,setPulling]=useState(false);
 const breaking=useRef(true),busyRef=useRef(false),angleRef=useRef(angle),powerRef=useRef(power),gesture=useRef<{id:number;kind:'aim'|'pull'|'place';start:{x:number;y:number};angle:number;placed?:boolean}|null>(null),powerDrag=useRef<{id:number;startY:number;travel:number;angle:number}|null>(null);
 const isBot=playing&&mode==='bot'&&turn===1&&winner===null,controls=playing&&!busy&&!isBot&&winner===null&&!dialog;
 const name=(n:number)=>mode==='bot'?(n?'BOT':'VOUS'):`JOUEUR ${n+1}`;
 useEffect(()=>{audio.current=new ContextAudio('pool');try{const off=localStorage.getItem('prox-pool-sound')==='off';setMuted(off);audio.current.setSound(!off)}catch{}return()=>{audio.current?.stop();cancelAnimationFrame(frame.current)}},[]);
 useEffect(()=>{angleRef.current=angle;powerRef.current=power;paint()},[angle,power,playing,busy,inHand,revision,dialog,turn,pulling]);
 useEffect(()=>{if(playing)window.scrollTo(0,0)},[playing]);
 useEffect(()=>{if(!playing)return;const observer=new ResizeObserver(()=>{cancelPull();paint()});if(canvas.current)observer.observe(canvas.current);return()=>observer.disconnect()},[playing]);
 useEffect(()=>{const onVisibility=()=>{if(document.hidden&&playing&&winner===null){cancelPull();setDialog(d=>d||'pause')}};document.addEventListener('visibilitychange',onVisibility);return()=>document.removeEventListener('visibilitychange',onVisibility)},[playing,winner]);
 useEffect(()=>{if(dialog||busy||winner!==null)cancelPull()},[dialog,busy,winner]);
 useEffect(()=>{const blur=()=>cancelPull();window.addEventListener('blur',blur);return()=>window.removeEventListener('blur',blur)},[]);
 useEffect(()=>{
  if(!busy||dialog)return;let last=0,acc=0,lastImpact=shot.current.impacts,lastPots=shot.current.potted.length,lastSound=0,lastCushion=shot.current.cushions;
  function animate(now:number){
   if(last)acc+=Math.min((now-last)/1000,.045);last=now;
   while(acc>=1/240){step(balls.current,1/240,shot.current);acc-=1/240}
   if(shot.current.impacts>lastImpact&&now-lastSound>75){lastImpact=shot.current.impacts;lastSound=now;void audio.current?.play('collision',Math.max(.18,shot.current.impact/850));shot.current.impact=0}
   if(shot.current.cushions>lastCushion){lastCushion=shot.current.cushions;void audio.current?.play('cushion',.6)}
   if(shot.current.potted.length>lastPots){lastPots=shot.current.potted.length;setPotted(balls.current.filter(b=>b.potted&&b.id).map(b=>b.id));void audio.current?.play('pocket')}
   paint(false);
   if(moving(balls.current))frame.current=requestAnimationFrame(animate);else finish();
  }
  frame.current=requestAnimationFrame(animate);return()=>cancelAnimationFrame(frame.current);
 },[busy,dialog]);
 useEffect(()=>{
  if(!isBot||busy||dialog)return;
  const timer=setTimeout(()=>{if(inHand){respot(balls.current,0);setInHand(false)}const aim=botAim(balls.current,groups[1]);setAngle(aim.angle);angleRef.current=aim.angle;setPower(aim.power);powerRef.current=aim.power;fire(aim.angle,aim.power)},850);
  return()=>clearTimeout(timer);
 },[isBot,busy,dialog,turn,inHand,groups]);
 useEffect(()=>{
  if(!dialog&&winner===null)return;const box=document.querySelector('.pool-dialog'),previous=document.activeElement as HTMLElement;
  const items=()=>Array.from(box?.querySelectorAll<HTMLButtonElement>('button')||[]);items()[0]?.focus();
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&dialog)setDialog('');if(e.key==='Tab'){const all=items();if(e.shiftKey&&document.activeElement===all[0]){e.preventDefault();all.at(-1)?.focus()}else if(!e.shiftKey&&document.activeElement===all.at(-1)){e.preventDefault();all[0]?.focus()}}};document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus()};
 },[dialog,winner]);
 function paint(showAim=!busyRef.current){const el=canvas.current;if(!el)return;const ctx=el.getContext('2d');if(!ctx)return;const scale=Math.min(window.devicePixelRatio||1,2),width=Math.round(el.clientWidth*scale),height=Math.round(el.clientHeight*scale);if(el.width!==width||el.height!==height){el.width=width;el.height=height}if(el.clientWidth>el.clientHeight)ctx.setTransform(0,-height/TABLE.width,width/TABLE.height,0,0,height);else ctx.setTransform(width/TABLE.width,0,0,height/TABLE.height,0,0);drawPool(ctx,balls.current,angleRef.current,powerRef.current,showAim&&winner===null&&!dialog,inHand,gesture.current?.kind==='pull'||powerDrag.current?powerRef.current*MAX_PULL:0)}
 function fire(a=angleRef.current,p=powerRef.current){if(busyRef.current||dialog||winner!==null)return;if(shoot(balls.current,a,p)){shot.current=newShot();busyRef.current=true;setBusy(true);setInHand(false);setMessage('');void audio.current?.play('cue',p)}}
 function finish(){const next=settleShot(balls.current,shot.current,turn,groups,breaking.current);breaking.current=false;if(next.respotEight)respot(balls.current,8);if(next.ballInHand)respot(balls.current,0);setGroups(next.groups);setTurn(next.turn);setInHand(next.ballInHand);setWinner(next.winner);setMessage(next.message);setPotted(balls.current.filter(b=>b.potted&&b.id).map(b=>b.id));busyRef.current=false;setBusy(false);setRevision(v=>v+1);if(next.winner!==null)void audio.current?.play('win');else if(next.ballInHand)void audio.current?.play('foul')}
 function start(m=mode){cancelAnimationFrame(frame.current);balls.current=rack();shot.current=newShot();breaking.current=true;busyRef.current=false;setMode(m);setTurn(0);setGroups([null,null]);setPotted([]);setBusy(false);setInHand(false);setWinner(null);setDialog('');setAngle(-Math.PI/2);setPower(0);powerRef.current=0;setMessage('À VOUS DE CASSER !');cancelPull();setPlaying(true);setRevision(v=>v+1);void audio.current?.play('click')}
 function home(){cancelPull();cancelAnimationFrame(frame.current);busyRef.current=false;setBusy(false);setPlaying(false);setWinner(null);setDialog('')}
 function toggleSound(){const next=!muted;setMuted(next);audio.current?.setSound(!next);if(!next)void audio.current?.play('click');try{localStorage.setItem('prox-pool-sound',next?'off':'on')}catch{}}
 function cancelPull(){const active=gesture.current,wasPower=powerDrag.current;gesture.current=null;powerDrag.current=null;if(active?.kind==='pull'||wasPower){powerRef.current=0;setPower(0)}setPulling(false)}
 function point(e:React.PointerEvent<HTMLCanvasElement>){
  if(!controls||gesture.current?.id!==e.pointerId)return;
  const p=tablePoint(e.clientX,e.clientY,e.currentTarget.getBoundingClientRect()),g=gesture.current,cue=balls.current.find(b=>b.id===0)!;
  if(g.kind==='place'){if(canPlace(balls.current,p.x,p.y)){cue.x=p.x;cue.y=p.y;g.placed=true;setRevision(v=>v+1)}}
  else if(g.kind==='pull'){const value=pullPower(g.start,p,g.angle);powerRef.current=value;setPower(value);paint()}
  else{const a=Math.atan2(p.y-cue.y,p.x-cue.x);angleRef.current=a;setAngle(a)}
 }
 function pointerDown(e:React.PointerEvent<HTMLCanvasElement>){
  if(!controls||gesture.current||powerDrag.current||!e.isPrimary||e.button!==0)return;
  const rect=e.currentTarget.getBoundingClientRect(),p=tablePoint(e.clientX,e.clientY,rect),cue=balls.current.find(b=>b.id===0)!;
  const scale=rect.width>rect.height?rect.height/480:rect.width/480;
  const kind=inHand?'place':onCue(p,cue,angleRef.current,Math.max(22,22/scale))?'pull':'aim';
  gesture.current={id:e.pointerId,kind,start:p,angle:angleRef.current};e.currentTarget.setPointerCapture(e.pointerId);
  if(kind==='pull'){powerRef.current=0;setPower(0);setPulling(true);void audio.current?.unlock().catch(()=>{})}else point(e);
 }
 function pointerUp(e:React.PointerEvent<HTMLCanvasElement>){
  const g=gesture.current;if(!g||g.id!==e.pointerId)return;
  point(e);const value=powerRef.current;gesture.current=null;setPulling(false);
  if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
  if(g.kind==='place'&&g.placed&&controls){setInHand(false);setMessage('VISEZ · TIREZ LA JAUGE')}
  if(g.kind==='pull'&&controls&&value>0)fire(g.angle,value);else paint();
 }
 function tubeDown(e:React.PointerEvent<HTMLDivElement>){
  if(!controls||gesture.current||powerDrag.current||!e.isPrimary||e.button!==0)return;
  powerDrag.current={id:e.pointerId,startY:e.clientY,travel:Math.max(60,e.currentTarget.clientHeight-50),angle:angleRef.current};
  powerRef.current=0;setPower(0);setPulling(true);setInHand(false);e.currentTarget.setPointerCapture(e.pointerId);void audio.current?.unlock().catch(()=>{});
 }
 function tubeMove(e:React.PointerEvent<HTMLDivElement>){const g=powerDrag.current;if(!g||g.id!==e.pointerId||!controls)return;const value=tubePower(g.startY,e.clientY,g.travel);powerRef.current=value;setPower(value);paint()}
 function tubeUp(e:React.PointerEvent<HTMLDivElement>){const g=powerDrag.current;if(!g||g.id!==e.pointerId)return;tubeMove(e);const value=powerRef.current;powerDrag.current=null;setPulling(false);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);if(controls&&value>0)fire(g.angle,value);else paint()}
 function tubeKey(e:React.KeyboardEvent<HTMLDivElement>){if(e.key==='Escape'){cancelPull();powerRef.current=0;setPower(0);return}if(!controls||gesture.current||powerDrag.current)return;
  if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.key)){e.preventDefault();const p=e.key==='Home'?0:e.key==='End'?1:Math.max(0,Math.min(1,powerRef.current+({ArrowDown:.05,ArrowUp:-.05,PageDown:.1,PageUp:-.1}[e.key]||0)));powerRef.current=p;setPower(p)}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();if(powerRef.current>0)fire()}
 }
 return <main className={`arcade-app pool-app ${playing?'pool-playing':''}`}><div className="arcade-shell"><header className="arcade-top">{playing?<button className="arcade-icon" aria-label="Menu billard" onClick={()=>setDialog('leave')}><ArrowLeft/></button>:<Link className="arcade-icon" href="/" aria-label="Tous les jeux"><ArrowLeft/></Link>}<strong>{playing?'BILLARD 8':'PROXPLAY'}</strong><button className="arcade-icon" aria-label={muted?'Activer les sons':'Couper les sons'} onClick={toggleSound}>{muted?<VolumeX/>:<Volume2/>}</button></header>
 {!playing?<><div className="arcade-logo"><Crown/><h1>BILLARD</h1><div className="pool-hero" aria-hidden="true"><i className="pool-hero-ball"><b>8</b></i><i className="pool-small-ball"/><i className="pool-hero-cue"/></div></div><div className="arcade-modes"><button className="arcade-mode" onClick={()=>start('bot')}><span><Bot/><b>VS</b></span><strong>ORDINATEUR</strong></button><button className="arcade-mode" onClick={()=>start('local')}><span><Users/></span><strong>2 JOUEURS</strong></button></div><div className="arcade-bottom"><button className="arcade-icon" aria-label="Règles du billard" onClick={()=>setDialog('rules')}><HelpCircle/></button><span>LA 8 EN DERNIER !</span><span>✦</span></div></>:<><div className="pool-players">{[0,1].map(n=><div key={n} className={`pool-player ${turn===n?'active':''}`}><strong>{name(n)}</strong><div className="pool-ball-track" aria-label={groups[n]==='solid'?'Billes pleines':groups[n]==='stripe'?'Billes rayées':'Groupes non attribués'}>{Array.from({length:7},(_,i)=>{const id=(groups[n]==='stripe'?9:1)+i;return <i key={i} className={`${groups[n]==='stripe'?'striped':''} ${groups[n]&&potted.includes(id)?'sunk':''}`} style={{'--ball':groups[n]?BALL_COLORS[id]:'#2e3944'} as React.CSSProperties}>{groups[n]&&!potted.includes(id)?id:''}</i>})}</div></div>)}</div><div className="pool-table-wrap"><canvas ref={canvas} className="pool-table" aria-label="Table de billard. Touchez pour viser, tirez la queue en arrière et relâchez pour tirer. Flèches pour ajuster la visée." tabIndex={0} onPointerDown={pointerDown} onPointerMove={point} onPointerUp={pointerUp} onPointerCancel={cancelPull} onLostPointerCapture={cancelPull} onKeyDown={e=>{if(e.key==='Escape'){cancelPull();return}if(!controls||gesture.current||powerDrag.current)return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();if(inHand){const cue=balls.current.find(b=>b.id===0)!;const x=cue.x+(e.key==='ArrowLeft'?-10:10);if(canPlace(balls.current,x,cue.y)){cue.x=x;setRevision(v=>v+1)}}else setAngle(a=>a+(e.key==='ArrowLeft'?-.025:.025))}if((e.key==='ArrowUp'||e.key==='ArrowDown')&&inHand){e.preventDefault();const cue=balls.current.find(b=>b.id===0)!,y=cue.y+(e.key==='ArrowUp'?-10:10);if(canPlace(balls.current,cue.x,y)){cue.y=y;setRevision(v=>v+1)}}if(e.key==='Enter'||e.key===' '){e.preventDefault();if(inHand)setInHand(false);else fire()}}}/><div className="pool-tube-area"><span className="pool-tube-value" aria-hidden="true">{Math.round(power*100)}%</span><div className={`pool-tube ${pulling?'charging':''}`} role="slider" tabIndex={controls?0:-1} aria-label="Puissance : tirez vers le bas et relâchez pour tirer" aria-orientation="vertical" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(power*100)} aria-valuetext={`${Math.round(power*100)} pour cent`} aria-disabled={!controls} style={{'--power':power} as React.CSSProperties} onPointerDown={tubeDown} onPointerMove={tubeMove} onPointerUp={tubeUp} onPointerCancel={cancelPull} onLostPointerCapture={cancelPull} onKeyDown={tubeKey} onBlur={()=>{if(powerDrag.current)cancelPull()}}><div className="pool-tube-channel"><i className="pool-tube-fill"/>{[0,1,2,3,4].map(i=><i className="pool-tube-tick" key={i} style={{top:`${i*25}%`}}/>)}</div><span className="pool-tube-ball"><i/></span></div><span className="pool-tube-arrow" aria-hidden="true">↓</span></div></div><div className="pool-controls"><div className="arcade-status" role="status" aria-live="polite">{pulling?`RELÂCHEZ · ${Math.round(power*100)}%`:busy?'LES BILLES ROULENT…':isBot?'LE BOT VISE…':inHand?'PLACEZ LA BLANCHE':message||'RECULEZ LA QUEUE · RELÂCHEZ'}</div><div className="pool-actions"><button className="arcade-icon" aria-label="Pause" onClick={()=>setDialog('pause')}><Pause/></button><span>TIREZ ↓ RELÂCHEZ</span><button className="arcade-icon" aria-label="Règles du billard" onClick={()=>setDialog('rules')}><HelpCircle/></button></div></div></>}
 </div>{(dialog||winner!==null)&&<div className="arcade-overlay"><section className="arcade-dialog pool-dialog" role="dialog" aria-modal="true" aria-label={winner!==null?'Résultat':'Menu billard'}>{winner!==null?<><Trophy className="arcade-win-icon"/><h2>{name(winner)} GAGNE !</h2><div className="arcade-dialog-actions"><button className="arcade-icon" aria-label="Menu" onClick={home}><ArrowLeft/></button><button className="arcade-button" onClick={()=>start()}>REJOUER</button></div></>:dialog==='rules'?<><h2>LA 8 EN DERNIER !</h2><p>Visez au doigt.<br/>Tirez la jauge à droite vers le bas.<br/>Relâchez pour tirer.<br/>Plus vous descendez, plus le tir est fort.<br/>Rentrez vos 7 billes, puis la 8.</p><p>Groupes attribués après la casse.<br/>Blanche rentrée, mauvais contact ou aucune bande ni poche : bille en main pour l’autre joueur. Placez-la au doigt, puis lâchez.</p><button className="arcade-button" onClick={()=>setDialog('')}>JOUER</button></>:dialog==='pause'?<><h2>PAUSE</h2><button className="arcade-button" onClick={()=>setDialog('')}><Play/> JOUER</button><div className="arcade-dialog-actions"><button className="arcade-icon" aria-label="Recommencer" onClick={()=>setDialog('restart')}><RotateCcw/></button></div></>:<><h2>{dialog==='restart'?'RECOMMENCER ?':'QUITTER ?'}</h2><div className="arcade-dialog-actions"><button className="arcade-icon" aria-label="Continuer" onClick={()=>setDialog('')}><ArrowLeft/></button><button className="arcade-button" onClick={()=>dialog==='restart'?start():home()}>OUI</button></div></>}</section></div>}</main>
}
