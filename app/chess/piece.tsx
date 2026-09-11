import {useId} from 'react';
export function ChessPiece({type,color}:{type:string,color:string}){
 const id=useId().replace(/:/g,''),white=color==='w';
 const paths:Record<string,string>={
  p:'M25 37 C23 47 23 52 19 59 L45 59 C41 52 41 47 39 37 Z',
  r:'M20 24 L20 12 L26 12 L26 19 L30 19 L30 12 L35 12 L35 19 L39 19 L39 12 L45 12 L45 24 L40 30 L40 49 L45 59 L19 59 L24 49 L24 30 Z',
  b:'M24 39 C14 30 24 21 32 12 C39 21 49 29 40 39 L36 44 L40 55 L45 59 L19 59 L24 55 L28 44 Z',
  n:'M17 58 L20 45 L27 37 L17 39 L12 32 L23 19 L27 11 L34 15 C51 19 52 33 47 46 L46 58 Z',
  q:'M18 23 L22 46 L26 50 L21 59 L44 59 L39 50 L43 46 L47 23 L39 33 L33 19 L27 33 Z',
  k:'M24 28 C9 18 17 12 27 22 L29 29 L29 15 L23 15 L23 9 L29 9 L29 3 L36 3 L36 9 L42 9 L42 15 L36 15 L36 29 L39 22 C49 12 57 18 41 28 L38 46 L42 55 L46 59 L19 59 L23 55 L27 46 Z',
 };
 return <svg viewBox="0 0 64 76" aria-hidden="true" className="chess-piece"><defs><linearGradient id={id} x1="0" y1="0" x2="1" y2=".3"><stop stopColor={white?'#957044':'#090b0d'}/><stop offset=".28" stopColor={white?'#fff2c5':'#656971'}/><stop offset=".52" stopColor={white?'#e9ce91':'#282b30'}/><stop offset=".82" stopColor={white?'#af874f':'#090a0c'}/><stop offset="1" stopColor={white?'#f3dbaa':'#42464a'}/></linearGradient></defs><ellipse cx="33" cy="69" rx="25" ry="5" fill="#0005"/><g fill={`url(#${id})`} stroke={white?'#846137':'#070809'} strokeWidth="1.4" strokeLinejoin="round"><path d={paths[type]||paths.p}/>{type==='p'&&<circle cx="32" cy="28" r="11"/>}{type==='q'&&<g><circle cx="17" cy="20" r="4"/><circle cx="33" cy="15" r="4"/><circle cx="48" cy="20" r="4"/></g>}<ellipse cx="32" cy="60" rx="19" ry="5"/><path d="M13 59 Q32 67 51 59 L54 66 Q32 77 10 66 Z"/><ellipse cx="32" cy="65" rx="22" ry="6"/></g>{type==='n'&&<g fill={white?'#684721':'#c4c0ac'}><circle cx="28" cy="25" r="2"/><path d="M37 20 Q48 30 40 43" fill="none" stroke={white?'#79512d':'#808080'} strokeWidth="2"/></g>}{type==='b'&&<path d="M34 20 L27 31" stroke={white?'#75542b':'#ccc4af'} strokeWidth="2"/>}<path d="M15 66 Q32 74 49 66" stroke={white?'#fff0bb':'#9a9b9c'} fill="none" opacity=".65"/></svg>
}
export function ChessPreview(){
 return <div className="chess-preview" aria-hidden="true">{Array.from({length:64},(_,i)=>{const row=Math.floor(i/8),type=row===0||row===7?'rnbqkbnr'[i%8]:row===1||row===6?'p':null;return <span key={i} className={(row+i)%2?'dark':'light'}>{type&&<ChessPiece type={type} color={row<2?'b':'w'}/>}</span>})}</div>
}
