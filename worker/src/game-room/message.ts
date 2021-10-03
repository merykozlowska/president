import { Card } from "./cards";

export enum IncomingMessageType {
  joined = "joined",
  ready = "ready",
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
    ready: boolean;
  };
}

export type IncomingMessage = JoinedInMessage | ReadyInMessage;

export enum OutgoingMessageType {
  init = "init",
  joined = "joined",
  ready = "ready",
  startGame = "startGame",
}

interface InitOutMessage {
  type: OutgoingMessageType.init;
  payload: {
    players: { name: string; ready: boolean }[];
  };
}

interface JoinedOutMessage {
  type: OutgoingMessageType.joined;
  payload: {
    name: string;
  };
}

interface ReadyOutMessage {
  type: OutgoingMessageType.ready;
  payload: {
    name: string;
    ready: boolean;
  };
}

export interface StartGameOutMessage {
  type: OutgoingMessageType.startGame;
  payload: {
    players: { name: string; hand: { count: number } }[];
    hand: Card[];
  };
}

export type OutgoingMessage =
  | InitOutMessage
  | JoinedOutMessage
  | ReadyOutMessage
  | StartGameOutMessage;
