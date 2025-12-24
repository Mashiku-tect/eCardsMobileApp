import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
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
  RadioButton,
  Chip,
  Avatar,
  HelperText,
  Surface,
  Divider,
  Portal,
  Dialog,
  Paragraph
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import config from './config';
import api from '../utils/api';

const EditScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: 'Tenant',
    status: 'Active',
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const capitalize = (value) => {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  };

  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        navigation.goBack();
        return;
      }

      const response = await api.get(`${config.BASE_URL}/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const userData = response.data;
      setUserData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
        role: capitalize(userData.role) || 'Tenant',
        status: capitalize(userData.status) || 'Active',
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to load user data';
      if (error.response?.status === 401) {
        await AsyncStorage.removeItem('authToken');
        navigation.navigate('Login');
      }
      Alert.alert('Error', errorMessage);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!userData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!userData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!userData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(userData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!userData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Authentication required');
        return;
      }

      const response = await api.put(
        `${config.BASE_URL}/api/users/update/${userId}`,
        userData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      Alert.alert('Success', response.data.message);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
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

  const getStatusChip = (status) => {
    const statusConfig = {
      Active: { icon: 'check-circle', color: '#4caf50', label: 'Active' },
      Pending: { icon: 'clock', color: '#ff9800', label: 'Pending' },
      Suspended: { icon: 'alert-circle', color: '#f44336', label: 'Suspended' }
    };
    
    const config = statusConfig[status] || { icon: 'help-circle', color: '#9e9e9e', label: status };
    
    return (
      <Chip
        key={`status-${status}`}
        icon={config.icon}
        mode={userData.status === status ? 'contained' : 'outlined'}
        onPress={() => handleInputChange('status', status)}
        style={{ marginHorizontal: 4 }}
      >
        {config.label}
      </Chip>
    );
  };

  const getRoleChip = (role) => {
    const roleConfig = {
      Tenant: { icon: 'account', color: '#2196f3', label: 'Tenant' },
      Boss: { icon: 'crown', color: '#ff9800', label: 'Boss' },
      Admin: { icon: 'shield-account', color: '#4caf50', label: 'Admin' }
    };
    
    const config = roleConfig[role] || { icon: 'account', color: '#9e9e9e', label: role };
    
    return (
      <Chip
        key={`role-${role}`}
        icon={config.icon}
        mode={userData.role === role ? 'contained' : 'outlined'}
        onPress={() => handleInputChange('role', role)}
        style={{ marginHorizontal: 4 }}
      >
        {config.label}
      </Chip>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={{ marginTop: 16 }}>Loading user data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Title style={{ textAlign: 'center', marginBottom: 24 }}>Edit User</Title>
            
            {/* User Info */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
              <Avatar.Image 
                size={64} 
                source={require('../assets/user.png')}
                style={{ marginRight: 16 }}
              />
              <View>
                <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
                  {userData.firstName} {userData.lastName}
                </Text>
                {/* <Text variant="bodyMedium" style={{ color: '#666' }}>ID: {userId}</Text> */}
              </View>
            </View>

            <Divider style={{ marginBottom: 24 }} />

            {/* Personal Information */}
            <Title style={{ marginBottom: 16 }}>Personal Information</Title>
            
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <TextInput
                label="First Name *"
                mode="outlined"
                value={userData.firstName}
                onChangeText={(text) => handleInputChange('firstName', text)}
                style={{ flex: 1, marginRight: 8 }}
                error={!!errors.firstName}
              />
              <TextInput
                label="Last Name *"
                mode="outlined"
                value={userData.lastName}
                onChangeText={(text) => handleInputChange('lastName', text)}
                style={{ flex: 1 }}
                error={!!errors.lastName}
              />
            </View>

            {errors.firstName && <HelperText type="error" visible>{errors.firstName}</HelperText>}
            {errors.lastName && <HelperText type="error" visible>{errors.lastName}</HelperText>}

            <TextInput
              label="Email *"
              mode="outlined"
              value={userData.email}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ marginBottom: 8 }}
              error={!!errors.email}
            />
            {errors.email && <HelperText type="error" visible>{errors.email}</HelperText>}

            <TextInput
              label="Phone Number *"
              mode="outlined"
              value={userData.phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={14}
              style={{ marginBottom: 8 }}
              error={!!errors.phoneNumber}
            />
            {errors.phoneNumber && <HelperText type="error" visible>{errors.phoneNumber}</HelperText>}
          </Card.Content>
        </Card>

        {/* Role Selection */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Title style={{ marginBottom: 16 }}>Role</Title>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {['Tenant', 'Boss'].map(role => getRoleChip(role))}
            </View>
          </Card.Content>
        </Card>

        {/* Status Selection */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Title style={{ marginBottom: 16 }}>Status</Title>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
              {['Active', 'Pending', 'Suspended'].map(status => getStatusChip(status))}
            </View>
          </Card.Content>
        </Card>

        {/* Current Values Display */}
        <Surface style={{ borderRadius: 8, padding: 16, marginBottom: 16, elevation: 2 }}>
          <Title style={{ marginBottom: 12 }}>Current Selection</Title>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text>Role:</Text>
            <Chip mode="outlined" icon={userData.role === 'Tenant' ? 'account' : 'crown'}>
              {userData.role}
            </Chip>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text>Status:</Text>
            <Chip mode="outlined" icon={userData.status === 'Active' ? 'check-circle' : userData.status === 'Pending' ? 'clock' : 'alert-circle'}>
              {userData.status}
            </Chip>
          </View>
        </Surface>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={{ flex: 1 }}
            icon="arrow-left"
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={submitting}
            disabled={submitting}
            style={{ flex: 1 }}
            icon="content-save"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditScreen;