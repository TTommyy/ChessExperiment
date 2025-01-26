import React from 'react';
import { Chessboard } from 'react-chessboard';
import styles from './ChessBoard.module.css';

function ChessBoard({
  game,
  position,
  onDrop,
  boardOrientation = 'white',
  boardWidth = 600,
}) {
  return (
    <div className={styles.chessBoardContainer}>
      <Chessboard
        position={position || game?.fen() || 'start'}
        onPieceDrop={onDrop}
        boardOrientation={boardOrientation}
        boardWidth={boardWidth}
        customDarkSquareStyle={{ backgroundColor: '#779952' }}
        customLightSquareStyle={{ backgroundColor: '#edeed1' }}
        customBoardStyle={{
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        }}
        arePiecesDraggable={true}
        arePremovesAllowed={false}
        snapToCursor={false} // Ensures the piece follows the cursor smoothly
      />
    </div>
  );
}

export default ChessBoard;