const game = require("../../utils/game");
const poker = require("../../utils/poker");

const SEAT_POINTS = {
  2: [
    { left: 50, top: 83 },
    { left: 50, top: 18 }
  ],
  3: [
    { left: 50, top: 83 },
    { left: 21, top: 25 },
    { left: 79, top: 25 }
  ],
  4: [
    { left: 50, top: 83 },
    { left: 17, top: 52 },
    { left: 50, top: 18 },
    { left: 83, top: 52 }
  ],
  5: [
    { left: 50, top: 83 },
    { left: 18, top: 58 },
    { left: 28, top: 21 },
    { left: 72, top: 21 },
    { left: 82, top: 58 }
  ],
  6: [
    { left: 50, top: 83 },
    { left: 18, top: 63 },
    { left: 20, top: 31 },
    { left: 50, top: 18 },
    { left: 80, top: 31 },
    { left: 82, top: 63 }
  ],
  7: [
    { left: 50, top: 83 },
    { left: 19, top: 67 },
    { left: 17, top: 38 },
    { left: 37, top: 19 },
    { left: 63, top: 19 },
    { left: 83, top: 38 },
    { left: 81, top: 67 }
  ],
  8: [
    { left: 50, top: 83 },
    { left: 24, top: 72 },
    { left: 17, top: 51 },
    { left: 24, top: 25 },
    { left: 50, top: 18 },
    { left: 76, top: 25 },
    { left: 83, top: 51 },
    { left: 76, top: 72 }
  ]
};

const AVATAR_COLORS = ["#22c55e", "#3b82f6", "#f97316", "#a855f7", "#ef4444", "#14b8a6", "#eab308", "#ec4899"];

function cardView(card) {
  const rank = card[0] === "T" ? "10" : card[0];
  const suit = card[1];
  const suitText = { S: "♠", H: "♥", D: "♦", C: "♣" }[suit];
  return {
    rank,
    suit: suitText,
    text: poker.formatCard(card),
    red: suit === "H" || suit === "D"
  };
}

function addRoomProps(player, index, hostId) {
  return Object.assign({}, player, {
    isHost: player.id === hostId,
    ready: player.id === hostId ? true : !!player.ready,
    avatar: (player.name || "玩").slice(0, 1),
    avatarColor: AVATAR_COLORS[index % AVATAR_COLORS.length]
  });
}

