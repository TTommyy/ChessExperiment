import React from 'react';
import styles from './PuzzleSolver.module.css';

const PuzzleProgress = ({ completedExercises, totalExercises }) => {
  return (
    <div className={styles.progress}>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${(completedExercises / totalExercises) * 100}%` }}
        ></div>
      </div>
      <div className={styles.progressText}>
        Progress: {completedExercises} / {totalExercises} puzzles
      </div>
    </div>
  );
};

export default PuzzleProgress;