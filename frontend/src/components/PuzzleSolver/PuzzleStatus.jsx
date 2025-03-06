import React from 'react';
import styles from './PuzzleSolver.module.css';

const PuzzleStatus = ({
  errorMessage,
  animateError,
  isSolved,
  isFailed,
  showSolution,
  solutionTimer
}) => {
  return (
    <>
      {/* Error Message */}
      {errorMessage && (
        <div
          className={`${styles.errorMessage} ${animateError ? styles.shake : ''}`}
        >
          {errorMessage}
        </div>
      )}

      {/* Status Messages */}
      {isSolved && (
        <div className={styles.statusMessage + ' ' + styles.success}>
          {showSolution
            ? `Correct! Reviewing solution... Next puzzle in ${solutionTimer}s`
            : "Correct! Loading next puzzle..."}
        </div>
      )}

      {isFailed && (
        <div className={styles.statusMessage + ' ' + styles.failure}>
          {showSolution
            ? `Incorrect. Review the solution... Next puzzle in ${solutionTimer}s`
            : "Incorrect. The correct solution will be shown."}
        </div>
      )}
    </>
  );
};

export default PuzzleStatus;