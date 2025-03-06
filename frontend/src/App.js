import styles from './App.module.css';
import Login from './components/Login';
import PuzzleSolver from './components/PuzzleSolver';
import LogoutModal from './components/LogoutModal';
import StudyCompleted from './components/StudyCompleted';

import { logout } from './api/users';
import { useState, useEffect } from 'react';
import { updateUserSession, getExercisesForSession, createSessionLog, completeSessionLog } from './api/database';

// Maximum number of sessions in the study
const MAX_SESSIONS = 5;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({
    userId: null,
    username: '',
    groupId: null,
    currentSession: null
  });
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [lastSessionTime, setLastSessionTime] = useState(null);
  const [sessionLogId, setSessionLogId] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sessionProgress, setSessionProgress] = useState({
    puzzlesCompleted: 0,
    totalPuzzles: 0,
    currentPuzzleIndex: 0
  });
  const [sessionStartTime, setSessionStartTime] = useState(null);

  // Restore user session from localStorage on initial load
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      restoreUserSession();
    }
  }, []);

  // Load exercises when user starts a session
  useEffect(() => {
    if (sessionActive && userInfo.groupId && userInfo.currentSession) {
      loadExercisesForCurrentSession();
    }
  }, [sessionActive, userInfo.groupId, userInfo.currentSession]);

  // Restore user session from localStorage
  const restoreUserSession = () => {
    const userId = localStorage.getItem('user_id');
    const username = localStorage.getItem('username');
    const groupId = localStorage.getItem('group_id');
    const currentSession = localStorage.getItem('current_session');
    const lastSessionCompleted = localStorage.getItem('last_session_time');
    const savedPuzzleIndex = localStorage.getItem('current_puzzle_index');
    const savedPuzzlesCompleted = localStorage.getItem('puzzles_completed');

    setUserInfo({
      userId,
      username,
      groupId: Number(groupId),
      currentSession: Number(currentSession)
    });

    if (lastSessionCompleted) {
      setLastSessionTime(new Date(lastSessionCompleted));
    }

    // Restore saved puzzle progress if available
    if (savedPuzzleIndex || savedPuzzlesCompleted) {
      setSessionProgress({
        puzzlesCompleted: savedPuzzlesCompleted ? Number(savedPuzzlesCompleted) : 0,
        totalPuzzles: 0, // Will be updated when exercises are loaded
        currentPuzzleIndex: savedPuzzleIndex ? Number(savedPuzzleIndex) : 0
      });
    }

    // Check if there was an active session when the page was refreshed
    const wasSessionActive = localStorage.getItem('session_active') === 'true';
    if (wasSessionActive) {
      // Also restore the session log ID if available
      const savedSessionLogId = localStorage.getItem('session_log_id');
      if (savedSessionLogId) {
        setSessionLogId(savedSessionLogId);
      }

      setSessionActive(true);
      setShowInstructions(false);

      // Restore session start time if available
      const savedStartTime = localStorage.getItem('session_start_time');
      if (savedStartTime) {
        setSessionStartTime(Number(savedStartTime));
      } else {
        // If no saved start time, set to current time
        setSessionStartTime(Date.now());
      }
    }

    setIsLoggedIn(true);
    console.log(`User session restored: ${username}, Group: ${groupId}, Session: ${currentSession}`);
  }

  const loadExercisesForCurrentSession = async () => {
    if (!userInfo.groupId || !userInfo.currentSession) return;

    // If user has completed all sessions, don't load exercises
    if (userInfo.currentSession > MAX_SESSIONS) {
      setExercises([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const exerciseData = await getExercisesForSession(
        userInfo.groupId,
        userInfo.currentSession
      );
      console.log('Exercises data received from API:', exerciseData);
      setExercises(exerciseData);

      // Update total puzzles in session progress
      setSessionProgress(prev => ({
        ...prev,
        totalPuzzles: exerciseData.length
      }));

      console.log(`Loaded ${exerciseData.length} exercises for Group ${userInfo.groupId}, Session ${userInfo.currentSession}`);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // If session is active, show the confirmation modal
    if (sessionActive) {
      setShowLogoutModal(true);
    } else {
      // If no active session, proceed with logout immediately
      performLogout();
    }
  };

  // Function to actually perform the logout
  const performLogout = async () => {
    // If there's an active session, complete it before logging out
    if (sessionActive && sessionLogId) {
      try {
        await completeAndAdvanceSession();
      } catch (error) {
        console.error('Error completing session during logout:', error);
      }
    }

    // Proceed with logout
    logout();
    resetAppState();

    // Clear session-related localStorage items
    localStorage.removeItem('current_puzzle_index');
    localStorage.removeItem('puzzles_completed');
    localStorage.removeItem('session_active');
    localStorage.removeItem('session_log_id');
    localStorage.removeItem('session_start_time');
  };

  // Reset the application state after logout
  const resetAppState = () => {
    setIsLoggedIn(false);
    setSessionActive(false);
    setShowInstructions(true);
    setUserInfo({
      userId: null,
      username: '',
      groupId: null,
      currentSession: null
    });
    setExercises([]);
    localStorage.removeItem('last_session_time');
    setLastSessionTime(null);
    setSessionLogId(null);
    setShowLogoutModal(false);
  }

  // Complete current session and advance to next
  const completeAndAdvanceSession = async () => {
    // Calculate total time for the session
    const totalTimeSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

    // Complete the current session
    await completeSessionLog(
      sessionLogId,
      totalTimeSeconds,
      sessionProgress.puzzlesCompleted,
      Math.min(sessionProgress.puzzlesCompleted, sessionProgress.totalPuzzles)
    );

    // Advance to the next session
    const newSession = await updateUserSession(userInfo.userId);

    // Record session completion time
    const now = new Date();
    localStorage.setItem('last_session_time', now.toISOString());
    localStorage.setItem('current_session', newSession);

    // Clear puzzle progress when completing a session
    localStorage.removeItem('current_puzzle_index');
    localStorage.removeItem('puzzles_completed');
    localStorage.removeItem('session_active');
    localStorage.removeItem('session_log_id');
    localStorage.removeItem('session_start_time');

    console.log(`Session completed during logout. Advanced to session ${newSession}`);
    return newSession;
  }

  // Function to cancel logout
  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleLoginSuccess = () => {
    restoreUserSession();
  };

  // When user finishes a session, update to the next one
  const handleSessionComplete = async (progress = {}) => {
    if (!userInfo.userId) return;

    // Update session progress with the final values
    setSessionProgress(progress);

    try {
      const newSession = await updateUserSession(userInfo.userId);

      // Record session completion time
      const now = new Date();
      localStorage.setItem('last_session_time', now.toISOString());
      setLastSessionTime(now);

      // Update local state and localStorage
      setUserInfo(prev => ({
        ...prev,
        currentSession: newSession
      }));
      localStorage.setItem('current_session', newSession);

      // Clear puzzle progress when completing a session
      localStorage.removeItem('current_puzzle_index');
      localStorage.removeItem('puzzles_completed');
      localStorage.removeItem('session_active');
      localStorage.removeItem('session_log_id');
      localStorage.removeItem('session_start_time');

      console.log(`Session completed. Advanced to session ${newSession}`);

      // End the current session
      setSessionActive(false);
      // Show instructions for the next session
      setShowInstructions(true);
      // Reset session progress for next session
      setSessionProgress({
        puzzlesCompleted: 0,
        totalPuzzles: 0,
        currentPuzzleIndex: 0
      });
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  // Add handler to update progress during session
  const handleProgressUpdate = (progress) => {
    // Store current progress in localStorage
    if (progress.currentPuzzleIndex !== undefined) {
      localStorage.setItem('current_puzzle_index', progress.currentPuzzleIndex);
    }

    if (progress.puzzlesCompleted !== undefined) {
      localStorage.setItem('puzzles_completed', progress.puzzlesCompleted);
    }

    setSessionProgress(progress);
  };

  const startSession = async () => {
    if (!userInfo.userId || !userInfo.currentSession) return;

    try {
      const sessionLog = await createSessionLog(userInfo.userId, userInfo.currentSession);
      setSessionLogId(sessionLog.session_log_id);

      // Store session log ID in localStorage
      localStorage.setItem('session_log_id', sessionLog.session_log_id);

      const startTime = Date.now();
      setSessionStartTime(startTime);

      // Store session start time and active state in localStorage
      localStorage.setItem('session_start_time', startTime);
      localStorage.setItem('session_active', 'true');

      setShowInstructions(false);
      setSessionActive(true);
    } catch (error) {
      console.error('Error creating session log:', error);
      // Still allow the session to start even if logging fails
      setShowInstructions(false);
      setSessionActive(true);

      // Store session state even if logging fails
      localStorage.setItem('session_active', 'true');
      localStorage.setItem('session_start_time', Date.now());
    }
  };

  // Check if 24 hours have passed since the last session
  const canStartNextSession = () => {
    if (!lastSessionTime) return true;

    // If the user has completed all sessions, they can't start a new one
    if (userInfo.currentSession > MAX_SESSIONS) return false;

    const now = new Date();
    const hoursSinceLastSession = (now - lastSessionTime) / (1000 * 60 * 60);
    return hoursSinceLastSession >= 24;
  };

  // Check if the user has completed all sessions
  const hasCompletedAllSessions = () => {
    return userInfo.currentSession > MAX_SESSIONS;
  };

  // Common session info for LogoutModal
  const getSessionInfo = () => ({
    currentSession: userInfo.currentSession,
    maxSessions: MAX_SESSIONS,
    puzzlesCompleted: sessionProgress.puzzlesCompleted,
    totalPuzzles: sessionProgress.totalPuzzles || exercises.length
  });

  // Render the logout modal
  const renderLogoutModal = (sessionInfo = null) => (
    <LogoutModal
      isOpen={showLogoutModal}
      onConfirm={performLogout}
      onCancel={cancelLogout}
      sessionInfo={sessionInfo}
    />
  );

  // Render user info panel
  const renderUserInfoPanel = () => (
    <div className={styles.userInfoPanel}>
      <h3>Welcome, {userInfo.username}!</h3>
      <p>Group: {userInfo.groupId}</p>
      <p>Session: {userInfo.currentSession} of {MAX_SESSIONS}</p>
      <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
    </div>
  );

  // User is not logged in
  if (!isLoggedIn) {
    return (
      <>
        {renderLogoutModal()}
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  // User has completed all sessions
  if (hasCompletedAllSessions()) {
    return (
      <StudyCompleted
        username={userInfo.username}
        onLogout={performLogout}
      />
    );
  }

  // Loading state
  if (loading) {
    return (
      <>
        {renderLogoutModal(getSessionInfo())}
        <div className={styles.loadingContainer}>
          <h2>Loading puzzle exercises...</h2>
          <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
        </div>
      </>
    );
  }

  // Show instructions screen
  if (!sessionActive && showInstructions) {
    const waitTimeLeft = lastSessionTime && !canStartNextSession() ?
      Math.ceil(24 - ((new Date() - lastSessionTime) / (1000 * 60 * 60))) : 0;

    const isLastSession = userInfo.currentSession === MAX_SESSIONS;

    return (
      <>
        {renderLogoutModal(getSessionInfo())}
        <div className={styles.instructionsContainer}>
          {renderUserInfoPanel()}

          <div className={styles.instructions}>
            <h2>Instructions</h2>
            <div className={styles.instructionsContent}>
              <p>In this study, you will solve a series of chess puzzles. Each puzzle has a specific solution that you need to find.</p>
              <p>You will have 2 minutes to solve each puzzle. If you can't solve it within the time limit, the solution will be shown to you.</p>
              <p>Try to solve as many puzzles as you can correctly. Your progress will be saved between sessions.</p>
              <p>This research aims to understand how different chess training methods affect puzzle-solving abilities.</p>

              {isLastSession && (
                <div className={styles.finalSessionNote}>
                  <p><strong>Note:</strong> This is your final session in the study. Thank you for your participation!</p>
                </div>
              )}

              <p>Remember:</p>
              <ul>
                <li>Make your moves by dragging the pieces</li>
                <li>White pieces are at the bottom, black at the top (unless otherwise specified)</li>
                <li>The timer shows how much time you have left for the current puzzle</li>
                <li>You need to complete {MAX_SESSIONS} sessions in total, with at least 24 hours between sessions</li>
              </ul>
            </div>

            {userInfo.currentSession > 1 && lastSessionTime && !canStartNextSession() ? (
              <div className={styles.waitMessage}>
                <h3>Please wait before starting the next session</h3>
                <p>You need to wait at least 24 hours between sessions.</p>
                <p>Time remaining: approximately {waitTimeLeft} hour{waitTimeLeft !== 1 ? 's' : ''}</p>
              </div>
            ) : (
              <div className={styles.startPrompt}>
                <h3>Are you ready to begin?</h3>
                <button
                  onClick={startSession}
                  className={styles.startSessionButton}
                  disabled={userInfo.currentSession > 1 && !canStartNextSession()}
                >
                  Yes, I'm ready
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }

  // Display user info and session start button
  if (!sessionActive) {
    const isLastSession = userInfo.currentSession === MAX_SESSIONS;

    return (
      <>
        {renderLogoutModal(getSessionInfo())}
        <div className={styles.sessionStart}>
          {renderUserInfoPanel()}

          <div className={styles.startSessionContainer}>
            <h2>Chess Puzzle Training</h2>
            {isLastSession && (
              <div className={styles.finalSessionNote}>
                <p><strong>Note:</strong> This is your final session in the study. Thank you for your participation!</p>
              </div>
            )}
            <p>Ready to solve some chess puzzles?</p>
            <button
              onClick={() => setShowInstructions(true)}
              className={styles.instructionsButton}
            >
              View Instructions
            </button>
            <button
              onClick={startSession}
              className={styles.startSessionButton}
              disabled={userInfo.currentSession > 1 && !canStartNextSession()}
            >
              Start Puzzle Session
            </button>
          </div>
        </div>
      </>
    );
  }

  // Render the PuzzleSolver with the loaded exercises
  return (
    <>
      {renderLogoutModal(getSessionInfo())}
      <div className={styles.appContainer}>
        <div className={styles.headerBar}>
          <div className={styles.userInfo}>
            <span>User: {userInfo.username} | Group: {userInfo.groupId} | Session: {userInfo.currentSession}/{MAX_SESSIONS}</span>
          </div>
          <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
        </div>

        <div className={styles.puzzleSolverContainer}>
          <PuzzleSolver
            exercises={exercises}
            onComplete={handleSessionComplete}
            onProgressUpdate={handleProgressUpdate}
            userId={userInfo.userId}
            sessionId={userInfo.currentSession}
            sessionLogId={sessionLogId}
            initialPuzzleIndex={sessionProgress.currentPuzzleIndex}
          />
        </div>
      </div>
    </>
  );
}

export default App;