Page({
  data: {
    players: [],
    hostId: "",
    state: null,
    newPlayerName: "",
    buyIn: 1000,
    smallBlind: 10,
    bigBlind: 20,
    raiseAmount: 20,
    dealerIndex: 0,
    handRunning: false,
    playerViews: [],
    communityCards: [],
    emptyBoard: [1, 2, 3, 4, 5],
    currentPlayer: {},
    callAmount: 0,
    winnersText: "",
    streetLabel: "等待准备",
    logs: [],
    allReady: false,
    canStart: false
  },

  onLoad() {
    const me = game.createPlayer("我", 1000);
    const friend = game.createPlayer("朋友", 1000);
    const hostId = me.id;
    this.setData({
      hostId,
      players: [
        addRoomProps(me, 0, hostId),
        addRoomProps(Object.assign(friend, { ready: false }), 1, hostId)
      ]
    });
    this.refreshViews();
  },

  onNameInput(event) {
    this.setData({ newPlayerName: event.detail.value });
  },

  onBuyInInput(event) {
    this.setData({ buyIn: Number(event.detail.value) || 1000 });
  },

  onSmallBlindInput(event) {
    this.setData({ smallBlind: Number(event.detail.value) || 10 });
  },

  onBigBlindInput(event) {
    const bigBlind = Number(event.detail.value) || 20;
    this.setData({ bigBlind, raiseAmount: bigBlind });
  },

  onRaiseInput(event) {
    this.setData({ raiseAmount: Number(event.detail.value) || this.data.bigBlind });
  },

  addPlayer() {
    if (this.data.handRunning || this.data.players.length >= 8) return;
    const name = this.data.newPlayerName.trim() || "玩家" + (this.data.players.length + 1);
    const player = Object.assign(game.createPlayer(name, this.data.buyIn), { ready: false });
    const players = this.data.players.concat([addRoomProps(player, this.data.players.length, this.data.hostId)]);
    this.setData({ players, newPlayerName: "" });
    this.refreshViews();
  },

  toggleReady(event) {
    if (this.data.handRunning) return;
    const id = event.currentTarget.dataset.id;
    const players = this.data.players.map((player, index) => {
      if (player.id !== id || player.isHost) return addRoomProps(player, index, this.data.hostId);
      return addRoomProps(Object.assign({}, player, { ready: !player.ready }), index, this.data.hostId);
    });
    this.setData({ players });
    this.refreshViews();
  },

  readyAllDemo() {
    if (this.data.handRunning) return;
    const players = this.data.players.map((player, index) => addRoomProps(Object.assign({}, player, { ready: true }), index, this.data.hostId));
    this.setData({ players });
    this.refreshViews();
  },

  startHand() {
    if (!this.data.canStart) return;
    const active = this.data.players.filter((player) => player.chips > 0);
    const dealerIndex = this.data.dealerIndex % active.length;
    const state = game.startHand(active, dealerIndex, this.data.smallBlind, this.data.bigBlind);
    const players = state.players.map((player, index) => addRoomProps(Object.assign(player, { ready: false }), index, this.data.hostId));
    this.setData({
      state,
      players,
      dealerIndex,
      handRunning: true,
      winnersText: ""
    });
    this.refreshViews();
  },

  nextHand() {
    const players = this.data.players.map((player, index) => addRoomProps(Object.assign({}, player, {
      hand: [],
      bet: 0,
      totalBet: 0,
      folded: false,
      allIn: false,
      acted: false,
      ready: player.isHost
    }), index, this.data.hostId));
    const nextDealer = (this.data.dealerIndex + 1) % players.length;
    this.setData({
      players,
      state: null,
      dealerIndex: nextDealer,
      handRunning: false,
      winnersText: "",
      streetLabel: "等待准备"
    });
    this.refreshViews();
  },

  resetTable() {
    const me = game.createPlayer("我", this.data.buyIn);
    const friend = game.createPlayer("朋友", this.data.buyIn);
    const hostId = me.id;
    this.setData({
      hostId,
      players: [
        addRoomProps(me, 0, hostId),
        addRoomProps(Object.assign(friend, { ready: false }), 1, hostId)
      ],
      state: null,
      dealerIndex: 0,
      handRunning: false,
      winnersText: "",
      logs: []
    });
    this.refreshViews();
  },

  doFold() {
    this.applyAction("fold");
  },

  doCheckOrCall() {
    this.applyAction(this.data.callAmount > 0 ? "call" : "check");
  },

  doRaise() {
    this.applyAction("raise", this.data.raiseAmount);
  },

  applyAction(action, amount) {
    const state = this.data.state;
    if (!state || state.street === "showdown") return;
    game.act(state, action, amount);
    const players = state.players.map((player, index) => {
      const previous = this.data.players.find((item) => item.id === player.id) || {};
      return addRoomProps(Object.assign(player, {
        ready: previous.ready,
        avatarColor: previous.avatarColor
      }), index, this.data.hostId);
    });
    this.setData({
      state,
      players,
      handRunning: state.street !== "showdown"
    });
    this.refreshViews();
  },

  refreshViews() {
    const state = this.data.state;
    const sourcePlayers = this.data.players;
    const currentBet = state ? game.currentBet(state.players) : 0;
    const currentPlayer = state && state.players[state.currentIndex] ? state.players[state.currentIndex] : {};
    const callAmount = state && currentPlayer.bet !== undefined ? Math.max(0, currentBet - currentPlayer.bet) : 0;
    const community = state ? state.community : [];
    const winners = state && state.winners.length ? state.winners : [];
    const seatPoints = SEAT_POINTS[Math.max(2, sourcePlayers.length)] || SEAT_POINTS[8];
    const playerViews = sourcePlayers.map((player, index) => {
      const point = seatPoints[index] || seatPoints[0];
      const cards = player.hand && player.hand.length ? player.hand.map(cardView) : [];
      return {
        id: player.id,
        name: player.name,
        avatar: player.avatar || (player.name || "玩").slice(0, 1),
        avatarColor: player.avatarColor || AVATAR_COLORS[index % AVATAR_COLORS.length],
        chips: player.chips,
        bet: player.bet,
        folded: player.folded,
        ready: player.ready,
        isHost: player.isHost,
        active: state && index === state.currentIndex && state.street !== "showdown",
        cards,
        emptyCards: cards.length ? [] : [1, 2],
        seatStyle: "left:" + point.left + "%;top:" + point.top + "%;"
      };
    });
    const allReady = sourcePlayers.length >= 2 && sourcePlayers.every((player) => player.isHost || player.ready);
    const canStart = allReady && !this.data.handRunning && !state;
    const winnersText = winners.length
      ? winners.map((winner) => winner.name + " 赢得 " + winner.amount + "（" + winner.result.name + "）").join("；")
      : "";
    this.setData({
      playerViews,
      communityCards: community.map(cardView),
      emptyBoard: Array.from({ length: Math.max(0, 5 - community.length) }, (_, index) => index),
      currentPlayer,
      callAmount,
      winnersText,
      streetLabel: state ? game.STREET_LABEL[state.street] : (allReady ? "可以开局" : "等待准备"),
      logs: state ? state.log.slice(-6).reverse() : this.data.logs,
      allReady,
      canStart
    });
  }
});
