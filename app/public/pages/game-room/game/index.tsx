import { FunctionComponent } from "preact";
import { useContext, useState } from "preact/hooks";
import { SessionContext } from "../../../components/session-context";
import { Card } from "../cards";
import { Player } from "../state";

interface Props {
  hand: Card[];
  pileTop: Card[];
  players: Player[];
  playing: string;
}

const Game: FunctionComponent<Props> = ({
  hand,
  pileTop,
  players,
  playing,
}) => {
  const { session } = useContext(SessionContext);

  const [selectedCards, setSelectedCards] = useState<boolean[]>(
    new Array(hand.length).fill(false)
  );

  const play = () => {
    const cards = hand.filter((card, idx) => selectedCards[idx]);
    session.ws.send(JSON.stringify({ type: "play", payload: { cards } }));
  };

  const selectCard = (idx) => {
    const newSelected = [...selectedCards];
    newSelected[idx] = !newSelected[idx];
    setSelectedCards(newSelected);
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
