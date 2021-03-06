import { FunctionComponent } from "preact";
import { useRef, useState } from "preact/hooks";
import { Session } from "../session";
import { LobbyPlayer } from "../state";
import styles from "./style.module.css";

interface Props {
  players: LobbyPlayer[];
  connect: (username: string) => void;
  session: Session;
}

const Lobby: FunctionComponent<Props> = ({
  players = [],
  connect,
  session,
}) => {
  const [ready, setReady] = useState<boolean>(false);

  const updateUsername = (e) => {
    e.preventDefault();
    const username = e.target["username"].value;
    if (!username) {
      return;
    }
    connect(username);
  };

  const sendReady = () => {
    session.ws.send(
      JSON.stringify({ type: "ready", payload: { ready: true } })
    );
    setReady(true);
  };

  const inputRef = useRef<HTMLInputElement>();

  const copyLink = async () => {
    inputRef.current.focus();
    inputRef.current.select();
    await navigator.clipboard.writeText(window.location.href);
  };

  return !session?.username ? (
    <section>
      <form onSubmit={updateUsername} class={styles.form}>
        <label htmlFor="username">Username</label>
        <input id="username" type="text" />
        <button>Join</button>
      </form>
    </section>
  ) : (
    <section className={styles.lobby}>
      <ul class={styles.players}>
        {players.map((player) => (
          <li
            key={player.id}
            class={`${styles.player} ${player.ready ? styles.ready : ""}`}
          >
            {player.name}
          </li>
        ))}
      </ul>
      {!ready && (
        <div class={styles.readyButtonContainer}>
          <button onClick={sendReady} class={styles.readyButton}>
            Ready!
          </button>
        </div>
      )}
      <div class={styles.linkWrapper}>
        <label htmlFor="link-input">
          Send this link to your friends to join
        </label>
        <input
          id="link-input"
          value={window.location.href}
          readOnly
          ref={inputRef}
        />
        <button onClick={copyLink}>Copy</button>
      </div>
    </section>
  );
};

export default Lobby;
