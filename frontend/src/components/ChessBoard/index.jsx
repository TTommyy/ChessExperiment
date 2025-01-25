import { Chessboard } from 'react-chessboard';

const ChessBoard = ({ game, onDrop }) => {
  const customStyles = {
    borderRadius: '4px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
  };

  return (
    <div style={{
      margin: '20px auto',
      padding: '20px',
      backgroundColor: '#fff',
      borderRadius: '8px'
    }}>
      <Chessboard
        position={game.fen()}
        onPieceDrop={onDrop}
        boardWidth={560}
        customBoardStyle={customStyles}
        customDarkSquareStyle={{ backgroundColor: '#779952' }}
        customLightSquareStyle={{ backgroundColor: '#edeed1' }}
      />
    </div>
  );
};

export default ChessBoard;