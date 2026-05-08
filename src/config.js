const VITE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const BASE_URL = VITE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
const API_BASE_URL = `${BASE_URL}/api`;

console.log('API_BASE_URL initialized as:', API_BASE_URL);

export default API_BASE_URL;
