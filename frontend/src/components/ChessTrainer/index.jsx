import { useState } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '../ChessBoard';
import ExerciseList from './ExerciseList';
import ExerciseForm from './ExerciseForm';
import ExerciseNavigator from './ExerciseNavigator';
import useChessGame from '../../hooks/useChessGame';
import useExercises from '../../hooks/useExercises';
import styles from './ChessTrainer.module.css';

const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function ChessTrainer() {
  const { game, setGame, resetGame } = useChessGame(initialFen);
  const { exercises, addExercise, removeExercise } = useExercises();
  const [mode, setMode] = useState('free');
  const [motives, setMotives] = useState('');
  const [startingColor, setStartingColor] = useState('white');
  const [creatingExercise, setCreatingExercise] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [currentMoveIndex, setCurrentMoveIndex] = useState(-1);
  const [exerciseMoves, setExerciseMoves] = useState([]);
  const [initialExerciseFen, setInitialExerciseFen] = useState(initialFen);

  // Ensure game is always defined
  const initializeGame = (fen = initialFen) => {
    setGame(new Chess(fen));
  };

  const resetGameHandler = () => {
    initializeGame(initialFen);
  };

  const clearBoard = () => {
    initializeGame('8/8/8/8/8/8/8/8 w - - 0 1');
  };

  const onDrop = (sourceSquare, targetSquare, piece) => {
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

        const uciMove = `${moveResult.from}${moveResult.to}${moveResult.promotion || ''}`;
        setExerciseMoves(prev => [...prev, uciMove]);
        setGame(newGame);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  };

  const handleNewExercise = (e) => {
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
    } catch (error) {
      alert('Invalid chess position!');
    }
  };

  const handleFinishExercise = async () => {
    try {
      await addExercise({
        initial_fen: initialExerciseFen,
        moves: exerciseMoves,
        starting_color: startingColor,
        motives
      });
      setCreatingExercise(false);
      setMode('free');
      setMotives('');
      setExerciseMoves([]);
      setInitialExerciseFen(initialFen);
      resetGameHandler();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to save exercise');
    }
  };

  const handleLoadExercise = (exercise) => {
    try {
      const game = new Chess(exercise.initial_fen);
      const positions = [game.fen()];

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

  const handleDeleteExercise = async (id) => {
    if (window.confirm('Are you sure you want to delete this exercise?')) {
      try {
        await removeExercise(id);
      } catch (error) {
        alert('Delete failed: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handlePreviousMove = () => {
    if (currentMoveIndex > 0) {
      const newIndex = currentMoveIndex - 1;
      setCurrentMoveIndex(newIndex);
      setGame(new Chess(currentExercise.positions[newIndex]));
    }
  };

  const handleNextMove = () => {
    if (currentMoveIndex < currentExercise.positions.length - 1) {
      const newIndex = currentMoveIndex + 1;
      setCurrentMoveIndex(newIndex);
      setGame(new Chess(currentExercise.positions[newIndex]));
    }
  };

  const handleCloseExercise = () => {
    setCurrentExercise(null);
    setCurrentMoveIndex(-1);
    resetGameHandler();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          onClick={() => setMode('free')}
          className={`${styles.button} ${mode === 'free' ? styles.active : ''}`}
        >
          Free Mode
        </button>
        <button
          onClick={() => setMode('exercise')}
          className={`${styles.button} ${mode === 'exercise' ? styles.active : ''}`}
        >
          Exercise Mode
        </button>

        {mode === 'free' && (
          <>
            <button
              onClick={resetGameHandler}
              className={styles.secondaryButton}
            >
              Reset Board
            </button>
            <button
              onClick={clearBoard}
              className={styles.secondaryButton}
            >
              Clear Board
            </button>
          </>
        )}

        {mode === 'exercise' && !creatingExercise && (
          <ExerciseForm
            motives={motives}
            startingColor={startingColor}
            onMotivesChange={setMotives}
            onStartingColorChange={setStartingColor}
            onSubmit={handleNewExercise}
          />
        )}

        {creatingExercise && (
          <button
            onClick={handleFinishExercise}
            className={styles.primaryButton}
          >
            ✅ Finish Exercise
          </button>
        )}
      </div>

      {currentExercise && (
        <ExerciseNavigator
          exercise={currentExercise}
          currentMoveIndex={currentMoveIndex}
          onPrevious={handlePreviousMove}
          onNext={handleNextMove}
          onClose={handleCloseExercise}
        />
      )}

      {game && ( // Ensure game is defined before rendering ChessBoard
        <ChessBoard game={game} onDrop={onDrop} />
      )}

      <ExerciseList
        exercises={exercises}
        onDelete={handleDeleteExercise}
        onLoad={handleLoadExercise}
      />
    </div>
  );
}

export default ChessTrainer;