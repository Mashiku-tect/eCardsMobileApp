import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from "jwt-decode"
 // npm install jwt-decode

// Check if token is still valid
export const checkLoginStatus = async () => {
  const token = await AsyncStorage.getItem("authToken");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000; // in seconds

    if (decoded.exp && decoded.exp > currentTime) {
      return token; // still valid
    } else {
      await AsyncStorage.removeItem("authToken"); // expired
      return null;
    }
  } catch (error) {
    console.error("Invalid token", error);
    return null;
  }
};

// Logout: remove token
export const logout = async (navigation) => {
  try {
    await AsyncStorage.removeItem("authToken");
    navigation.replace("Login");
  } catch (error) {
    console.error("Error during logout:", error);
  }
};
