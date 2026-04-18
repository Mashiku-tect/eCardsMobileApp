import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ToastAndroid,
  StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
  Paragraph,
  Surface
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import { useFocusEffect } from '@react-navigation/native';
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
  let errorMessage = 'Failed to load profile';

  if (axios.isAxiosError(error)) {
    // 1️⃣ Server responded with an error
    if (error.response) {
      const status = error.response.status;

      errorMessage =
        error.response.data?.message || 'Failed to load user profile';

     
    }
    // 2️⃣ Request sent but no response (network issue)
    else if (error.request) {
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      } else {
        errorMessage =
          'Unable to connect to the server. Check your internet connection.';
      }
    }
    // 3️⃣ Axios configuration / setup error
    else {
      errorMessage = error.message;
    }
  } else {
    // Non-Axios error
    errorMessage = 'Unexpected error occurred';
  }

  //  Show toast per platform
  if (Platform.OS === 'android') {
    ToastAndroid.show(errorMessage, ToastAndroid.LONG);
  } else {
    Toast.show({
      type: 'error',
      text1: errorMessage,
    });
  }
} finally {
      setLoading(false);
    }
  };

  // useEffect(() => {
  //   fetchUserDetails();
  // }, []);

  const handlePasswordChange = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword || !passwordData.currentPassword) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Please fill all fields', ToastAndroid.LONG);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Please fill all fields'
        });
      }
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('New passwords do not match', ToastAndroid.LONG);
      } else {
        Toast.show({
          type: 'error',
          text1: 'New passwords do not match'
        });
      }
      return;
    }

    if (passwordData.newPassword.length < 8) {
      if (Platform.OS === 'android') {
        ToastAndroid.show('Password must be at least 8 characters long', ToastAndroid.LONG);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Password must be at least 8 characters long'
        });
      }
      return;
    }

    const payload = {
      currentpassword: passwordData.currentPassword,
      newpassword: passwordData.newPassword
    };

    try {
      // Dismiss keyboard before showing loading
      Keyboard.dismiss();
      
      setUpdating(true);
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

  const response  =    await api.post(`${config.BASE_URL}/api/user/newpassword`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const responsemessage=response.data?.message || 'Password changed successfully';

      if (Platform.OS === 'android') {
        ToastAndroid.show(responsemessage, ToastAndroid.LONG);
      } else {
        Toast.show({
          type: 'success',
          text1:'Success',
          text2: responsemessage
        });
      }
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
        let errorMessage = 'Failed to Update Password. Please try again.';

  if (error.response) {


    errorMessage =error.response?.data?.message || 'Failed to Update Passoword. Please try again.';
    

    

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
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            animating={true} 
            size="large" 
            color="#000000"
            style={styles.spinner}
          />
          <Title style={styles.loadingTitle}>Loading Profile</Title>
          <Text style={styles.loadingSubtitle}>Please wait while we fetch your profile information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Surface style={styles.headerContainer} elevation={0}>
              <Title style={styles.headerTitle}>Profile</Title>
              <Text style={styles.headerSubtitle}>Manage your account settings</Text>
            </Surface>

            {/* Profile Card */}
            <Card style={styles.profileCard} mode="contained">
              <Card.Content style={styles.profileCardContent}>
                <Avatar.Image
                  size={100}
                  source={require('../assets/user.png')}
                  style={styles.avatar}
                />
                <Title style={styles.userName}>
                  {userData?.firstName?? 'eCards'} {userData?.lastName?? 'User'}
                </Title>
                <Text style={styles.userEmail}>
                  {userData?.email?? 'user@mashikutech.co.tz'}
                </Text>
                <Chip
                  icon="shield-check"
                  mode="outlined"
                  style={styles.roleChip}
                  textStyle={styles.roleChipText}
                >
                  {userData.role || 'User'}
                </Chip>
              </Card.Content>
            </Card>

            {/* Change Password Section */}
            <Card style={styles.passwordCard} mode="contained">
              <Card.Content>
                <Title style={styles.sectionTitle}>Change Password</Title>
                
                <TextInput
                  label="Current Password"
                  mode="outlined"
                  secureTextEntry
                  value={passwordData.currentPassword}
                  onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
                  style={styles.input}
                  left={<TextInput.Icon icon="lock" color="#666666" />}
                  returnKeyType="next"
                  disabled={updating}
                />

                <TextInput
                  label="New Password"
                  mode="outlined"
                  secureTextEntry
                  value={passwordData.newPassword}
                  onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
                  style={styles.input}
                  left={<TextInput.Icon icon="key" color="#666666" />}
                  returnKeyType="next"
                  disabled={updating}
                />

                <TextInput
                  label="Confirm New Password"
                  mode="outlined"
                  secureTextEntry
                  value={passwordData.confirmPassword}
                  onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
                  style={styles.lastInput}
                  left={<TextInput.Icon icon="key-change" color="#666666" />}
                  returnKeyType="done"
                  onSubmitEditing={handlePasswordChange}
                  disabled={updating}
                />

              <Button
  mode="contained"
  onPress={handlePasswordChange}
  disabled={updating}
  icon={updating ? "" : "key-change"}
  style={styles.updateButton}
  contentStyle={styles.buttonContent}
>
  {updating ? (
    <View style={styles.buttonLoadingContent}>
      <ActivityIndicator size="small" color="#ffffff" style={styles.buttonSpinner} />
      <Text style={styles.buttonLoadingText}>Updating Password...</Text>
    </View>
  ) : (
    'Update Password'
  )}
</Button>
              </Card.Content>
            </Card>

            {/* Account Actions */}
            <Card style={styles.actionsCard} mode="contained">
              <Card.Content>
                <Title style={styles.sectionTitle}>Account Actions</Title>
                
                <Button
                  mode="outlined"
                  icon="logout"
                  onPress={handleLogout}
                  style={styles.logoutButton}
                  textColor="#333333"
                  disabled={updating}
                >
                  Logout
                </Button>
                
                <Button
                  mode="text"
                  icon="help-circle"
                  onPress={() => setVisibleDialog('help')}
                  style={styles.helpButton}
                  textColor="#666666"
                  disabled={updating}
                >
                  Help & Support
                </Button>
              </Card.Content>
            </Card>

            {/* Version Info */}
            <Surface style={styles.footer} elevation={0}>
              <Text style={styles.versionText}>eCards Manager v1.0.0</Text>
            </Surface>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      {/* Logout Confirmation Dialog */}
      <Portal>
        <Dialog 
          visible={visibleDialog === 'logout'} 
          onDismiss={() => setVisibleDialog(null)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Confirm Logout</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={styles.dialogText}>Are you sure you want to logout?</Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setVisibleDialog(null)}
              textColor="#666666"
            >
              Cancel
            </Button>
            <Button 
              onPress={confirmLogout} 
              textColor="#000000"
              style={styles.confirmLogoutButton}
            >
              Logout
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Help Dialog */}
        <Dialog 
          visible={visibleDialog === 'help'} 
          onDismiss={() => setVisibleDialog(null)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Help & Support</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={styles.dialogText}>
              For assistance, please contact support at:
              {"\n\n"}mashikuallen@gmail.com
              {"\n\n"}Phone: +255 626 779 507
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setVisibleDialog(null)}
              textColor="#000000"
            >
              Close
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 100 : 80,
  },
  // Updated loading container for profile data
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: 5,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#666666',
    fontSize: 16,
  },
  profileCard: {
    marginBottom: 5,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  profileCardContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    alignSelf: 'center',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  userName: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#000000',
    fontSize: 22,
    fontWeight: '600',
  },
  userEmail: {
    textAlign: 'center',
    color: '#666666',
    marginBottom: 16,
  },
  roleChip: {
    alignSelf: 'center',
    backgroundColor: 'transparent',
    borderColor: '#e0e0e0',
  },
  roleChipText: {
    color: '#666666',
  },
  passwordCard: {
    marginBottom: 10,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    marginBottom: 20,
    color: '#333333',
    fontWeight: '600',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  lastInput: {
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  updateButton: {
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  buttonContent: {
    paddingVertical: 6,
  },
  actionsCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  logoutButton: {
    marginBottom: 12,
    borderColor: '#e0e0e0',
  },
  helpButton: {
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#ffffff',
  },
  versionText: {
    color: '#888888',
    fontSize: 12,
    fontStyle: 'italic',
  },
  dialog: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  dialogTitle: {
    color: '#000000',
    fontWeight: '600',
  },
  dialogText: {
    color: '#666666',
    lineHeight: 22,
  },
  confirmLogoutButton: {
    backgroundColor: 'transparent',
  },
});

export default ProfileScreen;