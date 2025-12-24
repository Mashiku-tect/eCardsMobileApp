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
  Card,
  Title,
  Button,
  Switch,
  Divider,
  Chip,
  Avatar,
  Surface,
  IconButton,
  Portal,
  Dialog,
  Paragraph,
  List
} from 'react-native-paper';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import api from '../utils/api';

const UserPermissions = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params;
  
  const [user, setUser] = useState(null);
  const [allPermissions, setAllPermissions] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasAccess, setHasAccess] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const defaultPermissions = [
    {"id":"73cc64f3-baec-11f0-a366-f430b9110f54","name":"user_add","description":"Can add a new user"},
    {"id":"73cc6b29-baec-11f0-a366-f430b9110f54","name":"user_edit","description":"Can edit user details"},
    {"id":"73cc6c93-baec-11f0-a366-f430b9110f54","name":"user_delete","description":"Can delete users"},
    {"id":"73cc6d8a-baec-11f0-a366-f430b9110f54","name":"user_view","description":"Can view users"},
    {"id":"73cc6f05-baec-11f0-a366-f430b9110f54","name":"user_set_permissions","description":"Can assign permissions to users"},
    {"id":"73cc6fb0-baec-11f0-a366-f430b9110f54","name":"event_add","description":"Can create events"},
    {"id":"73cc705b-baec-11f0-a366-f430b9110f54","name":"event_edit","description":"Can edit events"},
    {"id":"73cc7107-baec-11f0-a366-f430b9110f54","name":"event_delete","description":"Can delete events"},
    {"id":"73cc71a8-baec-11f0-a366-f430b9110f54","name":"event_view","description":"Can view events"},
    {"id":"73cc7247-baec-11f0-a366-f430b9110f54","name":"event_view_report","description":"Can view event reports"},
    {"id":"73cc72ea-baec-11f0-a366-f430b9110f54","name":"event_manage_scanners","description":"Can manage scanners for an event"},
    {"id":"73cc73a0-baec-11f0-a366-f430b9110f54","name":"event_cancel","description":"Can cancel events"},
    {"id":"73cc741a-baec-11f0-a366-f430b9110f54","name":"event_mark_completed","description":"Can mark events as completed"},
    {"id":"73cc74ae-baec-11f0-a366-f430b9110f54","name":"scanninglogs_view","description":"Can view QR code scanning logs"},
    {"id":"73cc752f-baec-11f0-a366-f430b9110f54","name":"dashboard_view","description":"Can view dashboard"},
    {"id":"73cc75ed-baec-11f0-a366-f430b9110f54","name":"invitation_generate","description":"Can generate invitation cards"},
    {"id":"73cc7661-baec-11f0-a366-f430b9110f54","name":"invitation_send","description":"Can send invitations"},
    {"id":"d8b88424-bd33-11f0-8d4d-f430b9110f54","name":"call_status_update","description":"user can update the call status of the guest"}
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if(!token){
          return;
        }
        
        // Fetch user details
        const userResponse = await api.get(`${config.BASE_URL}/api/users/getuserinfo/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(userResponse.data.user);

        // Fetch user's current permissions
        const permissionsResponse = await api.get(`${config.BASE_URL}/api/users/permissions/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Extract just the permission IDs from the response
        const userPermissionIds = permissionsResponse.data.map(p => p.id);
        
        setUserPermissions(userPermissionIds);
        setAllPermissions(defaultPermissions);
        setHasAccess(true);
        
      } catch (error) {
        if (error.response && error.response.status === 403) {
          setHasAccess(false);
        }
        Alert.alert('Error', 'Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  useEffect(() => {
    if (hasAccess === false) {
      navigation.navigate('Home');
    }
  }, [hasAccess, navigation]);

  const handlePermissionToggle = (permissionId) => {
    setUserPermissions(prev => {
      const newPermissions = prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId];
      return newPermissions;
    });
  };

  const handleSelectAll = (category) => {
    const categoryPermissions = allPermissions
      .filter(p => p.name.startsWith(category))
      .map(p => p.id);
    
    setUserPermissions(prev => {
      const hasAllCategory = categoryPermissions.every(id => prev.includes(id));
      if (hasAllCategory) {
        // Remove all category permissions
        return prev.filter(id => !categoryPermissions.includes(id));
      } else {
        // Add all category permissions
        const newPerms = [...prev];
        categoryPermissions.forEach(id => {
          if (!newPerms.includes(id)) {
            newPerms.push(id);
          }
        });
        return newPerms;
      }
    });
  };

  const handleSavePermissions = async () => {
    setSaving(true);
    try {
      await AsyncStorage.removeItem("authToken");
      const token = await AsyncStorage.getItem('authToken');
      
      await api.put(`${config.BASE_URL}/api/users/${userId}/permissions`, 
        { permissions: userPermissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      Alert.alert('Success', 'Permissions updated successfully!');
      navigation.goBack();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      const errorDetails = error.response?.data?.details || '';
      Alert.alert('Error', `Failed to update permissions: ${errorMessage} ${errorDetails}`);
    } finally {
      setSaving(false);
    }
  };

  const groupPermissionsByCategory = () => {
    const groups = {};
    allPermissions.forEach(permission => {
      const category = permission.name.split('_')[0];
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(permission);
    });
    return groups;
  };

  const isPermissionSelected = (permissionId) => {
    return userPermissions.includes(permissionId);
  };

  const getCategoryStats = (category) => {
    const categoryPermissions = allPermissions.filter(p => p.name.startsWith(category));
    const selectedCount = categoryPermissions.filter(p => userPermissions.includes(p.id)).length;
    return `${selectedCount}/${categoryPermissions.length}`;
  };

  if (loading || hasAccess === null) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={{ marginTop: 16 }}>Loading user permissions...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasAccess) {
    return null;
  }

  const permissionGroups = groupPermissionsByCategory();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      {/* Header */}
      <Surface style={{ elevation: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
          <IconButton
            icon="arrow-left"
            onPress={() => navigation.goBack()}
          />
          <View style={{ flex: 1 }}>
            <Title>Manage Permissions</Title>
            <Text style={{ color: '#666' }}>
              {user?.firstname} {user?.lastname}
            </Text>
            <Text style={{ color: '#666', fontSize: 12 }}>{user?.email}</Text>
          </View>
        </View>
      </Surface>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* User Summary */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <Avatar.Image 
                size={48} 
                source={require('../assets/user.png')}
                style={{ marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
                  {user?.firstname} {user?.lastname}
                </Text>
                <Text variant="bodySmall" style={{ color: '#666' }}>
                  {userPermissions.length} of {allPermissions.length} permissions granted
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Permission Categories */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Title style={{ marginBottom: 16 }}>Permission Categories</Title>
            <View style={{ gap: 8 }}>
              {Object.keys(permissionGroups).map((category) => (
                <Surface 
                  key={category} 
                  style={{ 
                    borderRadius: 8, 
                    padding: 12,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    elevation: 1
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Avatar.Icon 
                      size={40} 
                      icon={category === 'user' ? 'account-group' : category === 'event' ? 'calendar' : 'shield-check'}
                      style={{ backgroundColor: '#e0e0e0', marginRight: 12 }}
                    />
                    <View>
                      <Text style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>
                        {category} Permissions
                      </Text>
                      <Text style={{ fontSize: 12, color: '#666' }}>
                        {permissionGroups[category].length} permissions available
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontWeight: 'bold' }}>
                      {getCategoryStats(category)}
                    </Text>
                    <Button
                      mode="text"
                      onPress={() => handleSelectAll(category)}
                      compact
                      style={{ marginTop: 4 }}
                    >
                      {permissionGroups[category].every(p => userPermissions.includes(p.id)) 
                        ? 'Deselect All' 
                        : 'Select All'
                      }
                    </Button>
                  </View>
                </Surface>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Permissions List */}
        <Card>
          <Card.Content>
            <Title style={{ marginBottom: 16 }}>All Permissions</Title>
            <View style={{ gap: 12 }}>
              {allPermissions.map((permission) => {
                const isSelected = isPermissionSelected(permission.id);
                return (
                  <Surface 
                    key={permission.id}
                    style={{ 
                      borderRadius: 8, 
                      padding: 16,
                      elevation: 1,
                      backgroundColor: isSelected ? '#e8f5e8' : '#ffffff'
                    }}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
                          {permission.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Text>
                        <Text style={{ color: '#666', fontSize: 12 }}>
                          {permission.description}
                        </Text>
                      </View>
                      <Switch
                        value={isSelected}
                        onValueChange={() => handlePermissionToggle(permission.id)}
                      />
                    </View>
                  </Surface>
                );
              })}
            </View>
          </Card.Content>
        </Card>

        {/* Summary */}
        <Surface style={{ borderRadius: 8, padding: 16, marginTop: 16, elevation: 2 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 12 }}>Summary</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text>Total Permissions:</Text>
            <Text style={{ fontWeight: 'bold' }}>{allPermissions.length}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text>Granted Permissions:</Text>
            <Text style={{ fontWeight: 'bold', color: '#4caf50' }}>{userPermissions.length}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text>Denied Permissions:</Text>
            <Text style={{ fontWeight: 'bold', color: '#f44336' }}>
              {allPermissions.length - userPermissions.length}
            </Text>
          </View>
        </Surface>

        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 32 }}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={{ flex: 1 }}
            icon="close"
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSavePermissions}
            loading={saving}
            disabled={saving}
            style={{ flex: 1 }}
            icon="check"
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </View>

        {/* Quick Actions */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
          <Button
            mode="text"
            onPress={() => setUserPermissions([])}
            icon="close-circle"
            compact
          >
            Clear All
          </Button>
          <Button
            mode="text"
            onPress={() => setUserPermissions(allPermissions.map(p => p.id))}
            icon="check-circle"
            compact
          >
            Select All
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserPermissions;