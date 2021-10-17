import { FunctionComponent } from "preact";
import {
  LocationProvider,
  Router,
  Route,
  lazy,
  ErrorBoundary,
  hydrate,
  prerender as ssr,
} from "preact-iso";
import { useState } from "preact/hooks";
import Home from "./pages/home";
import NotFound from "./pages/_404.js";
import { Header } from "./components/header";
import { Session, SessionContext } from "./components/session-context";

const GameRoom = lazy(() => import("./pages/game-room"));

export const App: FunctionComponent = () => {
  const [session, setSession] = useState<Session>();

  const updateSession = (sessionData: Partial<Session>) => {
    setSession((session) => ({ ...session, ...sessionData }));
  };

  return (
    <LocationProvider>
      <SessionContext.Provider value={{ session, updateSession }}>
        <div class="app">
          <Header />
          <ErrorBoundary>
            <Router>
              <Route path="/" component={Home} />
              <Route path="/game/:id" component={GameRoom} />
              <Route default component={NotFound} />
            </Router>
          </ErrorBoundary>
        </div>
      </SessionContext.Provider>
    </LocationProvider>
  );
};

hydrate(<App />);

export const prerender: typeof ssr = async () => await ssr(<App />);
