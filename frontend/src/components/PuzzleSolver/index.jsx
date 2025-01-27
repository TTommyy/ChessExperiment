import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '../ChessBoard';
import Timer from '../Timer';
import { getPuzzleSequence } from '../../api/exercises';
import styles from './PuzzleSolver.module.css';

const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const SOLUTION_MOVE_DELAY = 3000;

function PuzzleSolver(mode) {
  const [game, setGame] = useState(new Chess(initialFen));
  const [puzzles, setPuzzles] = useState([]);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isSolved, setIsSolved] = useState(false);
  const [isFailed, setIsFailed] = useState(false);

  // Tracks which move user is supposed to play next
  const [moveIndex, setMoveIndex] = useState(0);

  // For showing the solution in an animated, move-by-move style
  const [showSolution, setShowSolution] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);

  // NEW: Store an error message to display when user attempts an illegal move
  const [errorMessage, setErrorMessage] = useState('');
  const [animateError, setAnimateError] = useState(false); // NEW: Trigger for animation

  useEffect(() => {
    const fetchPuzzles = async () => {
      try {
        const response = await getPuzzleSequence();
        if (mode === 'ordered') {
          setPuzzles(response.data.ordered);
        } else {
          setPuzzles(response.data.random);
        }
      } catch (error) {
        console.error('Error fetching puzzles:', error);
      }
    };
    fetchPuzzles();
  }, [mode]);

  useEffect(() => {
    if (puzzles.length > 0) {
      loadPuzzle(currentIndex);
    }
  }, [puzzles, currentIndex]);

  const loadPuzzle = (index) => {
    const puzzle = puzzles[index];
    const newChess = new Chess(puzzle.initial_fen);

    setGame(newChess);
    setCurrentPuzzle(puzzle);
    setIsSolved(false);
    setIsFailed(false);
    setMoveIndex(0);
    setShowSolution(false);
    setReplayIndex(0);
    setErrorMessage(''); // Clear any prior error
    setAnimateError(false); // Reset animation trigger
  };

  const handleMove = useCallback(
    (sourceSquare, targetSquare) => {
      if (isSolved || isFailed) return false;

      const newGame = new Chess(game.fen());
      let userMove = null;
      try {
        userMove = newGame.move({
          from: sourceSquare,
          to: targetSquare,
        });
      } catch (error) {
        // In case chess.js throws an error
        setErrorMessage('That move is illegal.');
        triggerErrorAnimation();
        return false;
      }

      // If the move is illegal, set an error message
      if (!userMove) {
        setErrorMessage('That move is illegal.');
        triggerErrorAnimation();
        return false;
      }

      // Otherwise, clear any previous error message
      setErrorMessage('');
      setAnimateError(false); // Ensure animation is reset

      // Compare the move to the puzzle’s expected solution move
      const uciMove = `${userMove.from}${userMove.to}`;
      if (uciMove === currentPuzzle.moves[moveIndex]) {
        let newMoveIndex = moveIndex + 1;
        setGame(newGame);

        // If puzzle expects a computer response right after user’s move
        if (newMoveIndex < currentPuzzle.moves.length) {
          const computerMove = newGame.move(currentPuzzle.moves[newMoveIndex]);
          if (computerMove) {
            setGame(newGame);
            newMoveIndex++;
          }
        }
        setMoveIndex(newMoveIndex);

        if (newMoveIndex >= currentPuzzle.moves.length) {
          setIsSolved(true);
        }
      } else {
        setIsFailed(true);
      }

      return true;
    },
    [game, currentPuzzle, moveIndex, isSolved, isFailed]
  );

  const handleTimeUp = () => {
    setIsFailed(true);
  };

  const handleNextPuzzle = () => {
    setCurrentIndex((prev) => (prev + 1) % puzzles.length);
  };

  // Trigger showing solution (animated or not)
  const handleShowSolution = () => {
    setShowSolution(true);
    setReplayIndex(0); // Start from beginning
  };

  // Step through solution moves automatically
  useEffect(() => {
    let intervalId = null;

    if (showSolution && currentPuzzle?.moves) {
      intervalId = setInterval(() => {
        setReplayIndex((prev) => {
          const next = prev + 1;
          if (next > currentPuzzle.moves.length) {
            clearInterval(intervalId);
            return prev;
          }
          return next;
        });
      }, SOLUTION_MOVE_DELAY);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [showSolution, currentPuzzle]);

  useEffect(() => {
    if (currentPuzzle && replayIndex >= 0) {
      const replayChess = new Chess(currentPuzzle.initial_fen);
      currentPuzzle.moves.slice(0, replayIndex).forEach((m) => replayChess.move(m));
      setGame(replayChess);
    }
  }, [replayIndex, currentPuzzle]);

  // NEW: Function to trigger error animation
  const triggerErrorAnimation = () => {
    setAnimateError(true);
    setTimeout(() => setAnimateError(false), 500); // Duration matches CSS animation
  };

  const puzzleOrientation = currentPuzzle?.starting_color; // 'white' or 'black'
  const puzzleSideText = puzzleOrientation === 'black' ? 'Black' : 'White';

  return (
    <div className={styles.PuzzleSolver}>
      {puzzles.length === 0 ? (
        <div className={styles.welcome}>
          <h1>Welcome to Chess Puzzles!</h1>
          <p>Loading puzzles...</p>
        </div>
      ) : (
        <>
          <div className={styles.header}>
            <h2>
              Puzzle {currentIndex + 1} of {puzzles.length}
            </h2>
            <Timer
              key={currentIndex}
              initialTime={120}
              onTimeUp={handleTimeUp}
              isRunning={!isSolved && !isFailed}
            />
          </div>

          {currentPuzzle?.motives && (
            <div className={styles.motives}>
              <strong>Motive:</strong> {currentPuzzle.motives}
            </div>
          )}

          {currentPuzzle?.starting_color && (
            <div className={styles.startingColor}>
              Starting color: <strong>{puzzleSideText}</strong>
            </div>
          )}

          <div className={styles.board}>
            <ChessBoard
              boardOrientation={puzzleOrientation}
              game={game}
              onDrop={handleMove}
            />
          </div>

          {/* Aggressive Error Message */}
          {errorMessage && (
            <div
              className={`${styles.errorMessage} ${
                animateError ? styles.shake : ''
              }`}
            >
              {errorMessage}
            </div>
          )}

          <div className={styles.status}>
            {isSolved && (
              <div className={styles.success}>
                <p>Puzzle Solved!</p>
                <button onClick={handleNextPuzzle}>Next Puzzle</button>
              </div>
            )}
            {isFailed && (
              <div className={styles.failure}>
                <p>Puzzle Failed</p>
                {!showSolution && (
                  <button onClick={handleShowSolution}>Show Solution</button>
                )}
                {showSolution && (
                  <div className={styles.solution}>
                    <p>
                      <strong>Moves ({replayIndex}/{currentPuzzle.moves.length}):</strong>{' '}
                      {currentPuzzle.moves.join(' ')}
                    </p>
                  </div>
                )}
                <button onClick={handleNextPuzzle}>Next Puzzle</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PuzzleSolver;