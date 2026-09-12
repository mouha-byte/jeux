export const SIGNS = ['rock', 'paper', 'scissors'];
export function chooseSign(rng = Math.random) {
  return SIGNS[Math.min(2, Math.max(0, Math.floor(rng() * 3)))];
}
export function roundResult(player, bot) {
  if (!SIGNS.includes(player) || !SIGNS.includes(bot)) throw new RangeError('Unknown sign');
  if (player === bot) return 'draw';
  return {rock: 'scissors', paper: 'rock', scissors: 'paper'}[player] === bot ? 'win' : 'lose';
}
export function scoreRound(scores, player, bot) {
  if (scores.you >= 3 || scores.bot >= 3) return scores;
  const result = roundResult(player, bot);
  return {...scores, you: scores.you + Number(result === 'win'), bot: scores.bot + Number(result === 'lose')};
}
