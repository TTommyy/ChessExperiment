import { useState } from 'react';
import PuzzleSolver from './components/PuzzleSolver';
import styles from './App.module.css';

function App() {
  const [puzzleMode, setPuzzleMode] = useState('ordered'); // 'ordered' or 'random'

  return (
    <div className={styles.container}>
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
    </div>
  );
}

export default App;