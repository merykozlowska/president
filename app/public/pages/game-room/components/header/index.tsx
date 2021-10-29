import { FunctionComponent } from "preact";
import { Logo } from "../../../components/logo";
import styles from "./header.module.css";

export const Header: FunctionComponent = () => {
  return (
    <header class={styles.header}>
      <nav>
        <a href="/">
          <Logo className={styles.logo} />
        </a>
        <a href="/rules" target="_blank">
          Rules
        </a>
      </nav>
    </header>
  );
};
