import { Card } from "./cards";

export enum IncomingMessageType {
  init = "init",
  joined = "joined",
  ready = "ready",
  startGame = "startGame",
  turnPlayed = "turnPlayed",
}

interface InitInMessage {
  type: IncomingMessageType.init;
  payload: {
    players: { name: string; ready: boolean }[];
  };
}

interface JoinedInMessage {
  type: IncomingMessageType.joined;
  payload: {
    name: string;
  };
}

interface ReadyInMessage {
  type: IncomingMessageType.ready;
  payload: {
    name: string;
    ready: boolean;
  };
}

interface GameState {
  players: { name: string; hand: { count: number } }[];
  hand: Card[];
  pileTop: Card[];
  playing: string;
}

interface StartGameInMessage {
  type: IncomingMessageType.startGame;
  payload: {
    gameState: GameState;
  };
}

interface TurnPlayedInMessage {
  type: IncomingMessageType.turnPlayed;
  payload: {
    gameState: GameState;
  };
}

export type IncomingMessage =
  | InitInMessage
  | JoinedInMessage
  | ReadyInMessage
  | StartGameInMessage
  | TurnPlayedInMessage;

export const canHandleMessage = (
  message: unknown
): message is IncomingMessage =>
  IncomingMessageType[(message as IncomingMessage).type] !== undefined;
