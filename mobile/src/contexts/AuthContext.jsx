import { createContext, useContext, useEffect, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setSession, clearSession } from '../services/session/sessionStore';

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
  async function login(name) {
    const session = { role: 'teacher', name: name.trim() };
    setSession(session);
    dispatch({ type: 'LOGIN', session });
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch {
      // Sessão já está ativa em memória; falha ao persistir só afeta reabertura do app.
    }
  }

  async function logout() {
    clearSession();
    dispatch({ type: 'LOGOUT' });
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch {
      // Falha ao persistir o logout não deve manter a UI em estado autenticado.
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
