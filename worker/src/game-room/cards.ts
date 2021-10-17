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

const initDeck = (): Card[] =>
  ranks.flatMap((rank) => suits.map((suit) => ({ rank, suit })));

export class Deck {
  constructor(public cards: Card[] = initDeck()) {}

  get numberOfCards(): number {
    return this.cards.length;
  }

  shuffle(): void {
    let m = this.numberOfCards;
    while (m) {
      const i = Math.floor(Math.random() * m--);
      const tmp = this.cards[m];
      this.cards[m] = this.cards[i];
      this.cards[i] = tmp;
    }
  }
}

export const cardsSortFn = (a: Card, b: Card): number => {
  if (a.rank === b.rank) {
    return suits.indexOf(a.suit) - suits.indexOf(b.suit);
  }
  return ranks.indexOf(a.rank) - ranks.indexOf(b.rank);
};
