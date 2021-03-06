const ranks = [
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
  "2",
] as const;
const suits = ["♣", "♦", "♥", "♠"] as const;

type Rank = typeof ranks[number];
type Suit = typeof suits[number];

export interface Card {
  rank: Rank;
  suit: Suit;
}

export const ranksCompare = (a: Rank, b: Rank): number =>
  ranks.indexOf(a) - ranks.indexOf(b);
