import {
  GameStateForPlayer,
  IncomingMessage,
  IncomingMessageType,
  OutgoingMessage,
  OutgoingMessageType,
  StartGameOutMessage,
  TurnPlayedOutMessage,
} from "./message";
import { Card, Deck } from "./cards";

interface Session {
  ws: WebSocket;
  id: string;
}

interface CommonPlayer {
  id: string;
  username: string;
  session: Session;
}

interface LobbyPlayer extends CommonPlayer {
  ready: boolean;
}

interface GamePlayer extends CommonPlayer {
  hand: Card[];
}

interface GameState {
  playing: string;
  pileTop: Card[];
}

enum State {
  lobby,
  playing,
}

interface LobbyRoomState {
  state: State.lobby;
  players: LobbyPlayer[];
}

interface PlayingRoomState {
  state: State.playing;
  players: GamePlayer[];
  gameState: GameState;
}

type RoomState = LobbyRoomState | PlayingRoomState;

const canHandleMessage = (message: unknown): message is IncomingMessage =>
  IncomingMessageType[(message as IncomingMessage).type] !== undefined;

export class GameRoom {
  state: DurableObjectState;
  roomState: RoomState = {
    state: State.lobby,
    players: [],
  };

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
    const session: Session = { ws, id: "" };
    ws.addEventListener("message", async (msg) => {
      console.log("GOT MESSAGE 🎉", msg);
      try {
        const data = JSON.parse(msg.data as string); // fixme
        if (!canHandleMessage(data)) {
          throw new Error("wtf is this");
        }
        this.handleMessage(data, session);
      } catch (e) {
        console.error(`Error handling message ${msg.data}`, e);
      }
    });
  }

  handleMessage(message: IncomingMessage, session: Session): void {
    switch (message.type) {
      case IncomingMessageType.joined: {
        const username = `${message.payload.name}`;

        if (this.roomState.state !== State.lobby) {
          console.log(`${username} TRYING TO JOIN BUT NOT LOBBY`);
          // todo reply with error
          break;
        }

        session.ws.send(
          JSON.stringify({
            type: OutgoingMessageType.init,
            payload: {
              players: this.roomState.players.map((player) => ({
                name: player.username,
                ready: player.ready,
              })),
            },
          })
        );

        const player = {
          id: username,
          username,
          ready: false,
          session,
        };
        session.id = player.id;
        this.roomState.players.push(player);

        this.broadcast({
          type: OutgoingMessageType.joined,
          payload: { id: player.id, name: player.username },
        });
        break;
      }

      case IncomingMessageType.ready: {
        if (this.roomState.state !== State.lobby) {
          console.log(`${session.id} ready but not lobby`);
          // todo reply with error
          break;
        }

        const player = this.roomState.players.find(
          ({ id }) => id === session.id
        );
        if (!player) {
          console.log(`no player found for id: ${session.id}`);
          break;
        }
        player.ready = true;
        this.broadcast({
          type: OutgoingMessageType.ready,
          payload: {
            id: player.id,
            name: player.username,
            ready: true,
          },
        });
        if (this.roomState.players.every((p) => p.ready)) {
          this.startGame();
        }
        break;
      }

      case IncomingMessageType.play: {
        if (this.roomState.state !== State.playing) {
          console.log(`${session.id} played but not playing`);
          // todo reply with error
          break;
        }

        const played = message.payload.cards;
        const player = this.roomState.players.find(
          ({ id }) => id === session.id
        );
        if (!player) {
          break;
        }

        player.hand = player.hand.filter(
          (card) =>
            !played.some(
              (playedCard) =>
                card.suit === playedCard.suit && card.rank === playedCard.rank
            )
        );
        this.roomState.gameState.pileTop = played;
        this.broadcastTurnPlayed();
        break;
      }
    }
  }

  broadcast(message: OutgoingMessage): void {
    const stringifiedMessage = JSON.stringify(message);

    const disconnected: CommonPlayer[] = [];
    this.roomState.players.forEach((player) => {
      console.log(`sending to ${player.session.id} ${stringifiedMessage}`);
      try {
        player.session.ws.send(stringifiedMessage);
      } catch (e) {
        console.log(e);
        disconnected.push(player);
      }
    });
    this.handleDisconnectedPlayers(disconnected);
  }

  handleDisconnectedPlayers(disconnectedPlayers: CommonPlayer[]): void {
    if (!disconnectedPlayers.length) {
      return;
    }
    // https://github.com/microsoft/TypeScript/issues/44373
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.roomState.players = (this.roomState.players as any[]).filter(
      (player: CommonPlayer) => !disconnectedPlayers.includes(player)
    );
    disconnectedPlayers.forEach((player) => {
      this.broadcast({
        type: OutgoingMessageType.disconnected,
        payload: {
          id: player.id,
          name: player.username,
        },
      });
    });
  }

  getGameStateFor(playerId: string): GameStateForPlayer | null {
    if (this.roomState.state !== State.playing) {
      return null;
    }
    const player = this.roomState.players.find(
      (player) => player.id === playerId
    );
    if (!player) {
      return null;
    }
    return {
      playing: this.roomState.gameState.playing,
      hand: player.hand,
      pileTop: this.roomState.gameState.pileTop,
      players: this.roomState.players.map((player) => ({
        id: player.id,
        name: player.username,
        hand: { count: player.hand.length },
      })),
    };
  }

  broadcastTurnPlayed(): void {
    const disconnected: CommonPlayer[] = [];
    this.roomState.players.forEach((player) => {
      const gameStateForPlayer = this.getGameStateFor(player.id);
      if (gameStateForPlayer) {
        const message: TurnPlayedOutMessage = {
          type: OutgoingMessageType.turnPlayed,
          payload: { gameState: gameStateForPlayer },
        };
        try {
          player.session.ws.send(JSON.stringify(message));
        } catch (e) {
          console.log(e);
          disconnected.push(player);
        }
      }
    });
    this.handleDisconnectedPlayers(disconnected);
  }

  startGame(): void {
    const deck = new Deck();
    deck.shuffle();

    const numberOfPlayers = this.roomState.players.length;
    const cardsPerPlayer = Math.ceil(deck.numberOfCards / numberOfPlayers);
    const players: GamePlayer[] = this.roomState.players.map((player, idx) => {
      const oneLess =
        idx >= numberOfPlayers - (deck.numberOfCards % numberOfPlayers);
      const cards = deck.cards.slice(
        idx * cardsPerPlayer,
        (idx + 1) * cardsPerPlayer - +oneLess
      );
      return {
        id: player.username,
        username: player.username,
        hand: cards,
        session: player.session,
      };
    });

    this.roomState = {
      state: State.playing,
      players,
      gameState: {
        playing: "",
        pileTop: [],
      },
    };

    const disconnected: CommonPlayer[] = [];
    this.roomState.players.forEach((player) => {
      const gameStateForPlayer = this.getGameStateFor(player.id);
      if (gameStateForPlayer) {
        const message: StartGameOutMessage = {
          type: OutgoingMessageType.startGame,
          payload: { gameState: gameStateForPlayer },
        };
        try {
          player.session.ws.send(JSON.stringify(message));
        } catch (e) {
          console.log(e);
          disconnected.push(player);
        }
      }
    });
    this.handleDisconnectedPlayers(disconnected);
  }
}
