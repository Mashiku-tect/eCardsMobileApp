import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  RefreshControl,
  FlatList,
  ToastAndroid
} from 'react-native';
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
  Paragraph
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
  const [updating, setUpdating] = useState(false);
  const [removeDialogVisible, setRemoveDialogVisible] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);

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
      console.error('Error fetching data:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to load data'
      });
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
      console.error('Error fetching scan permissions:', error);
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
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(allUsers);
    } else {
      const filtered = allUsers.filter(user =>
        user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
      setUpdating(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.post(
        `${config.BASE_URL}/api/events/${eventId}/scan-permissions`, 
        { tenant_id: userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const responsemessage=response?.data?.message || 'Scanner Added Successfully';
      if(Platform.OS==='android'){
        ToastAndroid.show(responsemessage,ToastAndroid.SHORT);
      }
      else{
Toast.show({
          type: 'success',
          text1: response.data.message
        });
      }
        
      
      
      await fetchScanPermissions();
    } catch (error) {
      const errormessage = error.response?.data?.message || 'Failed to add scanner';
      if(Platform.OS==='android'){
        ToastAndroid.show(errormessage,ToastAndroid.SHORT);
      }
      else{
 Toast.show({
        type: 'error',
        text1: errormessage || 'Failed to add scanner'
      });
      }
     
    } finally {
      setUpdating(false);
    }
  };

  const confirmRemoveScanner = (permissionId) => {
    setItemToRemove(permissionId);
    setRemoveDialogVisible(true);
  };

  const removeScanner = async () => {
    if (!itemToRemove) return;

    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.delete(
        `${config.BASE_URL}/api/events/${eventId}/scan-permissions/${itemToRemove}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const responsemessage=response?.data?.message || 'Scanner Removed Successfully';
      if(Platform.OS==='android'){
        ToastAndroid.show(responsemessage,ToastAndroid.SHORT);
      }
      else{
      
        Toast.show({
          type: 'success',
          text1: response.data.message
        });
      
    }
      
      await fetchScanPermissions();
    } catch (error) {
      const errormessage = error.response?.data?.message || 'Failed to remove scanner';
      if(Platform.OS==='android'){
        ToastAndroid.show(errormessage,ToastAndroid.SHORT)
      }
      else{
 Toast.show({
        type: 'error',
        text1: errormessage || 'Failed to remove scanner'
      });
      }
     
    } finally {
      setUpdating(false);
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

  const renderScannerItem = ({ item }) => (
    <Card style={styles.scannerCard} mode="outlined">
      <Card.Content style={styles.scannerContent}>
        <Surface style={styles.userInfo} elevation={0}>
          <Avatar.Text 
            size={40}
            label={getUserInitials(item.tenant)}
            style={styles.avatar}
            labelStyle={styles.avatarText}
          />
          <Surface style={styles.userDetails} elevation={0}>
            <Text variant="bodyLarge" style={styles.userName}>
              {item.tenant?.firstName} {item.tenant?.lastName}
            </Text>
            <Text variant="bodyMedium" style={styles.userEmail}>
              {item.tenant?.email}
            </Text>
          </Surface>
        </Surface>
        <Button
          mode="outlined"
          onPress={() => confirmRemoveScanner(item.id)}
          disabled={updating}
          style={styles.removeButton}
          textColor="#DC2626"
          icon="trash-can-outline"
          compact
        >
          Remove
        </Button>
      </Card.Content>
    </Card>
  );

  const renderUserItem = ({ item }) => {
    const isScanner = isUserScanner(item.id);
    const permissionId = getScannerPermissionId(item.id);
    
    return (
      <Card style={styles.userCard} mode="outlined">
        <Card.Content style={styles.userContent}>
          <Surface style={styles.userInfo} elevation={0}>
            <Avatar.Text 
              size={40}
              label={getUserInitials(item)}
              style={styles.avatar}
              labelStyle={styles.avatarText}
            />
            <Surface style={styles.userDetails} elevation={0}>
              <Text variant="bodyLarge" style={styles.userName}>
                {item.firstName} {item.lastName}
              </Text>
              <Text variant="bodyMedium" style={styles.userEmail}>
                {item.email}
              </Text>
              <Chip
                mode="outlined"
                compact
                style={styles.roleChip}
                textStyle={styles.roleText}
              >
                {item.role ? item.role.charAt(0).toUpperCase() + item.role.slice(1) : 'User'}
              </Chip>
            </Surface>
          </Surface>
          
          {isScanner ? (
            <Button
              mode="outlined"
              onPress={() => confirmRemoveScanner(permissionId)}
              disabled={updating}
              style={styles.removeButton}
              textColor="#DC2626"
              icon="trash-can-outline"
              compact
            >
              Remove
            </Button>
          ) : (
            <Button
              mode="contained"
              onPress={() => addScanner(item.id)}
              loading={updating}
              style={styles.addButton}
              icon="account-plus"
              compact
            >
              Add Scanner
            </Button>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#f8f9fa"
          translucent={false}
        />
        <Surface style={styles.loadingContainer} elevation={0}>
          <ActivityIndicator size="small" />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Loading scan permissions...
          </Text>
        </Surface>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#f8f9fa"
          translucent={false}
        />
        <Surface style={styles.errorContainer} elevation={0}>
          <Text variant="headlineMedium" style={styles.errorTitle}>
            Event Not Found
          </Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Back to Events
          </Button>
        </Surface>
      </SafeAreaView>
    );
  }

  const statusChipProps = getStatusChipProps();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f8f9fa"
        translucent={false}
      />
      
      {/* Remove Scanner Dialog */}
      <Portal>
        <Dialog visible={removeDialogVisible} onDismiss={() => setRemoveDialogVisible(false)}>
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
              loading={updating}
              style={styles.dialogRemoveButton}
            >
              Remove
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Card style={styles.headerCard} mode="contained">
          <Card.Content style={styles.headerContent}>
            <Surface style={styles.navigationRow} elevation={0}>
              <Button
                mode="outlined"
                icon="arrow-left"
                onPress={() => navigation.goBack()}
                style={styles.navButton}
                compact
              >
                Back to Event
              </Button>
            </Surface>
            <Text variant="headlineMedium" style={styles.title}>
              Manage Scan Permissions
            </Text>
          </Card.Content>
        </Card>

        {/* Event Info Card */}
        <Card style={styles.eventCard} mode="contained">
          <Card.Content>
            <Surface style={styles.eventHeader} elevation={0}>
              <Surface style={styles.eventInfo} elevation={0}>
                <Text variant="titleLarge" style={styles.eventName}>
                  {event.eventName}
                </Text>
                <Text variant="bodyMedium" style={styles.eventDetails}>
                  {formatDate(event.eventDate)} at {event.eventTime}
                </Text>
                <Text variant="bodyMedium" style={styles.eventLocation}>
                  {event.location}
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

        <Surface style={styles.content} elevation={0}>
          {/* Current Scanners Section */}
          <Card style={styles.sectionCard} mode="contained">
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Current Scanners
              </Text>
              <Text variant="bodyMedium" style={styles.sectionSubtitle}>
                Users who have permission to scan tickets for this event
              </Text>
              
              {scanners.length > 0 ? (
                <FlatList
                  data={scanners}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderScannerItem}
                  scrollEnabled={false}
                  style={styles.list}
                />
              ) : (
                <Surface style={styles.emptyState} elevation={0}>
                  <IconButton icon="account-group" size={48} iconColor="#9CA3AF" />
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
          <Card style={styles.sectionCard} mode="contained">
            <Card.Content>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Add Scanners
              </Text>
              <Text variant="bodyMedium" style={styles.sectionSubtitle}>
                Search and add users who can scan tickets for this event
              </Text>

              {/* Search Bar */}
              <Surface style={styles.searchContainer} elevation={0}>
                <Searchbar
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  style={styles.searchBar}
                  iconColor="#9CA3AF"
                />
              </Surface>

              {/* Users List */}
              {loadingUsers ? (
                <Surface style={styles.loadingUsers} elevation={0}>
                  <ActivityIndicator size="small" />
                  <Text variant="bodyMedium" style={styles.loadingUsersText}>
                    Loading users...
                  </Text>
                </Surface>
              ) : filteredUsers.length > 0 ? (
                <FlatList
                  data={filteredUsers}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderUserItem}
                  scrollEnabled={false}
                  style={styles.list}
                />
              ) : (
                <Surface style={styles.emptyState} elevation={0}>
                  <IconButton icon="magnify" size={48} iconColor="#9CA3AF" />
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
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    marginBottom: 16,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#3B82F6',
  },
  scrollView: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerContent: {
    paddingVertical: 12,
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  navButton: {
    backgroundColor: '#FFFFFF',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
  eventCard: {
    marginHorizontal: 16,
    marginBottom: 16,
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
  },
  eventDetails: {
    color: '#6B7280',
    marginBottom: 4,
  },
  eventLocation: {
    color: '#6B7280',
  },
  // Status Chip Styles
  activeChip: {
    backgroundColor: '#D1FAE5',
  },
  activeChipText: {
    color: '#065F46',
  },
  inactiveChip: {
    backgroundColor: '#F3F4F6',
  },
  inactiveChipText: {
    color: '#374151',
  },
  content: {
    padding: 16,
    gap: 20,
    backgroundColor: 'transparent',
  },
  sectionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  searchContainer: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#F9FAFB',
  },
  list: {
    marginTop: 8,
  },
  scannerCard: {
    marginBottom: 12,
  },
  userCard: {
    marginBottom: 12,
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
    backgroundColor: '#DBEAFE',
    marginRight: 12,
  },
  avatarText: {
    color: '#1E40AF',
  },
  userDetails: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userEmail: {
    color: '#6B7280',
    marginBottom: 2,
  },
  roleChip: {
    backgroundColor: '#E5E7EB',
    alignSelf: 'flex-start',
    height: 30,
  },
  roleText: {
    fontSize: 10,
  },
  addButton: {
    backgroundColor: 'green',
  },
  removeButton: {
    borderColor: '#FECACA',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  emptyTitle: {
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingUsers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
    backgroundColor: 'transparent',
  },
  loadingUsersText: {
    color: '#6B7280',
  },
  dialogRemoveButton: {
    backgroundColor: '#EF4444',
  },
};

export default ScanPermissionsScreen;