import styles from './ExerciseNavigator.module.css';

const ExerciseNavigator = ({ exercise, currentMoveIndex, onPrevious, onNext, onClose }) => (
  <div className={styles.container}>
    <div className={styles.info}>
      <h3 className={styles.title}>{exercise.motives}</h3>
      <div className={styles.counter}>
        Move {currentMoveIndex} of {exercise.positions.length - 1}
      </div>
    </div>
    <button
      onClick={onPrevious}
      disabled={currentMoveIndex === 0}
      className={styles.navButton}
    >
      ◀ Previous
    </button>
    <button
      onClick={onNext}
      disabled={currentMoveIndex === exercise.positions.length - 1}
      className={styles.navButton}
    >
      Next ▶
    </button>
    <button onClick={onClose} className={styles.closeButton}>
      Close
    </button>
  </div>
);

export default ExerciseNavigator;