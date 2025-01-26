import styles from './ExerciseForm.module.css';

const ExerciseForm = ({ motives, startingColor, onMotivesChange, onStartingColorChange, onSubmit }) => (
  <form onSubmit={onSubmit} className={styles.form}>
    <select
      value={motives}
      onChange={(e) => onMotivesChange(e.target.value)}
      className={styles.input}
      required
      defaultValue={'Pin'}
      >
        <option value="Pin">Pin</option>
        <option value="Fork">Fork</option>
        <option value="Undermining">Undermining</option>
      </select>

    <select
      value={startingColor}
      onChange={(e) => onStartingColorChange(e.target.value)}
      className={styles.select}
      required
    >
      <option value="white">White starts</option>
      <option value="black">Black starts</option>
    </select>
    <button type="submit" className={styles.button}>
      Start Exercise
    </button>
  </form>
);

export default ExerciseForm;