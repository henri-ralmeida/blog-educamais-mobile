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
const MAX_TIMEOUT = 2 ** 31 - 1;

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
  const expiryTimerRef = useRef(null);

  function clearExpiryTimer() {
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current);
    expiryTimerRef.current = null;
  }

  // Expiração acima do limite do setTimeout (signed int32, ~24,8 dias) era
  // simplesmente ignorada, eliminando o watchdog local. Agora reagenda em janelas.
  function armExpiry(expiresAt, onExpire) {
    const delay = expiresAt - Date.now();
    if (delay <= 0) {
      onExpire();
      return null;
    }
    return setTimeout(() => {
      if (Date.now() >= expiresAt) onExpire();
      else expiryTimerRef.current = armExpiry(expiresAt, onExpire);
    }, Math.min(delay, MAX_TIMEOUT));
  }

  // Devolve false quando a expiração disparou de forma síncrona: sem isso o
  // dispatch seguinte ressuscitava na UI uma sessão já invalidada.
  function activateSession(session) {
    clearExpiryTimer();
    desiredSessionRef.current = session;
    setSession(session);
    expiryTimerRef.current = armExpiry(session.expiresAt, () => {
      invalidateSession(session.token);
    });
    return desiredSessionRef.current === session;
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
        if (!restoredSession) {
          throw Object.assign(new Error('Sessão remota inválida'), { isSessionRejected: true });
        }

        if (!cancelled) activateSession(restoredSession);
      } catch (error) {
        restoredSession = null;
        clearSession();
        // Apagar a sessão salva em QUALQUER erro deslogava quem abrisse o app
        // offline, contrariando a política do próprio handler de AppState.
        // Só credencial recusada pelo servidor ou sessão estruturalmente
        // inválida justificam descartar o registro persistido.
        const status = error?.response?.status;
        if (status === 401 || status === 403 || error?.isSessionRejected) {
          await AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
        }
      } finally {
        if (!cancelled) dispatch({ type: 'RESTORE', session: restoredSession });
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
      clearExpiryTimer();
      // Restore interrompido no meio deixava o token no singleton do sessionStore
      // depois da desmontagem do provider.
      if (desiredSessionRef.current === null) clearSession();
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
    const active = activateSession(normalizedSession);
    if (!active) {
      throw new Error('A sessão recebida já estava expirada. Entre novamente.');
    }
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
          if (!refreshed) {
            invalidateSession(session.token);
          } else if (activateSession(refreshed)) {
            // Sem dispatch e sem persistir, um nome de professor alterado no
            // servidor ficava obsoleto na UI e no AsyncStorage indefinidamente.
            dispatch({ type: 'LOGIN', session: refreshed });
            persistLatestSession().catch(() => {});
          }
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
    // A UI e o token em memória caem PRIMEIRO. Antes o timer de expiração e a
    // sessão desejada eram desmontados e, se a escrita falhasse, a função abortava
    // deixando token vivo, UI autenticada e watchdog destruído para sempre.
    clearExpiryTimer();
    desiredSessionRef.current = null;
    clearSession();
    dispatch({ type: 'LOGOUT' });
    try {
      await persistLatestSession();
    } catch {
      throw new Error(
        'Você foi desconectado, mas não foi possível apagar a sessão salva neste dispositivo.',
      );
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
