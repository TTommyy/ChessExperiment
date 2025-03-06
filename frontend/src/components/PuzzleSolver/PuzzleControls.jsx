import React from 'react';
import styles from './PuzzleSolver.module.css';

const PuzzleControls = ({
  isSolved,
  isFailed,
  showSolution,
  onPrevMove,
  onNextMove,
  currentMoveIndex,
  totalMoves
}) => {
  // Only show controls when viewing solution (after solving or failing)
  if (!showSolution) {
    return null;
  }

  return (
    <div className={styles.controls}>
      <div className={styles.solutionControls}>
        <button
          onClick={onPrevMove}
          className={styles.moveButton}
          disabled={currentMoveIndex <= 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
          Previous
        </button>
        <div className={styles.moveIndicator}>
          {currentMoveIndex} / {totalMoves}
        </div>
        <button
          onClick={onNextMove}
          className={styles.moveButton}
          disabled={currentMoveIndex >= totalMoves}
        >
          Next
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PuzzleControls;