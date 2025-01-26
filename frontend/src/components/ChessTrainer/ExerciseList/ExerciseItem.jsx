import styles from './ExerciseList.module.css';

const ExerciseItem = ({ exercise, onDelete, onLoad }) => (
  <li className={styles.item}>
    <div className={styles.details}>
      <strong>{exercise.motives}</strong>
      <span className={styles.meta}>(ID: {exercise.id}) - {new Date(exercise.created_at).toLocaleString()}</span>
    </div>
    <div className={styles.actions}>
      <button className={styles.loadButton} onClick={() => onLoad(exercise)}>
        📖 Load
      </button>
      <button className={styles.deleteButton} onClick={() => onDelete(exercise.id)}>
        🗑️ Delete
      </button>
    </div>
  </li>
);

export default ExerciseItem;