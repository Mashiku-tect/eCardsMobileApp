import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from './logout';
import config from '../screens/config';
import Toast from 'react-native-toast-message';

const api = axios.create({
  baseURL: `${config.BASE_URL}`,
  timeout: 10000,
});

// Attach token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
  //       Toast.show({
  //   type: 'error',
  //   text1: 'Session expired',
  //   text2: 'Please login again',
  // });
      await logout();
    }
    return Promise.reject(error);
  }
);

export default api;
