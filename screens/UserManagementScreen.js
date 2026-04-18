import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  StatusBar,
  FlatList,
  RefreshControl,
  Platform,
  ToastAndroid
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Title,
  TextInput,
  Button,
  Chip,
  IconButton,
  Avatar,
  Portal,
  Dialog,
  Paragraph,
  Searchbar,
  Surface,
  Divider,
  List,
  FAB,
  Badge
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import config from './config';
import api from '../utils/api';
import Toast from 'react-native-toast-message';

const UserManagementScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ visible: false, userId: null, userName: '' });
  const navigation = useNavigation();

  const fetchUsers = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) throw new Error('No authentication token found');

      const response = await api.get(`${config.BASE_URL}/api/myusers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users);
    } catch (error) {
  let errorMessage = 'Failed to fetch event. Please try again.';

  if (error.response) {
   

    errorMessage =error.response?.data?.message || 'Failed To Fetch Users ';
    

    

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
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchUsers();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleDelete = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.delete(
        `${config.BASE_URL}/api/deleteuser/delete/${deleteDialog.userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const responsemessage=response.data?.message || 'User Deleted Successfully';
      
      //Alert.alert('Success', response.data.message);
      if(Platform.OS==='android'){
        ToastAndroid.show(responsemessage,ToastAndroid.LONG)
      }
      else{
        Toast.show({
          type:'success',
          text1:responsemessage
        })
      }
      setUsers(prevUsers => prevUsers.filter(user => user.id !== deleteDialog.userId));
    } 
     //Alert.alert('Error', error.response?.data?.message || 'Failed to delete user');
    catch (error) {
  let errorMessage = 'Failed to fetch event. Please try again.';

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    errorMessage =error.response?.data?.message || 'Failed to delete user';
    

  

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
      setDeleteDialog({ visible: false, userId: null, userName: '' });
    }
  };

  const filteredUsers = users.filter(user => 
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusChip = (status) => {
    const statusConfig = {
      Active: { icon: 'check-circle', color: '#666666', label: 'Active' },
      Pending: { icon: 'clock', color: '#999999', label: 'Pending' },
      Suspended: { icon: 'alert-circle', color: '#999999', label: 'Suspended' }
    };
    
    const config = statusConfig[status] || { icon: 'help-circle', color: '#999999', label: status };
    
    return (
      <Chip
        icon={config.icon}
        mode="outlined"
        style={[styles.statusChip, { borderColor: config.color }]}
        textStyle={[styles.statusChipText, { color: config.color }]}
      >
        {config.label}
      </Chip>
    );
  };

  const StatCard = ({ title, value, icon, color, bgColor }) => (
    <Card style={styles.statCard} mode="contained">
      <Card.Content style={styles.statCardContent}>
        <Avatar.Icon 
          size={44} 
          icon={icon} 
          style={[styles.statIcon, { backgroundColor: bgColor }]}
          color={color}
        />
        <Text variant="titleLarge" style={styles.statValue}>{value}</Text>
        <Text variant="bodySmall" style={styles.statLabel}>{title}</Text>
      </Card.Content>
    </Card>
  );

  const renderUserItem = ({ item }) => (
    <Card style={styles.userCard} mode="contained">
      <Card.Content>
        <Surface style={styles.userHeader} elevation={0}>
          <Avatar.Image 
            size={48} 
            source={require('../assets/user.png')} 
            style={styles.userAvatar}
          />
          <Surface style={styles.userInfo} elevation={0}>
            <Text variant="bodyLarge" style={styles.userName}>
              {item?.firstName?? 'eCards'} {item?.lastName?? 'User'}
            </Text>
            <Text variant="bodySmall" style={styles.userRole}>{item.role}</Text>
          </Surface>
          <Surface style={styles.statusContainer} elevation={0}>
            {getStatusChip(item?.status?? 'Active')}
          </Surface>
        </Surface>

        <Divider style={styles.divider} />

        <Surface style={styles.userDetails} elevation={0}>
          <Surface style={styles.detailItem} elevation={0}>
            <Text variant="bodySmall" style={styles.detailLabel}>Email</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>{item?.email ?? 'User@mashikutech.co.tz'}</Text>
          </Surface>
          <Surface style={styles.detailItem} elevation={0}>
            <Text variant="bodySmall" style={styles.detailLabel}>Phone</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>{item.phoneNumber || 'N/A'}</Text>
          </Surface>
        </Surface>

        <Surface style={styles.actionButtons} elevation={0}>
          <IconButton
            icon="shield-account"
            mode="contained"
            size={24}
            onPress={() => {
  if (!item || !item.id) {
    //console.warn('Cannot navigate: item or item.id is missing');
    return;
  }

  const userName = `${item.firstName || ''} ${item.lastName || ''}`.trim();

  navigation.navigate('UserPermissions', {
    userId: item.id,
    userName: userName || 'Unknown User',
  });
}}

            style={styles.actionButton}
            iconColor="#666666"
          />
          <IconButton
            icon="pencil"
            mode="contained"
            size={24}
         onPress={() => {
  if (!item || !item.id) {
    //console.warn('Cannot navigate: item or item.id is missing');
    return;
  }

  navigation.navigate('EditUser', { userId: item.id });
}}

            style={styles.actionButton}
            iconColor="#666666"
          />
        <IconButton
  icon="delete"
  mode="contained"
  size={24}
  onPress={() => {
    if (!item || !item.id) {
      return;
    }

    const userName = `${item.firstName || ''} ${item.lastName || ''}`.trim();

    // ✅ This shows the delete confirmation dialog
    setDeleteDialog({ 
      visible: true, 
      userId: item.id, 
      userName: userName || 'Unknown User' 
    });
  }}
  style={[styles.actionButton, styles.deleteButton]}
  iconColor="#666666"
/>
        </Surface>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Surface style={styles.loadingContainer} elevation={0}>
          <ActivityIndicator size="small" color="#000000" />
          <Text variant="bodyLarge" style={styles.loadingText}>Loading users...</Text>
        </Surface>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.container}>
        {/* Header */}
        <Surface style={styles.header} elevation={0}>
          <Surface style={styles.headerContent} elevation={0}>
            <Text variant="headlineMedium" style={styles.headerTitle}>User Management</Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>Manage all users in the system</Text>
          </Surface>
        </Surface>

        <ScrollView 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {/* Stats Cards */}
          <Surface style={styles.statsContainer} elevation={0}>
            <StatCard 
              title="Total Users" 
              value={users.length.toString() || 0} 
              icon="account-group" 
              color="#333333"
              bgColor="#f5f5f5"
            />
            <StatCard 
              title="Active" 
              value={users.filter(u => u.status === 'Active').length.toString() || 0} 
              icon="check-circle" 
              color="#333333"
              bgColor="#f5f5f5"
            />
            <StatCard 
              title="Pending" 
              value={users.filter(u => u.status === 'Pending').length.toString() || 0} 
              icon="clock" 
              color="#333333"
              bgColor="#f5f5f5"
            />
            <StatCard 
              title="Suspended" 
              value={users.filter(u => u.status === 'Suspended').length.toString() || 0} 
              icon="alert-circle" 
              color="#333333"
              bgColor="#f5f5f5"
            />
          </Surface>

          {/* Search Bar */}
          <Card style={styles.searchCard} mode="contained">
            <Card.Content>
              <Searchbar
                placeholder="Search users..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                style={styles.searchBar}
                iconColor="#666666"
              />
            </Card.Content>
          </Card>

          {/* Users List */}
          <Card style={styles.usersCard} mode="contained">
            <Card.Content>
              <Surface style={styles.usersHeader} elevation={0}>
                <Text variant="titleLarge" style={styles.usersTitle}>All Users</Text>
                <Chip mode="outlined" style={styles.countChip} textStyle={styles.countChipText}>
                  {filteredUsers.length || 0} users
                </Chip>
              </Surface>

              {filteredUsers.length > 0 ? (
               <FlatList
  data={Array.isArray(filteredUsers) ? filteredUsers : []}
  renderItem={renderUserItem}
  keyExtractor={(item, index) =>
    item?.id ? item.id.toString() : index.toString()
  }
  scrollEnabled={false}
  showsVerticalScrollIndicator={false}
  ListEmptyComponent={
    <Text style={{ textAlign: 'center', marginVertical: 10 }}>
      No users found
    </Text>
  }
/>

              ) : (
                <Surface style={styles.emptyState} elevation={0}>
                  <Avatar.Icon size={64} icon="account-search" style={styles.emptyIcon} iconColor="#CCCCCC" />
                  <Text variant="bodyLarge" style={styles.emptyTitle}>No users found</Text>
                  <Text variant="bodySmall" style={styles.emptySubtitle}>
                    {searchTerm ? 'Try adjusting your search terms' : 'No users in the system'}
                  </Text>
                </Surface>
              )}
            </Card.Content>
          </Card>
        </ScrollView>

        {/* FAB for adding new user */}
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => navigation.navigate('AddUser')}
          color="#ffffff"
        />
      </View>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog 
          visible={deleteDialog.visible} 
          onDismiss={() => setDeleteDialog({ visible: false, userId: null, userName: '' })}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Confirm Delete</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={styles.dialogText}>
              Are you sure you want to delete {deleteDialog.userName}? This action cannot be undone.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setDeleteDialog({ visible: false, userId: null, userName: '' })}
              textColor="#666666"
            >
              Cancel
            </Button>
            <Button 
              onPress={handleDelete} 
              textColor="#000000"
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = {
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    color: '#666666',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContent: {
    backgroundColor: 'transparent',
  },
  headerTitle: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 28,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#666666',
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'transparent',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  statCardContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontWeight: 'bold',
    color: '#000000',
    fontSize: 20,
  },
  statLabel: {
    color: '#666666',
    fontSize: 12,
  },
  searchCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  searchBar: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 1,
  },
  usersCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  usersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  usersTitle: {
    color: '#000000',
    fontWeight: '600',
  },
  countChip: {
    backgroundColor: 'transparent',
    borderColor: '#e0e0e0',
  },
  countChipText: {
    color: '#666666',
  },
  userCard: {
    marginBottom: 16,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  userAvatar: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  userName: {
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  userRole: {
    color: '#666666',
  },
  statusContainer: {
    backgroundColor: 'transparent',
  },
  statusChip: {
    height: 28,
  },
  statusChipText: {
    fontSize: 12,
  },
  divider: {
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
  },
  userDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  detailItem: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  detailLabel: {
    color: '#666666',
    marginBottom: 4,
    fontSize: 12,
  },
  detailValue: {
    color: '#000000',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    backgroundColor: 'transparent',
  },
  actionButton: {
    backgroundColor: '#f5f5f5',
    margin: 0,
  },
  deleteButton: {
    backgroundColor: '#f5f5f5',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'transparent',
  },
  emptyIcon: {
    backgroundColor: '#f5f5f5',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#000000',
    marginBottom: 8,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: '#666666',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 20,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
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
};

export default UserManagementScreen;