import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ToastAndroid
} from 'react-native';
import {
  Text,
  Card,
  Title,
  TextInput,
  Button,
  Divider,
  Chip,
  IconButton,
  Avatar,
  Portal,
  Dialog,
  Paragraph
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import {  useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import api from '../utils/api';

const ProfileScreen = ({ navigation, onLogout }) => {
  const [userData, setUserData] = useState({});
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [visibleDialog, setVisibleDialog] = useState(null);

    const fetchUserDetails = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) return;

        const response = await api.get(`${config.BASE_URL}/api/user/userdetails`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserData(response.data.user);
      } catch (error) {
        const errormessage =error.response?.data?.message || 'Failed to load profile';
        //Alert.alert('Error', error.response?.data?.message || 'Failed to load profile');
        if(Platform.OS === 'android'){
          ToastAndroid.show(errormessage, ToastAndroid.LONG);
        }
        else{
          Toast.show({
            type: 'error',
            text1: errormessage
          });
        }
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
  

    fetchUserDetails();
  }, []);

  const handlePasswordChange = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword || !passwordData.currentPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    const payload = {
      currentpassword: passwordData.currentPassword,
      newpassword: passwordData.newPassword
    };

    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      await api.post(`${config.BASE_URL}/api/user/newpassword`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      Alert.alert('Success', 'Password changed successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Keyboard.dismiss(); // Dismiss keyboard after success
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setUpdating(false);
    }
  };

   useFocusEffect(
      React.useCallback(() => {
        fetchUserDetails();
      }, [])
    );

  const handleLogout = () => {
    setVisibleDialog('logout');
  };

  const confirmLogout = async () => {
    setVisibleDialog(null);
    try {
      await AsyncStorage.removeItem('authToken');
      if (onLogout) onLogout();
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={{ marginTop: 16 }}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={{ 
              flexGrow: 1, 
              padding: 16,
              paddingBottom: Platform.OS === 'ios' ? 100 : 80 // Extra padding for keyboard
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Title style={{ fontSize: 24, fontWeight: 'bold' }}>Profile</Title>
              <Text style={{ color: '#666' }}>Manage your account settings</Text>
            </View>

            {/* Profile Card */}
            <Card style={{ marginBottom: 16, alignItems: 'center' }}>
              <Card.Content>
                <Avatar.Image
                  size={100}
                  source={require('../assets/user.png')}
                  style={{ alignSelf: 'center', marginBottom: 16 }}
                />
                <Title style={{ textAlign: 'center', marginBottom: 4 }}>
                  {userData.firstName} {userData.lastName}
                </Title>
                <Text style={{ textAlign: 'center', color: '#666', marginBottom: 12 }}>
                  {userData.email}
                </Text>
                <Chip
                  icon="shield-check"
                  mode="outlined"
                  style={{ alignSelf: 'center' }}
                >
                  {userData.role || 'User'}
                </Chip>
              </Card.Content>
            </Card>

            {/* Change Password Section */}
            <Card style={{ marginBottom: 16 }}>
              <Card.Content>
                <Title style={{ marginBottom: 16 }}>Change Password</Title>
                
                <TextInput
                  label="Current Password"
                  mode="outlined"
                  secureTextEntry
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
                  style={{ marginBottom: 12 }}
                  left={<TextInput.Icon icon="lock" />}
                  returnKeyType="next"
                  onSubmitEditing={() => {
                    // You might want to focus next input here
                    // If you have refs, you can use them to focus
                  }}
                />

                <TextInput
                  label="New Password"
                  mode="outlined"
                  secureTextEntry
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
                  style={{ marginBottom: 12 }}
                  left={<TextInput.Icon icon="key" />}
                  returnKeyType="next"
                />

                <TextInput
                  label="Confirm New Password"
                  mode="outlined"
                  secureTextEntry
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
                  style={{ marginBottom: 16 }}
                  left={<TextInput.Icon icon="key-change" />}
                  returnKeyType="done"
                  onSubmitEditing={handlePasswordChange}
                />

                <Button
                  mode="contained"
                  onPress={handlePasswordChange}
                  loading={updating}
                  disabled={updating}
                  icon="key-change"
                >
                  {updating ? 'Updating...' : 'Update Password'}
                </Button>
              </Card.Content>
            </Card>

            {/* Account Actions */}
            <Card>
              <Card.Content>
                <Title style={{ marginBottom: 16 }}>Account Actions</Title>
                
                <Button
                  mode="outlined"
                  icon="logout"
                  onPress={handleLogout}
                  style={{ marginBottom: 12 }}
                  textColor="#ff6b6b"
                >
                  Logout
                </Button>
                
                <Button
                  mode="text"
                  icon="help-circle"
                  onPress={() => setVisibleDialog('help')}
                >
                  Help & Support
                </Button>
              </Card.Content>
            </Card>

            {/* Version Info */}
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Text style={{ color: '#999', fontSize: 12 }}>Event Manager v1.0.0</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* Logout Confirmation Dialog */}
      <Portal>
        <Dialog visible={visibleDialog === 'logout'} onDismiss={() => setVisibleDialog(null)}>
          <Dialog.Title>Confirm Logout</Dialog.Title>
          <Dialog.Content>
            <Paragraph>Are you sure you want to logout?</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisibleDialog(null)}>Cancel</Button>
            <Button onPress={confirmLogout} textColor="#ff6b6b">Logout</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Help Dialog */}
        <Dialog visible={visibleDialog === 'help'} onDismiss={() => setVisibleDialog(null)}>
          <Dialog.Title>Help & Support</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              For assistance, please contact support at:
              {"\n\n"}mashikuallen@gmail.com
              {"\n\n"}Phone: +255 626 779 507
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisibleDialog(null)}>Close</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

export default ProfileScreen;