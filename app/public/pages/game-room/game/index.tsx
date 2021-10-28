import { FunctionComponent } from "preact";
import { useEffect, useState } from "preact/hooks";
import { Session } from "../session";
import { Card, ranksCompare } from "../cards";
import { Player } from "../state";
import styles from "./style.module.css";

interface Props {
  hand: Card[];
  pileTop: Card[];
  players: Player[];
  playing: string;
  hasToPlay3Club: boolean;
  session: Session;
}

const Game: FunctionComponent<Props> = ({
  hand,
  pileTop,
  players,
  playing,
  hasToPlay3Club,
  session,
}) => {
  const [selectedCards, setSelectedCards] = useState<Set<Card>>(new Set());

  const play = () => {
    session.ws.send(
      JSON.stringify({ type: "play", payload: { cards: [...selectedCards] } })
    );
  };

  const pass = () => {
    session.ws.send(JSON.stringify({ type: "pass" }));
  };

  useEffect(() => {
    setSelectedCards(new Set());
  }, [hand]);

  const toggleCardSelection = (card: Card): void => {
    const newSelected = new Set(selectedCards);

    if (selectedCards.has(card)) {
      newSelected.delete(card);
      setSelectedCards(newSelected);
      return;
    }

    newSelected.add(card);

    // deselect other ranks
    for (const selectedCard of newSelected) {
      if (selectedCard.rank !== card.rank) {
        newSelected.delete(selectedCard);
      }
    }

    // deselect oldest selected if too many
    if (pileTop.length && newSelected.size > pileTop.length) {
      const iterator = newSelected[Symbol.iterator]();
      const firstSelected = iterator.next().value;
      newSelected.delete(firstSelected);
    }

    setSelectedCards(newSelected);
  };

  const canBePlayed = (card: Card): boolean => {
    if (hasToPlay3Club) {
      return card.rank === "3" && card.suit === "♣";
    }
    if (!pileTop.length) {
      return true;
    }
    if (ranksCompare(card.rank, pileTop[0].rank) <= 0) {
      return false;
    }
    if (pileTop.length > 1) {
      const numberOfCardsOfSameRank = hand.filter(
        (handCard) => card.rank === handCard.rank
      ).length;
      if (numberOfCardsOfSameRank < pileTop.length) {
        return false;
      }
    }

    return true;
  };

  return (
    <>
      <section class={styles.players}>
        <ul>
          {players.map((player) => (
            <li key={player.id}>{`${player.id === playing ? "➡" : ""}${
              player.name
            } - ${player.hand.count} ${player.passed ? "- PASSED" : ""} ${
              player.rank ? player.rank : ""
            }`}</li>
          ))}
        </ul>
      </section>

      <section class={styles.table}>
        <ul class={styles.pile}>
          {pileTop.map((card) => (
            <li key={`${card.rank}${card.suit}`}>
              <span
                data-suit={card.suit}
                data-rank={card.rank}
                class={styles.card}
              >{`${card.suit}`}</span>
            </li>
          ))}
        </ul>
        <ul class={styles.hand}>
          {hand.map((card) => (
            <li key={`${card.rank}${card.suit}`}>
              <label>
                <input
                  class={styles.cardCheckbox}
                  type="checkbox"
                  checked={selectedCards.has(card)}
                  onClick={() => toggleCardSelection(card)}
                  disabled={!canBePlayed(card)}
                />{" "}
                <span
                  data-suit={card.suit}
                  data-rank={card.rank}
                  class={styles.card}
                >{`${card.suit}`}</span>
              </label>
            </li>
          ))}
        </ul>
        <div class={styles.buttonsContainer}>
          <button
            disabled={playing !== session.id || !selectedCards.size}
            onClick={play}
          >
            {playing === session.id ? "Play" : "Not your turn"}
          </button>
          <button
            disabled={playing !== session.id || hasToPlay3Club}
            onClick={pass}
          >
            {playing === session.id ? "Pass" : "Not your turn"}
          </button>
        </div>
      </section>
    </>
  );
};

export { Game };
