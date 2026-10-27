import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'sharemeal-csrf',
  xsrfHeaderName: 'X-CSRF-Token',
  headers: { 'Content-Type': 'application/json' },
});

export function getErrorMessage(error) {
  return error.response?.data?.message || error.message || 'Something went wrong. Please try again.';
}

export default api;
