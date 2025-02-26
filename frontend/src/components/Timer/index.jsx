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

  return (
    <div className={styles.timer}>
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
      >
        {formatTime(timeLeft)}
      </div>
    </div>
  );
}

export default Timer;