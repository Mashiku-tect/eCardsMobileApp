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
  SafeAreaView,
  StatusBar
} from 'react-native';
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
  Divider,
  Portal,
  Dialog,
  Paragraph
} from 'react-native-paper';
import axios from 'axios';
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10,15}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Phone number is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const formatPhoneNumber = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Format based on length
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 6) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    } else {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    handleInputChange('phoneNumber', formatted);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
     // await AsyncStorage.removeItem("authToken");
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, padding: 16, justifyContent: 'center' }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Card style={{ marginBottom: 24 }}>
              <Card.Content>
                {/* Header */}
                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                  <Avatar.Icon 
                    size={64} 
                    icon="account-plus" 
                    style={{ backgroundColor: '#6200ee', marginBottom: 16 }}
                  />
                  <Title style={{ textAlign: 'center' }}>Create User Account</Title>
                  <Text style={{ textAlign: 'center', color: '#666', marginTop: 8 }}>
                    Add a new user to the system
                  </Text>
                </View>

                <Divider style={{ marginBottom: 24 }} />

                {/* Form Fields */}
                <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                  <TextInput
                    label="First Name *"
                    mode="outlined"
                    value={formData.firstName}
                    onChangeText={(text) => handleInputChange('firstName', text)}
                    style={{ flex: 1, marginRight: 8 }}
                    error={!!errors.firstName}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                  <TextInput
                    label="Last Name *"
                    mode="outlined"
                    value={formData.lastName}
                    onChangeText={(text) => handleInputChange('lastName', text)}
                    style={{ flex: 1 }}
                    error={!!errors.lastName}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>

                {errors.firstName && <HelperText type="error" visible>{errors.firstName}</HelperText>}
                {errors.lastName && <HelperText type="error" visible>{errors.lastName}</HelperText>}

                <TextInput
                  label="Email *"
                  mode="outlined"
                  value={formData.email}
                  onChangeText={(text) => handleInputChange('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  style={{ marginBottom: 8 }}
                  error={!!errors.email}
                  returnKeyType="next"
                />
                {errors.email && <HelperText type="error" visible>{errors.email}</HelperText>}

                <TextInput
                  label="Phone Number *"
                  mode="outlined"
                  value={formData.phoneNumber}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={14}
                  style={{ marginBottom: 8 }}
                  error={!!errors.phoneNumber}
                  returnKeyType="next"
                />
                {errors.phoneNumber && <HelperText type="error" visible>{errors.phoneNumber}</HelperText>}

                <TextInput
                  label="Password *"
                  mode="outlined"
                  value={formData.password}
                  onChangeText={(text) => handleInputChange('password', text)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={{ marginBottom: 8 }}
                  error={!!errors.password}
                  right={
                    <TextInput.Icon 
                      icon={showPassword ? "eye-off" : "eye"}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  }
                  returnKeyType="done"
                />
                {errors.password && <HelperText type="error" visible>{errors.password}</HelperText>}

                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  icon="account-plus"
                  style={{ marginTop: 24 }}
                >
                  {isSubmitting ? 'Creating...' : 'Create User Account'}
                </Button>

                {/* Password Requirements */}
                <Surface style={{ borderRadius: 8, padding: 16, marginTop: 24, elevation: 1 }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Password Requirements:</Text>
                  <Text style={{ color: '#666', fontSize: 12 }}>• At least 6 characters long</Text>
                  <Text style={{ color: '#666', fontSize: 12 }}>• Use a combination of letters and numbers</Text>
                  <Text style={{ color: '#666', fontSize: 12 }}>• Avoid common passwords</Text>
                </Surface>
              </Card.Content>
            </Card>

            {/* Form Instructions */}
            <Surface style={{ borderRadius: 8, padding: 16, elevation: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <IconButton icon="information" size={20} />
                <Text style={{ fontWeight: 'bold', marginLeft: 8 }}>Important Notes:</Text>
              </View>
              <Text style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
                • All fields marked with * are required
              </Text>
              <Text style={{ color: '#666', fontSize: 12, marginBottom: 4 }}>
                • Phone number will be automatically formatted
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>
                • User will receive login credentials via email
              </Text>
            </Surface>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default EnhancedRegistrationScreen;