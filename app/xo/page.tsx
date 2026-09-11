'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {ArrowLeft,Bot,Users,Crown,Volume2,VolumeX,HelpCircle,RotateCcw,Trophy,Pause,Play} from 'lucide-react';
import {ContextAudio} from '../../lib/context-audio';
import {outcome} from '../../lib/tictactoe.mjs';
import {emptyXO,placeInfinite,chooseInfinite} from '../../lib/infinite-xo.mjs';
import '../arcade.css';
import './xo.css';
type Mark='X'|'O';
function Symbol({mark}:{mark:Mark}){return <svg className={`xo-symbol mark-${mark}`} viewBox="0 0 100 100" aria-hidden="true">{mark==='X'?<><path d="M23 23L77 77"/><path d="M77 23L23 77"/></>:<circle cx="50" cy="50" r="31"/>}</svg>}
export default function XO(){
 const [playing,setPlaying]=useState(false),[mode,setMode]=useState<'bot'|'local'>('bot'),[level,setLevel]=useState(3),[human,setHuman]=useState<Mark>('X');
 const [state,setState]=useState(emptyXO),[turn,setTurn]=useState<Mark>('X'),[scores,setScores]=useState({X:0,O:0,draw:0}),[dialog,setDialog]=useState(''),[muted,setMuted]=useState(false),[round,setRound]=useState(1),[resultOpen,setResultOpen]=useState(false);
 const audio=useRef<ContextAudio|null>(null),lock=useRef(false),endTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const board=state.board;
 const result=outcome(board),botTurn=mode==='bot'&&turn!==human&&playing&&!result;
 useEffect(()=>{if(playing)window.scrollTo(0,0)},[playing]);
 useEffect(()=>{audio.current=new ContextAudio('xo');try{const off=localStorage.getItem('prox-xo-sound')==='off';setMuted(off);audio.current.setSound(!off)}catch{}return()=>{audio.current?.stop();if(endTimer.current)clearTimeout(endTimer.current)}},[]);
 useEffect(()=>{
  if(!botTurn||dialog||result)return;
  const timer=setTimeout(()=>{const move=chooseInfinite(state,turn,level);if(move!==null)moveAt(move)},400);
  return()=>clearTimeout(timer);
 },[botTurn,dialog,state,turn,level]);
 useEffect(()=>{
  if(!dialog&&!resultOpen)return;
  const previous=document.activeElement as HTMLElement,box=document.querySelector('.xo-dialog');
  const items=()=>Array.from(box?.querySelectorAll<HTMLButtonElement>('button')||[]);items()[0]?.focus();
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&dialog)setDialog('');if(e.key==='Tab'){const all=items();if(e.shiftKey&&document.activeElement===all[0]){e.preventDefault();all.at(-1)?.focus()}else if(!e.shiftKey&&document.activeElement===all.at(-1)){e.preventDefault();all[0]?.focus()}}};
  document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus()};
 },[dialog,resultOpen]);
 function moveAt(index:number){
  if(lock.current||dialog||!playing||result)return;
  const next=placeInfinite(state,index,turn);if(!next)return;
  lock.current=true;if(state.queues[turn].length===3)void audio.current?.play('erase');setState(next);const end=outcome(next.board);
  if(end){setScores(s=>({...s,[end.winner]:s[end.winner as keyof typeof s]+1}));void audio.current?.play(end.winner==='draw'?'click':'win');endTimer.current=setTimeout(()=>setResultOpen(true),850)}
  else{setTurn(turn==='X'?'O':'X');void audio.current?.play(turn==='X'?'placeX':'placeO')}
  // Prevent repeated taps within the same render without delaying the next turn.
  queueMicrotask(()=>{lock.current=false});
 }
 function reset(newMatch=false){if(endTimer.current)clearTimeout(endTimer.current);setState(emptyXO());setTurn('X');setResultOpen(false);setDialog('');setPlaying(true);lock.current=false;if(newMatch){setScores({X:0,O:0,draw:0});setRound(1)}else setRound(r=>r+1);void audio.current?.play('start')}
 function home(){if(endTimer.current)clearTimeout(endTimer.current);setResultOpen(false);setDialog('');setPlaying(false);setState(emptyXO());lock.current=false}
 function toggleSound(){const next=!muted;setMuted(next);audio.current?.setSound(!next);if(!next)void audio.current?.play('click');try{localStorage.setItem('prox-xo-sound',next?'off':'on')}catch{}}
 const name=(mark:Mark)=>mode==='local'?mark:mark===human?'VOUS':'BOT';
 const line=result?.line;
 return <main className="arcade-app xo-app"><div className="arcade-shell"><header className="arcade-top">{playing?<button className="arcade-icon" aria-label="Menu X O" onClick={()=>setDialog('leave')}><ArrowLeft/></button>:<Link className="arcade-icon" href="/" aria-label="Tous les jeux"><ArrowLeft/></Link>}<strong>{playing?'X O':'PROXPLAY'}</strong><button className="arcade-icon" aria-label={muted?'Activer les sons':'Couper les sons'} onClick={toggleSound}>{muted?<VolumeX/>:<Volume2/>}</button></header>
 {!playing?<><div className="arcade-logo"><Crown/><h1><span className="xo-title-x">X</span> <span className="xo-title-o">O</span></h1><div className="xo-mini" aria-hidden="true">{['X','O','','','X','O','O','','X'].map((m,i)=><span key={i}>{m&&<Symbol mark={m as Mark}/>}</span>)}</div></div><div className="arcade-modes"><button className="arcade-mode" onClick={()=>{setMode('bot');setDialog('setup');void audio.current?.play('click')}}><span><Bot/><b>VS</b></span><strong>ORDINATEUR</strong></button><button className="arcade-mode" onClick={()=>{setMode('local');setDialog('setup');void audio.current?.play('click')}}><span><Users/></span><strong>2 JOUEURS</strong></button></div><div className="arcade-bottom"><button className="arcade-icon" aria-label="Règles du morpion" onClick={()=>setDialog('rules')}><HelpCircle/></button><span>3 À LA SUITE !</span><span>✦</span></div></>:<><div className="xo-match"><div className="xo-round">∞ · MANCHE {round}</div><div className="xo-scoreboard">{(['X','O'] as Mark[]).map(mark=><div key={mark} className={`xo-score ${turn===mark&&!result?'current':''}`}><Symbol mark={mark}/><span>{name(mark)}<b>{scores[mark]}</b></span></div>)}</div><div className="arcade-status" role="status" aria-live="polite">{result?result.winner==='draw'?'ÉGALITÉ !':`${name(result.winner as Mark)} GAGNE !`:botTurn?'LE BOT JOUE…':mode==='bot'?'À VOUS !':`${turn} À VOUS !`}</div><div className="xo-board" role="group" aria-label="Plateau X O">{board.map((mark,i)=><button key={i} aria-label={`Case ${i+1}${mark?`, ${mark}`:', vide'}`} disabled={!!mark||!!result||botTurn||!!dialog} className={`${result?.line.includes(i)?'winning':''} ${!result&&mark&&state.queues[mark].length===3&&state.queues[mark][0]===i?'xo-oldest':''}`} onClick={()=>moveAt(i)}>{mark&&<Symbol mark={mark}/>}</button>)}{line?.length===3&&<svg className="xo-win-line" viewBox="0 0 300 300" aria-hidden="true"><line x1={(line[0]%3)*100+50} y1={Math.floor(line[0]/3)*100+50} x2={(line[2]%3)*100+50} y2={Math.floor(line[2]/3)*100+50}/></svg>}</div><div className="xo-draws">∞ · LE PLUS ANCIEN DISPARAÎT</div></div><div className="arcade-bottom"><button className="arcade-icon" aria-label="Recommencer la manche" onClick={()=>setDialog('restart')}><RotateCcw/></button><span>3 À LA SUITE !</span><button className="arcade-icon" aria-label="Pause" onClick={()=>setDialog('pause')}><Pause/></button></div></>}
 </div>{(dialog||resultOpen)&&<div className="arcade-overlay"><section className="arcade-dialog xo-dialog" role="dialog" aria-modal="true" aria-label={dialog==='setup'?'Choisir le mode':resultOpen?'Résultat':'Menu du morpion'}>{dialog==='setup'?<><h2>{mode==='bot'?'ORDINATEUR':'2 JOUEURS'}</h2>{mode==='bot'?<><span className="arcade-label">NIVEAU</span><div className="arcade-levels">{[1,2,3].map(n=><button key={n} aria-label={`Niveau ${n}`} aria-pressed={level===n} onClick={()=>setLevel(n)}>{'★'.repeat(n)}</button>)}</div><span className="arcade-label">VOTRE SIGNE</span><div className="arcade-colors">{(['X','O'] as Mark[]).map(mark=><button key={mark} aria-label={`Jouer ${mark}`} aria-pressed={human===mark} onClick={()=>setHuman(mark)}><Symbol mark={mark}/></button>)}</div></>:<div className="xo-duel"><Symbol mark="X"/><b>VS</b><Symbol mark="O"/></div>}<div className="arcade-dialog-actions"><button className="arcade-icon" aria-label="Retour" onClick={()=>setDialog('')}><ArrowLeft/></button><button className="arcade-button" onClick={()=>reset(true)}>JOUER</button></div></>:dialog==='rules'?<><h2>3 À LA SUITE !</h2><p>Alignez trois X ou trois O.<br/>Trois signes par joueur.<br/>Au quatrième coup, le plus ancien disparaît.<br/>On continue jusqu’à la victoire !</p><button className="arcade-button" onClick={()=>setDialog('')}>RETOUR</button></>:dialog==='pause'?<><h2>PAUSE</h2><button className="arcade-button" onClick={()=>setDialog('')}><Play/> JOUER</button></>:dialog==='leave'||dialog==='restart'?<><h2>{dialog==='leave'?'QUITTER ?':'RECOMMENCER ?'}</h2><div className="arcade-dialog-actions"><button className="arcade-icon" aria-label="Continuer" onClick={()=>setDialog('')}><ArrowLeft/></button><button className="arcade-button" onClick={()=>dialog==='leave'?home():reset()}>OUI</button></div></>:<><Trophy className="arcade-win-icon"/><h2>{result?.winner==='draw'?'ÉGALITÉ !':`${name(result!.winner as Mark)} GAGNE !`}</h2>{result?.winner!=='draw'&&<div className="xo-winner-symbol"><Symbol mark={result!.winner as Mark}/></div>}<div className="arcade-dialog-actions"><button className="arcade-icon" aria-label="Menu" onClick={home}><ArrowLeft/></button><button className="arcade-button" onClick={()=>reset()}>REJOUER</button></div></>}</section></div>}</main>
}
