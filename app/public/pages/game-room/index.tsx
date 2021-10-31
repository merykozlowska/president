import { FunctionComponent } from "preact";
import { useRoute } from "preact-iso";
import { useReducer, useState } from "preact/hooks";
import { Session } from "./session";
import { Game } from "./game";
import Lobby from "./lobby";
import { canHandleMessage } from "./message";
import { GameState, initialState, reducer } from "./state";
import { Header } from "./components/header";
import { Ranking } from "./ranking";
import styles from "./style.module.css";

const GameRoom: FunctionComponent = () => {
  const {
    params: { id },
  } = useRoute();

  const [session, setSession] = useState<Session>();

  const updateSession = (sessionData: Partial<Session>) => {
    setSession((session) => ({ ...session, ...sessionData }));
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  const connect = (username: string) => {
    const ws = new WebSocket(`${import.meta.env.WS_URL}/game/${id}/websocket`);

    ws.addEventListener("open", () => {
      updateSession({ ws, username, id: username });
      ws.send(JSON.stringify({ type: "joined", payload: { name: username } }));
    });

    ws.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);
        if (!canHandleMessage(message)) {
          throw new Error("wtf is this");
        }
        console.log(message);
        dispatch(message);
      } catch (e) {
        console.error(e);
      }
    });
  };

  return (
    <>
      <Header />
      <main class={styles.game}>
        {state.gameState === GameState.waiting && (
          <Lobby players={state.players} connect={connect} session={session} />
        )}
        {state.gameState === GameState.started && (
          <Game
            players={state.players}
            hand={state.hand}
            pileTop={state.pileTop}
            playing={state.playing}
            hasToPlay3Club={state.hasToPlay3Club}
            session={session}
          />
        )}
        {state.gameState === GameState.finished && (
          <Ranking ranking={state.ranking} />
        )}
      </main>
    </>
  );
};

export default GameRoom;
