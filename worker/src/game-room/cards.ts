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
const suits = ["♣️", "♦️", "♥️", "♠️"] as const;

type Rank = typeof ranks[number];
type Suit = typeof suits[number];

export class Card {
  constructor(public rank: Rank, public suit: Suit) {}
}

const initDeck = (): Card[] =>
  ranks.flatMap((rank) => suits.map((suit) => new Card(rank, suit)));

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
