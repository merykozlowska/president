import styles from "./style.module.css";
import { FunctionComponent } from "preact";

const About: FunctionComponent = () => (
  <section class={styles.about}>
    <h1>About</h1>
    <p>A page all about this website.</p>
  </section>
);

export default About;
