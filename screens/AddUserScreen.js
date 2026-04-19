import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  StatusBar,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  TextInput,
  Card,
  Title,
  Button,
  IconButton,
  Avatar,
  HelperText,
  Surface,
  Divider
} from 'react-native-paper';
import config from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const EnhancedRegistrationScreen = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Validation functions
  const validateName = (name) => {
    return /^[A-Za-z]+(?:[ ][A-Za-z]+)*$/.test(name.trim());
  };

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  };

  const validatePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    return /^(06|07)\d{8}$/.test(cleaned);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!validateName(formData.firstName)) {
      newErrors.firstName = 'First name can only contain letters and spaces';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!validateName(formData.lastName)) {
      newErrors.lastName = 'Last name can only contain letters and spaces';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone must be in format: 06XXXXXXXX or 07XXXXXXXX';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    const limited = cleaned.slice(0, 10);
    
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 5) {
      return `${limited.slice(0, 2)} ${limited.slice(2)}`;
    } else if (limited.length <= 8) {
      return `${limited.slice(0, 2)} ${limited.slice(2, 5)} ${limited.slice(5)}`;
    } else {
      return `${limited.slice(0, 2)} ${limited.slice(2, 5)} ${limited.slice(5, 8)} ${limited.slice(8)}`;
    }
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    handleInputChange('phoneNumber', formatted);
  };

  const handleNameChange = (field, text) => {
    const filtered = text.replace(/[^A-Za-z ]/g, '');
    handleInputChange(field, filtered);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    // Dismiss keyboard before showing loading
    Keyboard.dismiss();
    
    setIsSubmitting(true);

    try {
      const token = await AsyncStorage.getItem("authToken");

      const payload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phoneNumber.replace(/\D/g, ''),
        password: formData.password
      };

      const response = await api.post(
        `${config.BASE_URL}/api/users/adduser`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : undefined
          }
        }
      );

      Alert.alert('Success', response.data?.message || 'User created successfully!');

      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: ""
      });

    } catch (error) {
      const apiMessage = error.response?.data?.message || "Something went wrong";
      Alert.alert('Error', apiMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Card style={styles.formCard} mode="contained">
              <Card.Content>
                {/* Header */}
                <Surface style={styles.headerContainer} elevation={0}>
                  <Avatar.Icon 
                    size={64} 
                    icon="account-plus" 
                    style={styles.headerIcon}
                    iconColor="#ffffff"
                  />
                  <Title style={styles.headerTitle}>Add New User</Title>
                  <Text style={styles.headerSubtitle}>
                    Add a new user to the system
                  </Text>
                </Surface>

                <Divider style={styles.divider} />

                {/* Form Fields */}
                <Surface style={styles.nameRow} elevation={0}>
                  <TextInput
                    label="First Name *"
                    mode="outlined"
                    value={formData.firstName}
                    onChangeText={(text) => handleNameChange('firstName', text)}
                    style={styles.firstNameInput}
                    error={!!errors.firstName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    maxLength={30}
                    disabled={isSubmitting}
                  />
                  <TextInput
                    label="Last Name *"
                    mode="outlined"
                    value={formData.lastName}
                    onChangeText={(text) => handleNameChange('lastName', text)}
                    style={styles.lastNameInput}
                    error={!!errors.lastName}
                    autoCapitalize="words"
                    returnKeyType="next"
                    maxLength={30}
                    disabled={isSubmitting}
                  />
                </Surface>

                {errors.firstName && <HelperText type="error" visible style={styles.errorText}>{errors.firstName}</HelperText>}
                {errors.lastName && <HelperText type="error" visible style={styles.errorText}>{errors.lastName}</HelperText>}

                <TextInput
                  label="Email *"
                  mode="outlined"
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={styles.input}
                  error={!!errors.email}
                  returnKeyType="next"
                  disabled={isSubmitting}
                />
                {errors.email && <HelperText type="error" visible style={styles.errorText}>{errors.email}</HelperText>}

                <TextInput
                  label="Phone Number *"
                  mode="outlined"
                  value={formData.phoneNumber}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={14}
                  style={styles.input}
                  error={!!errors.phoneNumber}
                  returnKeyType="next"
                  placeholder="06 123 456 78"
                  disabled={isSubmitting}
                />
                {errors.phoneNumber && (
                  <HelperText type="error" visible style={styles.errorText}>
                    {errors.phoneNumber}
                  </HelperText>
                )}

                <TextInput
                  label="Password *"
                  mode="outlined"
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={styles.input}
                  error={!!errors.password}
                  right={
                    <TextInput.Icon 
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword(!showPassword)}
                      color="#666666"
                      disabled={isSubmitting}
                    />
                  }
                  returnKeyType="done"
                  disabled={isSubmitting}
                />
                {errors.password && <HelperText type="error" visible style={styles.errorText}>{errors.password}</HelperText>}

                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  icon={isSubmitting ? '' : 'account-plus'}
                  style={styles.submitButton}
                  contentStyle={styles.submitButtonContent}
                >
                  {isSubmitting ? (
                    <View style={styles.buttonLoadingContent}>
                      <ActivityIndicator size="small" color="#ffffff" style={styles.buttonSpinner} />
                      <Text style={styles.buttonLoadingText}>Creating...</Text>
                    </View>
                  ) : (
                    'Create User Account'
                  )}
                </Button>

                {/* Password Requirements */}
                <Surface style={styles.requirementsCard} elevation={1}>
                  <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                  <Text style={styles.requirementsText}>• At least 8 characters long</Text>
                  <Text style={styles.requirementsText}>• Use a combination of letters and numbers</Text>
                  <Text style={styles.requirementsText}>• Avoid common passwords</Text>
                </Surface>
              </Card.Content>
            </Card>

            {/* Form Instructions */}
            <Surface style={styles.instructionsCard} elevation={1}>
              <Surface style={styles.instructionsHeader} elevation={0}>
                <IconButton icon="information" size={20} iconColor="#666666" disabled={isSubmitting} />
                <Text style={styles.instructionsTitle}>Important Notes:</Text>
              </Surface>
              <Text style={styles.instructionsText}>
                • All fields marked with * are required
              </Text>
              <Text style={styles.instructionsText}>
                • Names can only contain letters and spaces
              </Text>
              <Text style={styles.instructionsText}>
                • Phone must start with 06 or 07 and be 10 digits
              </Text>
              <Text style={styles.instructionsText}>
                • Phone number will be automatically formatted
              </Text>
              <Text style={styles.instructionsText}>
                • User will receive login credentials via email
              </Text>
            </Surface>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  formCard: {
    marginBottom: 24,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  headerIcon: {
    backgroundColor: '#000000',
    marginBottom: 16,
  },
  headerTitle: {
    textAlign: 'center',
    color: '#000000',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    textAlign: 'center',
    color: '#666666',
    fontSize: 16,
  },
  divider: {
    backgroundColor: '#f0f0f0',
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    marginBottom: 8,
    backgroundColor: 'transparent',
    gap: 12,
  },
  firstNameInput: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  lastNameInput: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  input: {
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  errorText: {
    marginBottom: 8,
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  submitButtonContent: {
    paddingVertical: 6,
  },
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
  requirementsCard: {
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    backgroundColor: '#f9f9f9',
  },
  requirementsTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000000',
    fontSize: 16,
  },
  requirementsText: {
    color: '#666666',
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  instructionsCard: {
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  instructionsTitle: {
    fontWeight: 'bold',
    color: '#000000',
    fontSize: 16,
  },
  instructionsText: {
    color: '#666666',
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
});

export default EnhancedRegistrationScreen;
