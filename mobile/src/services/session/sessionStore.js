// Módulo puro (sem import de React): desacopla client.js (não pode importar Context React)
// de AuthContext.jsx. AuthContext chama setSession()/clearSession() em login()/logout();
// client.js chama getSession() dentro do interceptor.
let currentSession = null;

export function setSession(session) {
  currentSession = session; // { role: 'teacher', name }
}

export function clearSession() {
  currentSession = null;
}

export function getSession() {
  return currentSession;
}
