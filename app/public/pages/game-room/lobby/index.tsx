import { FunctionComponent } from "preact";
import { useContext } from "preact/hooks";
import { SessionContext } from "../../../components/session-context";

interface Player {
  name: string;
  ready: boolean;
}

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
    </section>
  );
};

export default Lobby;
