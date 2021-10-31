import { FunctionComponent } from "preact";
import { useLocation } from "preact-iso";
import { Logo } from "../components/logo";
import styles from "./style.module.css";

const Home: FunctionComponent = () => {
  const { route } = useLocation();

  const handleCreate = async () => {
    const response = await fetch(`${import.meta.env.API_URL}/game`, {
      method: "POST",
    });
    if (response.ok) {
      const { id } = await response.json();
      route(`/game/${id}`);
    }
  };

  return (
    <main class={styles.homeContainer}>
      <section class={styles.home}>
        <Logo className={styles.logo} />
        <button onClick={handleCreate}>New game</button>
        <a href="/how-to-play" target="_blank" class={styles.rulesLink}>
          How to play
        </a>
      </section>
    </main>
  );
};

export default Home;
