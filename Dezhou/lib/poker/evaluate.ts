import type { Card, HandResult } from "@/types/poker";
import { cardRank, cardSuit, RANK_VALUE } from "./cards";

function rankCounts(cards: Card[]) {
  return cards.reduce<Record<number, number>>((acc, card) => {
    const value = RANK_VALUE[cardRank(card)];
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function uniqueValuesDesc(cards: Card[]) {
  const values = new Set(cards.map((card) => RANK_VALUE[cardRank(card)]));
  return [...values].sort((a, b) => b - a);
}

function cardsByValues(cards: Card[], values: number[], limit = values.length) {
  const selected: Card[] = [];
  values.forEach((value) => {
    cards.forEach((card) => {
      if (selected.length < limit && RANK_VALUE[cardRank(card)] === value && !selected.includes(card)) {
        selected.push(card);
      }
    });
  });
  return selected.slice(0, limit);
}

function findStraight(valuesDesc: number[]) {
  const values = valuesDesc.slice();
  if (values.includes(14)) values.push(1);
  for (let i = 0; i <= values.length - 5; i += 1) {
    const run = values.slice(i, i + 5);
    if (new Set(run).size === 5 && run[0] - run[4] === 4) return run[0];
  }
  return null;
}

export function compareScore(a: number[], b: number[]) {
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const diff = (a[i] || 0) - (b[i] || 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function evaluateSeven(cards: Card[]): HandResult {
  if (cards.length < 5) throw new Error("At least five cards are required");

  const counts = rankCounts(cards);
  const valuesDesc = uniqueValuesDesc(cards);
  const suits = cards.reduce<Record<string, Card[]>>((acc, card) => {
    const suit = cardSuit(card);
    acc[suit] = acc[suit] || [];
    acc[suit].push(card);
    return acc;
  }, {});

  const flushCards = Object.values(suits).find((group) => group.length >= 5) || null;
  if (flushCards) {
    const straightFlushHigh = findStraight(uniqueValuesDesc(flushCards));
    if (straightFlushHigh) {
      const values = straightFlushHigh === 5 ? [5, 4, 3, 2, 14] : [straightFlushHigh, straightFlushHigh - 1, straightFlushHigh - 2, straightFlushHigh - 3, straightFlushHigh - 4];
      return { category: 8, name: straightFlushHigh === 14 ? "皇家同花顺" : "同花顺", score: [8, straightFlushHigh], bestCards: cardsByValues(flushCards, values, 5) };
    }
  }

  const groups = Object.keys(counts)
    .map((value) => ({ value: Number(value), count: counts[Number(value)] }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  const four = groups.find((group) => group.count === 4);
  if (four) {
    const kicker = valuesDesc.find((value) => value !== four.value) || 0;
    return { category: 7, name: "四条", score: [7, four.value, kicker], bestCards: cardsByValues(cards, [four.value, kicker], 5) };
  }

  const triples = groups.filter((group) => group.count === 3).map((group) => group.value);
  const pairs = groups.filter((group) => group.count === 2).map((group) => group.value);
  if (triples.length && (pairs.length || triples.length > 1)) {
    const trip = triples[0];
    const pair = triples.length > 1 ? triples[1] : pairs[0];
    return { category: 6, name: "葫芦", score: [6, trip, pair], bestCards: cardsByValues(cards, [trip, pair], 5) };
  }

  if (flushCards) {
    const top = uniqueValuesDesc(flushCards).slice(0, 5);
    return { category: 5, name: "同花", score: [5, ...top], bestCards: cardsByValues(flushCards, top, 5) };
  }

  const straightHigh = findStraight(valuesDesc);
  if (straightHigh) {
    const values = straightHigh === 5 ? [5, 4, 3, 2, 14] : [straightHigh, straightHigh - 1, straightHigh - 2, straightHigh - 3, straightHigh - 4];
    return { category: 4, name: "顺子", score: [4, straightHigh], bestCards: cardsByValues(cards, values, 5) };
  }

  if (triples.length) {
    const kickers = valuesDesc.filter((value) => value !== triples[0]).slice(0, 2);
    return { category: 3, name: "三条", score: [3, triples[0], ...kickers], bestCards: cardsByValues(cards, [triples[0], ...kickers], 5) };
  }

  if (pairs.length >= 2) {
    const topPairs = pairs.slice(0, 2);
    const kicker = valuesDesc.find((value) => !topPairs.includes(value)) || 0;
    return { category: 2, name: "两对", score: [2, ...topPairs, kicker], bestCards: cardsByValues(cards, [...topPairs, kicker], 5) };
  }

  if (pairs.length === 1) {
    const kickers = valuesDesc.filter((value) => value !== pairs[0]).slice(0, 3);
    return { category: 1, name: "一对", score: [1, pairs[0], ...kickers], bestCards: cardsByValues(cards, [pairs[0], ...kickers], 5) };
  }

  const top = valuesDesc.slice(0, 5);
  return { category: 0, name: "高牌", score: [0, ...top], bestCards: cardsByValues(cards, top, 5) };
}

export function findWinners<T extends { id: string; holeCards: Card[] }>(players: T[], communityCards: Card[]) {
  let best: HandResult | null = null;
  return players.reduce<Array<T & { result: HandResult }>>((winners, player) => {
    const result = evaluateSeven([...player.holeCards, ...communityCards]);
    const entry = { ...player, result };
    if (!best || compareScore(result.score, best.score) > 0) {
      best = result;
      return [entry];
    }
    if (compareScore(result.score, best.score) === 0) winners.push(entry);
    return winners;
  }, []);
}
