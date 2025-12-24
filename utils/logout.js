import AsyncStorage from '@react-native-async-storage/async-storage';

let logoutHandler = null;

export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
};

export const logout = async () => {
  await AsyncStorage.removeItem('authToken');
  if (logoutHandler) {
    logoutHandler();
  }
};
