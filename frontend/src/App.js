import { useState } from 'react';
import PuzzleSolver from './components/PuzzleSolver';
import ChessTrainer from './components/ChessTrainer';
import styles from './App.module.css';

function App() {
  const [puzzleMode, setPuzzleMode] = useState('ordered'); // 'ordered' or 'random'
  const [appMode, setAppMode] = useState('puzzles'); // 'puzzles' or 'trainer'

  return (
    <div className={styles.container}>
      <div className={styles.modeSelector}>
        <button
          onClick={() => setAppMode('puzzles')}
          className={`${styles.modeSelectorButton} ${appMode === 'puzzles' ? styles.active : ''}`}
        >
          Puzzle Solver
        </button>
        <button
          onClick={() => setAppMode('trainer')}
          className={`${styles.modeSelectorButton} ${appMode === 'trainer' ? styles.active : ''}`}
        >
          Chess Trainer
        </button>
      </div>

      {appMode === 'puzzles' ? (
        <div className={styles.puzzleContainer}>
          <div className={styles.puzzleModeSelector}>
            <button
              onClick={() => setPuzzleMode('ordered')}
              className={`${styles.puzzleModeButton} ${puzzleMode === 'ordered' ? styles.active : ''}`}
            >
              Ordered Puzzles
            </button>
            <button
              onClick={() => setPuzzleMode('random')}
              className={`${styles.puzzleModeButton} ${puzzleMode === 'random' ? styles.active : ''}`}
            >
              Random Puzzles
            </button>
          </div>
          <PuzzleSolver mode={puzzleMode} />
        </div>
      ) : (
        <div className={styles.trainerContainer}>
          <ChessTrainer />
        </div>
      )}
    </div>
  );
}

export default App;