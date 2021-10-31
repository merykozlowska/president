import { Card } from "./cards";

export enum IncomingMessageType {
  joined = "joined",
  ready = "ready",
  play = "play",
  pass = "pass",
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

interface PassInMessage {
  type: IncomingMessageType.pass;
}

export type IncomingMessage =
  | JoinedInMessage
  | ReadyInMessage
  | PlayInMessage
  | PassInMessage;

export enum OutgoingMessageType {
  init = "init",
  joined = "joined",
  disconnected = "disconnected",
  ready = "ready",
  startGame = "startGame",
  turnPlayed = "turnPlayed",
  gameFinished = "gameFinished",
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

export enum PlayerRank {
  president = "president",
  vicePresident = "vicePresident",
  aHole = "aHole",
  none = "none",
}

export interface GameStateForPlayer {
  players: {
    id: string;
    name: string;
    hand: { count: number };
    passed: boolean;
    rank: PlayerRank | null;
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
    played: {
      id: string;
    };
  };
}

export interface GameFinishedOutMessage {
  type: OutgoingMessageType.gameFinished;
  payload: {
    ranking: { id: string; name: string; rank: PlayerRank }[];
  };
}

export type OutgoingMessage =
  | InitOutMessage
  | JoinedOutMessage
  | DisconnectedOutMessage
  | ReadyOutMessage
  | StartGameOutMessage
  | TurnPlayedOutMessage
  | GameFinishedOutMessage;
