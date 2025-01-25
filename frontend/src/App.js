import { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import axios from 'axios';

const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function App() {
  const [game, setGame] = useState(new Chess());
  const [mode, setMode] = useState('free');
  const [exercises, setExercises] = useState([]);
  const [creatingExercise, setCreatingExercise] = useState(false);
  const [motives, setMotives] = useState('');
  const [startingColor, setStartingColor] = useState('white');
  const [exerciseMoves, setExerciseMoves] = useState([]);
  const [initialExerciseFen, setInitialExerciseFen] = useState('');

  useEffect(() => {
    axios.get('http://localhost:5001/api/exercises')
      .then(res => setExercises(res.data))
      .catch(console.error);
  }, []);

  function onDrop(sourceSquare, targetSquare, piece) {
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

  const handleLoadExercise = (exercise) => {
    try {
      const newGame = new Chess(exercise.initial_fen);
      setGame(newGame);
      alert(`Loaded exercise: ${exercise.motives}\nMoves: ${exercise.moves.join(', ')}`);
    } catch (error) {
      alert('Failed to load exercise: ' + error.message);
    }
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
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => setMode('free')}>Free Mode</button>
        <button onClick={() => setMode('exercise')}>Exercise Mode</button>

        {mode === 'free' && (
          <>
            <button onClick={() => setGame(new Chess(initialFen))}>
              Reset Board
            </button>
            <button onClick={() => setGame(new Chess('8/8/8/8/8/8/8/8 w - - 0 1'))}>
              Clear Board
            </button>
          </>
        )}

        {mode === 'exercise' && !creatingExercise && (
          <form onSubmit={handleNewExercise} style={{ marginTop: '10px' }}>
            <input
              type="text"
              placeholder="Motives"
              value={motives}
              onChange={(e) => setMotives(e.target.value)}
              required
            />
            <select
              value={startingColor}
              onChange={(e) => setStartingColor(e.target.value)}
              required
            >
              <option value="white">White starts</option>
              <option value="black">Black starts</option>
            </select>
            <button type="submit">Start Exercise</button>
          </form>
        )}

        {creatingExercise && (
          <button onClick={handleFinishExercise} style={{ marginLeft: '10px' }}>
            Finish Exercise
          </button>
        )}
      </div>

      <div style={{ width: '560px', margin: 'auto' }}>
        <Chessboard
          position={game.fen()}
          onPieceDrop={onDrop}
          boardWidth={560}
          customBoardStyle={{
            borderRadius: '4px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
          }}
        />
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Saved Exercises</h2>
        <ul>
          {exercises.map(ex => (
            <li key={ex.id} style={{ margin: '10px 0', padding: '5px', borderBottom: '1px solid #ccc' }}>
              <div>
                <strong>{ex.motives}</strong> (ID: {ex.id}) -
                {new Date(ex.created_at).toLocaleString()}
              </div>
              <div style={{ marginTop: '5px' }}>
                <button
                  onClick={() => handleLoadExercise(ex)}
                  style={{ marginRight: '5px', padding: '2px 10px' }}
                >
                  Load
                </button>
                <button
                  onClick={() => handleDeleteExercise(ex.id)}
                  style={{
                    padding: '2px 10px',
                    backgroundColor: '#ff4444',
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Delete
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