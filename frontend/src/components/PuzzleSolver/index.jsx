import { useState, useEffect, useRef } from 'react';
import { Chess } from 'chess.js';
import styles from './PuzzleSolver.module.css';

// Import smaller components
import PuzzleBoard from './PuzzleBoard';
import PuzzleStatus from './PuzzleStatus';
import PuzzleControls from './PuzzleControls';
import PuzzleProgress from './PuzzleProgress';
import PuzzleHeader from './PuzzleHeader';
import Timer from '../Timer';

// Import logic functions
import {
  parsePuzzleMoves,
  makeChessMove,
  makeComputerMove,
  createReplayPosition
} from './PuzzleLogic';

// Import API functions
import { recordPuzzleResult, completeSessionLog } from '../../api/database';

const initialFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const SOLUTION_DISPLAY_TIME = 30; // 30 seconds to view solution

function PuzzleSolver({ exercises, onComplete, onProgressUpdate, userId, sessionId, sessionLogId, initialPuzzleIndex = 0 }) {
  // State declarations
  const [game, setGame] = useState(new Chess(initialFen));
  const [currentPuzzle, setCurrentPuzzle] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(initialPuzzleIndex);
  const [completedExercises, setCompletedExercises] = useState(0);
  const [isSolved, setIsSolved] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [moveIndex, setMoveIndex] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [animateError, setAnimateError] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [solutionTimer, setSolutionTimer] = useState(0);
  const [showSolutionAfterSuccess, setShowSolutionAfterSuccess] = useState(false);

  // New state for tracking metrics
  const [startTime, setStartTime] = useState(null);
  const [totalCorrectMoves, setTotalCorrectMoves] = useState(0);
  const [totalIncorrectMoves, setTotalIncorrectMoves] = useState(0);
  const [puzzleStartTime, setPuzzleStartTime] = useState(null);
  const [elapsedPuzzleTime, setElapsedPuzzleTime] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(Date.now());
  const [movesHistory, setMovesHistory] = useState([]);
  const [puzzleInitialized, setPuzzleInitialized] = useState(false);

  // Function to load a puzzle
  const loadPuzzle = (index) => {
    if (!exercises || exercises.length === 0 || index >= exercises.length) {
      console.log('No exercises to load or invalid index');
      return;
    }

    const puzzle = exercises[index];
    if (!puzzle) {
      console.error('Puzzle is undefined or null');
      return;
    }

    // Parse the puzzle moves
    const { fen, moves, newChess, starting_color } = parsePuzzleMoves(puzzle, initialFen);

    // Set puzzle data
    setGame(newChess);
    setCurrentPuzzle({
      ...puzzle,
      initial_fen: fen,
      moves: moves,
      starting_color: starting_color
    });
    setCurrentIndex(index);

    // Reset state for new puzzle
    setIsSolved(false);
    setIsFailed(false);
    setMoveIndex(0);
    setShowSolution(false);
    setReplayIndex(0);
    setErrorMessage('');
    setAnimateError(false);
    setSolutionTimer(0);
    setShowSolutionAfterSuccess(false);

    // Reset metrics for new puzzle
    setPuzzleStartTime(Date.now());
    setElapsedPuzzleTime(0);
    setMovesHistory([]);

    // Update parent component with current progress
    updateProgress(index);
  };

  // Update the parent component with progress information
  const updateProgress = (currentPuzzleIndex) => {
    if (onProgressUpdate) {
      onProgressUpdate({
        puzzlesCompleted: completedExercises,
        totalPuzzles: exercises.length,
        currentPuzzleIndex: currentPuzzleIndex
      });
    }
  };

  // Function to move to the next puzzle
  const handleNextPuzzle = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < exercises.length) {
      loadPuzzle(nextIndex);
    } else {
      // All puzzles completed
      setSessionCompleted(true);
      if (onComplete) {
        onComplete({
          puzzlesCompleted: completedExercises,
          totalPuzzles: exercises.length,
          currentPuzzleIndex: 0 // Reset for next session
        });
      }
    }
  };

  // Function to handle user moves
  const handleMove = (sourceSquare, targetSquare) => {
    if (isSolved || showSolution || !currentPuzzle) return false;

    // Clear any previous error
    setErrorMessage('');
    setAnimateError(false);

    try {
      // Try to make the move
      const moveResult = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q', // Default to queen promotion
      });

      // If move is invalid or null
      if (!moveResult) {
        setErrorMessage('That move is illegal.');
        triggerErrorAnimation();
        return false;
      }

      // Check if move matches expected solution
      const uciMove = `${sourceSquare}${targetSquare}`;
      const expectedMove = currentPuzzle.moves[moveIndex];

      // Record the move
      const moveData = {
        uci: uciMove,
        expected: expectedMove,
        isCorrect: uciMove === expectedMove,
        timestamp: Date.now()
      };
      setMovesHistory(prev => [...prev, moveData]);

      // Compare move against expected
      if (uciMove === expectedMove) {
        setTotalCorrectMoves(prev => prev + 1);
        let newMoveIndex = moveIndex + 1;

        // Make computer's response move if needed
        if (newMoveIndex < currentPuzzle.moves.length) {
          const computerMoveString = currentPuzzle.moves[newMoveIndex];
          const fromSquare = computerMoveString.substring(0, 2);
          const toSquare = computerMoveString.substring(2, 4);

          setTimeout(() => {
            try {
              const computerResult = game.move({
                from: fromSquare,
                to: toSquare,
                promotion: 'q',
              });

              if (computerResult) {
                setGame(new Chess(game.fen())); // This ensures the UI updates
                newMoveIndex++;
                setMoveIndex(newMoveIndex);

                // Check if puzzle is solved after computer's move
                if (newMoveIndex >= currentPuzzle.moves.length) {
                  setIsSolved(true);
                  setCompletedExercises(prev => prev + 1);
                  // Automatically show solution after success
                  setShowSolutionAfterSuccess(true);
                  setShowSolution(true);
                  setReplayIndex(0);
                  // Start a timer to show the solution for 5 seconds before moving to next puzzle
                  setSolutionTimer(5);

                  // Update progress with new completion count
                  updateProgress(currentIndex);
                }
              }
            } catch (error) {
              console.error("Computer move error:", error);
            }
          }, 300); // Small delay before computer move
        } else {
          // Puzzle is solved if no more computer moves
          setIsSolved(true);
          setCompletedExercises(prev => prev + 1);
          setMoveIndex(newMoveIndex);
          // Automatically show solution after success
          setShowSolutionAfterSuccess(true);
          setShowSolution(true);
          setReplayIndex(0);
          // Start a timer to show the solution for 5 seconds before moving to next puzzle
          setSolutionTimer(5);

          // Update progress with new completion count
          updateProgress(currentIndex);
        }
      } else {
        // It's a legal move but not the correct solution
        setTotalIncorrectMoves(prev => prev + 1);
        setErrorMessage('Incorrect move. Try again!');
        triggerErrorAnimation();
        setIsFailed(true);

        // Reset the game to the previous state
        game.undo();
        setGame(new Chess(game.fen()));

        // Automatically show solution after incorrect move
        handleShowSolution();

        // Start solution timer (30 seconds)
        setSolutionTimer(SOLUTION_DISPLAY_TIME);

        // Record the elapsed time when puzzle is failed
        const timeSpent = Math.floor((Date.now() - puzzleStartTime) / 1000);
        setElapsedPuzzleTime(timeSpent);

        // Submit puzzle result to backend
        submitPuzzleResult(false);

        return false;
      }

      // Update the game state to reflect the move
      setGame(new Chess(game.fen()));
      return true;
    } catch (error) {
      console.error("Move error:", error);
      setErrorMessage('That move is illegal.');
      triggerErrorAnimation();
      return false;
    }
  };

  // Handler for timer expiration
  const handleTimeUp = () => {
    setIsFailed(true);
    // Automatically show solution when time is up
    handleShowSolution();
    // Start solution timer (30 seconds)
    setSolutionTimer(SOLUTION_DISPLAY_TIME);

    // Record elapsed time when time is up
    const timeSpent = Math.floor((Date.now() - puzzleStartTime) / 1000);
    setElapsedPuzzleTime(timeSpent);

    // Submit puzzle result to backend
    submitPuzzleResult(false);
  };

  // Handler for showing solution
  const handleShowSolution = () => {
    if (!currentPuzzle) return;

    setShowSolution(true);
    setReplayIndex(0); // Start from beginning

    // Reset the game state to the initial position
    try {
      const initialPosition = new Chess(currentPuzzle.initial_fen);
      setGame(initialPosition);
    } catch (error) {
      console.error("Error resetting to initial position:", error);
    }
  };

  // Handler for previous move in solution replay
  const handlePrevMove = () => {
    if (replayIndex > 0) {
      setReplayIndex(replayIndex - 1);
    }
  };

  // Handler for next move in solution replay
  const handleNextMove = () => {
    if (currentPuzzle && replayIndex < currentPuzzle.moves.length) {
      setReplayIndex(replayIndex + 1);
    }
  };

  // Error animation trigger
  const triggerErrorAnimation = () => {
    setAnimateError(true);
    setTimeout(() => setAnimateError(false), 500);
  };

  // Function to submit puzzle result to backend
  const submitPuzzleResult = async (isSolved) => {
    if (!currentPuzzle || !userId || !sessionId) return;

    const timeSpent = elapsedPuzzleTime || Math.floor((Date.now() - puzzleStartTime) / 1000);

    const correctMoves = movesHistory.filter(move => move.isCorrect).length;
    const incorrectMoves = movesHistory.filter(move => !move.isCorrect).length;
    const attempts = correctMoves + incorrectMoves;

    try {
      await recordPuzzleResult(
        currentPuzzle.id,
        sessionId,
        isSolved,
        attempts,
        correctMoves,
        incorrectMoves,
        timeSpent
      );
      console.log('Puzzle result submitted successfully');
    } catch (error) {
      console.error('Error submitting puzzle result:', error);
    }
  };

  // Function to complete the session
  const completeSession = async () => {
    if (!userId || !sessionLogId) return;

    const totalTimeSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

    try {
      const data = await completeSessionLog(
        sessionLogId,
        totalTimeSeconds,
        completedExercises,
        totalCorrectMoves
      );
      console.log('Session completed successfully, next available at:', data.next_available_at);
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  // Load first puzzle when exercises are loaded, or start from remembered index
  useEffect(() => {
    if (exercises.length > 0 && !puzzleInitialized) {
      loadPuzzle(initialPuzzleIndex);
      setPuzzleInitialized(true);
    }
  }, [exercises, puzzleInitialized, initialPuzzleIndex]);

  // Check if all exercises are completed
  useEffect(() => {
    if (completedExercises >= exercises.length && exercises.length > 0) {
      setSessionCompleted(true);
      if (onComplete) {
        onComplete({
          puzzlesCompleted: completedExercises,
          totalPuzzles: exercises.length,
          currentPuzzleIndex: 0 // Reset for next session
        });
      }
    }
  }, [completedExercises, exercises.length, onComplete]);

  // Solution timer countdown
  useEffect(() => {
    if (solutionTimer <= 0) return;

    const timer = setTimeout(() => {
      setSolutionTimer(prev => {
        if (prev <= 1) {
          // When timer reaches 0, move to next puzzle
          handleNextPuzzle();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [solutionTimer]);

  // Auto-load next puzzle when solved
  useEffect(() => {
    if (isSolved && !showSolutionAfterSuccess) {
      const timer = setTimeout(() => {
        handleNextPuzzle();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSolved, showSolutionAfterSuccess]);

  // Apply moves during solution replay
  useEffect(() => {
    if (!currentPuzzle || !showSolution || replayIndex < 0) return;

    try {
      // Create a new chess instance with the initial position
      const replayChess = createReplayPosition(currentPuzzle, currentPuzzle.moves, replayIndex);

      if (replayChess) {
        setGame(replayChess);
      }
    } catch (error) {
      console.error("Error during solution replay:", error);
    }
  }, [replayIndex, currentPuzzle, showSolution]);

  // Update when a puzzle is solved to submit the result
  useEffect(() => {
    if (isSolved && currentPuzzle) {
      // Record the elapsed time when puzzle is solved
      const timeSpent = Math.floor((Date.now() - puzzleStartTime) / 1000);
      setElapsedPuzzleTime(timeSpent);

      // Submit puzzle result to backend
      submitPuzzleResult(true);
    }
  }, [isSolved, currentPuzzle]);

  // Submit session results when all exercises are completed
  useEffect(() => {
    if (sessionCompleted) {
      completeSession();

      // Pass the final progress information to the parent component
      onComplete?.({
        puzzlesCompleted: completedExercises,
        totalPuzzles: exercises.length,
        currentPuzzleIndex: 0 // Reset for next session
      });
    }
  }, [sessionCompleted]);

  // Update completed puzzles tracking
  useEffect(() => {
    if (exercises && exercises.length > 0) {
      // Report progress to parent component
      updateProgress(currentIndex);
    }
  }, [completedExercises, exercises, currentIndex]);

  // Render loading state
  if (!exercises || exercises.length === 0) {
    return (
      <div className={styles.PuzzleSolver}>
        <div className={styles.welcome}>
          <h1>Welcome to Chess Puzzles!</h1>
          <p>Loading puzzles...</p>
        </div>
      </div>
    );
  }

  // Render completion state
  if (sessionCompleted) {
    return (
      <div className={styles.PuzzleSolver}>
        <div className={styles.sessionComplete}>
          <h1>Session Complete!</h1>
          <p>Thank you for completing this session.</p>
          <p>Your next session will be available after 24 hours.</p>
          <p>Correct puzzles: {completedExercises} / {exercises.length}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.PuzzleSolver}>
      <PuzzleHeader
        currentIndex={currentIndex}
        totalPuzzles={exercises.length}
      />

      <div className={styles.boardContainer}>
        <PuzzleBoard
          game={game}
          orientation={currentPuzzle?.starting_color || 'white'}
          onMove={handleMove}
        />

        <div className={styles.sidePanel}>
          {showSolution ? (
            <div className={styles.solutionTimer}>
              <strong>Next puzzle in: </strong>
              <span>{solutionTimer}s</span>
            </div>
          ) : (
            <Timer
              key={currentIndex}
              initialTime={120}
              onTimeUp={handleTimeUp}
              isRunning={!isSolved && !isFailed}
            />
          )}

          <div className={styles.puzzleDetails}>
            {currentPuzzle?.motives && (
              <div className={styles.motives}>
                <strong>Motive</strong>
                <span className={styles.motiveText}>{currentPuzzle.motives}</span>
                <div className={styles.motiveIcon}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                    <path d="M2 17l10 5 10-5"></path>
                    <path d="M2 12l10 5 10-5"></path>
                  </svg>
                </div>
              </div>
            )}

            <div className={styles.startingColor}>
              <strong>Starting color</strong>
              <span className={styles.colorText}>{currentPuzzle?.starting_color === 'black' ? 'Black' : 'White'}</span>
              <div className={styles.colorIcon}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  <path d="M2 12h20"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PuzzleStatus
        errorMessage={errorMessage}
        animateError={animateError}
        isSolved={isSolved}
        isFailed={isFailed}
        showSolution={showSolution}
        solutionTimer={solutionTimer}
      />

      <PuzzleControls
        isSolved={isSolved}
        isFailed={isFailed}
        showSolution={showSolution}
        onPrevMove={handlePrevMove}
        onNextMove={handleNextMove}
        currentMoveIndex={replayIndex}
        totalMoves={currentPuzzle?.moves?.length || 0}
      />

      <PuzzleProgress
        completedExercises={completedExercises}
        totalExercises={exercises.length}
      />
    </div>
  );
}

export default PuzzleSolver;