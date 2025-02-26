import axios from 'axios';

const API_URL = 'http://20.63.17.189:5001/api/exercises';

// Helper to retrieve auth config with JWT token from localStorage
const getAuthConfig = () => {
  const accessToken = localStorage.getItem('access_token');
  return {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
};

export const fetchExercises = () => axios.get(API_URL, getAuthConfig());
export const createExercise = (exercise) => axios.post(API_URL, exercise, getAuthConfig());
export const deleteExercise = (id) => axios.delete(`${API_URL}/${id}`, getAuthConfig());
export const getPuzzleSequence = () => axios.get(`${API_URL.replace('exercises','exercises')}/sequence`, getAuthConfig());