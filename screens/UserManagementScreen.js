import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  FlatList,
  RefreshControl
} from 'react-native';
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
      Alert.alert('Error', error.response?.data?.message || 'Failed to fetch users');
    } finally {
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
      
      Alert.alert('Success', response.data.message);
      setUsers(prevUsers => prevUsers.filter(user => user.id !== deleteDialog.userId));
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete user');
    } finally {
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
      Active: { icon: 'check-circle', color: '#4caf50', label: 'Active' },
      Pending: { icon: 'clock', color: '#ff9800', label: 'Pending' },
      Suspended: { icon: 'alert-circle', color: '#f44336', label: 'Suspended' }
    };
    
    const config = statusConfig[status] || { icon: 'help-circle', color: '#9e9e9e', label: status };
    
    return (
      <Chip
        icon={config.icon}
        mode="outlined"
        style={{ borderColor: config.color }}
        textStyle={{ color: config.color }}
      >
        {config.label}
      </Chip>
    );
  };

  const StatCard = ({ title, value, icon, color, bgColor }) => (
    <Card style={{ flex: 1, margin: 4 }}>
      <Card.Content style={{ alignItems: 'center' }}>
        <Avatar.Icon 
          size={48} 
          icon={icon} 
          style={{ backgroundColor: bgColor, marginBottom: 8 }}
          color={color}
        />
        <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>{value}</Text>
        <Text variant="bodySmall" style={{ color: '#666' }}>{title}</Text>
      </Card.Content>
    </Card>
  );

  const renderUserItem = ({ item }) => (
    <Card style={{ marginBottom: 8, marginHorizontal: 16 }}>
      <Card.Content>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Avatar.Image 
            size={48} 
            source={require('../assets/user.png')} 
            style={{ marginRight: 12 }}
          />
          <View style={{ flex: 1 }}>
            <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
              {item.firstName} {item.lastName}
            </Text>
            <Text variant="bodySmall" style={{ color: '#666' }}>{item.role}</Text>
          </View>
          <View>
            {getStatusChip(item.status)}
          </View>
        </View>

        <Divider style={{ marginBottom: 12 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text variant="bodySmall" style={{ color: '#666' }}>Email</Text>
            <Text variant="bodyMedium">{item.email}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodySmall" style={{ color: '#666' }}>Phone</Text>
            <Text variant="bodyMedium">{item.phoneNumber || 'N/A'}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
          <IconButton
            icon="shield-account"
            mode="contained"
            size={24}
            onPress={() => navigation.navigate('UserPermissions', { 
              userId: item.id,
              userName: `${item.firstName} ${item.lastName}`
            })}
          />
          <IconButton
            icon="pencil"
            mode="contained"
            size={24}
            onPress={() => navigation.navigate('EditUser', { userId: item.id })}
          />
          <IconButton
            icon="delete"
            mode="contained"
            size={24}
            onPress={() => setDeleteDialog({
              visible: true,
              userId: item.id,
              userName: `${item.firstName} ${item.lastName}`
            })}
            iconColor="#f44336"
          />
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={{ marginTop: 16 }}>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <View style={{ flex: 1 }}>
        {/* Header */}
        <Surface style={{ elevation: 2 }}>
          <View style={{ padding: 16 }}>
            <Title>User Management</Title>
            <Text style={{ color: '#666' }}>Manage all users in the system</Text>
          </View>
        </Surface>

        <ScrollView 
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats Cards */}
          <View style={{ flexDirection: 'row', margin: 16 }}>
            <StatCard 
              title="Total Users" 
              value={users.length.toString()} 
              icon="account-group" 
              color="#3f51b5"
              bgColor="#e8eaf6"
            />
            <StatCard 
              title="Active" 
              value={users.filter(u => u.status === 'Active').length.toString()} 
              icon="check-circle" 
              color="#4caf50"
              bgColor="#e8f5e8"
            />
            <StatCard 
              title="Pending" 
              value={users.filter(u => u.status === 'Pending').length.toString()} 
              icon="clock" 
              color="#ff9800"
              bgColor="#fff3e0"
            />
            <StatCard 
              title="Suspended" 
              value={users.filter(u => u.status === 'Suspended').length.toString()} 
              icon="alert-circle" 
              color="#f44336"
              bgColor="#ffebee"
            />
          </View>

          {/* Search Bar */}
          <Card style={{ margin: 16 }}>
            <Card.Content>
              <Searchbar
                placeholder="Search users..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </Card.Content>
          </Card>

          {/* Users List */}
          <Card style={{ margin: 16 }}>
            <Card.Content>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title>All Users</Title>
                <Chip mode="outlined">
                  {filteredUsers.length} users
                </Chip>
              </View>

              {filteredUsers.length > 0 ? (
                <FlatList
                  data={filteredUsers}
                  renderItem={renderUserItem}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Avatar.Icon size={64} icon="account-search" style={{ backgroundColor: '#e0e0e0' }} />
                  <Text style={{ marginTop: 16, color: '#666' }}>No users found</Text>
                  <Text style={{ marginTop: 8, color: '#999' }}>
                    {searchTerm ? 'Try adjusting your search terms' : 'No users in the system'}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        </ScrollView>

        {/* FAB for adding new user */}
        <FAB
          icon="plus"
          style={{ position: 'absolute', margin: 16, right: 0, bottom: 0 }}
          onPress={() => navigation.navigate('AddUser')}
        />
      </View>

      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog visible={deleteDialog.visible} onDismiss={() => setDeleteDialog({ visible: false, userId: null, userName: '' })}>
          <Dialog.Title>Confirm Delete</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to delete {deleteDialog.userName}? This action cannot be undone.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialog({ visible: false, userId: null, userName: '' })}>
              Cancel
            </Button>
            <Button onPress={handleDelete} textColor="#f44336">
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

export default UserManagementScreen;