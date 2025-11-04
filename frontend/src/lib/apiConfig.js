// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_URL = `${API_BASE_URL}/api`;

// You can add other API-related configurations here
export const API_TIMEOUT = 30000; // 30 seconds
