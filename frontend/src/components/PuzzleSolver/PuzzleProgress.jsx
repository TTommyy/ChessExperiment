import React from 'react';
import styles from './PuzzleSolver.module.css';

const PuzzleProgress = ({ completedExercises, totalExercises, attemptedExercises }) => {
  // Use attemptedExercises for progress if provided, otherwise fall back to completedExercises
  const progressCount = attemptedExercises !== undefined ? attemptedExercises : completedExercises;

  // Calculate percentage based on attempted puzzles
  const progressPercentage = (progressCount / totalExercises) * 100;

  return (
    <div className={styles.progress}>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <div className={styles.progressText}>
        Progress: {progressCount} / {totalExercises} puzzles
        {attemptedExercises !== undefined && completedExercises < attemptedExercises && (
          <span className={styles.progressDetails}>
            ({completedExercises} correct, {attemptedExercises - completedExercises} incorrect)
          </span>
        )}
      </div>
    </div>
  );
};

export default PuzzleProgress;