import axios from 'axios';
import { API_BASE_URL } from '../../config/env';
import { getSession, invalidateSession } from '../session/sessionStore';

const client = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

client.interceptors.request.use((config) => {
  const token = getSession()?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.sessionToken = token;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && error.config?.sessionToken) {
      invalidateSession(error.config.sessionToken);
    }
    return Promise.reject(error);
  },
);

export default client;
