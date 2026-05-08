const VITE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// Remove trailing slash and /api if user accidentally included it
const BASE_URL = VITE_URL.replace(/\/api\/?$/, '').replace(/\/$/, '');
const API_BASE_URL = `${BASE_URL}/api`;

export default API_BASE_URL;
