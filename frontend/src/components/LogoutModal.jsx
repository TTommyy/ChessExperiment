import React from 'react';
import styles from './LogoutModal.module.css';

const LogoutModal = ({ isOpen, onConfirm, onCancel, sessionInfo }) => {
  if (!isOpen) return null;

  const {
    currentSession = 1,
    maxSessions = 5,
    puzzlesCompleted = 0,
    totalPuzzles = 0
  } = sessionInfo || {};

  const progressPercentage = totalPuzzles > 0
    ? Math.round((puzzlesCompleted / totalPuzzles) * 100)
    : 0;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h2>Confirm Logout</h2>
        <div className={styles.modalContent}>
          <p>
            <strong>Warning:</strong> If you logout now, you cannot return to this session.
          </p>
          <p>Any unsaved progress will be lost.</p>

          {sessionInfo && (
            <div className={styles.sessionInfo}>
              <p>Current session: {currentSession} of {maxSessions}</p>
              <div className={styles.progressInfo}>
                <span>Progress: {puzzlesCompleted} of {totalPuzzles} puzzles ({progressPercentage}%)</span>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <p className={styles.confirmQuestion}>Are you sure you want to logout?</p>
        </div>
        <div className={styles.modalButtons}>
          <button
            className={`${styles.modalButton} ${styles.cancelButton}`}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`${styles.modalButton} ${styles.confirmButton}`}
            onClick={onConfirm}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;