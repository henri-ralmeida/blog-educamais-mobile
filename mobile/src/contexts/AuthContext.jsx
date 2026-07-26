import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setSession,
  clearSession,
  invalidateSession,
  subscribeToSessionInvalidation,
} from '../services/session/sessionStore';
import { authService } from '../services/authService';

const SESSION_KEY = '@blogeducamais:session';

const AuthContext = createContext(null);

function decodeBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');

  if (typeof globalThis.atob === 'function') {
    return globalThis.atob(padded);
  }

  if (typeof globalThis.Buffer !== 'undefined') {
    return globalThis.Buffer.from(padded, 'base64').toString('utf8');
  }

  throw new Error('Decodificador base64 indisponível');
}

function getTokenExpiresAt(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return null;
    const expiresAt = payload.exp * 1000;
    return Number.isSafeInteger(expiresAt) ? expiresAt : null;
  } catch {
    return null;
  }
}

function normalizeSession(session) {
  if (
    session === null
    || typeof session !== 'object'
    || Array.isArray(session)
    || typeof session.token !== 'string'
    || session.token.trim().length === 0
    || session.professor === null
    || typeof session.professor !== 'object'
    || Array.isArray(session.professor)
    || session.professor.id === undefined
    || session.professor.id === null
    || typeof session.professor.nome !== 'string'
    || session.professor.nome.trim().length === 0
  ) {
    return null;
  }

  // O payload decodificado fornece apenas a expiração local. Autenticidade e
  // autorização continuam sendo responsabilidade da API, que verifica a assinatura.
  const expiresAt = getTokenExpiresAt(session.token);
  if (expiresAt === null || expiresAt <= Date.now()) return null;
  return { ...session, expiresAt };
}

const initialState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
};

function scheduleExpiry(expiresAt, onExpire) {
  const delay = expiresAt - Date.now();
  if (delay <= 0) {
    onExpire();
    return null;
  }
  if (delay > 2 ** 31 - 1) return null; // setTimeout não aceita delay acima do signed int32.
  return setTimeout(onExpire, delay);
}

function reducer(state, action) {
  switch (action.type) {
    case 'RESTORE':
      return {
        ...state,
        isAuthenticated: !!action.session,
        user: action.session?.professor ?? null,
        isLoading: false,
      };
    case 'LOGIN':
      return { ...state, isAuthenticated: true, user: action.session.professor };
    case 'LOGOUT':
      return { ...state, isAuthenticated: false, user: null };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  // Serializa persistência da sessão. Cada operação lê o estado mais recente somente
  // quando chega à frente da fila, impedindo escrita antiga de apagar login posterior.
  const desiredSessionRef = useRef(null);
  const persistQueueRef = useRef(Promise.resolve());
  const expiryTimerRef = useRef(null);

  function clearExpiryTimer() {
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    expiryTimerRef.current = null;
  }

  function activateSession(session) {
    clearExpiryTimer();
    desiredSessionRef.current = session;
    setSession(session);
    expiryTimerRef.current = scheduleExpiry(session.expiresAt, () => {
      invalidateSession(session.token);
    });
  }

  function persistLatestSession() {
    persistQueueRef.current = persistQueueRef.current
      .catch(() => {})
      .then(() => {
        const desiredSession = desiredSessionRef.current;
        if (desiredSession) {
          return AsyncStorage.setItem(SESSION_KEY, JSON.stringify(desiredSession));
        }
        return AsyncStorage.removeItem(SESSION_KEY);
      });
    return persistQueueRef.current;
  }

  // Loading gate no boot: sessão persistida só é restaurada depois que a API
  // revalida assinatura, expiração, professor existente e versão de credenciais.
  useEffect(() => {
    let cancelled = false;
    let restoredSession = null;

    async function restoreSession() {
      try {
        const raw = await AsyncStorage.getItem(SESSION_KEY);
        if (!raw) return;

        const normalizedSession = normalizeSession(JSON.parse(raw));
        if (!normalizedSession) {
          await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
          return;
        }

        // O interceptor precisa do token em memória para autenticar /auth/session,
        // mas a UI continua bloqueada por isLoading até a resposta remota.
        setSession(normalizedSession);
        const validated = await authService.validateSession();
        restoredSession = normalizeSession({
          ...normalizedSession,
          professor: validated.professor,
        });
        if (!restoredSession) throw new Error('Sessão remota inválida');

        if (!cancelled) activateSession(restoredSession);
      } catch {
        restoredSession = null;
        clearSession();
        await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
      } finally {
        if (!cancelled) dispatch({ type: 'RESTORE', session: restoredSession });
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
      clearExpiryTimer();
    };
  }, []);

  // Estado em memória é a fonte de verdade da UI; AsyncStorage preserva o token
  // e os dados públicos do professor entre reaberturas.
  async function login(email, senha) {
    const session = await authService.login(email, senha);
    const normalizedSession = normalizeSession(session);
    if (!normalizedSession) {
      throw new Error('O servidor retornou uma sessão inválida. Entre novamente.');
    }
    activateSession(normalizedSession);
    dispatch({ type: 'LOGIN', session: normalizedSession });
    try {
      await persistLatestSession();
    } catch {
      // Sessão já está ativa em memória; falha ao persistir só afeta reabertura do app.
    }
  }

  useEffect(() => subscribeToSessionInvalidation(() => {
    clearExpiryTimer();
    desiredSessionRef.current = null;
    clearSession();
    dispatch({ type: 'LOGOUT' });
    persistLatestSession().catch(() => {});
  }), []);

  // Ao voltar do background, Date.now() confirma a expiração mesmo se o SO tiver
  // suspendido timers. Sessão ainda vigente é revalidada remotamente.
  useEffect(() => {
    let validating = false;
    const subscription = AppState.addEventListener('change', async (nextState) => {
      const session = desiredSessionRef.current;
      if (nextState !== 'active' || !session || validating) return;
      if (session.expiresAt <= Date.now()) {
        invalidateSession(session.token);
        return;
      }

      validating = true;
      try {
        const validated = await authService.validateSession();
        if (desiredSessionRef.current?.token === session.token) {
          const refreshed = normalizeSession({ ...session, professor: validated.professor });
          if (!refreshed) invalidateSession(session.token);
          else activateSession(refreshed);
        }
      } catch (error) {
        // 401 já invalida via interceptor. Falha transitória de rede não encerra
        // sessão local ainda válida ao retomar o app.
        if (error?.response?.status === 401) invalidateSession(session.token);
      } finally {
        validating = false;
      }
    });
    return () => subscription.remove();
  }, []);

  async function logout() {
    clearExpiryTimer();
    desiredSessionRef.current = null;
    try {
      await persistLatestSession();
    } catch {
      throw new Error('Não foi possível encerrar a sessão. Tente novamente.');
    }
    if (desiredSessionRef.current === null) {
      clearSession();
      dispatch({ type: 'LOGOUT' });
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
