import { FunctionComponent } from "preact";
import { useRoute } from "preact-iso";
import { useContext, useReducer } from "preact/hooks";
import { SessionContext } from "../../components/session-context";
import { Game } from "./game";
import Lobby from "./lobby";
import { canHandleMessage } from "./message";
import { GameState, initialState, reducer } from "./state";

const GameRoom: FunctionComponent = () => {
  const {
    params: { id },
  } = useRoute();

  const { updateSession } = useContext(SessionContext);

  const [state, dispatch] = useReducer(reducer, initialState);

  const connect = (username: string) => {
    const ws = new WebSocket(`${import.meta.env.WS_URL}/game/${id}/websocket`);

    ws.addEventListener("open", () => {
      updateSession({ ws, username });
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
      {state.gameState === GameState.waiting && (
        <Lobby players={state.players} connect={connect} />
      )}
      {state.gameState === GameState.started && (
        <Game
          players={state.players}
          hand={state.hand}
          pileTop={state.pileTop}
          playing={state.playing}
        />
      )}
    </>
  );
};

export default GameRoom;
