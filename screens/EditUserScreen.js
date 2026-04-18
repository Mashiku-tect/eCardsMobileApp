import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Keyboard,
  Platform,
  ToastAndroid
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  Paragraph,
  
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import config from './config';
import Toast from 'react-native-toast-message';
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

  const handleInputChange = (field, value) => {
    setUserData(prev => ({
      ...prev,
      [field]: value,
    }));
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
        //Alert.alert('Error', 'Authentication required');
        if(Platform.OS==='android'){
          ToastAndroid.show('Authentication required',ToastAndroid.LONG)
        }
        else{
          Toast.show({
            type:'error',
            text1:'Authentication required'
          })
        }
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
    }
    // } catch (error) {
    //   const errorMessage = error.response?.data?.message || 'Failed to load user data';
      
    //   Alert.alert('Error', errorMessage);
    //   navigation.goBack();
    // }
    catch (error) {
  let errorMessage = 'Failed to fetch event. Please try again.';

  if (error.response) {
    errorMessage = error.response?.data?.message || 'Failed to load user data';
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
  navigation.goBack();
}

     finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!userData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (!validateName(userData.firstName)) {
      newErrors.firstName = 'First name can only contain letters and spaces';
    }
    
    if (!userData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (!validateName(userData.lastName)) {
      newErrors.lastName = 'Last name can only contain letters and spaces';
    }
    
    if (!userData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(userData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!userData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!validatePhone(userData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone must be in format: 06XXXXXXXX or 07XXXXXXXX';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    // Dismiss keyboard before showing loading
    Keyboard.dismiss();
    
    setSubmitting(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        if(Platform.OS==='android'){
          ToastAndroid.show('Authentication Required',ToastAndroid.LONG)
        }
        else{
          Toast.show({
            type:'error',
            text1:'Authentication Required'
          })
        }
       // Alert.alert('Error', 'Authentication required');
        return;
      }

      const formattedData = {
        ...userData,
        phoneNumber: userData.phoneNumber.replace(/\D/g, '')
      };

      const response = await api.put(
        `${config.BASE_URL}/api/users/update/${userId}`,
        formattedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
       const responsemessage=response.data.message || 'User Updated Successfully';
     // Alert.alert('Success', response.data.message);
     if(Platform.OS==='android'){
ToastAndroid.show(responsemessage,ToastAndroid.LONG)
     }
     else{
      Toast.show({
        type:'success',
        text1:responsemessage
      })
     }
     
      navigation.goBack();
    // } catch (error) {
    //   Alert.alert('Error', error.response?.data?.message || 'Failed to update user');
    // } 
    }
    catch (error) {
  let errorMessage = 'Failed to fetch event. Please try again.';

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    errorMessage =error.response?.data?.message || 'Failed to update user';
     
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
}

    
    finally {
      setSubmitting(false);
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

  const getStatusChip = (status) => {
    const statusConfig = {
      Active: { icon: 'check-circle', color: '#666666', label: 'Active' },
      Pending: { icon: 'clock', color: '#999999', label: 'Pending' },
      Suspended: { icon: 'alert-circle', color: '#999999', label: 'Suspended' }
    };
    
    const config = statusConfig[status] || { icon: 'help-circle', color: '#999999', label: status };
    
    return (
      <Chip
        key={`status-${status}`}
        icon={config.icon}
        mode={userData.status === status ? 'contained' : 'outlined'}
        onPress={() => handleInputChange('status', status)}
        style={[styles.statusChip, userData.status === status ? styles.selectedChip : styles.unselectedChip]}
        textStyle={[styles.chipText, userData.status === status ? styles.selectedChipText : styles.unselectedChipText]}
        disabled={submitting}
      >
        {config.label}
      </Chip>
    );
  };

  const getRoleChip = (role) => {
    const roleConfig = {
      Tenant: { icon: 'account', color: '#666666', label: 'Tenant' },
      Boss: { icon: 'crown', color: '#666666', label: 'Boss' },
      Admin: { icon: 'shield-account', color: '#666666', label: 'Admin' }
    };
    
    const config = roleConfig[role] || { icon: 'account', color: '#999999', label: role };
    
    return (
      <Chip
        key={`role-${role}`}
        icon={config.icon}
        mode={userData.role === role ? 'contained' : 'outlined'}
        onPress={() => handleInputChange('role', role)}
        style={[styles.roleChip, userData.role === role ? styles.selectedChip : styles.unselectedChip]}
        textStyle={[styles.chipText, userData.role === role ? styles.selectedChipText : styles.unselectedChipText]}
        disabled={submitting}
      >
        {config.label}
      </Chip>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            animating={true} 
            size="large" 
            color="#000000"
            style={styles.spinner}
          />
          <Text style={styles.loadingTitle}>Loading User Data</Text>
          <Text style={styles.loadingSubtitle}>Please wait while we fetch user information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Main Form Card */}
        <Card style={styles.formCard} mode="contained">
          <Card.Content>
            <Text variant="titleLarge" style={styles.formTitle}>Edit User</Text>
            
            {/* User Info */}
            <Surface style={styles.userInfoContainer} elevation={0}>
              <Avatar.Image 
                size={64} 
                source={require('../assets/user.png')}
                style={styles.userAvatar}
              />
              <Surface style={styles.userInfoText} elevation={0}>
                <Text variant="bodyLarge" style={styles.userName}>
                  {userData?.firstName ?? 'eCards'} {userData?.lastName?? 'User'}
                </Text>
              </Surface>
            </Surface>

            <Divider style={styles.divider} />

            {/* Personal Information */}
            <Text variant="titleMedium" style={styles.sectionTitle}>Personal Information</Text>
            
            <Surface style={styles.nameRow} elevation={0}>
              <TextInput
                label="First Name *"
                mode="outlined"
                value={userData?.firstName?? 'eCards'}
                onChangeText={(text) => handleNameChange('firstName', text)}
                style={styles.firstNameInput}
                error={!!errors.firstName}
                autoCapitalize="words"
                returnKeyType="next"
                maxLength={30}
                disabled={submitting}
              />
              <TextInput
                label="Last Name *"
                mode="outlined"
                value={userData?.lastName ?? 'User'}
                onChangeText={(text) => handleNameChange('lastName', text)}
                style={styles.lastNameInput}
                error={!!errors.lastName}
                autoCapitalize="words"
                returnKeyType="next"
                maxLength={30}
                disabled={submitting}
              />
            </Surface>

            {errors.firstName && <HelperText type="error" visible style={styles.errorText}>{errors.firstName}</HelperText>}
            {errors.lastName && <HelperText type="error" visible style={styles.errorText}>{errors.lastName}</HelperText>}

            <TextInput
              label="Email *"
              mode="outlined"
              value={userData?.email?? 'ecardsuser@mashikutech.co.tz'}
              onChangeText={(text) => handleInputChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              error={!!errors.email}
              returnKeyType="next"
              disabled={submitting}
            />
            {errors.email && <HelperText type="error" visible style={styles.errorText}>{errors.email}</HelperText>}

            <TextInput
              label="Phone Number *"
              mode="outlined"
              value={userData?.phoneNumber?? '07XXXXXXX'}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              maxLength={14}
              style={styles.input}
              error={!!errors.phoneNumber}
              returnKeyType="next"
              placeholder="06 123 456 78"
              disabled={submitting}
            />
            {errors.phoneNumber && (
              <HelperText type="error" visible style={styles.errorText}>
                {errors.phoneNumber}
              </HelperText>
            )}

            {/* Validation Notes */}
            <Surface style={styles.validationNotes} elevation={0}>
              <Text style={styles.validationTitle}>Format Requirements:</Text>
              <Text style={styles.validationText}>• Names: Letters and spaces only</Text>
              <Text style={styles.validationText}>• Phone: Must start with 06 or 07, 10 digits total</Text>
            </Surface>
          </Card.Content>
        </Card>

        {/* Role Selection */}
        <Card style={styles.selectionCard} mode="contained">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Role</Text>
            <Surface style={styles.chipContainer} elevation={0}>
              {['Tenant', 'Boss'].map(role => getRoleChip(role))}
            </Surface>
          </Card.Content>
        </Card>

        {/* Status Selection */}
        <Card style={styles.selectionCard} mode="contained">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>Status</Text>
            <Surface style={styles.chipContainer} elevation={0}>
              {['Active', 'Pending', 'Suspended'].map(status => getStatusChip(status))}
            </Surface>
          </Card.Content>
        </Card>

        {/* Current Values Display */}
        <Surface style={styles.currentValuesCard} elevation={1}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Current Selection</Text>
          <Surface style={styles.currentValueRow} elevation={0}>
            <Text style={styles.currentValueLabel}>Role:</Text>
            <Chip 
              mode="outlined" 
              icon={userData.role === 'Tenant' ? 'account' : 'crown'}
              style={styles.currentValueChip}
              textStyle={styles.currentValueChipText}
            >
              {userData?.role?? 'Tenant'}
            </Chip>
          </Surface>
          <Surface style={styles.currentValueRow} elevation={0}>
            <Text style={styles.currentValueLabel}>Status:</Text>
            <Chip 
              mode="outlined" 
              icon={userData.status === 'Active' ? 'check-circle' : userData.status === 'Pending' ? 'clock' : 'alert-circle'}
              style={styles.currentValueChip}
              textStyle={styles.currentValueChipText}
            >
              {userData?.status?? 'Active'}
            </Chip>
          </Surface>
        </Surface>

        {/* Action Buttons */}
        <Surface style={styles.actionButtons} elevation={0}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            textColor="#333333"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            disabled={submitting}
            style={styles.saveButton}
            icon={submitting ? "" : "content-save"}
            contentStyle={styles.buttonContent}
          >
            {submitting ? (
              <View style={styles.buttonLoadingContent}>
                <ActivityIndicator size="small" color="#ffffff" style={styles.buttonSpinner} />
                <Text style={styles.buttonLoadingText}>Saving Changes...</Text>
              </View>
            ) : (
              'Save Changes'
            )}
          </Button>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  // Updated loading container for initial data fetch
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  spinner: {
    marginBottom: 24,
  },
  loadingTitle: {
    color: '#000000',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingSubtitle: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  formTitle: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 24,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  userAvatar: {
    marginRight: 16,
  },
  userInfoText: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  userName: {
    fontWeight: 'bold',
    color: '#000000',
    fontSize: 18,
  },
  divider: {
    backgroundColor: '#f0f0f0',
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 16,
    color: '#000000',
    fontWeight: '600',
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
    marginBottom: 12,
  },
  validationNotes: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  validationTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#666666',
    fontSize: 14,
  },
  validationText: {
    color: '#666666',
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 18,
  },
  selectionCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: 'transparent',
  },
  roleChip: {
    marginHorizontal: 0,
  },
  statusChip: {
    marginHorizontal: 0,
  },
  selectedChip: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  unselectedChip: {
    backgroundColor: 'transparent',
    borderColor: '#e0e0e0',
  },
  chipText: {
    fontSize: 14,
  },
  selectedChipText: {
    color: '#ffffff',
  },
  unselectedChipText: {
    color: '#666666',
  },
  currentValuesCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
  },
  currentValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  currentValueLabel: {
    color: '#000000',
  },
  currentValueChip: {
    backgroundColor: 'transparent',
    borderColor: '#e0e0e0',
  },
  currentValueChipText: {
    color: '#666666',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
    backgroundColor: 'transparent',
  },
  cancelButton: {
    flex: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 12,
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
});

export default EditScreen;