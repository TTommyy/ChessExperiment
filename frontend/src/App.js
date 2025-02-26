import { useState, useEffect } from 'react';
import Login from './components/Login';
import PuzzleSolver from './components/PuzzleSolver';
import ChessTrainer from './components/ChessTrainer';
import { logout } from './api/users';
import styles from './App.module.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [appMode, setAppMode] = useState(null); // null, 'puzzles', or 'trainer'

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setAppMode(null);
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  if (!appMode) {
    return (
      <div className={styles.modeSelection}>
        <h2>Choose Mode</h2>
        <div className={styles.modeButtons}>
          <button onClick={() => setAppMode('puzzles')}>Puzzle Solver</button>
          <button onClick={() => setAppMode('trainer')}>Chess Trainer</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>{appMode === 'puzzles' ? 'Puzzle Solver' : 'Chess Trainer'}</h1>
        <div className={styles.actions}>
          <button onClick={() => setAppMode(null)}>Change Mode</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      {appMode === 'puzzles' ? <PuzzleSolver /> : <ChessTrainer />}
    </div>
  );
}

export default App;