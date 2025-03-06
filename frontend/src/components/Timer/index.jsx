import { useEffect, useState, useRef } from 'react';
import styles from './Timer.module.css';

function Timer({ initialTime, onTimeUp, isRunning }) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const endTimeRef = useRef(0);
  const requestRef = useRef(null);
  const puzzleKey = useRef(`${window.location.pathname}-${initialTime}`);
  const intervalRef = useRef(null);
  const lastUpdateRef = useRef(Date.now());

  // On component mount, check if there's a saved timer state
  useEffect(() => {
    const initializeTimer = () => {
      // Try to retrieve saved end time for current puzzle
      const savedEndTime = localStorage.getItem(`puzzle_timer_end_${puzzleKey.current}`);
      const heartbeatKey = `puzzle_timer_heartbeat`;

      if (savedEndTime) {
        // If there's a saved end time, calculate how much time is left
        const now = Date.now();
        const endTime = parseInt(savedEndTime, 10);

        // If the end time is in the future, use it
        if (endTime > now) {
          endTimeRef.current = endTime;
          const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
          setTimeLeft(remaining);

          // Update last update timestamp
          lastUpdateRef.current = now;
          localStorage.setItem(heartbeatKey, now.toString());
        } else {
          // Timer already expired
          setTimeLeft(0);
          endTimeRef.current = 0;
          localStorage.removeItem(`puzzle_timer_end_${puzzleKey.current}`);

          // Run onTimeUp on the next tick to avoid calling it during render
          if (isRunning) {
            setTimeout(() => {
              onTimeUp();
            }, 0);
          }
        }
      } else if (isRunning) {
        // No saved timer, initialize a new one
        const newEndTime = Date.now() + initialTime * 1000;
        endTimeRef.current = newEndTime;
        localStorage.setItem(`puzzle_timer_end_${puzzleKey.current}`, newEndTime.toString());

        // Initialize heartbeat
        lastUpdateRef.current = Date.now();
        localStorage.setItem(heartbeatKey, lastUpdateRef.current.toString());
      }
    };

    // Initialize timer on mount
    initializeTimer();

    // Set up a heartbeat interval to periodically update localStorage
    // This ensures the end time stays fresh even if the main animation frame fails
    intervalRef.current = setInterval(() => {
      if (isRunning && endTimeRef.current > 0) {
        const now = Date.now();
        localStorage.setItem(`puzzle_timer_end_${puzzleKey.current}`, endTimeRef.current.toString());
        localStorage.setItem(`puzzle_timer_heartbeat`, now.toString());
        lastUpdateRef.current = now;
      }
    }, 1000); // Heartbeat every second

    // Add window load event listener for timer synchronization
    const handleLoad = () => {
      // Reinitialize timer on page load
      initializeTimer();
    };

    window.addEventListener('load', handleLoad);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('load', handleLoad);
    };
  }, [initialTime, isRunning, onTimeUp]);

  // Reset timer when initialTime changes (new puzzle)
  useEffect(() => {
    // Update puzzle key when initial time changes (likely a new puzzle)
    puzzleKey.current = `${window.location.pathname}-${initialTime}`;

    // Reset the timer for new puzzles
    setTimeLeft(initialTime);

    // Clean up any previous timer
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    // Clear previous puzzle timer from localStorage
    const previousKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('puzzle_timer_end_') && key !== `puzzle_timer_end_${puzzleKey.current}`) {
        previousKeys.push(key);
      }
    }
    previousKeys.forEach(key => localStorage.removeItem(key));

    // Reset end time
    endTimeRef.current = 0;
  }, [initialTime]);

  useEffect(() => {
    if (!isRunning) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      return;
    }

    // Set the end time when timer starts running
    if (!endTimeRef.current || endTimeRef.current === 0) {
      const newEndTime = Date.now() + timeLeft * 1000;
      endTimeRef.current = newEndTime;
      localStorage.setItem(`puzzle_timer_end_${puzzleKey.current}`, newEndTime.toString());
      localStorage.setItem(`puzzle_timer_heartbeat`, Date.now().toString());
    }

    // Use requestAnimationFrame for more accurate timing
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));

      setTimeLeft(remaining);

      if (remaining <= 0) {
        onTimeUp();
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
        // Clear saved timer when it expires
        localStorage.removeItem(`puzzle_timer_end_${puzzleKey.current}`);
      } else {
        // Continue updating
        requestRef.current = requestAnimationFrame(updateTimer);
      }

      // Update heartbeat if more than a second has passed since last update
      if (now - lastUpdateRef.current >= 1000) {
        localStorage.setItem(`puzzle_timer_heartbeat`, now.toString());
        lastUpdateRef.current = now;
      }
    };

    // Start the animation frame
    requestRef.current = requestAnimationFrame(updateTimer);

    // Cleanup on unmount or when running state changes
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
    };
  }, [isRunning, onTimeUp, timeLeft]);

  // Handle visibility change events
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isRunning) {
        // Check for updated end time in localStorage
        const savedEndTime = localStorage.getItem(`puzzle_timer_end_${puzzleKey.current}`);
        const heartbeatTimestamp = localStorage.getItem(`puzzle_timer_heartbeat`);

        if (savedEndTime) {
          const parsedEndTime = parseInt(savedEndTime, 10);

          // Only update if this end time is still valid (check against heartbeat)
          if (parsedEndTime > 0) {
            endTimeRef.current = parsedEndTime;

            // Recalculate remaining time
            const now = Date.now();
            const newTimeLeft = Math.max(0, Math.ceil((parsedEndTime - now) / 1000));
            setTimeLeft(newTimeLeft);

            // Update heartbeat
            localStorage.setItem(`puzzle_timer_heartbeat`, now.toString());
            lastUpdateRef.current = now;

            // If timer expired while page was hidden, trigger time up
            if (newTimeLeft <= 0) {
              onTimeUp();
              // Clear saved timer
              localStorage.removeItem(`puzzle_timer_end_${puzzleKey.current}`);
            }
          }
        }
      }
    };

    // Function to handle beforeunload event
    const handleBeforeUnload = () => {
      // Ensure the timer end time is saved before page unload
      if (isRunning && endTimeRef.current > 0) {
        localStorage.setItem(`puzzle_timer_end_${puzzleKey.current}`, endTimeRef.current.toString());
        localStorage.setItem(`puzzle_timer_heartbeat`, Date.now().toString());
      }
    };

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRunning, onTimeUp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const barScale = Math.max(0, Math.min(1, timeLeft / initialTime));
  const isLowTime = timeLeft <= 30;
  const timeString = formatTime(timeLeft);

  return (
    <div className={`${styles.timer} ${isLowTime ? styles.lowTimeContainer : ''}`}>
      <div className={styles.timerLabel}>Time Remaining</div>
      <div className={styles.timerContent}>
        <div className={styles.timerProgress}>
          <div
            className={styles.timerBar}
            style={{ transform: `scaleX(${barScale})` }}
          />
        </div>

        <div
          className={
            isLowTime ? `${styles.timerText} ${styles.lowTime}` : styles.timerText
          }
          aria-live="polite"
          role="timer"
        >
          {timeString}
        </div>
      </div>

      <div className={styles.timerIcon}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      </div>
    </div>
  );
}

export default Timer;