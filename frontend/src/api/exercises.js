import axios from 'axios';
import { API_URL } from './config';
// Helper to retrieve auth config with JWT token from localStorage
const getAuthConfig = () => {
  const accessToken = localStorage.getItem('access_token');
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
};

export const fetchExercises = () => axios.get(API_URL + '/exercises', getAuthConfig());
export const createExercise = (exercise) => axios.post(API_URL + '/exercises', exercise, getAuthConfig());
export const deleteExercise = (id) => axios.delete(API_URL + '/exercises/' + id, getAuthConfig());
export const getPuzzleSequence = () => axios.get(API_URL + '/exercises/sequence', getAuthConfig());