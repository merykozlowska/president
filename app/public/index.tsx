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
import Home from "./pages/home";
import NotFound from "./pages/_404";

const HowToPlay = lazy(() => import("./pages/how-to-play"));
const GameRoom = lazy(() => import("./pages/game-room"));

export const App: FunctionComponent = () => {
  return (
    <LocationProvider>
      <div class="app">
        <ErrorBoundary>
          <Router>
            <Route path="/" component={Home} />
            <Route path="/how-to-play" component={HowToPlay} />
            <Route path="/game/:id" component={GameRoom} />
            <Route default component={NotFound} />
          </Router>
        </ErrorBoundary>
      </div>
    </LocationProvider>
  );
};

hydrate(<App />);

export const prerender: typeof ssr = async () => ({
  ...(await ssr(<App />)),
  links: new Set(["/how-to-play"]),
});
