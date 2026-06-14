import type { Card, Rank, Suit } from "@/types/poker";

export const SUITS: Suit[] = ["S", "H", "D", "C"];
export const RANKS: Rank[] = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];

export const RANK_VALUE: Record<Rank, number> = RANKS.reduce((acc, rank, index) => {
  acc[rank] = index + 2;
  return acc;
}, {} as Record<Rank, number>);

export const SUIT_LABEL: Record<Suit, string> = {
  S: "♠",
  H: "♥",
  D: "♦",
  C: "♣"
};

export const RANK_LABEL: Record<Rank, string> = {
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  T: "10",
  J: "J",
  Q: "Q",
  K: "K",
  A: "A"
};

export function createDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => `${rank}${suit}` as Card));
}

export function shuffle(deck: Card[]): Card[] {
  const cards = deck.slice();
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function cardRank(card: Card): Rank {
  return card[0] as Rank;
}

export function cardSuit(card: Card): Suit {
  return card[1] as Suit;
}

export function formatCard(card: Card): string {
  return `${RANK_LABEL[cardRank(card)]}${SUIT_LABEL[cardSuit(card)]}`;
}

export function isRed(card: Card): boolean {
  const suit = cardSuit(card);
  return suit === "H" || suit === "D";
}
