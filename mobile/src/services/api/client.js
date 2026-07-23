import axios from 'axios';
import { API_BASE_URL } from '../../config/env';
import { getSession } from '../session/sessionStore';

const client = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

// Lê o papel atual da sessão via sessionStore (módulo puro, atualizado por
// AuthContext.login()/logout()) — client.js não pode importar Context React.
function getCurrentUserType() {
  return getSession()?.role ?? null;
}

client.interceptors.request.use((config) => {
  const userType = getCurrentUserType();
  if (userType) config.headers['x-user-type'] = userType;
  return config;
});

export default client;
