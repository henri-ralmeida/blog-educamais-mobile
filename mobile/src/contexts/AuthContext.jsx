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
      .finally(() => {
        if (!cancelled) dispatch({ type: 'RESTORE', session: restoredSession });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function login(name) {
    const session = { role: 'teacher', name: name.trim() };
    setSession(session);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
    dispatch({ type: 'LOGIN', session });
  }

  async function logout() {
    clearSession();
    await AsyncStorage.removeItem(SESSION_KEY);
    dispatch({ type: 'LOGOUT' });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
