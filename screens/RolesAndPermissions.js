import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform,
  ToastAndroid
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import Toast from 'react-native-toast-message';

const { width: screenWidth } = Dimensions.get('window');
const isSmallScreen = screenWidth < 375; // iPhone X width threshold

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
      }
      // } catch (error) {
      //   if (error.response && error.response.status === 403) {
      //     setHasAccess(false);
      //   }
      //   Alert.alert('Error', 'Failed to load user data');
      // }
      catch (error) {
        setHasAccess(false);
  let errorMessage = 'Failed to fetch User Information. Please try again.';

  if (error.response) {
    

    errorMessage =error.response?.data?.message || 'Failed to Load User Data';
    

    

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
      //await AsyncStorage.removeItem("authToken");
      const token = await AsyncStorage.getItem('authToken');
      
   const response=   await api.put(`${config.BASE_URL}/api/users/${userId}/permissions`, 
        { permissions: userPermissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      //Alert.alert('Success', 'Permissions updated successfully!');
      const responsemessage=response.data?.message || 'Permissions updated successfully!';
      if(Platform.OS==='android'){
        ToastAndroid.show(responsemessage,ToastAndroid.LONG)
      }
      else{
        Toast.show({
          type:'success',
          text1:'Success',
          text2:responsemessage
        })
      }
      navigation.goBack();
    }
    // } catch (error) {
    //   const errorMessage = error.response?.data?.message || error.message;
    //   const errorDetails = error.response?.data?.details || '';
    //   Alert.alert('Error', `Failed to update permissions: ${errorMessage} ${errorDetails}`);
    // } 
    catch (error) {
  let errorMessage = 'Failed to update permissions';

  if (error.response) {
 

    errorMessage =error.response?.data?.message || 'Failed to update permissions';
     

    

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
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Surface style={styles.loadingContainer} elevation={0}>
          <ActivityIndicator size="small" color="#000000" />
          <Text variant="bodyLarge" style={styles.loadingText}>Loading user permissions...</Text>
        </Surface>
      </SafeAreaView>
    );
  }

  if (!hasAccess) {
    return null;
  }

  const permissionGroups = groupPermissionsByCategory();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <Surface style={styles.header} elevation={0}>
        <Surface style={styles.headerContent} elevation={0}>
          <Text variant="headlineMedium" style={styles.headerTitle}>Manage Permissions</Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            {user?.firstname?? 'eCards'} {user?.lastname?? 'User'}
          </Text>
          <Text variant="bodySmall" style={styles.headerEmail}>{user?.email?? 'ecardsuser@mashikutech.co.tz'}</Text>
        </Surface>
      </Surface>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Summary */}
        <Card style={styles.userSummaryCard} mode="contained">
          <Card.Content>
            <Surface style={styles.userSummary} elevation={0}>
              <Avatar.Image 
                size={48} 
                source={require('../assets/user.png')}
                style={styles.userAvatar}
              />
              <Surface style={styles.userInfo} elevation={0}>
                <Text variant="bodyLarge" style={styles.userName}>
                  {user?.firstname?? 'eCards'} {user?.lastname ?? 'User'}
                </Text>
                <Text variant="bodySmall" style={styles.userStats}>
                  {userPermissions.length || 0} of {allPermissions.length || 0} permissions granted
                </Text>
              </Surface>
            </Surface>
          </Card.Content>
        </Card>

        {/* Permission Categories */}
       <Card style={styles.categoriesCard} mode="contained">
  <Card.Content>
    <Text variant="titleLarge" style={styles.sectionTitle}>
      Permission Categories
    </Text>

    <Surface style={styles.categoriesContainer} elevation={0}>
      {permissionGroups && typeof permissionGroups === 'object' && Object.keys(permissionGroups).length > 0 ? (
        Object.keys(permissionGroups).map((category) => {
          const permissions = Array.isArray(permissionGroups[category])
            ? permissionGroups[category]
            : [];

          const allSelected =
            Array.isArray(userPermissions) &&
            permissions.every((p) => p?.id && userPermissions.includes(p.id));

          return (
            <Surface
              key={category}
              style={[
                styles.categoryItem,
                isSmallScreen && styles.categoryItemSmall,
              ]}
              elevation={1}
            >
              <Surface style={styles.categoryInfo} elevation={0}>
                <Avatar.Icon
                  size={isSmallScreen ? 36 : 40}
                  icon={
                    category === 'user'
                      ? 'account-group'
                      : category === 'event'
                      ? 'calendar'
                      : 'shield-check'
                  }
                  style={styles.categoryIcon}
                  iconColor="#666666"
                />
                <Surface style={styles.categoryText} elevation={0}>
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {category || 'Unknown'} Permissions
                  </Text>
                  <Text style={styles.categoryCount}>
                    {permissions.length} permissions
                  </Text>
                </Surface>
              </Surface>
              <Surface style={styles.categoryActions} elevation={0}>
                <Text style={styles.categoryStats}>
                  {getCategoryStats ? getCategoryStats(category) : ''}
                </Text>
                <Button
                  mode="text"
                  onPress={() =>
                    typeof handleSelectAll === 'function' &&
                    handleSelectAll(category)
                  }
                  compact
                  style={styles.selectAllButton}
                  textColor="#333333"
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Button>
              </Surface>
            </Surface>
          );
        })
      ) : (
        <Text>No permission categories found</Text>
      )}
    </Surface>
  </Card.Content>
</Card>


        {/* Permissions List */}
        <Card style={styles.permissionsCard} mode="contained">
  <Card.Content>
    <Text variant="titleLarge" style={styles.sectionTitle}>
      All Permissions
    </Text>

    <Surface style={styles.permissionsContainer} elevation={0}>
      {Array.isArray(allPermissions) && allPermissions.length > 0 ? (
        allPermissions.map((permission, index) => {
          if (!permission || !permission.id) return null; // skip invalid items

          const id = permission.id;
          const name = permission.name
            ? permission.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            : 'Unnamed Permission';
          const description = permission.description || '';

          const isSelected =
            typeof isPermissionSelected === 'function'
              ? isPermissionSelected(id)
              : false;

          const handleToggle =
            typeof handlePermissionToggle === 'function'
              ? () => handlePermissionToggle(id)
              : undefined;

          return (
            <Surface
              key={id.toString() || index.toString()} // always provide a string key
              style={[
                styles.permissionItem,
                isSelected
                  ? styles.selectedPermission
                  : styles.unselectedPermission,
              ]}
              elevation={1}
            >
              <Surface style={styles.permissionContent} elevation={0}>
                <Surface style={styles.permissionText} elevation={0}>
                  <Text style={styles.permissionName} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={styles.permissionDescription} numberOfLines={2}>
                    {description}
                  </Text>
                </Surface>
                <Switch
                  value={isSelected}
                  onValueChange={handleToggle}
                  color="#000000"
                />
              </Surface>
            </Surface>
          );
        })
      ) : (
        <Text>No permissions available</Text>
      )}
    </Surface>
  </Card.Content>
</Card>


        {/* Summary */}
        <Surface style={styles.summaryCard} elevation={1}>
          <Text style={styles.summaryTitle}>Summary</Text>
          <Surface style={styles.summaryRow} elevation={0}>
            <Text style={styles.summaryLabel}>Total Permissions:</Text>
            <Text style={styles.summaryValue}>{allPermissions.length || 0}</Text>
          </Surface>
          <Divider style={styles.summaryDivider} />
          <Surface style={styles.summaryRow} elevation={0}>
            <Text style={styles.summaryLabel}>Granted Permissions:</Text>
            <Text style={[styles.summaryValue, styles.grantedValue]}>{userPermissions.length || 0}</Text>
          </Surface>
          <Divider style={styles.summaryDivider} />
          <Surface style={styles.summaryRow} elevation={0}>
            <Text style={styles.summaryLabel}>Denied Permissions:</Text>
            <Text style={[styles.summaryValue, styles.deniedValue]}>
              {(allPermissions.length || 0) - (userPermissions.length || 0)}
            </Text>
          </Surface>
        </Surface>

        {/* Quick Actions */}
        <Surface style={styles.quickActions} elevation={0}>
          <Button
            mode="text"
            onPress={() => setUserPermissions([])}
            icon="close-circle"
            compact
            textColor="#666666"
            style={styles.quickActionButton}
          >
            Clear All
          </Button>
          <Button
            mode="text"
            onPress={() => setUserPermissions(allPermissions.map(p => p.id))}
            icon="check-circle"
            compact
            textColor="#666666"
            style={styles.quickActionButton}
          >
            Select All
          </Button>
        </Surface>

        {/* Action Buttons */}
        <Surface style={styles.actionButtons} elevation={0}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelButton}
            icon="close"
            textColor="#333333"
          >
            Cancel
          </Button>
          <Button
            mode="contained"
            onPress={handleSavePermissions}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}
            icon="check"
          >
            {saving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  headerEmail: {
    color: '#888888',
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userSummaryCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  userSummary: {
    flexDirection: 'row',
    alignItems: 'center',
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
  userStats: {
    color: '#666666',
  },
  categoriesCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    color: '#000000',
    fontWeight: '600',
    marginBottom: 16,
    fontSize: 20,
  },
  categoriesContainer: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  categoryItem: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  categoryItemSmall: {
    padding: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: 'transparent',
  },
  categoryIcon: {
    backgroundColor: '#f5f5f5',
    marginRight: 12,
  },
  categoryText: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  categoryName: {
    fontWeight: 'bold',
    textTransform: 'capitalize',
    color: '#000000',
    fontSize: 15,
  },
  categoryCount: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  categoryActions: {
    alignItems: 'flex-end',
    backgroundColor: 'transparent',
  },
  categoryStats: {
    fontWeight: 'bold',
    color: '#000000',
    fontSize: 14,
  },
  selectAllButton: {
    marginTop: 4,
  },
  permissionsCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  permissionsContainer: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  permissionItem: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#ffffff',
  },
  selectedPermission: {
    backgroundColor: '#f9f9f9',
  },
  unselectedPermission: {
    backgroundColor: '#ffffff',
  },
  permissionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  permissionText: {
    flex: 1,
    marginRight: 12,
    backgroundColor: 'transparent',
  },
  permissionName: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000000',
    fontSize: 15,
  },
  permissionDescription: {
    color: '#666666',
    fontSize: 13,
    lineHeight: 18,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
  },
  summaryTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000000',
    fontSize: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  summaryDivider: {
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  summaryLabel: {
    color: '#666666',
  },
  summaryValue: {
    fontWeight: 'bold',
    color: '#000000',
  },
  grantedValue: {
    color: '#666666',
  },
  deniedValue: {
    color: '#666666',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  quickActionButton: {
    marginHorizontal: 0,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
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
};

export default UserPermissions;