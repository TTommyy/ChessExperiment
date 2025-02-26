export const API_URL = 'http://4.251.8.177:5001/api';

export const getAuthConfig = () => {
    const token = localStorage.getItem('access_token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};