import styles from "./style.module.css";
import { FunctionComponent } from "preact";
import { useLocation } from "preact-iso";

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
    <section class={styles.home}>
      <button onClick={handleCreate}>Create new game</button>
    </section>
  );
};

export default Home;
