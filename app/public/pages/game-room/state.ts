import { IncomingMessage, IncomingMessageType } from "./message";
import { Card } from "./cards";

export interface Player {
  name: string;
  ready: boolean;
}

export enum GameState {
  waiting,
  started,
}

export interface State {
  players: Player[];
  gameState: GameState;
  hand?: Card[];
}

export const initialState: State = {
  players: [],
  gameState: GameState.waiting,
  hand: undefined,
};

export const reducer = (state: State, message: IncomingMessage): State => {
  switch (message.type) {
    case IncomingMessageType.init: {
      return {
        ...state,
        players: message.payload.players.map((player) => ({
          name: player.name,
          ready: player.ready,
        })),
      };
    }
    case IncomingMessageType.joined: {
      const player = { name: message.payload.name, ready: false };
      return {
        ...state,
        players: [...state.players, player],
      };
    }
    case IncomingMessageType.ready: {
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
      return {
        ...state,
        gameState: GameState.started,
        hand: message.payload.hand,
      };
    }
    default:
      return state;
  }
};
