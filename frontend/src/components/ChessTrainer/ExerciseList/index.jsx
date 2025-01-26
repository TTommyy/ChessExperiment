import ExerciseItem from './ExerciseItem.jsx';
import styles from './ExerciseList.module.css';

const ExerciseList = ({ exercises, onDelete, onLoad }) => (
  <div className={styles.container}>
    <h2 className={styles.heading}>Saved Exercises</h2>
    <ul className={styles.list}>
      {exercises.map(ex => (
        <ExerciseItem
          key={ex.id}
          exercise={ex}
          onDelete={onDelete}
          onLoad={onLoad}
        />
      ))}
    </ul>
  </div>
);

export default ExerciseList;