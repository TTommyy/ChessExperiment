from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import chess
import chess.pgn
import random
import heapq
from datetime import datetime
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    jwt_required,
    get_jwt_identity
)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///exercises.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'your-secret-key'  # Change this to a secure secret key
CORS(app)
db = SQLAlchemy(app)
jwt = JWTManager(app)

class Exercise(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    initial_fen = db.Column(db.String(100), nullable=False)
    moves = db.Column(db.JSON, nullable=False)
    starting_color = db.Column(db.String(5), nullable=False)
    motives = db.Column(db.String(200))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)

class Result(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    exercise_id = db.Column(db.Integer, nullable=False)
    user_id = db.Column(db.Integer, nullable=False)
    result = db.Column(db.String(100), nullable=False)
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
        'ordered': ordered_list,
        'random': random_list
    })

@app.route('/api/users/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data['username']
    password = data['password']
    user = User.query.filter_by(username=username).first()
    if user and user.password == password:  # In production, use proper password hashing
        access_token = create_access_token(identity=user.id)
        return jsonify({
            'access_token': access_token,
            'user_id': user.id,
            'username': user.username
        }), 200
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/results', methods=['POST'])
@jwt_required()
def save_result():
    data = request.get_json()
    user_id = get_jwt_identity()  # Get user_id from JWT token
    exercise_id = data['exercise_id']
    result = data['result']
    result = Result(exercise_id=exercise_id, user_id=user_id, result=result)
    db.session.add(result)
    db.session.commit()
    return jsonify({'message': 'Result saved successfully'}), 200

@app.route('/api/results/user', methods=['GET'])
@jwt_required()
def get_user_results():
    user_id = get_jwt_identity()
    results = Result.query.filter_by(user_id=user_id).all()
    return jsonify([{
        'id': r.id,
        'exercise_id': r.exercise_id,
        'result': r.result,
        'created_at': r.created_at.isoformat()
    } for r in results]), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Check if admin user exists before creating
        existing_admin = User.query.filter_by(username='boss').first()
        if not existing_admin:
            user = User(username='boss', password='password')
            db.session.add(user)
            db.session.commit()
    app.run(debug=True, port=5001, host='0.0.0.0')