import { useState } from 'react';
import PuzzleSolver from './components/PuzzleSolver';
import ChessTrainer from './components/ChessTrainer';
import styles from './App.module.css';

function App() {
  const [mode, setMode] = useState('trainer'); // 'trainer' or 'puzzle'
  const [puzzleMode, setPuzzleMode] = useState('ordered'); // 'ordered' or 'random'

  return (
    <div className={styles.container}>
      <div className={styles.modeSelector}>
        <button
          onClick={() => setMode('trainer')}
          className={`${styles.modeButton} ${mode === 'trainer' ? styles.active : ''}`}
        >
          Trainer Mode
        </button>
        <button
          onClick={() => setMode('puzzle')}
          className={`${styles.modeButton} ${mode === 'puzzle' ? styles.active : ''}`}
        >
          Puzzle Mode
        </button>
      </div>

      {mode === 'trainer' && <ChessTrainer />}

      {mode === 'puzzle' && (
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
      )}
    </div>
  );
}

export default App;