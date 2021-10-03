import { FunctionComponent } from "preact";

export const Header: FunctionComponent = () => {
  return (
    <header>
      <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
      </nav>
    </header>
  );
};
