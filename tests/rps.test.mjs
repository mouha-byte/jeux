import test from 'node:test';
import assert from 'node:assert/strict';
import {SIGNS, chooseSign, roundResult, scoreRound} from '../lib/rps.mjs';
test('all nine duels are symmetric; each sign wins, loses and draws once', () => {
  for (const a of SIGNS) {
    const outcomes = SIGNS.map(b => roundResult(a, b));
    assert.deepEqual(outcomes.toSorted(), ['draw', 'lose', 'win']);
    for (const b of SIGNS) assert.equal(roundResult(b, a), {win:'lose', lose:'win', draw:'draw'}[roundResult(a, b)]);
  }
  assert.equal(roundResult('rock', 'scissors'), 'win');
  assert.equal(roundResult('paper', 'rock'), 'win');
  assert.equal(roundResult('scissors', 'paper'), 'win');
  assert.throws(() => roundResult('lizard', 'rock'), RangeError);
});
test('bot samples all three choices independently', () => {
  assert.deepEqual([0,.34,.67,.999999].map(n => chooseSign(() => n)), ['rock','paper','scissors','scissors']);
});
test('first to three; draws preserve score and completed matches cannot score again', () => {
  const start = {you:0,bot:0}; let scores = scoreRound(start, 'rock', 'rock');
  assert.deepEqual(scores, start);
  scores = scoreRound(scores, 'rock', 'paper');
  for (let i=0;i<3;i++) scores=scoreRound(scores,'scissors','paper');
  assert.deepEqual(scores,{you:3,bot:1});
  assert.deepEqual(scoreRound(scores,'rock','paper'),scores);
  assert.deepEqual(start,{you:0,bot:0});
  assert.deepEqual(scoreRound({you:1,bot:2},'rock','paper'),{you:1,bot:3});
});
