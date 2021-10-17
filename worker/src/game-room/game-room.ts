import {
  GameStateForPlayer,
  IncomingMessage,
  IncomingMessageType,
  OutgoingMessage,
  OutgoingMessageType,
  StartGameOutMessage,
  TurnPlayedOutMessage,
} from "./message";
import { Card, cardsCompare, Deck, ranksCompare } from "./cards";

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
  passed: boolean;
}

interface GameState {
  playing: string;
  pileTop: Card[];
  hasToPlay3Club: boolean;
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
        if (player.id !== this.roomState.gameState.playing) {
          // todo reply with error
          break;
        }
        if (!this.validatePlayed(played, player)) {
          // todo reply with error
          break;
        }

        this.roomState.gameState.hasToPlay3Club = false;
        player.hand = player.hand.filter(
          (card) =>
            !played.some(
              (playedCard) =>
                card.suit === playedCard.suit && card.rank === playedCard.rank
            )
        );
        if (played.every((card) => card.rank === "2")) {
          this.startNewRound();
        } else {
          this.roomState.gameState.pileTop = played;
          this.roomState.gameState.playing = this.nextPlayer(player).id;
        }
        this.broadcastTurnPlayed({ player });
        break;
      }

      case IncomingMessageType.pass: {
        if (this.roomState.state !== State.playing) {
          console.log(`${session.id} passed but not playing`);
          // todo reply with error
          break;
        }

        const player = this.roomState.players.find(
          ({ id }) => id === session.id
        );
        if (!player) {
          break;
        }
        if (player.id !== this.roomState.gameState.playing) {
          // todo reply with error
          break;
        }
        if (this.roomState.gameState.hasToPlay3Club) {
          // todo reply with error
          break;
        }

        this.roomState.gameState.playing = this.nextPlayer(player).id;
        player.passed = true;

        if (this.roomState.players.every((p) => p.passed)) {
          this.startNewRound();
        }

        this.broadcastTurnPlayed({ player });
        break;
      }
    }
  }

  startNewRound(): void {
    if (this.roomState.state !== State.playing) {
      throw new Error("Cannot start new round when not playing");
    }
    this.roomState.gameState.pileTop = [];
    this.roomState.players.forEach((player) => {
      player.passed = false;
    });
  }

  nextPlayer(currentPlayer: GamePlayer): GamePlayer {
    if (this.roomState.state !== State.playing) {
      throw new Error("Cannot get next player when not playing");
    }
    const playingPlayers = this.roomState.players.filter(
      (player) => !player.passed
    );
    return playingPlayers[
      (playingPlayers.indexOf(currentPlayer) + 1) % playingPlayers.length
    ];
  }

  validatePlayed(played: Card[], player: GamePlayer): boolean {
    if (this.roomState.state !== State.playing) {
      return false;
    }

    if (
      !played.every((card) =>
        player.hand.some(
          (playedCard) =>
            card.suit === playedCard.suit && card.rank === playedCard.rank
        )
      )
    ) {
      return false;
    }

    if (!played.length) {
      return false;
    }
    if (this.roomState.gameState.hasToPlay3Club) {
      return played.every((card) => card.rank === "3" && card.suit === "♣");
    }
    if (!played.every((card) => card.rank === played[0].rank)) {
      return false;
    }

    const pileTop = this.roomState.gameState.pileTop;
    if (!pileTop.length) {
      return true;
    }
    if (played.length !== pileTop.length) {
      return false;
    }
    const playedRank = played[0].rank;
    const pileTopRank = pileTop[0].rank;
    if (ranksCompare(playedRank, pileTopRank) <= 0) {
      return false;
    }

    return true;
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
      hasToPlay3Club: this.roomState.gameState.hasToPlay3Club,
      players: this.roomState.players.map((player) => ({
        id: player.id,
        name: player.username,
        hand: { count: player.hand.length },
        passed: player.passed,
      })),
    };
  }

  broadcastTurnPlayed(played: { player: GamePlayer }): void {
    const disconnected: CommonPlayer[] = [];
    this.roomState.players.forEach((player) => {
      const gameStateForPlayer = this.getGameStateFor(player.id);
      if (gameStateForPlayer) {
        const message: TurnPlayedOutMessage = {
          type: OutgoingMessageType.turnPlayed,
          payload: {
            gameState: gameStateForPlayer,
            played: {
              id: played.player.id,
            },
          },
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
        hand: cards.sort(cardsCompare),
        session: player.session,
        passed: false,
      };
    });

    const playing = players.find((player) =>
      player.hand.some((card) => card.rank === "3" && card.suit === "♣")
    );

    if (!playing) {
      throw new Error("Player with 3♣ not found");
    }

    this.roomState = {
      state: State.playing,
      players,
      gameState: {
        playing: playing.id,
        pileTop: [],
        hasToPlay3Club: true,
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
