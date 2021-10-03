import { FunctionComponent } from "preact";
import { useRoute } from "preact-iso";
import Lobby from "../lobby";
import { useContext, useEffect } from "preact/hooks";
import { SessionContext } from "../../components/session-context";

const GameRoom: FunctionComponent = () => {
  const {
    params: { id },
  } = useRoute();

  const { session, updateSession } = useContext(SessionContext);

  const connect = () => {
    const ws = new WebSocket(`${import.meta.env.WS_URL}/game/${id}/websocket`);

    ws.addEventListener("open", () => {
      updateSession({ ws });

      ws.send(JSON.stringify({ hello: "world" }));
    });
  };

  useEffect(() => {
    connect();
  }, []);

  return (
    <>
      <div>{session?.username}</div>
      <Lobby />
    </>
  );
};

export default GameRoom;
