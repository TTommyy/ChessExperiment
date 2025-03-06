import React from 'react';
import styles from './PuzzleSolver.module.css';

function PuzzleHeader({ currentIndex, totalPuzzles }) {
  return (
    <div className={styles.header}>
      <div className={styles.puzzleInfo}>
        <h2>
          Puzzle {currentIndex + 1} of {totalPuzzles}
        </h2>
      </div>
    </div>
  );
}

export default PuzzleHeader;