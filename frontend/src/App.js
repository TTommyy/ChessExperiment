import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import axios from 'axios';

const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  header: {
    marginBottom: '30px',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  button: {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '600'
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
    ':hover': {
      backgroundColor: '#45a049'
    }
  },
  dangerButton: {
    backgroundColor: '#ff4444',
    color: 'white',
    ':hover': {
      backgroundColor: '#cc0000'
    }
  },
  modeButton: (active) => ({
    backgroundColor: active ? '#4CAF50' : '#e0e0e0',
    color: active ? 'white' : '#333'
  }),
  form: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    marginTop: '15px',
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px'
  },
  input: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    minWidth: '200px'
  },
  select: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ddd'
  },
  exerciseItem: {
    margin: '10px 0',
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s',
    ':hover': {
      transform: 'translateX(5px)'
    }
  },
  exerciseActions: {
    marginTop: '10px',
    display: 'flex',
    gap: '8px'
  },
  chessboardContainer: {
    margin: '20px auto',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
  }
};


function App() {
  const [game, setGame] = useState(new Chess());
  const [mode, setMode] = useState('free');
  const [exercises, setExercises] = useState([]);
  const [creatingExercise, setCreatingExercise] = useState(false);
  const [motives, setMotives] = useState('');
  const [startingColor, setStartingColor] = useState('white');
  const [exerciseMoves, setExerciseMoves] = useState([]);
  const [initialExerciseFen, setInitialExerciseFen] = useState('');
  const [currentExercise, setCurrentExercise] = useState(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);

  useEffect(() => {
    axios.get('http://localhost:5001/api/exercises')
      .then(res => setExercises(res.data))
      .catch(console.error);
  }, []);

  function onDrop(sourceSquare, targetSquare, piece) {
    if (currentExercise) return false;
    const newGame = new Chess(game.fen());

    if (mode === 'free') {
      newGame.remove(sourceSquare);
      newGame.put({ type: piece[1].toLowerCase(), color: piece[0] }, targetSquare);
      setGame(newGame);
      return true;
    }

    if (mode === 'exercise' && creatingExercise) {
      try {
        const moveResult = newGame.move({
          from: sourceSquare,
          to: targetSquare,
          promotion: piece[1] === 'P' ? 'q' : undefined
        });
        setGame(newGame);
        const uciMove = `${moveResult.from}${moveResult.to}${
          moveResult.promotion ? moveResult.promotion : ''
        }`;
        setExerciseMoves(prev => [...prev, uciMove]);
        return true;
      }  catch {
        return false;
      }
    }

    return false;
  }

  function handleNewExercise(e) {
    e.preventDefault();
    try {
      const fenParts = game.fen().split(' ');
      fenParts[1] = startingColor[0];
      const initialFen = fenParts.join(' ');

      const newGame = new Chess(initialFen);
      setGame(newGame);
      setInitialExerciseFen(initialFen);
      setExerciseMoves([]);
      setCreatingExercise(true);
      setMode('exercise');
    } catch (error) {
      alert('Invalid chess position!');
    }
  }


  function handleFinishExercise() {
    axios.post('http://localhost:5001/api/exercises', {
      initial_fen: initialExerciseFen,
      moves: exerciseMoves,
      starting_color: startingColor,
      motives
    }).then(res => {
      setExercises([...exercises, res.data]);
      setCreatingExercise(false);
      setMode("free")
      setMotives('');
      setExerciseMoves([]);
      setInitialExerciseFen('');
      setGame(new Chess());
    }).catch(error => {
      console.error('Error saving exercise:', error);
      alert('Failed to save exercise: ' + error.response?.data?.error);
    });
  }

  // Update handleLoadExercise
  const handleLoadExercise = (exercise) => {
    try {
      const game = new Chess(exercise.initial_fen);
      const positions = [game.fen()];

      // Precompute all positions
      exercise.moves.forEach(move => {
        game.move(move);
        positions.push(game.fen());
      });

      setCurrentExercise({ ...exercise, positions });
      setCurrentMoveIndex(0);
      setGame(new Chess(positions[0]));
    } catch (error) {
      alert('Failed to load exercise: ' + error.message);
    }
  };

  // Add navigation handlers
  const handleNextMove = () => {
    if (currentMoveIndex < currentExercise.positions.length - 1) {
      const newIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newIndex);
      setGame(new Chess(currentExercise.positions[newIndex]));
    }
  };

  const handlePreviousMove = () => {
    if (currentMoveIndex > 0) {
      const newIndex = currentMoveIndex - 1;
      setCurrentMoveIndex(newIndex);
      setGame(new Chess(currentExercise.positions[newIndex]));
    }
  };

  // Add close exercise handler
  const handleCloseExercise = () => {
    setCurrentExercise(null);
    setCurrentMoveIndex(-1);
    setGame(new Chess());
  };

  const handleDeleteExercise = (id) => {
    if (window.confirm('Are you sure you want to delete this exercise?')) {
      axios.delete(`http://localhost:5001/api/exercises/${id}`)
        .then(() => {
          setExercises(exercises.filter(ex => ex.id !== id));
        })
        .catch(error => {
          alert('Delete failed: ' + (error.response?.data?.error || error.message));
        });
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button
          onClick={() => setMode('free')}
          style={{...styles.button, ...styles.modeButton(mode === 'free')}}
        >
          Free Mode
        </button>
        <button
          onClick={() => setMode('exercise')}
          style={{...styles.button, ...styles.modeButton(mode === 'exercise')}}
        >
          Exercise Mode
        </button>

        {mode === 'free' && (
          <>
            <button
              onClick={() => setGame(new Chess(initialFen))}
              style={{...styles.button, backgroundColor: '#2196F3', color: 'white'}}
            >
              Reset Board
            </button>
            <button
              onClick={() => setGame(new Chess('8/8/8/8/8/8/8/8 w - - 0 1'))}
              style={{...styles.button, backgroundColor: '#9E9E9E', color: 'white'}}
            >
              Clear Board
            </button>
          </>
        )}

        {mode === 'exercise' && !creatingExercise && (
          <form onSubmit={handleNewExercise} style={styles.form}>
            <input
              type="text"
              placeholder="Exercise Motives (e.g., Fork, Pin)"
              value={motives}
              onChange={(e) => setMotives(e.target.value)}
              style={styles.input}
              required
            />
            <select
              value={startingColor}
              onChange={(e) => setStartingColor(e.target.value)}
              style={styles.select}
              required
            >
              <option value="white">White starts</option>
              <option value="black">Black starts</option>
            </select>
            <button
              type="submit"
              style={{...styles.button, ...styles.primaryButton}}
            >
              Start Exercise
            </button>
          </form>
        )}

        {creatingExercise && (
          <button
            onClick={handleFinishExercise}
            style={{...styles.button, ...styles.primaryButton}}
          >
            ✅ Finish Exercise
          </button>
        )}
      </div>

      {currentExercise && (
        <div style={{
          margin: '20px 0',
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '8px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <div style={{ flexGrow: 1 }}>
            <h3 style={{ margin: 0 }}>{currentExercise.motives}</h3>
            <div style={{ color: '#666' }}>
              Move {currentMoveIndex} of {currentExercise.positions.length - 1}
            </div>
          </div>

          <button
            onClick={handlePreviousMove}
            disabled={currentMoveIndex === 0}
            style={{...styles.button, ...styles.primaryButton}}
          >
            ◀ Previous
          </button>

          <button
            onClick={handleNextMove}
            disabled={currentMoveIndex === currentExercise.positions.length - 1}
            style={{...styles.button, ...styles.primaryButton}}
          >
            Next ▶
          </button>

          <button
            onClick={handleCloseExercise}
            style={{...styles.button, backgroundColor: '#9E9E9E', color: 'white'}}
          >
            Close
          </button>
        </div>
      )}

      <div style={styles.chessboardContainer}>
        <Chessboard
          position={game.fen()}
          onPieceDrop={onDrop}
          boardWidth={560}
          customBoardStyle={{
            borderRadius: '4px',
          }}
          customDarkSquareStyle={{ backgroundColor: '#779952' }}
          customLightSquareStyle={{ backgroundColor: '#edeed1' }}
        />
      </div>

      <div>
        <h2 style={{ color: '#333', marginBottom: '15px' }}>Saved Exercises</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {exercises.map(ex => (
            <li key={ex.id} style={styles.exerciseItem}>
              <div style={{ fontSize: '1.1em', marginBottom: '5px' }}>
                <span style={{ fontWeight: '600' }}>{ex.motives}</span>
                <span style={{ color: '#666', marginLeft: '10px' }}>
                  (ID: {ex.id}) - {new Date(ex.created_at).toLocaleString()}
                </span>
              </div>
              <div style={styles.exerciseActions}>
                <button
                  onClick={() => handleLoadExercise(ex)}
                  style={{...styles.button, ...styles.primaryButton}}
                >
                  📖 Load Exercise
                </button>
                <button
                  onClick={() => handleDeleteExercise(ex.id)}
                  style={{...styles.button, ...styles.dangerButton}}
                >
                  🗑️ Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;