import { IncomingMessage, IncomingMessageType } from "./message";

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
}

export const initialState: State = {
  players: [],
  gameState: GameState.waiting,
};

export const reducer = (state: State, message: IncomingMessage): State => {
  switch (message.type) {
    case IncomingMessageType.init: {
      return {
        ...state,
        players: message.payload.players.map((player) => ({
          name: player.name,
          ready: false,
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
    default:
      return state;
  }
};
