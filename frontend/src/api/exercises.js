import axios from 'axios';

const API_URL = 'http://localhost:5001/api/exercises';

export const fetchExercises = () => axios.get(API_URL);
export const createExercise = (exercise) => axios.post(API_URL, exercise);
export const deleteExercise = (id) => axios.delete(`${API_URL}/${id}`);
export const getPuzzleSequence = () => axios.get(`${API_URL}/sequence`);