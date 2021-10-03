import { Card } from "./cards";

export enum IncomingMessageType {
  init = "init",
  joined = "joined",
  ready = "ready",
  startGame = "startGame",
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

interface StartGameInMessage {
  type: IncomingMessageType.startGame;
  payload: {
    hand: Card[];
  };
}

export type IncomingMessage =
  | InitInMessage
  | JoinedInMessage
  | ReadyInMessage
  | StartGameInMessage;

export const canHandleMessage = (
  message: unknown
): message is IncomingMessage =>
  IncomingMessageType[(message as IncomingMessage).type] !== undefined;
