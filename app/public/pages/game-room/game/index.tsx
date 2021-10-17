import { FunctionComponent } from "preact";
import { useContext, useEffect, useState } from "preact/hooks";
import { SessionContext } from "../../../components/session-context";
import { Card, ranksCompare } from "../cards";
import { Player } from "../state";

interface Props {
  hand: Card[];
  pileTop: Card[];
  players: Player[];
  playing: string;
  hasToPlay3Club: boolean;
}

const Game: FunctionComponent<Props> = ({
  hand,
  pileTop,
  players,
  playing,
  hasToPlay3Club,
}) => {
  const { session } = useContext(SessionContext);

  const [selectedCards, setSelectedCards] = useState<boolean[]>(
    new Array(hand.length).fill(false)
  );

  const play = () => {
    const cards = hand.filter((card, idx) => selectedCards[idx]);
    session.ws.send(JSON.stringify({ type: "play", payload: { cards } }));
    setSelectedCards([]);
  };

  const selectCard = (idx) => {
    const newSelected = [...selectedCards];
    newSelected[idx] = !newSelected[idx];
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
    <section>
      <div>
        players:{" "}
        <ul>
          {players.map((player) => (
            <li key={player.id}>{`${player.id === playing ? "➡" : ""}${
              player.name
            } - ${player.hand.count}`}</li>
          ))}
        </ul>
      </div>
      <div>
        top of the pile:{" "}
        {pileTop.map((card) => (
          <span
            key={`${card.rank}${card.suit}`}
          >{`${card.rank}${card.suit}`}</span>
        ))}
      </div>
      <div>
        hand:{" "}
        <ul>
          {hand.map((card, idx) => (
            <li key={`${card.rank}${card.suit}`}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedCards[idx]}
                  onClick={() => selectCard(idx)}
                  disabled={!canBePlayed(card)}
                />{" "}
                {`${card.rank}${card.suit}`}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <button disabled={playing !== session.id} onClick={play}>
        {playing === session.id ? "Play" : "Not your turn"}
      </button>
    </section>
  );
};

export { Game };
