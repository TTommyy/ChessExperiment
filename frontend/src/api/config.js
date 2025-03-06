export const API_URL = 'http://localhost:5001/api';

export const getAuthConfig = () => {
    const token = localStorage.getItem('access_token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};