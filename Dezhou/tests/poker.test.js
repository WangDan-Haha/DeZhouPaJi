const assert = require("assert");
const poker = require("../utils/poker");

function name(cards) {
  return poker.evaluateSeven(cards).name;
}

assert.strictEqual(name(["AS", "KS", "QS", "JS", "TS", "2D", "3C"]), "同花顺");
assert.strictEqual(name(["9S", "9H", "9D", "9C", "2S", "3D", "4C"]), "四条");
assert.strictEqual(name(["AS", "AH", "AD", "KC", "KH", "2D", "3C"]), "葫芦");
assert.strictEqual(name(["AS", "TS", "7S", "4S", "2S", "KD", "3C"]), "同花");
assert.strictEqual(name(["AS", "2H", "3D", "4C", "5S", "KD", "QC"]), "顺子");

const winners = poker.bestPlayers(
  [
    { id: "a", name: "A", folded: false, hand: ["AS", "AH"] },
    { id: "b", name: "B", folded: false, hand: ["KS", "KH"] }
  ],
  ["2S", "3H", "4D", "8C", "9S"]
);
assert.strictEqual(winners[0].name, "A");

console.log("poker tests passed");
