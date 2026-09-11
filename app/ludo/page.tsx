'use client';
import '../ludo.css';
import {useEffect,useRef,useState} from 'react';
import {Crown,Settings,Undo2,Maximize,Minimize,Users,Smartphone,HelpCircle,Check,UserRound,Trophy} from 'lucide-react';
import {PATH,HOME,SAFE,globalIndex,coordinate,legal,advance,automaticPawn} from '../../lib/engine.mjs';
import {GameAudio} from '../../lib/game-audio';
import {capturedPieces,motionTiming} from '../../lib/motion.mjs';
import {pawnLayout} from '../../lib/pawn-layout.mjs';
const COLORS=['#ffe000','#159de0','#ff0805','#138600'];
const NAMES=['Jaune','Bleu','Rouge','Vert'];
const DOTS:Record<number,number[]>={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
const fresh=()=>Array.from({length:4},()=>[-1,-1,-1,-1]);
function Pin({color,id}:{color:string,id:string}){return <svg className="pin-svg" viewBox="0 0 50 70" aria-hidden="true"><defs><linearGradient id={`pin-${id}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff"/><stop offset=".48" stopColor="#f8fbff"/><stop offset="1" stopColor="#97a5b2"/></linearGradient><radialGradient id={`gem-${id}`} cx=".3" cy=".2" r=".8"><stop stopColor="#ffffffaa"/><stop offset=".38" stopColor={color}/><stop offset="1" stopColor={color}/></radialGradient></defs><ellipse cx="25" cy="59" rx="17" ry="9" fill={color} stroke="#313c46" strokeWidth="2"/><ellipse cx="25" cy="56" rx="13" ry="7" fill="#a32926" stroke="#12354d" strokeWidth="2"/><path d="M25 2C11 2 4 12 4 25c0 13 21 36 21 36s21-23 21-36C46 12 39 2 25 2Z" fill={`url(#pin-${id})`} stroke="#778491" strokeWidth="1.5"/><circle cx="25" cy="23" r="14" fill={`url(#gem-${id})`} stroke="#344952" strokeWidth="2.4"/></svg>}
function Die({value,rolling=false}:{value:number,rolling?:boolean}){return <span className={`die-scene ${rolling?'is-rolling':''}`}><span className={`die ${rolling?'rolling':''}`}>{Array.from({length:9},(_,i)=><i key={i} className={DOTS[value].includes(i)?'pip':''}/>)}</span>{rolling&&<span className="rolling-cube" aria-hidden="true">{[1,6,3,4,2,5].map((n,f)=><span key={f} className={`cube-face face-${f}`}>{Array.from({length:9},(_,i)=><i key={i} className={DOTS[n].includes(i)?'pip':''}/>)}</span>)}</span>}</span>}
export default function Game(){
 const [screen,setScreen]=useState('home'),[modal,setModal]=useState(''),[count,setCount]=useState(2),[human,setHuman]=useState(3),[chosen,setChosen]=useState(3),[mode,setMode]=useState('bot'),[pendingMode,setPendingMode]=useState('bot');
 const [tokens,setTokens]=useState<number[][]>(fresh),[active,setActive]=useState([1,3]),[turn,setTurn]=useState(3),[dice,setDice]=useState(1),[lastDice,setLastDice]=useState([1,1,1,1]),[phase,setPhase]=useState('roll'),[message,setMessage]=useState('Touchez le dé pour jouer'),[winner,setWinner]=useState<number|null>(null),[sixes,setSixes]=useState(0),[moves,setMoves]=useState(0);
 const [sound,setSound]=useState(true),[music,setMusic]=useState(false),[fast,setFast]=useState(false),[full,setFull]=useState(false),[audioReady,setAudioReady]=useState(false),[notice,setNotice]=useState('');
 const [moving,setMoving]=useState<{color:number,index:number,step:number,duration:number}|null>(null);
 const [capture,setCapture]=useState<{victims:ReturnType<typeof capturedPieces>,at:number[],stage:'hit'|'return',duration:number}|null>(null);
 const lock=useRef(false),epoch=useRef(0),audio=useRef<GameAudio|null>(null),app=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  if(process.env.NODE_ENV==='production')return;
  const scenario=new URLSearchParams(window.location.search).get('motionTest');
  if(!['capture','overlap'].includes(scenario||''))return;
  const fixture=fresh();
  if(scenario==='overlap'){fixture[3]=[26,26,10,-1];fixture[1][3]=0;}
  else{fixture[3][0]=13;fixture[1][0]=42;}
  setScreen('game');setMode('local');setHuman(3);setChosen(3);setActive([3,1]);setTurn(3);setTokens(fixture);setDice(scenario==='overlap'?1:3);setPhase('choose');setMessage('Choisissez un pion');
 },[]);
 const computer=mode==='bot'&&turn!==human;
 const options=phase==='choose'?legal(tokens,turn,dice):[];
 const layout=pawnLayout(tokens,active);
 const pause=(ms:number)=>new Promise(r=>setTimeout(r,ms));
 useEffect(()=>{audio.current=new GameAudio();return()=>{audio.current?.stop();epoch.current++}},[]);
 function unlockAudio(){void audio.current?.unlock().then(()=>setAudioReady(true)).catch(()=>{});}
 function sfx(_f=440,_d=.1){if(sound)void audio.current?.play('btnSound')}
 useEffect(()=>{audio.current?.setSound(sound)},[sound]);
 useEffect(()=>{audio.current?.setMusic(music)},[music,audioReady]);
 useEffect(()=>{const change=()=>setFull(!!document.fullscreenElement);document.addEventListener('fullscreenchange',change);return()=>document.removeEventListener('fullscreenchange',change)},[]);
 useEffect(()=>{if(!modal)return;const previous=document.activeElement as HTMLElement;const dialog=document.querySelector('[role="dialog"]');const items=()=>Array.from(dialog?.querySelectorAll<HTMLElement>('button,input')||[]);items()[0]?.focus();const handler=(e:KeyboardEvent)=>{if(e.key==='Escape')setModal('');if(e.key==='Tab'){const all=items(),first=all[0],last=all[all.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};document.addEventListener('keydown',handler);return()=>{document.removeEventListener('keydown',handler);previous?.focus()}},[modal]);
 function nextTurn(){setTurn(t=>active[(active.indexOf(t)+1)%active.length]);setPhase('roll');setSixes(0);setMessage('Touchez le dé pour jouer')}
 async function roll(){
  if(lock.current||screen!=='game'||phase!=='roll'||winner!==null||modal)return;
  unlockAudio();lock.current=true;const e=epoch.current,timing=motionTiming(fast);setPhase('rolling');void audio.current?.play('diceRoll');
  for(let j=0;j<8;j++){if(e!==epoch.current)return;setDice(1+Math.floor(Math.random()*6));await pause(timing.roll/8)}
  if(e!==epoch.current)return;let value;do{value=crypto.getRandomValues(new Uint32Array(1))[0]}while(value>=4294967292);
  const d=1+value%6;setDice(d);setLastDice(a=>a.map((v,c)=>c===turn?d:v));
  if(d===6&&sixes===2){setMessage('Trois 6 : le tour est terminé !');setPhase('waiting');await pause(1100);if(e!==epoch.current)return;nextTurn()}
  else if(legal(tokens,turn,d).length){setSixes(s=>d===6?s+1:0);setMessage(d===6?'Un 6 ! Choisissez votre pion':automaticPawn(tokens,turn,d)!==null?'Votre pion avance…':'Choisissez un pion');setPhase('choose')}
  else{setMessage('Aucun déplacement possible');setPhase('waiting');await pause(900);if(e!==epoch.current)return;nextTurn()}
  lock.current=false;
 }
 async function move(i:number){
  if(lock.current||phase!=='choose'||!options.includes(i)||winner!==null||modal)return;
  lock.current=true;const e=epoch.current,timing=motionTiming(fast);setPhase('moving');
  const from=tokens[turn][i],result=advance(tokens,turn,i,dice);
  for(let p=from<0?0:from+1;p<=result.tokens[turn][i];p++){
   if(e!==epoch.current)return;
   setMoving({color:turn,index:i,step:p,duration:timing.step});
   setTokens(prev=>prev.map((a,c)=>a.map((v,j)=>c===turn&&j===i?p:v)));
   void audio.current?.play('tokenMove');await pause(timing.step);
  }
  if(e!==epoch.current)return;setMoving(null);
  if(result.captured){
   const victims=capturedPieces(tokens,result,turn),at=coordinate(turn,result.tokens[turn][i],i);
   setCapture({victims,at,stage:'hit',duration:timing.impact});setMessage('Capture !');void audio.current?.play('tokenKill');
   await pause(timing.impact);if(e!==epoch.current)return;
   setCapture({victims,at,stage:'return',duration:timing.return});setTokens(result.tokens);
   await pause(timing.return);if(e!==epoch.current)return;setCapture(null);
  }else setTokens(result.tokens);
  setMoves(m=>m+1);
  if(result.finished){void audio.current?.play('tokenHome');setNotice('À L’ARRIVÉE !')}
  else if(!result.captured&&result.tokens[turn][i]<51&&SAFE.includes(globalIndex(turn,result.tokens[turn][i])))void audio.current?.play('safePoint');
  if(result.winner){setWinner(turn);setPhase('won')}
  else if(dice===6||result.captured||result.finished){setMessage(result.captured?'Capture ! Rejouez':result.finished?'Pion arrivé ! Rejouez':'Un 6 ! Rejouez');setPhase('roll')}
  else nextTurn();lock.current=false;
 }
 useEffect(()=>{
  if(screen!=='game'||computer||modal||winner!==null||phase!=='choose')return;
  const pawn=automaticPawn(tokens,turn,dice);
  if(pawn===null)return;
  const timer=setTimeout(()=>void move(pawn),fast?90:220);
  return()=>clearTimeout(timer);
 },[screen,computer,modal,winner,phase,tokens,turn,dice,fast]);
 useEffect(()=>{if(!notice)return;const t=setTimeout(()=>setNotice(''),1600);return()=>clearTimeout(t)},[notice]);
 useEffect(()=>{if(screen!=='game'||!computer||modal||winner!==null)return;const timer=setTimeout(()=>{if(phase==='roll')void roll();else if(phase==='choose'){const choices=legal(tokens,turn,dice);choices.sort((a:number,b:number)=>{const score=(i:number)=>{const r=advance(tokens,turn,i,dice);return (r.winner?10000:0)+(r.finished?500:0)+r.captured*200+(tokens[turn][i]===-1?70:tokens[turn][i])};return score(b)-score(a)});if(choices.length)void move(choices[0])}},fast?300:850);return()=>clearTimeout(timer)},[screen,computer,phase,turn,tokens,modal,winner,fast]);
 function start(){setMoving(null);setCapture(null);unlockAudio();epoch.current++;lock.current=false;setHuman(chosen);setMode(pendingMode);setTokens(fresh());setActive(count===2?[chosen,(chosen+2)%4]:[chosen,(chosen+1)%4,(chosen+2)%4,(chosen+3)%4]);setTurn(chosen);setDice(1);setLastDice([1,1,1,1]);setSixes(0);setMoves(0);setWinner(null);setPhase('roll');setMessage('Touchez le dé pour jouer');setNotice('');setModal('');setScreen('game');void audio.current?.play('startGame')}
 function home(){setMoving(null);setCapture(null);epoch.current++;lock.current=false;setScreen('home');setModal('');setWinner(null);setPhase('roll')}
 function setup(m:string){unlockAudio();sfx(650,.1);setPendingMode(m);setModal('players')}
 async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await app.current?.requestFullscreen()}catch{setNotice('Plein écran indisponible')}}
 const name=(c:number)=>mode==='bot'?(c===human?'Vous':'Bot'):`Joueur ${active.indexOf(c)+1}`;
 function playerDice(c:number){if(!active.includes(c))return <div className="dice-placeholder"/>;const current=turn===c,ready=current&&!computer&&phase==='roll'&&!modal&&winner===null;return <div className={`player-dock ${current?'current':''} dock-${c}`}><div className="dock-pin"><Pin color={COLORS[c]} id={`dock${c}`}/></div><button className={`dice-button ${ready?'ready':''}`} aria-label={`${name(c)} — lancer le dé, ${current?dice:lastDice[c]}`} disabled={!ready} onClick={()=>void roll()}><Die value={current?dice:lastDice[c]} rolling={current&&phase==='rolling'}/></button>{ready&&<span className="turn-arrow" aria-hidden="true">➜</span>}{tokens[c].some(v=>v===56)&&<span className="arrived">{tokens[c].filter(v=>v===56).length}/4</span>}</div>}
 return <div className={`app-shell ${screen==='game'?'in-game':''}`} style={{'--roll-ms':`${motionTiming(fast).roll}ms`} as React.CSSProperties} ref={app}><div className="game-wallpaper"/>
 {screen==='home'?<main className="home-screen"><a className="ludo-library" href="/">← Tous les jeux</a><header className="guest-header"><div className="guest-avatar"><UserRound/></div><strong>Guest1234</strong><span>LOCAL</span></header><button className="gold-icon settings-button" aria-label="Réglages" onClick={()=>{unlockAudio();setModal('settings')}}><Settings/></button>
 <div className="game-logo" aria-label="Ludo Classic"><Crown className="logo-crown"/><span className="logo-classic">CLASSIC</span><div className="logo-letters">{['L','U','D','O'].map((l,i)=><span key={l} style={{'--letter':['#28b8ed','#eb2324','#79c840','#ffe363'][i]} as React.CSSProperties}>{l}</span>)}</div><div className="logo-pieces"><Pin color="#159de0" id="logo-blue"/><Die value={5}/><Pin color="#ffe000" id="logo-yellow"/></div></div>
 <div className="mode-buttons"><button className="mode-button" onClick={()=>setup('bot')}><span className="mode-art"><Smartphone/><b>VS</b></span><strong>ORDINATEUR</strong></button><button className="mode-button" onClick={()=>setup('local')}><span className="mode-art friends"><Users/></span><strong>ENTRE AMIS</strong><small>SUR LE MÊME APPAREIL</small></button></div><div className="home-bottom"><button className="gold-icon" aria-label="Règles du jeu" onClick={()=>setModal('rules')}><HelpCircle/></button><span>2 OU 4 JOUEURS</span><button className="gold-icon" aria-label={full?'Quitter le plein écran':'Plein écran'} onClick={()=>void toggleFullscreen()}>{full?<Minimize/>:<Maximize/>}</button></div></main>:<main className="play-screen"><div className="play-top"><button className="gold-icon back-button" aria-label="Retour au menu" onClick={()=>setModal('leave')}><Undo2/></button><button className="gold-icon play-settings" aria-label="Réglages" onClick={()=>setModal('settings')}><Settings/></button></div><div className="board-region"><div className="dice-row upper">{playerDice(0)}{playerDice(1)}</div><div className="classic-board" aria-label="Plateau de Ludo"><svg className="board-grid" viewBox="0 0 600 600" aria-hidden="true"><rect width="600" height="600" fill="white"/>{[[0,0],[360,0],[360,360],[0,360]].map(([x,y],i)=><g key={i}><rect x={x} y={y} width="240" height="240" fill={COLORS[i]} stroke="#27313b" strokeWidth="1"/><rect x={x+40} y={y+40} width="160" height="160" fill="white" stroke="#27313b" strokeWidth="1"/>{[[80,80],[160,80],[80,160],[160,160]].map(([cx,cy],j)=><circle key={j} cx={x+cx} cy={y+cy} r="19" fill={COLORS[i]} stroke="#27313b" strokeWidth="1.5"/>)}</g>)}{PATH.map(([r,c]:number[],i:number)=><g key={i}><rect x={c*40} y={r*40} width="40" height="40" fill={i%13===0?COLORS[Math.floor(i/13)]:'white'} stroke="#323232" strokeWidth=".9"/>{[8,21,34,47].includes(i)&&<text x={c*40+20} y={r*40+30} textAnchor="middle" fontSize="37" fill="white" stroke="#444" strokeWidth="1.3">☆</text>}</g>)}{HOME.map((cells:number[][],i:number)=>cells.slice(0,5).map(([r,c],j)=><rect key={`${i}-${j}`} x={c*40} y={r*40} width="40" height="40" fill={COLORS[i]} stroke="#333" strokeWidth=".9"/>))}{[[7,0,'→'],[0,7,'↓'],[7,14,'←'],[14,7,'↑']].map(([r,c,a],i)=><text key={i} x={(+c)*40+20} y={(+r)*40+30} fontSize="32" textAnchor="middle" fill={COLORS[i]}>{a}</text>)}{['240,240 300,300 240,360','240,240 360,240 300,300','360,240 360,360 300,300','240,360 300,300 360,360'].map((p,i)=><polygon key={i} points={p} fill={COLORS[i]} stroke="#333" strokeWidth="1.5"/>)}</svg>
 {active.map(c=><span key={c} className={`board-name name-${c}`}>{name(c)}</span>)}
 {tokens.map((ps,c)=>active.includes(c)&&ps.map((p,i)=>{const {row:r,col,stacked}=layout[`${c}-${i}`];const available=turn===c&&!computer&&options.includes(i)&&!modal,isMoving=moving?.color===c&&moving?.index===i,isVictim=!!capture?.victims.some(v=>v.color===c&&v.index===i);return <button key={`${c}-${i}`} aria-label={`Pion ${NAMES[c]} ${i+1}${p===-1?', dans la base':p===56?', arrivé':''}`} disabled={!available} className={`board-pin ${stacked?'stacked':''} ${available?'selectable':''} ${p===56?'finished':''} ${isMoving?'is-hopping':''} ${isVictim?'capture-'+capture!.stage:''}`} style={{left:`${(col+.5)/15*100}%`,top:`${(r+.5)/15*100}%`,zIndex:isMoving||isVictim?40:available?30+i:10+i,'--step-ms':`${moving?.duration||200}ms`,'--capture-ms':`${capture?.duration||700}ms`} as React.CSSProperties} onClick={()=>void move(i)}><span className="pawn-shadow"/><span key={isMoving?moving!.step:'rest'} className="pawn-visual"><Pin color={COLORS[c]} id={`p${c}-${i}`}/></span>{p===56&&<Check className="pin-check"/>}</button>}))}{capture&&<div key={capture.stage} className={`capture-effect ${capture.stage}`} style={{left:`${(capture.at[1]+.5)/15*100}%`,top:`${(capture.at[0]+.5)/15*100}%`}} aria-hidden="true"><span className="impact-ring"/>{Array.from({length:10},(_,i)=><i key={i} style={{'--angle':`${i*36}deg`} as React.CSSProperties}/>)}{capture.stage==='hit'&&<b>CAPTURE !</b>}</div>}{notice&&<div className="board-notice" role="status">{notice}</div>}</div><div className="dice-row lower">{playerDice(3)}{playerDice(2)}</div><div className="game-message" role="status" aria-live="polite">{computer?`${name(turn)} joue…`:message}</div></div><div className="play-bottom"><button className="gold-icon" aria-label="Règles du jeu" onClick={()=>setModal('rules')}><HelpCircle/></button><span>{moves} COUPS</span><button className="gold-icon" aria-label={full?'Quitter le plein écran':'Plein écran'} onClick={()=>void toggleFullscreen()}>{full?<Minimize/>:<Maximize/>}</button></div></main>}
 {modal&&<div className="overlay"><div className="dialog-wrap" role="dialog" aria-modal="true" aria-label={modal==='players'?'Choisir les joueurs':modal==='color'?'Choisir votre couleur':modal==='settings'?'Réglages':modal==='leave'?'Quitter la partie':'Règles du jeu'}><section className="blue-panel"><h1>{modal==='players'?'CHOISISSEZ LES JOUEURS':modal==='color'?'CHOISISSEZ VOTRE COULEUR':modal==='settings'?'RÉGLAGES':modal==='leave'?'QUITTER LA PARTIE ?':'RÈGLES DU JEU'}</h1>
 {modal==='players'&&<div className="player-choices">{[2,4].map(n=><button key={n} aria-pressed={count===n} onClick={()=>{setCount(n);sfx(660)}}><span className="radio-gold">{count===n&&<Check/>}</span>{n} JOUEURS</button>)}</div>}
 {modal==='color'&&<div className="color-choices">{[1,2,3,0].map(c=><button key={c} aria-label={NAMES[c]} aria-pressed={chosen===c} onClick={()=>{setChosen(c);sfx(660)}}><Pin color={COLORS[c]} id={`choice${c}`}/><span style={{borderColor:COLORS[c],background:chosen===c?COLORS[c]:'transparent'}}>{chosen===c&&<Check/>}</span></button>)}</div>}
 {modal==='settings'&&<div className="settings-list">{[['Musique',music,setMusic],['Sons',sound,setSound],['Jeu rapide',fast,setFast]].map(([label,value,setter])=><div key={label as string} className="setting-row"><span>{label as string}</span><button role="switch" aria-label={label as string} aria-checked={value as boolean} className={`game-switch ${value?'on':''}`} onClick={()=>{unlockAudio();(setter as (v:boolean)=>void)(!value)}}><b>{value?'On':'Off'}</b></button></div>)}</div>}
 {modal==='rules'&&<ol className="rules"><li>Faites un <b>6</b> pour sortir un pion.</li><li>Lancez le dé, puis touchez un pion éclairé.</li><li>Capturez vos adversaires en arrivant sur leur case. Les étoiles et les cases de départ sont protégées.</li><li>Un 6, une capture ou une arrivée vous fait rejouer. Trois 6 consécutifs terminent le tour.</li><li>Le nombre exact est nécessaire pour arriver au centre. Rentrez vos quatre pions pour gagner !</li><li>Les pions peuvent se dépasser et se superposer sans bloquer le passage.</li></ol>}
 {modal==='leave'&&<p className="leave-text">Votre progression sera perdue.</p>}
 </section><div className="dialog-actions"><button className="gold-icon" aria-label="Retour" onClick={()=>setModal(modal==='color'?'players':'')}><Undo2/></button>{modal==='players'?<button className="gold-button" onClick={()=>setModal('color')}>SUIVANT</button>:modal==='color'?<button className="gold-button" onClick={start}>JOUER</button>:modal==='leave'?<button className="gold-button" onClick={home}>QUITTER</button>:<button className="gold-button" onClick={()=>setModal('')}>RETOUR</button>}</div></div></div>}
 {winner!==null&&!modal&&<div className="overlay"><div className="dialog-wrap" role="dialog" aria-modal="true" aria-label="Victoire"><section className="blue-panel victory"><Trophy/><h1>VICTOIRE !</h1><Pin color={COLORS[winner]} id="winner"/><h2>{name(winner)} {name(winner)==='Vous'?'avez':'a'} gagné !</h2><p>Les quatre pions sont arrivés.</p></section><div className="dialog-actions"><button className="gold-icon" aria-label="Menu" onClick={home}><Undo2/></button><button className="gold-button" onClick={()=>{setWinner(null);setup(mode)}}>REJOUER</button></div></div></div>}
 </div>
}
