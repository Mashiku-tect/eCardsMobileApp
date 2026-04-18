import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  StatusBar,
  ScrollView,
  View,
  Keyboard,
  ToastAndroid
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
  HelperText,
  Surface,
  IconButton,
  Chip
} from 'react-native-paper';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import config from './config';
import api from '../utils/api';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const [errors, setErrors] = useState({});

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendResetLink = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Dismiss keyboard before showing loading
      Keyboard.dismiss();
      
      setLoading(true);
      setErrors({});
      
      const response = await api.post(`/api/request-reset`, {
        email: email.toLowerCase().trim(),
      });

     const responsemessage=response.data?.message || 'Password reset link sent to your email';
        setLinkSent(true);
        if(Platform.OS==='android'){
          ToastAndroid.show(responsemessage,ToastAndroid.LONG)
        }
        else{
Toast.show({
          type: 'success',
          text1:'Success',
          text2: 'Password reset link sent to your email',
        });
        }
        
      
    } catch (error) {
      //const errorMessage = error.response?.data?.message || 'Failed to send reset link';
      let errorMessage = 'Failed to send reste link. Please try again.';

  if (error.response) {


    errorMessage =error.response?.data?.message || 'Failed to send reste link. Please try again.';
    

    

  } else if (error.request) {
    errorMessage = 'Unable to reach the server. Check your internet connection.';
  } else if (error.code === 'ECONNABORTED') {
    errorMessage = 'Request timed out. Please try again.';
  } else {
    errorMessage = error.message;
  }

  if (Platform.OS === 'android') {
    ToastAndroid.show(errorMessage, ToastAndroid.LONG);
  } else {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: errorMessage
    });
  }
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.goBack();
  };

  const handleTryDifferentEmail = () => {
    setLinkSent(false);
    setEmail('');
    setErrors({});
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <Surface style={styles.header} elevation={0}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={handleBackToLogin}
              style={styles.backButton}
              disabled={loading}
            />
            <Text variant="headlineSmall" style={styles.title}>
              Reset Password
            </Text>
          </Surface>

          {!linkSent ? (
            /* Email Input Form */
            <Card style={styles.formContainer} mode="contained">
              <Card.Content style={styles.cardContent}>
                <Surface style={styles.iconContainer} elevation={0}>
                  <IconButton
                    icon="email"
                    size={40}
                    iconColor="#555555"
                    style={styles.emailIcon}
                  />
                </Surface>
                
                <Text variant="bodyLarge" style={styles.subtitle}>
                  Enter your email address and we'll send you a password reset link.
                </Text>

                <TextInput
                  label="Email Address"
                  placeholder="Enter your email address"
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  style={styles.input}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  error={!!errors.email}
                  left={<TextInput.Icon icon="email-outline" />}
                  disabled={loading}
                />
                <HelperText type="error" visible={!!errors.email}>
                  {errors.email}
                </HelperText>

                <HelperText type="error" visible={!!errors.submit}>
                  {errors.submit}
                </HelperText>

                <Button
                  mode="contained"
                  onPress={handleSendResetLink}
                  disabled={loading}
                  style={styles.primaryButton}
                  icon={loading ? () => <ActivityIndicator color="#ffffff" size={20} /> : "send"}
                  contentStyle={styles.buttonContent}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <Button
                  mode="text"
                  onPress={handleBackToLogin}
                  style={styles.secondaryButton}
                  compact
                  disabled={loading}
                >
                  Back to Login
                </Button>
              </Card.Content>
            </Card>
          ) : (
            /* Success Message */
            <Card style={styles.formContainer} mode="contained">
              <Card.Content style={styles.cardContent}>
                <Surface style={styles.successIconContainer} elevation={0}>
                  <Surface style={styles.successCircle} elevation={4}>
                    <IconButton
                      icon="check"
                      size={30}
                      iconColor="#fff"
                    />
                  </Surface>
                </Surface>
                
                <Text variant="headlineMedium" style={styles.successTitle}>
                  Reset Link Sent!
                </Text>
                
                <Text variant="bodyLarge" style={styles.successMessage}>
                  We've sent a password reset link to{'\n'}
                  <Text style={styles.emailText}>{email}</Text>
                </Text>

                <Text variant="bodyMedium" style={styles.instructions}>
                  Please check your email and click on the link to reset your password. 
                  The link will expire in 15 minutes.
                </Text>

                <Surface style={styles.notesContainer} elevation={1}>
                  <Chip
                    icon="information"
                    mode="outlined"
                    style={styles.noteChip}
                    textStyle={styles.noteText}
                  >
                    Check your spam folder if you don't see the email
                  </Chip>
                  <Chip
                    icon="clock-outline"
                    mode="outlined"
                    style={styles.noteChip}
                    textStyle={styles.noteText}
                  >
                    Reset link expires in 15 minutes
                  </Chip>
                </Surface>

                <Button
                  mode="contained"
                  onPress={handleTryDifferentEmail}
                  style={styles.primaryButton}
                  icon="email-edit"
                  contentStyle={styles.buttonContent}
                >
                  Use Different Email
                </Button>

                <Button
                  mode="text"
                  onPress={handleBackToLogin}
                  style={styles.secondaryButton}
                  icon="arrow-left"
                  compact
                >
                  Back to Login
                </Button>
              </Card.Content>
            </Card>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 0,
    backgroundColor: '#ffffff',
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    color: '#333333',
    fontWeight: 'bold',
  },
  formContainer: {
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  cardContent: {
    paddingVertical: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  emailIcon: {
    backgroundColor: '#f5f5f5',
    width: 80,
    height: 80,
  },
  successIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  successTitle: {
    color: '#333333',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: 'bold',
  },
  successMessage: {
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  emailText: {
    fontWeight: 'bold',
    color: '#555555',
  },
  instructions: {
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  notesContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    backgroundColor: '#f9f9f9',
    gap: 12,
  },
  noteChip: {
    backgroundColor: 'transparent',
    borderColor: '#e0e0e0',
  },
  noteText: {
    fontSize: 14,
    color: '#666666',
  },
  primaryButton: {
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    backgroundColor: '#000000',
  },
  buttonContent: {
    paddingVertical: 6,
  },
  secondaryButton: {
    marginTop: 8,
  },
});

export default ForgotPasswordScreen;