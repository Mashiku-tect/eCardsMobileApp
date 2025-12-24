import React from 'react';
import { 
  View, 
  ActivityIndicator
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, Icon } from 'react-native-paper';
import { usePermissions } from '../context/PermissionContext';

// Screens
import ScannerScreen from '../screens/ScannerScreen';
import EventsScreen from '../screens/EventsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
 import ReportsScreen from '../screens/ReportsScreen';
// import SettingsScreen from '../screens/SettingsScreen';
import CreateEventScreen from '../screens/CreateEventsScreen';
 import EventDetailsScreen from '../screens/EventDetailsScreen';
 import EventLogsScreen from '../screens/EventLogsScreen'; 
import DashboardScreen from '../screens/DashboardScreen';
import EditEventScreen from '../screens/EditEventScreen';
import InvitationsScreen from '../screens/InvitationsScreen';
 import AddUserScreen from '../screens/AddUserScreen';
 import EditUserScreen from '../screens/EditUserScreen';
 import ScanPermissionsScreen from '../screens/ScanPermissionScreen';
 import UserPermissions from '../screens/RolesAndPermissions';
 import ManualCheckin from '../screens/ManualCheckinScreen';

const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();

// Bottom Tabs (main daily actions)
function BottomTabs({ onLogout }) {
  const { permissions, loading } = usePermissions();

  // Show splash while loading permissions
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={{ marginTop: 10 }}>Loading permissions...</Text>
      </View>
    );
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size, focused }) => {
          let iconName;
          
          switch (route.name) {
            case 'Dashboard': 
              iconName = focused ? 'view-dashboard' : 'view-dashboard-outline'; 
              break;
            case 'Create Events': 
              iconName = focused ? 'plus-circle' : 'plus-circle-outline'; 
              break;
            case 'Events': 
              iconName = focused ? 'calendar' : 'calendar-outline'; 
              break;
            case 'User Management': 
              iconName = focused ? 'account-group' : 'account-group-outline'; 
              break;
            case 'Send Invitations': 
              iconName = focused ? 'send' : 'send-outline'; 
              break;
            case 'Profile': 
              iconName = focused ? 'account' : 'account-outline'; 
              break;
          }
          return <Icon source={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6200ee',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          height: 60,
          paddingBottom: 10,
        },
      })}
    >

      {/* Dashboard */}
      {permissions.includes('dashboard_view') && (
        <Tab.Screen 
          name="Dashboard" 
          component={DashboardScreen}
          options={{ tabBarLabel: 'Dashboard' }}
        />
      )}

      {/* Create Events */}
      {permissions.includes('event_add') && (
        <Tab.Screen 
          name="Create Events" 
          component={CreateEventScreen}
          options={{ tabBarLabel: 'Create' }}
        />
      )}

      {/* Events */}
      {permissions.includes('event_view') && (
        <Tab.Screen 
          name="Events" 
          component={EventsScreen}
          options={{ tabBarLabel: 'Events' }}
        />
      )}

       {/* User Management */}
      {permissions.includes('user_view') && (
        <Tab.Screen 
          name="User Management" 
          component={UserManagementStack}
          options={{ tabBarLabel: 'Users' }}
        />
      )}

       {/* Invitations */}
      {permissions.includes('invitation_send') && (
        <Tab.Screen 
          name="Send Invitations" 
          component={InvitationsScreen}
          options={{ tabBarLabel: 'Invite' }}
        />
      )}

        {/* Profile (always visible) */}
      <Tab.Screen 
        name="Profile"
        options={{ tabBarLabel: 'Profile' }}
      >
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>

      

    </Tab.Navigator>
  );
}

// Home Stack (for screens pushed on top of tabs)
function HomeStack({ onLogout }) {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="HomeTabs" 
        options={{ headerShown: false }}
      >
        {(props) => <BottomTabs {...props} onLogout={onLogout} />}
      </Stack.Screen>

      <Stack.Screen 
        name="EventDetails" 
        component={EventDetailsScreen}
        options={{ title: 'Event Details' }}
      />

       <Stack.Screen 
        name="EventLogs" 
        component={EventLogsScreen}
        options={{ title: 'Event Logs' }}
      />

       <Stack.Screen 
        name="Scanner" 
        component={ScannerScreen}
        options={{ title: 'QR Scanner' }}
      />

      <Stack.Screen 
        name="EditEvent" 
        component={EditEventScreen}
        options={{ title: 'Edit Event' }}
      />

      <Stack.Screen 
        name="Reports" 
        component={ReportsScreen}
        options={{ title: 'Event Reports' }}
      />

      <Stack.Screen 
        name="ScanPermissions" 
        component={ScanPermissionsScreen}
        options={{ title: 'Scanner Permissions' }}
      />


      <Stack.Screen 
        name="ManualCheckin" 
        component={ManualCheckin}
        options={{ title: 'Manual Check-in' }}
      />


    </Stack.Navigator>
  );
}

// User Management Stack
function UserManagementStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerStyle: {
          backgroundColor: '#6200ee',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Users" 
        component={UserManagementScreen}
        options={{ title: 'User Management' }}
      />

      <Stack.Screen 
        name="AddUser" 
        component={AddUserScreen}
        options={{ title: 'Add User' }}
      />

       <Stack.Screen 
        name="EditUser" 
        component={EditUserScreen}
        options={{ title: 'Edit User' }}
      />

      
     
      <Stack.Screen 
        name="UserPermissions" 
        component={UserPermissions}
        options={{ title: 'Manage Permissions' }}
      />
    </Stack.Navigator>
  );
}

// Main App Navigator
export default function AppNavigator({ onLogout }) {
  return (
    <HomeStack onLogout={onLogout} />
  );
}