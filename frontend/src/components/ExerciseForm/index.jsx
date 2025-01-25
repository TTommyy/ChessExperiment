import styles from './ExerciseForm.module.css';

const ExerciseForm = ({ motives, startingColor, onMotivesChange, onStartingColorChange, onSubmit }) => (
  <form onSubmit={onSubmit} className={styles.form}>
    <input
      type="text"
      placeholder="Exercise Motives (e.g., Fork, Pin)"
      value={motives}
      onChange={(e) => onMotivesChange(e.target.value)}
      className={styles.input}
      required
    />
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