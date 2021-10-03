export enum IncomingMessageType {
  init = "init",
  joined = "joined",
  ready = "ready",
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

export type IncomingMessage = InitInMessage | JoinedInMessage | ReadyInMessage;

export const canHandleMessage = (
  message: unknown
): message is IncomingMessage =>
  IncomingMessageType[(message as IncomingMessage).type] !== undefined;
