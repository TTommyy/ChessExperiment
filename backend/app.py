from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import chess
import chess.pgn
from datetime import datetime
import random
import heapq

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///exercises.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
CORS(app)
db = SQLAlchemy(app)

class Exercise(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    initial_fen = db.Column(db.String(100), nullable=False)
    moves = db.Column(db.JSON, nullable=False)
    starting_color = db.Column(db.String(5), nullable=False)
    motives = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@app.route('/api/exercises', methods=['GET', 'POST'])
def handle_exercises():
    if request.method == 'POST':
        data = request.get_json()

        try:
            # Validate moves
            board = chess.Board(data['initial_fen'])
            board.turn = chess.WHITE if data['starting_color'] == 'white' else chess.BLACK

            for move_uci in data['moves']:
                move = chess.Move.from_uci(move_uci)
                if move not in board.legal_moves:
                    return jsonify({'error': f'Invalid move: {move_uci}'}), 400
                board.push(move)

            exercise = Exercise(
                initial_fen=data['initial_fen'],
                moves=data['moves'],
                starting_color=data['starting_color'],
                motives=data['motives']
            )
            db.session.add(exercise)
            db.session.commit()
            return jsonify({'id': exercise.id}), 201

        except Exception as e:
            return jsonify({'error': str(e)}), 400

    elif request.method == 'GET':
        exercises = Exercise.query.all()
        return jsonify([{
            'id': ex.id,
            'initial_fen': ex.initial_fen,
            'moves': ex.moves,
            'starting_color': ex.starting_color,
            'motives': ex.motives,
            'created_at': ex.created_at.isoformat()
        } for ex in exercises])

@app.route('/api/exercises/<int:exercise_id>', methods=['DELETE'])
def delete_exercise(exercise_id):
    exercise = Exercise.query.get(exercise_id)
    if not exercise:
        return jsonify({'error': 'Exercise not found'}), 404

    db.session.delete(exercise)
    db.session.commit()
    return jsonify({'message': 'Exercise deleted successfully'}), 200

@app.route('/api/exercises/sequence', methods=['GET'])
def get_puzzle_sequence():
    exercises = Exercise.query.all()

    # Convert each puzzle row into a dictionary
    all_puzzles = []
    for ex in exercises:
        all_puzzles.append({
            'id': ex.id,
            'initial_fen': ex.initial_fen,
            'moves': ex.moves,
            'starting_color': ex.starting_color,
            'motives': ex.motives
        })


    grouped = {}
    for puzzle in all_puzzles:
        motive = puzzle['motives']
        grouped.setdefault(motive, []).append(puzzle)

    for motive in grouped:
        grouped[motive].sort(key=lambda x: x['id'])


    ordered_list = []
    for motive in sorted(grouped.keys()):
        ordered_list.extend(grouped[motive])

    ordered_list = ordered_list[:21]

    for motive in grouped:
        random.shuffle(grouped[motive])

    heap = []
    for motive, puzzles in grouped.items():
        count = len(puzzles)
        if count > 0:
            # Push (negative_count, motive)
            heapq.heappush(heap, (-count, motive))

    random_list = []
    prev_motive = None
    while heap and len(random_list) < 21:
        count1, motive1 = heapq.heappop(heap)
        count1 = -count1

        if motive1 == prev_motive:
            if not heap:
                break

            count2, motive2 = heapq.heappop(heap)
            count2 = -count2
            puzzle = grouped[motive2].pop()
            random_list.append(puzzle)
            prev_motive = motive2
            count2 -= 1  # used one puzzle

            if count2 > 0:
                heapq.heappush(heap, ( -count2, motive2 ))

            heapq.heappush(heap, (-count1, motive1))
        else:
            puzzle = grouped[motive1].pop()
            random_list.append(puzzle)
            prev_motive = motive1
            count1 -= 1

            if count1 > 0:
                heapq.heappush(heap, (-count1, motive1))


    return jsonify({
        'ordered': ordered_list,    # up to 21 puzzles, grouped by motive
        'random': random_list       # up to 21, no two consecutive same motive
    })
if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5001, host='0.0.0.0')