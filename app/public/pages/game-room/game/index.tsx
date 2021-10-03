import { FunctionComponent } from "preact";
import { Card } from "../cards";

interface Props {
  hand: Card[];
}

const Game: FunctionComponent<Props> = ({ hand }) => {
  return (
    <div>
      {hand.map((card) => (
        <div key={`${card.rank}${card.suit}`}>{`${card.rank}${card.suit}`}</div>
      ))}
    </div>
  );
};

export { Game };
