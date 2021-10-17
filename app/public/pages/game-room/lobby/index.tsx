import { FunctionComponent } from "preact";
import { useContext } from "preact/hooks";
import { SessionContext } from "../../../components/session-context";
import { LobbyPlayer } from "../state";

interface Props {
  players: LobbyPlayer[];
  connect: (username: string) => void;
}

const Lobby: FunctionComponent<Props> = ({ players = [], connect }) => {
  const { session } = useContext(SessionContext);

  const updateUsername = (e) => {
    e.preventDefault();
    const username = e.target["username"].value;
    connect(username);
  };

  const sendReady = () => {
    session.ws.send(
      JSON.stringify({ type: "ready", payload: { ready: true } })
    );
  };

  return (
    <section>
      {!session?.username && (
        <form onSubmit={updateUsername}>
          <label htmlFor="username">Username</label>
          <input id="username" />
          <button>✅</button>
        </form>
      )}
      <ul>
        {players.map((player) => (
          <li key={player.id}>
            {player.ready ? "✅" : "❌"} {player.name}
          </li>
        ))}
      </ul>
      <button onClick={sendReady}>Ready!</button>
    </section>
  );
};

export default Lobby;
