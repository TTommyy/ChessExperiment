import { useEffect, useState } from 'react';
import styles from './Timer.module.css';

function Timer({ initialTime, onTimeUp, isRunning }) {
  const [timeLeft, setTimeLeft] = useState(initialTime);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        // If time runs out, clear interval and trigger callback
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Cleanup on unmount or if isRunning changes
    return () => clearInterval(interval);
  }, [isRunning, onTimeUp]);

  // Convert seconds into mm:ss format
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Calculate bar width as a percentage
  const barWidth = (timeLeft / initialTime) * 100;

  return (
    <div className={styles.timer}>
      <div className={styles.timerProgress}>
        <div
          className={styles.timerBar}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      <div className={styles.timerText}>{formatTime(timeLeft)}</div>
    </div>
  );
}

export default Timer;