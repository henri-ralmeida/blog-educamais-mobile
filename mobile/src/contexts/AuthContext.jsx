import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  setSession,
  clearSession,
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

  // Loading gate no boot: isLoading só vira false no finally, garantindo
  // que RootNavigator nunca decida a stack antes da restauração da sessão terminar.
  useEffect(() => {
    let cancelled = false;
    let restoredSession = null;

    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => {
        if (!raw) return;
        try {
          const parsedSession = JSON.parse(raw);
          const normalizedSession = normalizeSession(parsedSession);
          if (!normalizedSession) {
            return AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
          }
          restoredSession = normalizedSession;
          desiredSessionRef.current = restoredSession;
          setSession(restoredSession);
        } catch {
          // JSON corrompido nunca deve quebrar o boot do app — trata como sessão ausente.
          restoredSession = null;
          return AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
        }
      })
      .catch(() => {
        // Falha ao ler AsyncStorage no boot nunca deve travar o app — trata como sessão ausente.
        restoredSession = null;
      })
      .finally(() => {
        if (!cancelled) dispatch({ type: 'RESTORE', session: restoredSession });
      });

    return () => {
      cancelled = true;
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
    desiredSessionRef.current = normalizedSession;
    setSession(normalizedSession);
    dispatch({ type: 'LOGIN', session: normalizedSession });
    try {
      await persistLatestSession();
    } catch {
      // Sessão já está ativa em memória; falha ao persistir só afeta reabertura do app.
    }
  }

  useEffect(() => subscribeToSessionInvalidation(() => {
    desiredSessionRef.current = null;
    clearSession();
    dispatch({ type: 'LOGOUT' });
    persistLatestSession().catch(() => {});
  }), []);

  async function logout() {
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
