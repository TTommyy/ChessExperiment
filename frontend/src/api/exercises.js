import axios from 'axios';

const API_URL = 'http://127.0.0.1:5001/api/exercises';

export const fetchExercises = () => axios.get(API_URL);
export const createExercise = (exercise) => axios.post(API_URL, exercise);
export const deleteExercise = (id) => axios.delete(`${API_URL}/${id}`);