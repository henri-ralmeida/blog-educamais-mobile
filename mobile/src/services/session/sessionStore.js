// Módulo puro: mantém o token fora do Context React usado pelo client HTTP e
// publica invalidações para a UI quando a API rejeita a sessão.
let currentSession = null;
const invalidationListeners = new Set();

export function setSession(session) {
  currentSession = session;
}

export function clearSession() {
  currentSession = null;
}

export function getSession() {
  return currentSession;
}

export function invalidateSession(expectedToken) {
  if (!currentSession || currentSession.token !== expectedToken) return;
  currentSession = null;
  invalidationListeners.forEach((listener) => listener());
}

export function subscribeToSessionInvalidation(listener) {
  invalidationListeners.add(listener);
  return () => invalidationListeners.delete(listener);
}
