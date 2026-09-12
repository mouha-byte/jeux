'use client';
import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {ArrowLeft, Volume2, VolumeX, HelpCircle, RotateCcw, Trophy, X} from 'lucide-react';
import {ContextAudio} from '../../lib/context-audio';
import {chooseSign, roundResult, scoreRound} from '../../lib/rps.mjs';
import {Hand, names, type Sign} from './hand';
import '../arcade.css';
import './rps.css';

type Phase = 'ready' | 'count' | 'reveal';
export default function RPS() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [pair, setPair] = useState<{you: Sign; bot: Sign} | null>(null);
  const [beat, setBeat] = useState(0), [scores, setScores] = useState({you: 0, bot: 0});
  const [muted, setMuted] = useState(false), [rules, setRules] = useState(false);
  const audio = useRef<ContextAudio | null>(null), locked = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]), dialog = useRef<HTMLDialogElement>(null);
  const matchOver = scores.you === 3 || scores.bot === 3;
  const result = pair ? roundResult(pair.you, pair.bot) : null;
  function clearTimers() {timers.current.forEach(clearTimeout); timers.current = [];}
  useEffect(() => {
    const sound = new ContextAudio('rps'); audio.current = sound;
    try {const off = localStorage.getItem('prox-rps-sound') === 'off'; setMuted(off); sound.setSound(!off);} catch {}
    const hide = () => {if (document.hidden) {clearTimers(); if (locked.current) {locked.current = false; setPhase('ready'); setPair(null);}}};
    document.addEventListener('visibilitychange', hide);
    return () => {clearTimers(); sound.stop(); document.removeEventListener('visibilitychange', hide);};
  }, []);
  useEffect(() => {if (rules) dialog.current?.showModal(); else dialog.current?.close();}, [rules]);
  function choose(sign: Sign) {
    if (locked.current || matchOver || phase !== 'ready' || rules) return;
    // Commit the independent bot choice before any countdown or reveal.
    const next = {you: sign, bot: chooseSign() as Sign};
    locked.current = true; setPair(next); setBeat(0); setPhase('count');
    void audio.current?.play('count');
    [1, 2].forEach(n => timers.current.push(setTimeout(() => {setBeat(n); void audio.current?.play('count');}, n * 420)));
    timers.current.push(setTimeout(() => {
      const outcome = roundResult(next.you, next.bot);
      const nextScores = scoreRound(scores, next.you, next.bot);
      setScores(nextScores); setPhase('reveal'); locked.current = false;
      void audio.current?.play(outcome === 'win' ? 'win' : outcome === 'lose' ? 'foul' : 'draw');
    }, 1260));
  }
  function nextRound(reset = false) {
    clearTimers(); locked.current = false; setPair(null); setPhase('ready');
    if (reset) setScores({you: 0, bot: 0});
    void audio.current?.play('click');
  }
  function toggleSound() {
    const off = !muted; setMuted(off); audio.current?.setSound(!off);
    if (!off) void audio.current?.play('click');
    try {localStorage.setItem('prox-rps-sound', off ? 'off' : 'on');} catch {}
  }
  const status = phase === 'count' ? ['PIERRE…', 'FEUILLE…', 'CISEAUX !'][beat]
    : phase === 'ready' ? 'À VOUS DE JOUER !'
      : matchOver ? (scores.you === 3 ? 'VOUS GAGNEZ !' : 'LE BOT GAGNE !')
        : result === 'draw' ? 'ÉGALITÉ !' : result === 'win' ? 'BIEN JOUÉ !' : 'POINT AU BOT !';
  return <main className="arcade-app rps-app"><div className="arcade-shell">
    <header className="arcade-top"><Link className="arcade-icon" href="/" aria-label="Tous les jeux"><ArrowLeft/></Link><strong>PROXPLAY</strong><button className="arcade-icon" aria-label={muted ? 'Activer les sons' : 'Couper les sons'} onClick={toggleSound}>{muted ? <VolumeX/> : <Volume2/>}</button></header>
    <h1 className="rps-title">PIERRE <span>FEUILLE</span> CISEAUX</h1>
    <div className="rps-scoreboard" aria-label={`Score : vous ${scores.you}, bot ${scores.bot}. Trois points pour gagner.`}>
      {(['you', 'bot'] as const).map(who => <div key={who} className={`rps-score ${who}`}><strong>{who === 'you' ? 'VOUS' : 'BOT'}</strong><div aria-hidden="true">{[1, 2, 3].map(n => <i key={n} className={scores[who] >= n ? 'earned' : ''}>★</i>)}</div></div>)}
      <b>VS</b>
    </div>
    <div className={`rps-arena ${phase} ${phase === 'reveal' ? result : ''}`}>
      <div className="rps-orbit" aria-hidden="true"/>
      <div className={`rps-fighter you ${phase === 'reveal' && result === 'win' ? 'winner' : ''}`}><div className="rps-motion"><Hand sign={phase === 'reveal' && pair ? pair.you : 'rock'}/></div><span>{phase === 'reveal' && pair ? names[pair.you] : 'VOUS'}</span></div>
      <div className="rps-versus" aria-hidden="true">{phase === 'reveal' ? result === 'draw' ? '=' : '✦' : 'VS'}</div>
      <div className={`rps-fighter bot ${phase === 'reveal' && result === 'lose' ? 'winner' : ''}`}><div className="rps-motion"><Hand blue sign={phase === 'reveal' && pair ? pair.bot : 'rock'}/></div><span>{phase === 'reveal' && pair ? names[pair.bot] : 'BOT'}</span></div>
      {phase === 'reveal' && result === 'win' && <div className="rps-confetti" aria-hidden="true">{Array.from({length:16}, (_, i) => <i key={i} style={{'--i': i} as React.CSSProperties}/>)}</div>}
    </div>
    <div className="rps-announcement" role="status" aria-live="polite"><h2 key={status}>{matchOver && <Trophy/>}{status}</h2><p>{phase === 'ready' ? '3 POINTS POUR GAGNER' : phase === 'count' ? 'ON RÉVÈLE ENSEMBLE' : pair ? `${names[pair.you]} ${result === 'draw' ? '=' : result === 'win' ? 'BAT' : 'PERD CONTRE'} ${names[pair.bot]}` : ''}</p></div>
    <div className="rps-input">
      {phase === 'reveal' ? <button className="arcade-button rps-next" onClick={() => nextRound(matchOver)}>{matchOver ? <RotateCcw/> : null}{matchOver ? 'REJOUER' : 'ENCORE !'}</button> : <div className="rps-choices" role="group" aria-label="Votre signe">{(['rock', 'paper', 'scissors'] as Sign[]).map(sign => <button key={sign} disabled={phase === 'count'} aria-label={names[sign]} className={pair?.you === sign ? 'selected' : ''} onClick={() => choose(sign)}><Hand sign={sign}/><strong>{names[sign]}</strong></button>)}</div>}
    </div>
    <footer className="arcade-bottom"><button className="arcade-icon" aria-label="Règles du jeu" disabled={phase === 'count'} onClick={() => setRules(true)}><HelpCircle/></button><span>UN CHOIX. UN DUEL.</span><span>✦</span></footer>
  </div>
  <dialog ref={dialog} className="arcade-dialog rps-rules" onCancel={() => setRules(false)} onClose={() => setRules(false)} aria-labelledby="rps-rules-title"><button className="arcade-icon arcade-close" aria-label="Fermer les règles" onClick={() => setRules(false)}><X/></button><h2 id="rps-rules-title">3 POINTS !</h2><p>La pierre bat les ciseaux.<br/>Les ciseaux coupent la feuille.<br/>La feuille enveloppe la pierre.</p><p>Égalité ? On rejoue !<br/>Le premier à 3 gagne.</p><button className="arcade-button" onClick={() => setRules(false)}>COMPRIS !</button></dialog>
  </main>;
}
