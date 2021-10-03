import { FunctionComponent } from "preact";
import { useContext, useState } from "preact/hooks";
import { SessionContext } from "../../../components/session-context";
import { Card } from "../cards";

interface Props {
  hand: Card[];
  pileTop: Card[];
}

const Game: FunctionComponent<Props> = ({ hand, pileTop }) => {
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
        top of the pile:{" "}
        {pileTop.map((card) => (
          <span
            key={`${card.rank}${card.suit}`}
          >{`${card.rank}${card.suit}`}</span>
        ))}
      </div>
      <div>
        hand:{" "}
        {hand.map((card, idx) => (
          <label key={`${card.rank}${card.suit}`}>
            <input
              type="checkbox"
              checked={selectedCards[idx]}
              onClick={() => selectCard(idx)}
            />{" "}
            {`${card.rank}${card.suit}`}
          </label>
        ))}
      </div>
      <button onClick={play}>Play</button>
    </section>
  );
};

export { Game };
