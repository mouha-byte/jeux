export type Sign = 'rock' | 'paper' | 'scissors';
export const names: Record<Sign, string> = {rock: 'PIERRE', paper: 'FEUILLE', scissors: 'CISEAUX'};
/** Original vector hands: shared by the game and its collection thumbnail. */
export function Hand({sign, blue = false}: {sign: Sign; blue?: boolean}) {
  return <svg viewBox="0 0 160 180" className={`rps-hand ${blue ? 'blue' : ''}`} aria-hidden="true">
    <g stroke="#352619" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
      <path fill={blue ? '#84dcf4' : '#ffd68d'} d={sign === 'rock'
        ? 'M43 149L39 132Q22 119 24 92L26 70Q26 53 41 53Q42 36 59 41Q67 25 81 37Q99 25 107 43Q130 38 133 59L138 98Q140 124 119 143L117 155Z'
        : sign === 'paper'
          ? 'M43 149L27 118L13 88Q8 74 20 69Q30 67 36 79L46 96L36 36Q33 21 46 19Q59 17 61 33L69 75L65 21Q64 6 77 6Q90 6 90 22L93 73L98 27Q100 12 113 15Q124 18 121 32L118 81L126 48Q130 34 141 39Q150 42 146 57L137 117Q135 132 118 148L117 157Z'
          : 'M43 149L30 122Q20 111 25 96L36 72Q42 61 53 67L39 27Q34 12 47 9Q59 6 64 21L84 69L98 22Q102 7 115 11Q127 15 121 30L103 84Q118 71 128 82Q138 85 135 99L133 120Q130 134 116 148L117 157Z'}/>
      {sign === 'rock' ? <><path fill="none" d="M43 56L45 84M63 46L66 78M85 43L88 77M108 49L110 78"/><path fill={blue ? '#b8edf9' : '#ffe4b0'} d="M30 93Q31 80 46 84L84 96Q98 100 92 114Q87 124 75 119L49 112"/></> : sign === 'paper' ? <path fill="none" d="M47 100Q65 92 72 114M82 91L110 94M84 109L106 110"/> : <><path fill={blue ? '#b8edf9' : '#ffe4b0'} d="M32 97Q34 85 48 90L85 104Q98 111 89 122Q82 131 70 122L48 114"/><path fill="none" d="M104 86L96 105M122 91L115 112"/></>}
      <path fill={blue ? '#248dd0' : '#e9972b'} d="M40 146Q80 156 120 146L124 171Q82 183 37 171Z"/>
      <path fill="none" stroke={blue ? '#d4f5ff' : '#fff2d0'} strokeWidth="5" d="M48 160Q79 167 111 160"/>
    </g>
  </svg>;
}
