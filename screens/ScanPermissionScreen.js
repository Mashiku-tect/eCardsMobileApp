import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  Platform,
  RefreshControl,
  FlatList,
  ToastAndroid,
  StyleSheet,
  View,
  KeyboardAvoidingView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Text,
  Card,
  ActivityIndicator,
  Surface,
  IconButton,
  Button,
  Chip,
  Divider,
  Searchbar,
  Avatar,
  Badge,
  Dialog,
  Portal,
  Paragraph,
  HelperText
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import Toast from 'react-native-toast-message';
import api from '../utils/api';

const ScanPermissionsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanners, setScanners] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [removeDialogVisible, setRemoveDialogVisible] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      
      // Fetch event details
      const eventResponse = await api.get(`${config.BASE_URL}/api/events/eventdetails/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvent(eventResponse.data.event);

      // Fetch current scanners and all users
      await fetchScanPermissions();
      await fetchAllUsers();
      
    } catch (error) {
     // console.error('Error fetching data:', error);
     let errorMessage = 'Failed to load Event Details. Please try again.';

  if (error.response) {


    errorMessage =error.response?.data?.message || 'Failed to Load Event Details. Please try again.';
    

    

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
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const fetchScanPermissions = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.get(`${config.BASE_URL}/api/events/${eventId}/scan-permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScanners(response.data.scanners || []);
    } catch (error) {
     // console.error('Error fetching scan permissions:', error);
      let errorMessage = 'Failed to Fetch Scann Permission. Please try again.';

  if (error.response) {


    errorMessage =error.response?.data?.message || 'Failed to Fetch Scan Permmision. Please try again.';
    

    

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
  };

  const fetchAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.get(`${config.BASE_URL}/api/myusers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllUsers(response.data.users || []);
      setFilteredUsers(response.data.users || []);
    } catch (error) {
     // console.error('Error fetching users:', error);
      let errorMessage = 'Failed to fetch users. Please try again.';

  if (error.response) {


    errorMessage =error.response?.data?.message || 'Failed to fetch users. Please try again.';
    

    

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
      setLoadingUsers(false);
    }
  };

  // Filter users based on search term
  useEffect(() => {
  const safeSearch = (searchTerm ?? "").trim();
  const safeUsers = Array.isArray(allUsers) ? allUsers : [];

  if (safeSearch === "") {
    setFilteredUsers(safeUsers);
  } else {
    const lowerSearch = safeSearch.toLowerCase();

    const filtered = safeUsers.filter(user =>
      user?.firstName?.toLowerCase()?.includes(lowerSearch) ||
      user?.lastName?.toLowerCase()?.includes(lowerSearch) ||
      user?.email?.toLowerCase()?.includes(lowerSearch)
    );

    setFilteredUsers(filtered);
  }
}, [searchTerm, allUsers]);


  // Check if user is already a scanner
  const isUserScanner = (userId) => {
    return scanners.some(scanner => scanner.tenant_id === userId);
  };

  const getScannerPermissionId = (userId) => {
    const scanner = scanners.find(scanner => scanner.tenant_id === userId);
    return scanner ? scanner.id : null;
  };

  const addScanner = async (userId) => {
    try {
      setAddingId(userId);
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.post(
        `${config.BASE_URL}/api/events/${eventId}/scan-permissions`, 
        { tenant_id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const responsemessage = response?.data?.message || 'Scanner Added Successfully';
      if(Platform.OS === 'android'){
        ToastAndroid.show(responsemessage, ToastAndroid.SHORT);
      } else {
        Toast.show({
          type: 'success',
          text1: response.data.message
        });
      }
      
      await fetchScanPermissions();
    } catch (error) {
     // const errormessage = error.response?.data?.message || 'Failed to add scanner';
      let errorMessage = 'Failed to add scanner. Please try again.';

  if (error.response) {


    errorMessage =error.response?.data?.message || 'Failed to add scanner.Please Try Again';
    

    

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
      setAddingId(null);
    }
  };

  const confirmRemoveScanner = (permissionId) => {
    setItemToRemove(permissionId);
    setRemoveDialogVisible(true);
  };

  const removeScanner = async () => {
    if (!itemToRemove) return;

    try {
      setRemovingId(itemToRemove);
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.delete(
        `${config.BASE_URL}/api/events/${eventId}/scan-permissions/${itemToRemove}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const responsemessage = response?.data?.message || 'Scanner Removed Successfully';
      if(Platform.OS === 'android'){
        ToastAndroid.show(responsemessage, ToastAndroid.SHORT);
      } else {
        Toast.show({
          type: 'success',
          text1: response.data.message
        });
      }
      
      await fetchScanPermissions();
    } catch (error) {
      //const errormessage = error.response?.data?.message || 'Failed to remove scanner';
        let errorMessage = 'Failed to remove Scanner. Please try again.';

  if (error.response) {


    errorMessage =error.response?.data?.message || 'Failed to remove scanner';
    

    

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
      setRemovingId(null);
      setRemoveDialogVisible(false);
      setItemToRemove(null);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getUserInitials = (user) => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getStatusChipProps = () => {
    if (!event) return { style: styles.inactiveChip, textStyle: styles.inactiveChipText };
    
    return event.active 
      ? { style: styles.activeChip, textStyle: styles.activeChipText }
      : { style: styles.inactiveChip, textStyle: styles.inactiveChipText };
  };

  const getStatusText = () => {
    if (!event) return 'Unknown';
    return event.active ? 'Upcoming' : 'Completed';
  };

  const renderScannerItem = ({ item }) => {
    const isRemoving = removingId === item.id;
    
    return (
      <Card style={styles.scannerCard} mode="outlined">
        <Card.Content style={styles.scannerContent}>
          <Surface style={styles.userInfo} elevation={0}>
            <Avatar.Text 
              size={40}
             label={getUserInitials?.(item?.tenant ?? {}) ?? "?"}

              style={styles.avatar}
              labelStyle={styles.avatarText}
            />
            <Surface style={styles.userDetails} elevation={0}>
              <Text variant="bodyLarge" style={styles.userName}>
                {item?.tenant?.firstName ?? 'eCards'} {item?.tenant?.lastName?? 'User'}
              </Text>
              <Text variant="bodyMedium" style={styles.userEmail}>
                {item?.tenant?.email ?? 'ecardsuser@mashikutech.co.tz'}
              </Text>
            </Surface>
          </Surface>
          <Button
            mode="outlined"
            onPress={() => confirmRemoveScanner(item.id)}
            disabled={isRemoving}
            style={styles.removeButton}
            textColor="#DC2626"
            icon={isRemoving ? "" : "trash-can-outline"}
            contentStyle={styles.buttonContent}
            compact
          >
            {isRemoving ? (
              <View style={styles.buttonLoadingContent}>
                <ActivityIndicator size="small" color="#DC2626" style={styles.buttonSpinner} />
                <Text style={styles.buttonLoadingText}>Removing...</Text>
              </View>
            ) : (
              'Remove'
            )}
          </Button>
        </Card.Content>
      </Card>
    );
  };

 const renderUserItem = ({ item }) => {
  const safeItem = item ?? {};

  const userId = safeItem.id ?? null;
  const permissionId = userId ? getScannerPermissionId?.(userId) : null;

  const isScanner = userId ? isUserScanner?.(userId) : false;
  const isAdding = userId ? addingId === userId : false;
  const isRemoving = permissionId ? removingId === permissionId : false;

  return (
    <Card style={styles.userCard} mode="outlined">
      <Card.Content style={styles.userContent}>
        <Surface style={styles.userInfo} elevation={0}>
          <Avatar.Text
            size={40}
            label={getUserInitials?.(safeItem) ?? "?"}
            style={styles.avatar}
            labelStyle={styles.avatarText}
          />

          <Surface style={styles.userDetails} elevation={0}>
            <Text variant="bodyLarge" style={styles.userName}>
              {(safeItem.firstName ?? "User") + " " + (safeItem.lastName ?? "")}
            </Text>

            <Text variant="bodyMedium" style={styles.userEmail}>
              {safeItem.email ?? "No email"}
            </Text>

            <Chip
              mode="outlined"
              compact
              style={styles.roleChip}
              textStyle={styles.roleText}
            >
              {safeItem.role
                ? safeItem.role.charAt(0).toUpperCase() +
                  safeItem.role.slice(1)
                : "User"}
            </Chip>
          </Surface>
        </Surface>

        {isScanner ? (
          <Button
            mode="outlined"
            onPress={() => permissionId && confirmRemoveScanner?.(permissionId)}
            disabled={!permissionId || isRemoving}
            style={styles.removeButton}
            textColor="#DC2626"
            icon={isRemoving ? "" : "trash-can-outline"}
            contentStyle={styles.buttonContent}
            compact
          >
            {isRemoving ? (
              <View style={styles.buttonLoadingContent}>
                <ActivityIndicator
                  size="small"
                  color="#DC2626"
                  style={styles.buttonSpinner}
                />
                <Text style={styles.buttonLoadingText}>Removing...</Text>
              </View>
            ) : (
              "Remove"
            )}
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={() => userId && addScanner?.(userId)}
            disabled={!userId || isAdding}
            style={styles.addButton}
            icon={isAdding ? "" : "account-plus"}
            contentStyle={styles.buttonContent}
            compact
          >
            {isAdding ? (
              <View style={styles.buttonLoadingContent}>
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                  style={styles.buttonSpinner}
                />
                <Text style={styles.buttonLoadingText}>Adding...</Text>
              </View>
            ) : (
              "Add Scanner"
            )}
          </Button>
        )}
      </Card.Content>
    </Card>
  );
};


  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#ffffff"
          translucent={false}
        />
        <Surface style={styles.loadingContainer} elevation={0}>
          <ActivityIndicator size="small" color="#333333" />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Loading scan permissions...
          </Text>
        </Surface>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#ffffff"
          translucent={false}
        />
        <Surface style={styles.errorContainer} elevation={0}>
          <Text variant="headlineMedium" style={styles.errorTitle}>
            Event Not Found
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.primaryButton}
            contentStyle={styles.buttonContent}
          >
            Back to Events
          </Button>
        </Surface>
      </SafeAreaView>
    );
  }

  const statusChipProps = getStatusChipProps();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#ffffff"
        translucent={false}
      />
      
      {/* Remove Scanner Dialog */}
      <Portal>
        <Dialog 
          visible={removeDialogVisible} 
          onDismiss={() => setRemoveDialogVisible(false)}
        >
          <Dialog.Title>Remove Scanner</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to remove this user's scan permission?
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRemoveDialogVisible(false)}>
              Cancel
            </Button>
            <Button 
              onPress={removeScanner}
              mode="contained"
              disabled={removingId !== null}
              style={styles.dialogRemoveButton}
              icon={removingId !== null ? "" : "trash-can-outline"}
              contentStyle={styles.buttonContent}
            >
              {removingId !== null ? (
                <View style={styles.buttonLoadingContent}>
                  <ActivityIndicator size="small" color="#ffffff" style={styles.buttonSpinner} />
                  <Text style={styles.buttonLoadingText}>Removing...</Text>
                </View>
              ) : (
                'Remove'
              )}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Surface style={styles.header} elevation={0}>
            <IconButton
              icon="arrow-left"
              size={24}
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <Text variant="headlineSmall" style={styles.title}>
              Manage Scan Permissions
            </Text>
          </Surface>

          {/* Event Info Card */}
          <Card style={styles.formContainer} mode="contained">
            <Card.Content>
              <Surface style={styles.eventHeader} elevation={0}>
                <Surface style={styles.eventInfo} elevation={0}>
                  <Text variant="titleLarge" style={styles.eventName}>
                    {event?.eventName ?? 'Uknown Event'}
                  </Text>
                  <Text variant="bodyMedium" style={styles.eventDetails}>
                    {event?.eventDate
  ? formatDate?.(event.eventDate) ?? "No date"
  : "No date"
} at {event?.eventTime ?? '-'}
                  </Text>
                  <Text variant="bodyMedium" style={styles.eventLocation}>
                    {event?.location ?? 'Not Specified'}
                  </Text>
                </Surface>
                <Chip
                  mode="outlined"
                  {...statusChipProps}
                >
                  {getStatusText()}
                </Chip>
              </Surface>
            </Card.Content>
          </Card>

          {/* Current Scanners Section */}
          <Card style={styles.formContainer} mode="contained">
            <Card.Content style={styles.cardContent}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Current Scanners
              </Text>
              <Text variant="bodyMedium" style={styles.sectionSubtitle}>
                Users who have permission to scan cards for this event
              </Text>
              
              {scanners?.length > 0 ? (
                <FlatList
  data={Array.isArray(scanners) ? scanners : []}
  keyExtractor={(item, index) =>
    item?.id != null ? String(item.id) : index.toString()
  }
  renderItem={(props) => renderScannerItem?.(props)}
  scrollEnabled={false}
  style={styles.list}
/>

              ) : (
                <Surface style={styles.emptyState} elevation={0}>
                  <IconButton 
                    icon="account-group" 
                    size={48} 
                    iconColor="#9CA3AF"
                    style={styles.emptyIcon}
                  />
                  <Text variant="bodyLarge" style={styles.emptyTitle}>
                    No scanners assigned yet
                  </Text>
                  <Text variant="bodyMedium" style={styles.emptySubtitle}>
                    Add users from the list below
                  </Text>
                </Surface>
              )}
            </Card.Content>
          </Card>

          {/* Add Scanners Section */}
          <Card style={styles.formContainer} mode="contained">
            <Card.Content style={styles.cardContent}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Add Scanners
              </Text>
              <Text variant="bodyMedium" style={styles.sectionSubtitle}>
                Search and add users who can scan cards for this event
              </Text>

              {/* Search Bar */}
              <Surface style={styles.searchContainer} elevation={0}>
                <Searchbar
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  style={styles.searchBar}
                  iconColor="#666666"
                  mode="outlined"
                />
              </Surface>

              {/* Users List */}
              {loadingUsers ? (
                <Surface style={styles.loadingUsers} elevation={0}>
                  <ActivityIndicator size="small" color="#333333" />
                  <Text variant="bodyMedium" style={styles.loadingUsersText}>
                    Loading users...
                  </Text>
                </Surface>
              ) : filteredUsers.length > 0 ? (
                <FlatList
  data={Array.isArray(filteredUsers) ? filteredUsers : []}
  keyExtractor={(item, index) =>
    item?.id != null ? String(item.id) : index.toString()
  }
  renderItem={(props) => renderUserItem?.(props)}
  scrollEnabled={false}
  style={styles.list}
/>

              ) : (
                <Surface style={styles.emptyState} elevation={0}>
                  <IconButton 
                    icon="magnify" 
                    size={48} 
                    iconColor="#9CA3AF"
                    style={styles.emptyIcon}
                  />
                  <Text variant="bodyLarge" style={styles.emptyTitle}>
                    {searchTerm ? 'No users found' : 'No users available'}
                  </Text>
                  <Text variant="bodyMedium" style={styles.emptySubtitle}>
                    {searchTerm ? 'Try a different search term' : 'No users available to add'}
                  </Text>
                </Surface>
              )}
            </Card.Content>
          </Card>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    color: '#333333',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    marginBottom: 16,
    textAlign: 'center',
    color: '#333333',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
    marginBottom: 20,
  },
  cardContent: {
    paddingVertical: 20,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  eventInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  eventName: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
  },
  eventDetails: {
    color: '#666666',
    marginBottom: 4,
  },
  eventLocation: {
    color: '#666666',
  },
  // Status Chip Styles
  activeChip: {
    backgroundColor: '#f5f5f5',
    borderColor: '#333333',
  },
  activeChipText: {
    color: '#333333',
  },
  inactiveChip: {
    backgroundColor: '#f5f5f5',
  },
  inactiveChipText: {
    color: '#666666',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
  },
  sectionSubtitle: {
    color: '#666666',
    marginBottom: 20,
    lineHeight: 20,
  },
  searchContainer: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#ffffff',
  },
  list: {
    marginTop: 8,
  },
  scannerCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  userCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  scannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'transparent',
  },
  avatar: {
    backgroundColor: '#f5f5f5',
    marginRight: 12,
  },
  avatarText: {
    color: '#333333',
  },
  userDetails: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#333333',
  },
  userEmail: {
    color: '#666666',
    marginBottom: 2,
  },
  roleChip: {
    backgroundColor: '#f5f5f5',
    alignSelf: 'flex-start',
    height: 30,
    borderColor: '#e0e0e0',
  },
  roleText: {
    fontSize: 10,
    color: '#666666',
  },
  addButton: {
    backgroundColor: '#000000',
    borderRadius: 8,
  },
  removeButton: {
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  emptyIcon: {
    backgroundColor: '#f5f5f5',
  },
  emptyTitle: {
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingUsers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
    backgroundColor: 'transparent',
  },
  loadingUsersText: {
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
    fontSize: 14,
    fontWeight: '600',
  },
  dialogRemoveButton: {
    backgroundColor: '#000000',
  },
});

export default ScanPermissionsScreen;