import axios from 'axios';

// Base URL configurável para a API simulada DummyJSON
const getDummyApiBaseUrl = (): string => {
  if (typeof process !== 'undefined' && process.env?.VITE_DUMMY_API_URL) {
    return process.env.VITE_DUMMY_API_URL;
  }
  return 'https://dummyjson.com';
};

// Cliente Axios isolado: não compartilha tokens de autorização da API de autenticação
export const dummyApi = axios.create({
  baseURL: getDummyApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});
