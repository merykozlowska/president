import { FunctionComponent } from "preact";
import styles from "./header.module.css";

export const Header: FunctionComponent = () => {
  return (
    <header class={styles.header}>
      <nav>
        <a href="/">
          <img src="/assets/clubs.svg" alt="" class={styles.logo} />
        </a>
        <a href="/rules" target="_blank">
          Rules
        </a>
      </nav>
    </header>
  );
};
