import { useState } from 'react';
import { Chess } from 'chess.js';

export const useChessGame = (initialFen) => {
  const [game, setGame] = useState(new Chess(initialFen));

  const resetGame = (fen) => setGame(new Chess(fen));
  const clearBoard = () => setGame(new Chess('8/8/8/8/8/8/8/8 w - - 0 1'));

  return { game, setGame, resetGame, clearBoard };
};