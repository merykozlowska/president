const ranks = [
  "2",
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
] as const;
const suits = ["C", "D", "H", "S"] as const;

type Rank = typeof ranks[number];
type Suit = typeof suits[number];

export interface Card {
  rank: Rank;
  suit: Suit;
}
