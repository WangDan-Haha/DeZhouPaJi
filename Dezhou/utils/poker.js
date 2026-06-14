const SUITS = ["S", "H", "D", "C"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const RANK_VALUE = RANKS.reduce((acc, rank, index) => {
  acc[rank] = index + 2;
  return acc;
}, {});

function createDeck() {
  const deck = [];
  SUITS.forEach((suit) => {
    RANKS.forEach((rank) => deck.push(rank + suit));
  });
  return deck;
}

function shuffle(deck) {
  const cards = deck.slice();
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = cards[i];
    cards[i] = cards[j];
    cards[j] = tmp;
  }
  return cards;
}

function cardRank(card) {
  return card[0];
}

function cardSuit(card) {
  return card[1];
}

function rankCounts(cards) {
  return cards.reduce((acc, card) => {
    const value = RANK_VALUE[cardRank(card)];
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function uniqueValuesDesc(cards) {
  const set = {};
  cards.forEach((card) => {
    set[RANK_VALUE[cardRank(card)]] = true;
  });
  return Object.keys(set).map(Number).sort((a, b) => b - a);
}

function findStraight(valuesDesc) {
  const values = valuesDesc.slice();
  if (values.indexOf(14) !== -1) values.push(1);
  for (let i = 0; i <= values.length - 5; i += 1) {
    const run = values.slice(i, i + 5);
    if (run[0] - run[4] === 4 && new Set(run).size === 5) {
      return run[0];
    }
  }
  return null;
}

function compareScore(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function evaluateSeven(cards) {
  if (!cards || cards.length < 5) {
    throw new Error("At least five cards are required");
  }

  const counts = rankCounts(cards);
  const valuesDesc = uniqueValuesDesc(cards);
  const suits = cards.reduce((acc, card) => {
    const suit = cardSuit(card);
    if (!acc[suit]) acc[suit] = [];
    acc[suit].push(card);
    return acc;
  }, {});

  let flushCards = null;
  Object.keys(suits).forEach((suit) => {
    if (suits[suit].length >= 5) flushCards = suits[suit];
  });

  if (flushCards) {
    const straightFlushHigh = findStraight(uniqueValuesDesc(flushCards));
    if (straightFlushHigh) return { category: 8, name: "同花顺", score: [8, straightFlushHigh] };
  }

  const groups = Object.keys(counts)
    .map((value) => ({ value: Number(value), count: counts[value] }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  const four = groups.find((group) => group.count === 4);
  if (four) {
    const kicker = valuesDesc.find((value) => value !== four.value);
    return { category: 7, name: "四条", score: [7, four.value, kicker] };
  }

  const triples = groups.filter((group) => group.count === 3).map((group) => group.value);
  const pairs = groups.filter((group) => group.count === 2).map((group) => group.value);
  if (triples.length && (pairs.length || triples.length > 1)) {
    const trip = triples[0];
    const pair = triples.length > 1 ? triples[1] : pairs[0];
    return { category: 6, name: "葫芦", score: [6, trip, pair] };
  }

  if (flushCards) {
    const top = uniqueValuesDesc(flushCards).slice(0, 5);
    return { category: 5, name: "同花", score: [5].concat(top) };
  }

  const straightHigh = findStraight(valuesDesc);
  if (straightHigh) return { category: 4, name: "顺子", score: [4, straightHigh] };

  if (triples.length) {
    const kickers = valuesDesc.filter((value) => value !== triples[0]).slice(0, 2);
    return { category: 3, name: "三条", score: [3, triples[0]].concat(kickers) };
  }

  if (pairs.length >= 2) {
    const topPairs = pairs.slice(0, 2);
    const kicker = valuesDesc.find((value) => value !== topPairs[0] && value !== topPairs[1]);
    return { category: 2, name: "两对", score: [2].concat(topPairs, [kicker]) };
  }

  if (pairs.length === 1) {
    const kickers = valuesDesc.filter((value) => value !== pairs[0]).slice(0, 3);
    return { category: 1, name: "一对", score: [1, pairs[0]].concat(kickers) };
  }

  return { category: 0, name: "高牌", score: [0].concat(valuesDesc.slice(0, 5)) };
}

function bestPlayers(players, community) {
  let best = null;
  return players.filter((player) => !player.folded).reduce((winners, player) => {
    const hand = evaluateSeven(player.hand.concat(community));
    const entry = Object.assign({}, player, { result: hand });
    if (!best || compareScore(hand.score, best.score) > 0) {
      best = hand;
      return [entry];
    }
    if (compareScore(hand.score, best.score) === 0) {
      winners.push(entry);
    }
    return winners;
  }, []);
}

function formatCard(card) {
  const rankNames = { T: "10", J: "J", Q: "Q", K: "K", A: "A" };
  const suitNames = { S: "♠", H: "♥", D: "♦", C: "♣" };
  return (rankNames[cardRank(card)] || cardRank(card)) + suitNames[cardSuit(card)];
}

module.exports = {
  SUITS,
  RANKS,
  createDeck,
  shuffle,
  evaluateSeven,
  bestPlayers,
  compareScore,
  formatCard
};
