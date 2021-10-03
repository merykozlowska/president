import {
  IncomingMessage,
  IncomingMessageType,
  OutgoingMessage,
  OutgoingMessageType,
} from "./message";

interface Session {
  ws: WebSocket;
  username?: string;
}

const canHandleMessage = (message: unknown): message is IncomingMessage =>
  IncomingMessageType[(message as IncomingMessage).type] !== undefined;

export class GameRoom {
  state: DurableObjectState;
  sessions: Session[] = [];

  constructor(state: DurableObjectState) {
    this.state = state;
    // this.env = env
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    switch (url.pathname) {
      case "/websocket": {
        if (request.headers.get("Upgrade") !== "websocket") {
          return new Response("expected websocket", { status: 400 });
        }

        const { 0: clientWs, 1: serverWs } = new WebSocketPair();

        this.handleSession(serverWs);

        return new Response(null, { status: 101, webSocket: clientWs });
      }

      default:
        return new Response("Not found", { status: 404 });
    }
  }

  handleSession(ws: WebSocket): void {
    ws.accept();
    const session = { ws };
    this.sessions.push(session);
    ws.addEventListener("message", async (msg) => {
      console.log("GOT MESSAGE 🎉", msg);
      try {
        const data = JSON.parse(msg.data as string); // fixme
        if (!canHandleMessage(data)) {
          throw new Error("wtf is this");
        }
        this.handleMessage(data, session);
      } catch (e) {
        console.error(`Error handling message ${msg.data}`);
      }
    });
  }

  handleMessage(message: IncomingMessage, session: Session): void {
    switch (message.type) {
      case IncomingMessageType.joined:
        const username = `${message.payload.name}`;
        if (session.username) {
          console.log(
            `${session.username}: username already set, ignoring joined message with name ${username}`
          );
        }
        session.ws.send(
          JSON.stringify({
            type: OutgoingMessageType.init,
            payload: {
              players: this.sessions
                .filter((session) => Boolean(session.username))
                .map((session) => ({
                  name: session.username,
                })),
            },
          })
        );
        session.username = username;
        this.broadcast({
          type: OutgoingMessageType.joined,
          payload: { name: username },
        });
        break;
      case IncomingMessageType.ready:
        if (!session.username) {
          break;
        }
        this.broadcast({
          type: OutgoingMessageType.ready,
          payload: {
            name: session.username,
            ready: true,
          },
        });
        break;
    }
  }

  broadcast(message: OutgoingMessage): void {
    const stringifiedMessage = JSON.stringify(message);

    this.sessions.forEach((session) => {
      if (!session.username) {
        return;
      }
      console.log(`sending to ${session.username} ${stringifiedMessage}`);
      session.ws.send(stringifiedMessage);
    });
  }
}
