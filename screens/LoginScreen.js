import React, { useState } from 'react';
import Toast from 'react-native-toast-message';
import { 
  KeyboardAvoidingView, 
  Platform,
  StyleSheet,
  StatusBar,
  ToastAndroid,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
  HelperText,
  IconButton,
  Surface
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import { usePermissions } from "../context/PermissionContext";

import api from '../utils/api';

const LoginScreen = ({ navigation, onLogin }) => {
  const { permissions, fetchPermissions } = usePermissions();

  const [email, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
    const { refreshPermissions } = usePermissions();

  const validateForm = () => {
    const newErrors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      // 1️⃣ Login request
      const response = await api.post(`${config.BASE_URL}/api/login`, {
        email,
        password,
      });

      if (response.data.message === "Login successful") {
        const token = response.data.token;

        // 2️⃣ Save token consistently
        await AsyncStorage.setItem("authToken", token);

          await refreshPermissions();

        // 3️⃣ Tell parent App that user is logged in
        onLogin(token);

       

        // 6️⃣ Toast success message
        const message = response.data.message;
        if (Platform.OS === "android") {
         ToastAndroid.show(message,ToastAndroid.LONG)
        } else {
          Toast.show({ type: "success", text1: message });
        }

       

       
      }
    } catch (error) {
    //  console.log(error)
      const errorMessage = error.response?.data?.message || "Login failed";
      setErrors({ submit: errorMessage });
      Toast.show({ type: "error", text1: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#ffffff"
        translucent={false}
      />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Surface style={styles.content} elevation={0}>
          {/* Simple App Name Display */}
          <Text style={styles.appName}>eCards</Text>
          <Text style={styles.tagline}>Digital Invitation Manager</Text>

          {/* Login Form */}
          <Card style={styles.formContainer} mode="contained">
            <Card.Content>
              <Text variant="headlineSmall" style={styles.welcomeText}>
                Welcome Back!
              </Text>
              
              {/* Email/Username */}
              <TextInput
                label="Email"
                placeholder="Enter your email"
                value={email}
                onChangeText={setUsername}
                mode="outlined"
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
                error={!!errors.email}
                left={<TextInput.Icon icon="email" />}
                disabled={loading}
              />
              <HelperText type="error" visible={!!errors.email}>
                {errors.email}
              </HelperText>

              {/* Password */}
              <TextInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
                mode="outlined"
                style={styles.input}
                error={!!errors.password}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon 
                    icon={isPasswordVisible ? "eye-off" : "eye"} 
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    disabled={loading}
                  />
                }
                disabled={loading}
              />
              <HelperText type="error" visible={!!errors.password}>
                {errors.password}
              </HelperText>

              {/* Forgot Password */}
              <Button 
                mode="text" 
                onPress={() => navigation.navigate('ForgotPassword')}
                style={styles.forgotPassword}
                compact
                disabled={loading}
              >
                Forgot Password?
              </Button>

              {/* Submit Error */}
              <HelperText type="error" visible={!!errors.submit}>
                {errors.submit}
              </HelperText>

              {/* Login Button */}
             {/* Login Button */}
<Button 
  mode="contained" 
  onPress={handleLogin}
  disabled={loading}
  style={styles.loginButton}
  icon={loading ? "" : "login"}
  contentStyle={styles.buttonContent}
>
  {loading ? (
    <View style={styles.buttonLoadingContent}>
      <ActivityIndicator size="small" color="#ffffff" style={styles.buttonSpinner} />
      <Text style={styles.buttonLoadingText}>Signing In...</Text>
    </View>
  ) : (
    'Sign In'
  )}
</Button>
            </Card.Content>
          </Card>

          {/* Additional Info */}
          <Surface style={styles.footer} elevation={0}>
            <Text variant="bodySmall" style={styles.footerText}>
              Powered By Mashiku Tech
            </Text>
          </Surface>
        </Surface>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: { 
    flex: 1, 
    backgroundColor: '#ffffff' 
  },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    padding: 30,
    backgroundColor: '#ffffff',
  },
  appName: { 
    color: '#000000', 
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 1,
  },
  tagline: { 
    color: '#666666', 
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 40,
  },
  formContainer: { 
    borderRadius: 16, 
    marginBottom: 20,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  welcomeText: { 
    color: '#333333', 
    textAlign: 'center', 
    marginBottom: 25,
    fontWeight: '600',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  forgotPassword: { 
    alignSelf: 'flex-end', 
    marginBottom: 16,
  },
  loginButton: { 
    borderRadius: 12,
    marginTop: 8,
    elevation: 2,
    backgroundColor: '#000000',
  },
  buttonContent: {
    paddingVertical: 6,
  },
  // Button loading styles
  buttonLoadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSpinner: {
    marginRight: 8,
  },
  buttonLoadingText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
    marginTop: 20,
  },
  footerText: {
    color: '#888888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  // Removed loading overlay styles
});