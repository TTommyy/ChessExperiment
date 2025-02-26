import axios from 'axios';

const BASE_URL = 'http://20.63.17.189:5001/api/users';

export const registerUser = async (username, password) => {
  const response = await axios.post(`${BASE_URL}/register`, { username, password });
  return response.data;
};

export const loginUser = async (username, password) => {
  const response = await axios.post(`${BASE_URL}/login`, { username, password });
  return response.data;
};