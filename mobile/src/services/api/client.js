import axios from 'axios';
import { API_BASE_URL } from '../../config/env';

const client = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

// Fase 1: sempre retorna null (leitura pública, sem sessão).
// Fase 2: lido do AuthContext quando o professor autenticar.
function getCurrentUserType() {
  return null;
}

client.interceptors.request.use((config) => {
  const userType = getCurrentUserType();
  if (userType) config.headers['x-user-type'] = userType;
  return config;
});

export default client;
