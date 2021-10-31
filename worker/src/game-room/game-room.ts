import {
  GameStateForPlayer,
  IncomingMessage,
  IncomingMessageType,
  OutgoingMessage,
  OutgoingMessageType,
  PlayerRank,
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
  rank: PlayerRank | null;
}

interface RankingPlayer extends CommonPlayer {
  rank: PlayerRank;
}

interface GameState {
  playing: string;
  pileTop: Card[];
  playerRanksLeft: PlayerRank[];
  ranking: (string | null)[];
}

enum State {
  lobby,
  playing,
  finished,
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

interface FinishedState {
  state: State.finished;
  players: RankingPlayer[];
}

type RoomState = LobbyRoomState | PlayingRoomState | FinishedState;

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
          break;
        }
        if (!this.validatePlayed(played, player)) {
          break;
        }

        player.hand = player.hand.filter(
          (card) =>
            !played.some(
              (playedCard) =>
                card.suit === playedCard.suit && card.rank === playedCard.rank
            )
        );

        if (!player.hand.length) {
          let nextRank, rankingIdx;
          if (played.some((card) => card.rank === "2")) {
            nextRank = this.roomState.gameState.playerRanksLeft.shift();
            rankingIdx = this.roomState.gameState.ranking.lastIndexOf(null);
          } else {
            nextRank = this.roomState.gameState.playerRanksLeft.pop();
            rankingIdx = this.roomState.gameState.ranking.indexOf(null);
          }
          if (!nextRank) {
            console.log(
              JSON.stringify(this.roomState.gameState.playerRanksLeft)
            );
            throw new Error("No ranks left???");
          }
          player.rank = nextRank;
          this.roomState.gameState.ranking[rankingIdx] = player.id;

          const playersWithoutRank = this.roomState.players.filter(
            (p) => p.rank == null
          );
          if (!playersWithoutRank.length) {
            this.finishGame();
            break;
          }
          if (playersWithoutRank.length === 1) {
            const lastRank = this.roomState.gameState.playerRanksLeft.shift();
            const lastRankingIdx =
              this.roomState.gameState.ranking.lastIndexOf(null);
            if (!lastRank) {
              console.log(
                JSON.stringify(this.roomState.gameState.playerRanksLeft)
              );
              throw new Error("No ranks left???");
            }
            playersWithoutRank[0].rank = lastRank;
            this.roomState.gameState.ranking[lastRankingIdx] =
              playersWithoutRank[0].id;
            this.broadcastTurnPlayed({ player });
            this.finishGame();
            break;
          }

          const everyoneElsePassed = playersWithoutRank.every((p) => p.passed);
          if (everyoneElsePassed) {
            this.startNewRound();
          }
        }

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
          break;
        }

        const player = this.roomState.players.find(
          ({ id }) => id === session.id
        );
        if (!player) {
          break;
        }
        if (player.id !== this.roomState.gameState.playing) {
          break;
        }

        this.roomState.gameState.playing = this.nextPlayer(player).id;
        player.passed = true;

        if (this.roomState.players.every((p) => p.passed || p.rank != null)) {
          this.startNewRound();
        }

        this.broadcastTurnPlayed({ player });
        break;
      }
    }
  }

  finishGame(): void {
    if (this.roomState.state !== State.playing) {
      throw new Error("Cannot finish game when not playing");
    }
    console.log("GAME ENDED");
    const players = this.roomState.gameState.ranking.map((playerId) => {
      const player = (this.roomState as PlayingRoomState).players.find(
        (p) => p.id === playerId
      );
      if (!player) {
        throw new Error(`Player ${playerId} not found`);
      }
      if (!player.rank) {
        throw new Error(`Player ${player.id} missing rank`);
      }
      return {
        id: player.id,
        username: player.username,
        session: player.session,
        rank: player.rank,
      };
    });

    this.roomState = {
      state: State.finished,
      players,
    };

    this.broadcast({
      type: OutgoingMessageType.gameFinished,
      payload: {
        ranking: players.map((player) => ({
          id: player.id,
          name: player.username,
          rank: player.rank,
        })),
      },
    });
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
      (player) => !player.passed && player.rank == null
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
      players: this.roomState.players.map((player) => ({
        id: player.id,
        name: player.username,
        hand: { count: player.hand.length },
        passed: player.passed,
        rank: player.rank,
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
        rank: null,
      };
    });

    this.roomState = {
      state: State.playing,
      players,
      gameState: {
        playing: players[0].id,
        pileTop: [],
        playerRanksLeft: [
          PlayerRank.aHole,
          ...new Array(Math.max(numberOfPlayers - 3, 0)).fill(PlayerRank.none),
          ...(numberOfPlayers >= 3 ? [PlayerRank.vicePresident] : []),
          PlayerRank.president,
        ],
        ranking: new Array(players.length).fill(null),
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
