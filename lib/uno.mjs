export const COLORS=['red','blue','green','yellow'];
export const COLOR_NAMES={red:'Rouge',blue:'Bleu',green:'Vert',yellow:'Jaune'};
export const SYMBOLS={skip:'⊘',reverse:'⇄',draw2:'+2',wild:'✦',wild4:'+4'};
export function deck(){let id=0;const cards=[];for(const color of COLORS){cards.push({id:String(id++),color,value:'0'});for(const value of ['1','2','3','4','5','6','7','8','9','skip','reverse','draw2'])for(let i=0;i<2;i++)cards.push({id:String(id++),color,value})}for(const value of ['wild','wild4'])for(let i=0;i<4;i++)cards.push({id:String(id++),color:null,value});return cards}
export function shuffle(cards,rng=Math.random){const copy=[...cards];for(let i=copy.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
export function newUno(count=4,rng=Math.random){if(![2,4].includes(count))throw new Error('2 or 4 players');const stock=shuffle(deck(),rng),hands=Array.from({length:count},()=>stock.splice(0,7));const index=stock.findIndex(c=>/^\d$/.test(c.value)),top=stock.splice(index,1)[0];return {hands,stock,discard:[top],color:top.color,turn:0,direction:1,winner:null,unoPlayer:null,hasDrawn:false,drawnId:null,event:{type:'start',player:0,count:0},moves:0}}
const clone=s=>({...s,hands:s.hands.map(h=>[...h]),stock:[...s.stock],discard:[...s.discard]});
const nextPlayer=(s,steps=1)=>(s.turn+s.direction*steps+s.hands.length*2)%s.hands.length;
export function canPlay(s,player,card){
 if(s.winner!==null||s.unoPlayer!==null||player!==s.turn||!s.hands[player]?.some(c=>c.id===card.id)||s.hasDrawn&&s.drawnId!==card.id)return false;
 if(card.value==='wild4')return !s.hands[player].some(c=>c.color===s.color);
 return card.value==='wild'||card.color===s.color||card.value===s.discard.at(-1).value;
}
function take(s,player,count,rng){let drawn=[];for(let i=0;i<count;i++){
 if(!s.stock.length){if(s.discard.length<=1)break;const top=s.discard.pop();s.stock=shuffle(s.discard,rng);s.discard=[top]}
 const card=s.stock.pop();s.hands[player].push(card);drawn.push(card);
 }return drawn;
}
export function playCard(state,player,id,color=null,saidUno=false,rng=Math.random){
 const card=state.hands[player]?.find(c=>c.id===id);if(!card||!canPlay(state,player,card)||(!card.color&&!COLORS.includes(color)))return null;
 const s=clone(state);s.hands[player]=s.hands[player].filter(c=>c.id!==id);s.discard.push(card);s.color=card.color||color;s.hasDrawn=false;s.drawnId=null;s.moves++;
 let steps=1,affected=nextPlayer(s),count=0;
 if(card.value==='reverse'){s.direction*=-1;if(s.hands.length===2)steps=2}
 if(card.value==='skip')steps=2;
 if(card.value==='draw2'||card.value==='wild4'){count=card.value==='draw2'?2:4;take(s,affected,count,rng);steps=2}
 s.event={type:card.value,player,affected,count};s.turn=nextPlayer(s,steps);
 if(!s.hands[player].length)s.winner=player;
 else if(s.hands[player].length===1&&!saidUno)s.unoPlayer=player;
 return s;
}
export function drawCard(state,player,rng=Math.random){
 if(state.winner!==null||state.unoPlayer!==null||state.turn!==player||state.hasDrawn)return null;
 const s=clone(state),drawn=take(s,player,1,rng);s.hasDrawn=true;s.drawnId=drawn[0]?.id||null;s.event={type:'draw',player,count:drawn.length};s.moves++;
 if(!drawn.length||!canPlay(s,player,drawn[0])){s.turn=nextPlayer(s);s.hasDrawn=false;s.drawnId=null}
 return s;
}
export function passTurn(state,player){if(state.turn!==player||!state.hasDrawn||state.winner!==null||state.unoPlayer!==null)return null;const s=clone(state);s.turn=nextPlayer(s);s.hasDrawn=false;s.drawnId=null;s.event={type:'pass',player,count:0};return s}
export function sayUno(state,player){if(state.unoPlayer!==player)return null;return {...state,unoPlayer:null,event:{type:'uno',player,count:0}}}
export function catchUno(state,rng=Math.random){if(state.unoPlayer===null)return null;const s=clone(state),player=s.unoPlayer;take(s,player,2,rng);s.unoPlayer=null;s.event={type:'caught',player,count:2};return s}
export function chooseUno(state,player){
 const hand=state.hands[player],legal=hand.filter(c=>canPlay(state,player,c));
 if(!legal.length)return null;
 const counts=Object.fromEntries(COLORS.map(color=>[color,hand.filter(c=>c.color===color).length]));
 const value=c=>(c.color?counts[c.color]*3:0)+(c.value==='draw2'?6:c.value==='skip'?4:c.value==='reverse'?3:0)-(c.value==='wild'?5:c.value==='wild4'?4:0);
 const card=[...legal].sort((a,b)=>value(b)-value(a))[0];
 const color=[...COLORS].sort((a,b)=>hand.filter(c=>c.id!==card.id&&c.color===b).length-hand.filter(c=>c.id!==card.id&&c.color===a).length)[0];
 return {id:card.id,color};
}
export const cardLabel=c=>`${c.color?COLOR_NAMES[c.color]+' ':''}${({skip:'Passe',reverse:'Inversion',draw2:'+2',wild:'Joker',wild4:'Joker +4'})[c.value]||c.value}`;
