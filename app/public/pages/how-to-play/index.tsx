import { FunctionComponent } from "preact";
import styles from "./styles.module.css";

const Rules: FunctionComponent = () => (
  <main class={styles.rules}>
    <h1>How to play President card game online</h1>
    <section>
      <h2>Game rules</h2>
      <p>Recommended for 4-7 players.</p>
      <p>
        The aim of the game is to get rid of all your cards as soon as possible.
      </p>
      <p>
        The first player starts with any single card or any set of cards of
        equal rank (for example three fives). Each player in turn must then
        either pass, or play a card or a set of cards which beats the previous
        play.
      </p>
      <p>
        A single card is beaten by any higher single card (the ranks from high
        to low are: 2 A K Q J 10 9 8 7 6 5 4 3). A set of cards can only be
        beaten by a higher set containing the same number of cards. So for
        example if the previous player played two sixes you can beat this with
        two kings, or two sevens, but not with a single king, and not with three
        sevens (though you could play two of them and hang onto the third).
      </p>
      <p>
        Play continues in this way until everyone passes. The player who played
        last begins a new round and the game proceeds as usual.
      </p>
      <p>
        The first player who is out of cards is awarded the highest social rank
        - President - the next is Vice-President, then Citizen and so on down.
        The last player to be left with any cards is known as the Scum.
      </p>
      <p>
        Whenever a player puts a 2 down they finish the round and can start a
        new one. However, a 2 card cannot be the last card that you play in your
        hand. If you only have a 2 card left and you play it, you automatically
        lose the game, becoming the scum.
      </p>
    </section>
  </main>
);

export default Rules;
