import { IncomingMessage, IncomingMessageType } from "./message";
import { Card } from "./cards";

export interface LobbyPlayer {
  name: string;
  id: string;
  ready: boolean;
}

export enum PlayerRank {
  president = "president",
  vicePresident = "vicePresident",
  aHole = "aHole",
  none = "none",
}

export interface Player {
  name: string;
  id: string;
  hand: { count: number };
  passed: boolean;
  rank: PlayerRank | null;
}

export enum GameState {
  waiting,
  started,
  finished,
}

export interface LobbyState {
  gameState: GameState.waiting;
  players: LobbyPlayer[];
}

export interface GameInProgressState {
  gameState: GameState.started;
  hand: Card[];
  players: Player[];
  playing: string;
  pileTop: Card[];
  hasToPlay3Club: boolean;
}

export interface FinishedState {
  gameState: GameState.finished;
  ranking: { id: string; name: string; rank: PlayerRank }[];
}

export type State = LobbyState | GameInProgressState | FinishedState;

export const initialState: State = {
  gameState: GameState.waiting,
  players: [],
};

export const reducer = (state: State, message: IncomingMessage): State => {
  switch (message.type) {
    case IncomingMessageType.init: {
      if (state.gameState !== GameState.waiting) {
        return state;
      }
      return {
        ...state,
        players: message.payload.players.map((player) => ({
          id: player.id,
          name: player.name,
          ready: player.ready,
        })),
      };
    }
    case IncomingMessageType.joined: {
      if (state.gameState !== GameState.waiting) {
        return state;
      }
      const player = {
        id: message.payload.id,
        name: message.payload.name,
        ready: false,
      };
      return {
        ...state,
        players: [...state.players, player],
      };
    }
    case IncomingMessageType.disconnected: {
      if (state.gameState === GameState.waiting) {
        return {
          ...state,
          players: state.players.filter(
            (player) => player.name !== message.payload.name
          ),
        };
      }
      if (state.gameState === GameState.started) {
        return {
          ...state,
          players: state.players.filter(
            (player) => player.name !== message.payload.name
          ),
        };
      }
      return state;
    }
    case IncomingMessageType.ready: {
      if (state.gameState !== GameState.waiting) {
        return state;
      }
      const playerIdx = state.players.findIndex(
        (p) => p.name === message.payload.name
      );
      const players = [...state.players];
      players[playerIdx].ready = message.payload.ready;
      return {
        ...state,
        players,
      };
    }
    case IncomingMessageType.startGame: {
      if (state.gameState !== GameState.waiting) {
        return state;
      }
      return {
        ...state,
        gameState: GameState.started,
        ...message.payload.gameState,
      };
    }
    case IncomingMessageType.turnPlayed: {
      if (state.gameState === GameState.started) {
        return {
          ...state,
          ...message.payload.gameState,
        };
      }
      return state;
    }
    case IncomingMessageType.gameFinished: {
      return {
        gameState: GameState.finished,
        ranking: message.payload.ranking,
      };
    }
    default:
      return state;
  }
};
