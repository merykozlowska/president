import { FunctionComponent } from "preact";
import { PlayerRank } from "../state";
import { playerRankDisplayName, playerRankSymbol } from "../player-rank";
import styles from "./style.module.css";

interface Props {
  ranking: { id: string; name: string; rank: PlayerRank }[];
}

export const Ranking: FunctionComponent<Props> = ({ ranking }) => {
  return (
    <section className={styles.ranking}>
      <ul>
        {ranking.map((player) => (
          <li key={player.id} className={styles.player}>
            <span class={styles.symbol}>{playerRankSymbol[player.rank]}</span>
            <span class={styles.name}>{player.name}</span>
            <span class={styles.rank}>
              {playerRankDisplayName[player.rank]}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
};
