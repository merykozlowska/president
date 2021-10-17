import { Card } from "./cards";

export enum IncomingMessageType {
  joined = "joined",
  ready = "ready",
  play = "play",
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

interface PlayInMessage {
  type: IncomingMessageType.play;
  payload: {
    cards: Card[];
  };
}

export type IncomingMessage = JoinedInMessage | ReadyInMessage | PlayInMessage;

export enum OutgoingMessageType {
  init = "init",
  joined = "joined",
  disconnected = "disconnected",
  ready = "ready",
  startGame = "startGame",
  turnPlayed = "turnPlayed",
}

interface InitOutMessage {
  type: OutgoingMessageType.init;
  payload: {
    players: { id: string; name: string; ready: boolean }[];
  };
}

interface JoinedOutMessage {
  type: OutgoingMessageType.joined;
  payload: {
    id: string;
    name: string;
  };
}

interface DisconnectedOutMessage {
  type: OutgoingMessageType.disconnected;
  payload: {
    id: string;
    name: string;
  };
}

interface ReadyOutMessage {
  type: OutgoingMessageType.ready;
  payload: {
    id: string;
    name: string;
    ready: boolean;
  };
}

export interface GameStateForPlayer {
  players: {
    id: string;
    name: string;
    hand: { count: number };
  }[];
  hand: Card[];
  pileTop: Card[];
  playing: string;
  hasToPlay3Club: boolean;
}

export interface StartGameOutMessage {
  type: OutgoingMessageType.startGame;
  payload: {
    gameState: GameStateForPlayer;
  };
}

export interface TurnPlayedOutMessage {
  type: OutgoingMessageType.turnPlayed;
  payload: {
    gameState: GameStateForPlayer;
  };
}

export type OutgoingMessage =
  | InitOutMessage
  | JoinedOutMessage
  | DisconnectedOutMessage
  | ReadyOutMessage
  | StartGameOutMessage
  | TurnPlayedOutMessage;
