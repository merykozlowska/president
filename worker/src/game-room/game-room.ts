import {
  IncomingMessage,
  IncomingMessageType,
  OutgoingMessage,
  OutgoingMessageType,
  StartGameOutMessage,
} from "./message";
import { Card, Deck } from "./cards";

interface Session {
  ws: WebSocket;
  username?: string;
  ready: boolean;
  hand?: Card[];
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
    const session = { ws, ready: false };
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
                .filter((s) => Boolean(s.username))
                .map((s) => ({
                  name: s.username,
                  ready: s.ready,
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
        session.ready = Boolean(message.payload.ready);
        this.broadcast({
          type: OutgoingMessageType.ready,
          payload: {
            name: session.username,
            ready: true,
          },
        });
        if (this.sessions.every((s) => s.ready)) {
          this.startGame();
        }
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

  startGame(): void {
    const deck = new Deck();
    deck.shuffle();
    const numberOfPlayers = this.sessions.length;
    const cardsPerPlayer = Math.ceil(deck.numberOfCards / numberOfPlayers);
    this.sessions = this.sessions.map((session, idx) => {
      const oneLess =
        idx >= numberOfPlayers - (deck.numberOfCards % numberOfPlayers);
      const cards = deck.cards.slice(
        idx * cardsPerPlayer,
        (idx + 1) * cardsPerPlayer - +oneLess
      );
      return { ...session, hand: cards };
    });
    const players = this.sessions.map((session) => ({
      name: session.username!,
      hand: { count: session.hand!.length },
    }));
    this.sessions.forEach((session) => {
      const message: StartGameOutMessage = {
        type: OutgoingMessageType.startGame,
        payload: {
          players,
          hand: session.hand!,
        },
      };
      const stringifiedMessage = JSON.stringify(message);
      session.ws.send(stringifiedMessage);
    });
  }
}
