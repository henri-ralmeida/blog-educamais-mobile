import axios from 'axios';
import { API_BASE_URL } from '../../config/env';
import { getSession, invalidateSession } from '../session/sessionStore';

const client = axios.create({ baseURL: API_BASE_URL, timeout: 10000 });

// Leituras públicas de post e o próprio login não precisam do Bearer. Anexar o
// token a elas ampliava sem motivo a superfície de exposição da credencial
// (rede local, proxy, host errado configurado em EXPO_PUBLIC_API_URL).
function isPublicRequest(config) {
  const url = config?.url ?? '';
  const method = (config?.method ?? 'get').toLowerCase();
  if (url.startsWith('/auth/login')) return true;
  if (method === 'get' && /^\/posts(\/|\?|$)/.test(url)) return true;
  return false;
}

client.interceptors.request.use((config) => {
  if (isPublicRequest(config)) return config;
  const token = getSession()?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Guarda um identificador derivado, não o token cru: config vaza dentro do
    // AxiosError e qualquer console.error(error) imprimiria a credencial inteira.
    config.sessionTokenTail = token.slice(-12);
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const tail = error.config?.sessionTokenTail;
    if (error?.response?.status === 401 && tail) {
      const current = getSession()?.token;
      if (current && current.slice(-12) === tail) invalidateSession(current);
    }
    return Promise.reject(error);
  },
);

export default client;
