import { createContext } from "preact";

export interface Session {
  username: string;
  id: string;
  ws: WebSocket;
}

interface SessionContextValue {
  session: Session;
  updateSession: (s: Partial<Session>) => void;
}

export const SessionContext = createContext<SessionContextValue>({
  session: null,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  updateSession: () => {},
});
