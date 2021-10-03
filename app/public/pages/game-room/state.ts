import { IncomingMessage, IncomingMessageType } from "./message";
import { Card } from "./cards";

export interface LobbyPlayer {
  name: string;
  ready: boolean;
}

export interface Player {
  name: string;
  hand: { count: number };
}

export enum GameState {
  waiting,
  started,
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
}

export type State = LobbyState | GameInProgressState;

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
          name: player.name,
          ready: player.ready,
        })),
      };
    }
    case IncomingMessageType.joined: {
      if (state.gameState !== GameState.waiting) {
        return state;
      }
      const player = { name: message.payload.name, ready: false };
      return {
        ...state,
        players: [...state.players, player],
      };
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
      if (state.gameState !== GameState.started) {
        return state;
      }
      return {
        ...state,
        ...message.payload.gameState,
      };
    }
    default:
      return state;
  }
};
