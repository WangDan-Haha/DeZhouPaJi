const poker = require("./poker");

const STREETS = ["preflop", "flop", "turn", "river", "showdown"];
const STREET_LABEL = {
  preflop: "翻牌前",
  flop: "翻牌圈",
  turn: "转牌圈",
  river: "河牌圈",
  showdown: "摊牌"
};

function createPlayer(name, buyIn) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name: name || "玩家",
    chips: buyIn,
    hand: [],
    bet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    acted: false
  };
}

function activePlayers(players) {
  return players.filter((player) => !player.folded);
}

function nextIndex(players, fromIndex) {
  if (!players.length) return 0;
  for (let step = 1; step <= players.length; step += 1) {
    const index = (fromIndex + step) % players.length;
    const player = players[index];
    if (!player.folded && !player.allIn && player.chips > 0) return index;
  }
  return fromIndex;
}

function resetStreet(players) {
  players.forEach((player) => {
    player.bet = 0;
    player.acted = player.folded || player.allIn;
  });
}

function currentBet(players) {
  return Math.max.apply(null, players.map((player) => player.bet));
}

function bettingComplete(players) {
  const live = players.filter((player) => !player.folded && !player.allIn);
  if (live.length === 0) return true;
  const target = currentBet(players);
  return live.every((player) => player.acted && player.bet === target);
}

function dealPrivateCards(state) {
  for (let round = 0; round < 2; round += 1) {
    state.players.forEach((player) => {
      player.hand.push(state.deck.pop());
    });
  }
}

function blindBet(player, amount) {
  const paid = Math.min(player.chips, amount);
  player.chips -= paid;
  player.bet += paid;
  player.totalBet += paid;
  if (player.chips === 0) player.allIn = true;
  return paid;
}

function startHand(players, dealerIndex, smallBlind, bigBlind) {
  if (players.length < 2) throw new Error("至少需要 2 位玩家");
  const deck = poker.shuffle(poker.createDeck());
  const normalizedPlayers = players.map((player) => ({
    id: player.id,
    name: player.name,
    chips: player.chips,
    hand: [],
    bet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    acted: false
  }));
  const sbIndex = players.length === 2 ? dealerIndex : (dealerIndex + 1) % players.length;
  const bbIndex = (sbIndex + 1) % players.length;
  const state = {
    players: normalizedPlayers,
    deck,
    community: [],
    pot: 0,
    dealerIndex,
    currentIndex: nextIndex(normalizedPlayers, bbIndex),
    street: "preflop",
    minRaise: bigBlind,
    smallBlind,
    bigBlind,
    winners: [],
    log: []
  };
  state.pot += blindBet(state.players[sbIndex], smallBlind);
  state.pot += blindBet(state.players[bbIndex], bigBlind);
  state.players[sbIndex].acted = true;
  state.players[bbIndex].acted = false;
  state.log.push(state.players[sbIndex].name + " 下小盲 " + smallBlind);
  state.log.push(state.players[bbIndex].name + " 下大盲 " + bigBlind);
  dealPrivateCards(state);
  return state;
}

function revealNextStreet(state) {
  resetStreet(state.players);
  if (state.street === "preflop") {
    state.community = state.community.concat([state.deck.pop(), state.deck.pop(), state.deck.pop()]);
    state.street = "flop";
  } else if (state.street === "flop") {
    state.community.push(state.deck.pop());
    state.street = "turn";
  } else if (state.street === "turn") {
    state.community.push(state.deck.pop());
    state.street = "river";
  } else if (state.street === "river") {
    state.street = "showdown";
    settleShowdown(state);
    return state;
  }
  state.currentIndex = nextIndex(state.players, state.dealerIndex);
  state.log.push("进入" + STREET_LABEL[state.street]);
  return state;
}

function awardSingleWinner(state) {
  const winner = activePlayers(state.players)[0];
  winner.chips += state.pot;
  state.winners = [{ id: winner.id, name: winner.name, amount: state.pot, result: { name: "其他玩家弃牌" } }];
  state.log.push(winner.name + " 赢得底池 " + state.pot);
  state.pot = 0;
  state.street = "showdown";
}

function settleShowdown(state) {
  const winners = poker.bestPlayers(state.players, state.community);
  const share = Math.floor(state.pot / winners.length);
  const remainder = state.pot - share * winners.length;
  winners.forEach((winner, index) => {
    const player = state.players.find((item) => item.id === winner.id);
    const amount = share + (index === 0 ? remainder : 0);
    player.chips += amount;
    winner.amount = amount;
  });
  state.winners = winners;
  state.log.push(winners.map((winner) => winner.name).join("、") + " 摊牌获胜");
  state.pot = 0;
}

function act(state, action, amount) {
  if (state.street === "showdown") return state;
  const player = state.players[state.currentIndex];
  const target = currentBet(state.players);
  const callAmount = Math.max(0, target - player.bet);

  if (action === "fold") {
    player.folded = true;
    player.acted = true;
    state.log.push(player.name + " 弃牌");
  } else {
    let pay = 0;
    if (action === "call") pay = callAmount;
    if (action === "raise") pay = callAmount + Math.max(state.minRaise, Number(amount) || state.minRaise);
    if (action === "check") pay = 0;
    pay = Math.min(pay, player.chips);
    player.chips -= pay;
    player.bet += pay;
    player.totalBet += pay;
    state.pot += pay;
    player.acted = true;
    if (player.chips === 0) player.allIn = true;
    if (action === "raise" && pay > callAmount) {
      state.minRaise = pay - callAmount;
      state.players.forEach((item) => {
        if (item.id !== player.id && !item.folded && !item.allIn) item.acted = false;
      });
      state.log.push(player.name + " 加注到 " + player.bet);
    } else if (callAmount > 0) {
      state.log.push(player.name + " 跟注 " + pay);
    } else {
      state.log.push(player.name + " 过牌");
    }
  }

  if (activePlayers(state.players).length === 1) {
    awardSingleWinner(state);
    return state;
  }
  if (bettingComplete(state.players)) {
    revealNextStreet(state);
    return state;
  }
  state.currentIndex = nextIndex(state.players, state.currentIndex);
  return state;
}

module.exports = {
  STREET_LABEL,
  createPlayer,
  startHand,
  act,
  currentBet
};
