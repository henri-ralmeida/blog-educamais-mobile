import { Platform } from 'react-native';

const DEFAULT_PORT = 3000;

function resolveDefaultHost() {
  if (Platform.OS === 'android') return `http://10.0.2.2:${DEFAULT_PORT}`;
  return `http://localhost:${DEFAULT_PORT}`; // iOS simulator / web
}

// EXPO_PUBLIC_API_URL definido em .env — obrigatório para device físico (IP LAN)
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || resolveDefaultHost();
