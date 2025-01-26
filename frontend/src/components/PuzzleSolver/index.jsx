import { useState, useEffect, useCallback } from 'react';
import { Chess } from 'chess.js';
import ChessBoard from '../ChessBoard';
import Timer from '../Timer';
import { getPuzzleSequence } from '../../api/exercises';
import styles from './PuzzleSolver.module.css';

const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

function PuzzleSolver(mode) {
  const [game, setGame] = useState(new Chess(initialFen));
  const [puzzles, setPuzzles] = useState([]);
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [moveIndex, setMoveIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    const fetchPuzzles = async () => {
      try {
        const response = await getPuzzleSequence();
        setPuzzles(mode === 'ordered' ? response.data.ordered : response.data.random);
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
  };

  const handleMove = useCallback(
    (sourceSquare, targetSquare) => {
      if (isSolved || isFailed) return false;

      const newGame = new Chess(game.fen());
      const userMove = newGame.move({
        from: sourceSquare,
        to: targetSquare,
      });

      if (!userMove) {
        alert('Illegal move. Try again.');
        return false;
      }

      const uciMove = `${userMove.from}${userMove.to}`;

      if (uciMove === currentPuzzle.moves[moveIndex]) {
        let newMoveIndex = moveIndex + 1;
        setGame(newGame);

        // "Computer" response
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

  const handleShowSolution = () => {
    setShowSolution(true);
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
            <h2>Puzzle {currentIndex + 1} of {puzzles.length}</h2>
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

          <div className={styles.status}>
            {isSolved && (
              <div className={styles.success}>
                Puzzle Solved!
                <button onClick={handleNextPuzzle}>Next Puzzle</button>
              </div>
            )}
            {isFailed && (
              <div className={styles.failure}>
                Puzzle Failed
                {!showSolution && (
                  <button onClick={handleShowSolution}>Show Solution</button>
                )}
                {showSolution && (
                  <div className={styles.solution}>
                    Solution: {currentPuzzle?.moves?.join(' ')}
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