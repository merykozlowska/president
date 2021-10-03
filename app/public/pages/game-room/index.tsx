import { FunctionComponent } from "preact";
import { useRoute } from "preact-iso";
import { useContext, useEffect, useState } from "preact/hooks";
import { SessionContext } from "../../components/session-context";
import { Game } from "./game";
import Lobby from "./lobby";
import { canHandleMessage, IncomingMessageType } from "./message";

enum GameState {
  waiting,
  started,
}

interface Player {
  name: string;
  ready: boolean;
}

const GameRoom: FunctionComponent = () => {
  const {
    params: { id },
  } = useRoute();

  const { updateSession } = useContext(SessionContext);
  const [gameState, setGameState] = useState<GameState>(GameState.waiting);
  const [players, setPlayers] = useState<Player[]>([]);

  const connect = () => {
    const ws = new WebSocket(`${import.meta.env.WS_URL}/game/${id}/websocket`);

    ws.addEventListener("open", () => {
      updateSession({ ws });

      // ws.send(JSON.stringify({ hello: "world" }));
    });

    ws.addEventListener("message", (event) => {
      // ws.send(JSON.stringify({ hello: "world" }));
      try {
        const message = JSON.parse(event.data);
        if (!canHandleMessage(message)) {
          throw new Error("wtf is this");
        }
        console.log(message);
        switch (message.type) {
          case IncomingMessageType.init: {
            setPlayers(
              message.payload.players.map((player) => ({
                name: player.name,
                ready: false,
              }))
            );
            break;
          }
          case IncomingMessageType.joined: {
            const player = { name: message.payload.name, ready: false };
            setPlayers((players) => [...players, player]);
            break;
          }
        }
      } catch (e) {
        console.error(e);
      }
    });
  };

  useEffect(() => {
    connect();
  }, []);

  return (
    <>
      {gameState === GameState.waiting && <Lobby players={players} />}
      {gameState === GameState.started && <Game />}
    </>
  );
};

export default GameRoom;
