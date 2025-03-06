import { useEffect, useState } from 'react';
import styles from './Timer.module.css';

function Timer({ initialTime, onTimeUp, isRunning }) {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onTimeUp]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const barScale = timeLeft / initialTime;
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