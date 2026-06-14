import { strict as assert } from "node:assert";
import { evaluateSeven, findWinners } from "@/lib/poker/evaluate";
import type { Card } from "@/types/poker";

function cards(values: Card[]) {
  return values;
}

assert.equal(evaluateSeven(cards(["AS", "KS", "QS", "JS", "TS", "2D", "3C"])).name, "皇家同花顺");
assert.equal(evaluateSeven(cards(["9S", "9H", "9D", "9C", "2S", "3D", "4C"])).name, "四条");
assert.equal(evaluateSeven(cards(["AS", "AH", "AD", "KC", "KH", "2D", "3C"])).name, "葫芦");
assert.equal(evaluateSeven(cards(["AS", "TS", "7S", "4S", "2S", "KD", "3C"])).name, "同花");
assert.equal(evaluateSeven(cards(["AS", "2H", "3D", "4C", "5S", "KD", "QC"])).name, "顺子");

const winners = findWinners(
  [
    { id: "a", holeCards: cards(["AS", "AH"]) },
    { id: "b", holeCards: cards(["KS", "KH"]) }
  ],
  cards(["2S", "3H", "4D", "8C", "9S"])
);

assert.equal(winners[0].id, "a");
console.log("poker tests passed");
