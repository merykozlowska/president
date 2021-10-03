import { FunctionComponent } from "preact";
import { useContext } from "preact/hooks";
import { SessionContext } from "../../../components/session-context";
import { Player } from "../state";

interface Props {
  players: Player[];
}

const Lobby: FunctionComponent<Props> = ({ players = [] }) => {
  const { session, updateSession } = useContext(SessionContext);

  const updateUsername = (e) => {
    e.preventDefault();
    const username = e.target["username"].value;
    updateSession({ username });
    session.ws.send(
      JSON.stringify({ type: "joined", payload: { name: username } })
    );
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
          <li key={player.name}>
            {player.ready ? "✅" : "❌"} {player.name}
          </li>
        ))}
      </ul>
      <button onClick={sendReady}>Ready!</button>
    </section>
  );
};

export default Lobby;
