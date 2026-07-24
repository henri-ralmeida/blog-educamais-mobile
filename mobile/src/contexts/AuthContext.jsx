import { createContext, useContext, useEffect, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setSession, clearSession } from '../services/session/sessionStore';
import { authService } from '../services/authService';

const SESSION_KEY = '@blogeducamais:session';

const AuthContext = createContext(null);

const initialState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'RESTORE':
      return { ...state, isAuthenticated: !!action.session, user: action.session, isLoading: false };
    case 'LOGIN':
      return { ...state, isAuthenticated: true, user: action.session };
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
          restoredSession = JSON.parse(raw);
          desiredSessionRef.current = restoredSession;
          setSession(restoredSession);
        } catch {
          // JSON corrompido nunca deve quebrar o boot do app — trata como sessão ausente.
          restoredSession = null;
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

  // Estado em memória (sessionStore/dispatch) é sempre a fonte de verdade da UI —
  // persistência em AsyncStorage é best-effort e nunca deve deixar isAuthenticated
  // dessincronizado de sessionStore se a escrita falhar.
  // Assinatura async login(email, senha) — login real contra POST /auth/login.
  // O reject de authService.login (ex.: 401) propaga para quem chamou login(), sem ser
  // capturado aqui (quem trata o erro é a LoginScreen).
  async function login(email, senha) {
    const professor = await authService.login(email, senha);
    const session = { role: 'teacher', name: professor.nome, id: professor.id };
    desiredSessionRef.current = session;
    setSession(session);
    dispatch({ type: 'LOGIN', session });
    try {
      await persistLatestSession();
    } catch {
      // Sessão já está ativa em memória; falha ao persistir só afeta reabertura do app.
    }
  }

  async function logout() {
    desiredSessionRef.current = null;
    clearSession();
    dispatch({ type: 'LOGOUT' });
    try {
      await persistLatestSession();
    } catch {
      // Tenta novamente após falha para não restaurar sessão encerrada no próximo boot.
      persistLatestSession().catch(() => {});
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
