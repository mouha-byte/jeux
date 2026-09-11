'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {Chess,type Square,type Move,type PieceSymbol} from 'chess.js';
import {ArrowLeft,Volume2,VolumeX,RotateCcw,RefreshCw,Flag,Users,Bot,ChevronRight,Clock3,HelpCircle,X,Crown,Check,History,Trophy} from 'lucide-react';
import {ChessPiece,ChessPreview} from './piece';
import '../arcade.css';
import {ChessSound} from '../../lib/chess-sound';
import './chess.css';
const pieceNames:Record<string,string>={p:'pion',n:'cavalier',b:'fou',r:'tour',q:'dame',k:'roi'};
const squares=Array.from({length:64},(_,i)=>`${'abcdefgh'[i%8]}${8-Math.floor(i/8)}` as Square);
const clock=(seconds:number)=>`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;
function resultText(game:Chess){
 if(game.isCheckmate())return `Échec et mat ! Les ${game.turn()==='w'?'Noirs':'Blancs'} gagnent.`;
 if(game.isStalemate())return 'Partie nulle : pat.';
 if(game.isThreefoldRepetition())return 'Partie nulle : répétition de position.';
 if(game.isInsufficientMaterial())return 'Partie nulle : matériel insuffisant.';
 if(game.isDraw())return 'Partie nulle : règle des 50 coups.';
 return '';
}
type Motion={move:Move,captured?:{type:string,color:string,square:Square}};
export default function ChessGame(){
 const game=useRef(new Chess()),audio=useRef<ChessSound|null>(null),animationTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
 const [fen,setFen]=useState(game.current.fen()),[playing,setPlaying]=useState(false),[mode,setMode]=useState<'bot'|'local'>('bot'),[level,setLevel]=useState(2),[side,setSide]=useState<'w'|'b'>('w');
 const [selected,setSelected]=useState<Square|null>(null),[flipped,setFlipped]=useState(false),[muted,setMuted]=useState(false),[thinking,setThinking]=useState(false);
 const [motion,setMotion]=useState<Motion|null>(null),[promotion,setPromotion]=useState<{from:Square,to:Square}|null>(null),[dialog,setDialog]=useState(''),[resigned,setResigned]=useState(''),[elapsed,setElapsed]=useState({w:0,b:0});
 const turn=game.current.turn(),history=game.current.history({verbose:true}),last=history.at(-1),result=resigned||resultText(game.current),ended=!!result;
 const botTurn=playing&&mode==='bot'&&turn!==side&&!ended;
 const canPlay=playing&&!ended&&!botTurn&&!motion&&!dialog&&!promotion;
 const legal=selected?game.current.moves({square:selected,verbose:true}):[];
 const order=flipped?[...squares].reverse():squares;
 useEffect(()=>{if(playing)window.scrollTo(0,0)},[playing]);
 useEffect(()=>{
  if(process.env.NODE_ENV==='production')return;
  const fixtures:Record<string,string>={promotion:'7k/P7/8/8/8/8/8/7K w - - 0 1',castling:'r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1',enpassant:'4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2'};
  const fixture=fixtures[new URLSearchParams(location.search).get('chessTest')||''];
  if(fixture){game.current=new Chess(fixture);setFen(fixture);setMode('local');setPlaying(true)}
 },[]);
 useEffect(()=>{audio.current=new ChessSound();try{const off=localStorage.getItem('prox-chess-sound')==='off';setMuted(off);audio.current.mute(off)}catch{}return()=>{audio.current?.close();if(animationTimer.current)clearTimeout(animationTimer.current)}},[]);
 useEffect(()=>{
  if(!playing||ended||dialog||promotion)return;
  const started=Date.now(),base=elapsed[turn];
  const timer=setInterval(()=>setElapsed(prev=>({...prev,[turn]:base+Math.floor((Date.now()-started)/1000)})),250);
  return()=>clearInterval(timer);
 },[playing,ended,turn,dialog,promotion]);
 useEffect(()=>{
  if(!dialog&&!promotion&&!ended)return;
  const previous=document.activeElement as HTMLElement,box=document.querySelector<HTMLElement>('.chess-dialog');
  const buttons=()=>Array.from(box?.querySelectorAll<HTMLElement>('button,a')||[]);buttons()[0]?.focus();
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setDialog('');setPromotion(null)}if(e.key==='Tab'){const all=buttons(),first=all[0],last=all.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};
  document.addEventListener('keydown',key);return()=>{document.removeEventListener('keydown',key);previous?.focus()};
 },[dialog,promotion,ended]);
 function commit(from:Square,to:Square,promote?:string){
  if(game.current.isGameOver()||resigned)return;
  let move:Move;try{move=game.current.move({from,to,...(promote?{promotion:promote}:{})})}catch{return}
  const captureSquare=(move.flags.includes('e')?`${to[0]}${from[1]}`:to) as Square;
  setMotion({move,...(move.captured?{captured:{type:move.captured,color:move.color==='w'?'b':'w',square:captureSquare}}:{})});
  setFen(game.current.fen());setSelected(null);setPromotion(null);
  audio.current?.play(game.current.isCheckmate()?'win':game.current.isCheck()?'check':move.captured?'capture':'move');
  animationTimer.current=setTimeout(()=>setMotion(null),280);
 }
 useEffect(()=>{
  if(!botTurn||motion||dialog||promotion)return;
  setThinking(true);let worker:Worker|null=null,cancelled=false;
  const fallback=()=>{if(cancelled||game.current.fen()!==fen)return;const move=game.current.moves({verbose:true})[0];setThinking(false);if(move)commit(move.from,move.to,move.promotion)};
  const timeout=setTimeout(()=>{worker?.terminate();fallback()},2500);
  try{
   worker=new Worker('/chess-worker.js');
   worker.onmessage=event=>{clearTimeout(timeout);if(cancelled||game.current.fen()!==fen)return;setThinking(false);if(event.data.move){const {from,to,promotion}=event.data.move;commit(from,to,promotion)}else fallback()};
   worker.onerror=()=>{clearTimeout(timeout);fallback()};worker.postMessage({fen,level});
  }catch{clearTimeout(timeout);fallback()}
  return()=>{cancelled=true;clearTimeout(timeout);worker?.terminate();setThinking(false)};
 },[fen,botTurn,motion,dialog,promotion,level]);
 function start(){if(animationTimer.current)clearTimeout(animationTimer.current);game.current=new Chess();setFen(game.current.fen());setSelected(null);setMotion(null);setPromotion(null);setResigned('');setElapsed({w:0,b:0});setDialog('');setFlipped(side==='b'&&mode==='bot');setPlaying(true);audio.current?.play('click')}
 function choose(square:Square){
  if(!canPlay)return;const piece=game.current.get(square);
  if(selected===square){setSelected(null);return}
  if(selected){const move=legal.find(m=>m.to===square);if(move){if(move.promotion)setPromotion({from:selected,to:square});else commit(selected,square);return}}
  setSelected(piece?.color===turn?square:null);
 }
 function undo(){
  if(motion||thinking||!history.length)return;
  if(resigned){setResigned('');return}
  game.current.undo();if(mode==='bot'&&game.current.turn()!==side&&game.current.history().length)game.current.undo();
  setFen(game.current.fen());setSelected(null);audio.current?.play('click');
 }
 function toggleSound(){const next=!muted;setMuted(next);audio.current?.mute(next);if(!next)audio.current?.play('click');try{localStorage.setItem('prox-chess-sound',next?'off':'on')}catch{}}
 const label=(color:string)=>mode==='local'?(color==='w'?'Blancs':'Noirs'):color===side?'Vous':'Bot';
 const captured=(color:string)=>history.filter(m=>m.color===color&&m.captured).map(m=>m.captured!);
 const coordinates=(square:Square)=>{const i=order.indexOf(square);return {x:i%8,y:Math.floor(i/8)}};
 const capturedMotion=motion?.captured;
 const status=ended?result:thinking?'LE BOT JOUE…':game.current.isCheck()?'ÉCHEC !':selected?'CHOISISSEZ UNE CASE':`${turn==='w'?'BLANCS':'NOIRS'} À VOUS !`;
 function playerBar(color:'w'|'b'){
  return <div className={`ch-player ${playing&&turn===color&&!ended?'active':''}`}><span className={`ch-avatar ${color}`}><ChessPiece type="k" color={color}/></span><div><strong>{label(color)}</strong><span className="ch-captured" aria-label={`${captured(color).length} pièces capturées`}>{captured(color).map((type,i)=><ChessPiece key={i} type={type} color={color==='w'?'b':'w'}/>)}</span></div><span className="ch-clock"><Clock3 size={16}/>{clock(elapsed[color])}</span></div>
 }
 return <main className={`arcade-app chess-app ${playing?'chess-playing':''}`}><div className="arcade-shell"><header className="arcade-top">{playing?<button className="arcade-icon" aria-label="Menu des échecs" onClick={()=>setDialog('restart')}><ArrowLeft/></button>:<Link href="/" className="arcade-icon" aria-label="Tous les jeux"><ArrowLeft/></Link>}<strong>{playing?'ÉCHECS':'PROXPLAY'}</strong><button className="arcade-icon" onClick={toggleSound} aria-label={muted?'Activer les sons':'Couper les sons'}>{muted?<VolumeX/>:<Volume2/>}</button></header>
 {!playing?<><div className="arcade-logo"><Crown/><h1>ÉCHECS</h1><div className="ch-home-board"><ChessPreview/></div></div><div className="arcade-modes"><button className="arcade-mode" onClick={()=>{setMode('bot');setDialog('setup');audio.current?.play('click')}}><span><Bot/><b>VS</b></span><strong>ORDINATEUR</strong></button><button className="arcade-mode" onClick={()=>{setMode('local');setDialog('setup');audio.current?.play('click')}}><span><Users/></span><strong>2 JOUEURS</strong></button></div><div className="arcade-bottom"><button className="arcade-icon" aria-label="Règles des échecs" onClick={()=>setDialog('rules')}><HelpCircle/></button><span>À VOUS DE JOUER</span><span>♟</span></div></>:<>
<section className="ch-table" aria-label="Partie d’échecs">{playerBar(flipped?'w':'b')}<div className="ch-frame"><div className="ch-files top">{order.slice(0,8).map(s=><span key={s}>{s[0].toUpperCase()}</span>)}</div><div className="ch-ranks">{order.filter((_,i)=>i%8===0).map(s=><span key={s}>{s[1]}</span>)}</div><div className={`ch-board ${!playing?'preview':''}`} role="group" aria-label="Échiquier">
 {order.map((square,i)=>{const piece=game.current.get(square),destination=legal.find(m=>m.to===square),isLast=last&&(last.from===square||last.to===square),inCheck=piece?.type==='k'&&piece.color===turn&&game.current.isCheck();
  let from=motion?.move.to===square?motion.move.from:null;
  if(motion?.move.flags.includes('k')&&square===`f${motion.move.to[1]}`)from=`h${motion.move.to[1]}` as Square;
  if(motion?.move.flags.includes('q')&&square===`d${motion.move.to[1]}`)from=`a${motion.move.to[1]}` as Square;
  const offset=from?{x:coordinates(from).x-i%8,y:coordinates(from).y-Math.floor(i/8)}:null;
  return <button key={square} data-square={square} className={`ch-square ${(Math.floor(i/8)+i)%2?'dark':'light'} ${selected===square?'selected':''} ${isLast?'last':''} ${inCheck?'in-check':''}`} aria-label={`${square}${piece?`, ${pieceNames[piece.type]} ${piece.color==='w'?'blanc':'noir'}`:', vide'}${destination?', déplacement possible':''}`} aria-pressed={selected===square} disabled={!canPlay} onClick={()=>choose(square)} onKeyDown={e=>{const delta:Record<string,number>={ArrowLeft:-1,ArrowRight:1,ArrowUp:-8,ArrowDown:8};if(e.key in delta){e.preventDefault();const next=order[i+delta[e.key]];if(next)document.querySelector<HTMLButtonElement>(`[data-square="${next}"]`)?.focus()}}}>
   {destination&&<span className={piece?'ch-target capture':'ch-target'}/>}{piece&&<span key={`${square}-${fen}`} className={`ch-figure ${offset?'sliding':''}`} style={offset?{'--dx':`${offset.x*100}%`,'--dy':`${offset.y*100}%`} as React.CSSProperties:undefined}><ChessPiece type={piece.type} color={piece.color}/></span>}
  </button>})}
 {capturedMotion&&<span className="ch-capture-ghost" style={{left:`${coordinates(capturedMotion.square).x*12.5}%`,top:`${coordinates(capturedMotion.square).y*12.5}%`}}><ChessPiece type={capturedMotion.type} color={capturedMotion.color}/></span>}
 </div><div className="ch-files bottom">{order.slice(0,8).map(s=><span key={s}>{s[0].toUpperCase()}</span>)}</div></div>{playerBar(flipped?'b':'w')}<div className={`arcade-status ${game.current.isCheck()?'warning':''}`} role="status" aria-live="polite"><span className={thinking?'thinking-dot':''}/>{status}</div></section>
 <div className="arcade-bottom ch-controls"><button className="arcade-icon" aria-label="Annuler" title="Annuler" disabled={!history.length||!!motion||thinking||botTurn} onClick={undo}><RotateCcw/></button><button className="arcade-icon" aria-label="Tourner" title="Tourner" disabled={!!motion} onClick={()=>setFlipped(!flipped)}><RefreshCw/></button><button className="arcade-icon" aria-label="Historique" title="Historique" onClick={()=>setDialog('history')}><History/></button><button className="arcade-icon" aria-label="Abandonner" title="Abandonner" disabled={ended||!!motion||thinking} onClick={()=>setDialog('resign')}><Flag/></button></div></>}
 </div>
 {(dialog||promotion||ended)&&<div className="arcade-overlay"><section className="arcade-dialog chess-dialog" role="dialog" aria-modal="true" aria-label={promotion?'Promotion du pion':dialog==='setup'?'Choisir le mode':dialog==='history'?'Historique des coups':dialog==='rules'?'Règles des échecs':ended&&!dialog?'Résultat':'Confirmer'}>
 {promotion?<><h2>PROMOTION !</h2><div className="ch-promote">{(['q','r','b','n'] as PieceSymbol[]).map(type=><button key={type} aria-label={`Promouvoir en ${pieceNames[type]}`} onClick={()=>commit(promotion.from,promotion.to,type)}><ChessPiece type={type} color={turn}/></button>)}</div><div className="arcade-dialog-actions"><button className="arcade-icon" aria-label="Retour" onClick={()=>setPromotion(null)}><ArrowLeft/></button></div></>:dialog==='setup'?<><h2>{mode==='bot'?'ORDINATEUR':'2 JOUEURS'}</h2>{mode==='bot'?<><span className="arcade-label">NIVEAU</span><div className="arcade-levels">{[1,2,3].map(n=><button key={n} aria-label={`Niveau ${n}`} aria-pressed={level===n} onClick={()=>setLevel(n)}>{'★'.repeat(n)}</button>)}</div><span className="arcade-label">VOTRE COULEUR</span><div className="arcade-colors">{(['w','b'] as const).map(color=><button key={color} aria-label={color==='w'?'Blancs':'Noirs'} aria-pressed={side===color} onClick={()=>setSide(color)}><ChessPiece type="k" color={color}/>{side===color&&<Check size={20}/>}</button>)}</div></>:<div className="ch-duel-art"><ChessPiece type="k" color="w"/><b>VS</b><ChessPiece type="k" color="b"/></div>}<div className="arcade-dialog-actions"><button className="arcade-icon" aria-label="Retour" onClick={()=>setDialog('')}><ArrowLeft/></button><button className="arcade-button" onClick={start}>JOUER</button></div></>:dialog==='rules'?<><h2>LES RÈGLES</h2><ul><li>Mettez le roi adverse échec et mat.</li><li>Touchez une pièce, puis une case éclairée.</li><li>Roque, prise en passant et promotion inclus.</li><li>Les horloges mesurent le temps, sans limite.</li></ul><button className="arcade-button" onClick={()=>setDialog('')}>RETOUR</button></>:dialog==='history'?<><h2>LES COUPS</h2><div className="ch-history" aria-label="Historique des coups">{history.length?Array.from({length:Math.ceil(history.length/2)},(_,i)=><div key={i}><span>{i+1}.</span><b>{history[i*2].san}</b><b>{history[i*2+1]?.san||'—'}</b></div>):<p>Aucun coup</p>}</div><div className="arcade-dialog-actions"><button className="arcade-button" onClick={()=>setDialog('')}>RETOUR</button></div></>:ended&&!dialog?<><Trophy className="arcade-win-icon"/><h2>{game.current.isCheckmate()?'ÉCHEC ET MAT !':game.current.isDraw()?'ÉGALITÉ !':'PARTIE TERMINÉE'}</h2><p>{result}</p><div className="arcade-dialog-actions"><button className="arcade-icon" aria-label="Menu" onClick={()=>{setPlaying(false);setResigned('');game.current=new Chess();setFen(game.current.fen())}}><ArrowLeft/></button><button className="arcade-button" onClick={start}>REJOUER</button><button className="arcade-icon" aria-label="Annuler le dernier coup" disabled={!history.length||!!motion} onClick={undo}><RotateCcw/></button></div></>:<><h2>{dialog==='restart'?'QUITTER ?':'ABANDONNER ?'}</h2><div className="arcade-dialog-actions"><button className="arcade-icon" aria-label="Continuer" onClick={()=>setDialog('')}><ArrowLeft/></button><button className="arcade-button" onClick={()=>{if(dialog==='restart'){setPlaying(false);setDialog('');setSelected(null);setResigned('');game.current=new Chess();setFen(game.current.fen());setElapsed({w:0,b:0})}else{setResigned(`Les ${turn==='w'?'Noirs':'Blancs'} gagnent.`);setDialog('')}}}>OUI</button></div></>}
 </section></div>}
 </main>
}
