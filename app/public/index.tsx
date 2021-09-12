import {
  LocationProvider,
  Router,
  Route,
  lazy,
  ErrorBoundary,
  hydrate,
  prerender as ssr,
} from "preact-iso";
import { FunctionComponent } from "preact";
import Home from "./pages/home";
import NotFound from "./pages/_404.js";
import Header from "./header";

const About = lazy(() => import("./pages/about"));

export const App: FunctionComponent = () => {
  return (
    <LocationProvider>
      <div class="app">
        <Header />
        <ErrorBoundary>
          <Router>
            <Route path="/" component={Home} />
            <Route path="/about" component={About} />
            <Route default component={NotFound} />
          </Router>
        </ErrorBoundary>
      </div>
    </LocationProvider>
  );
};

hydrate(<App />);

export const prerender: typeof ssr = async () => await ssr(<App />);
