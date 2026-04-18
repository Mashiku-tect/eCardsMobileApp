import React, { useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePermissions } from '../context/PermissionContext';

// Screens
import ScannerScreen from '../screens/ScannerScreen';
import EventsScreen from '../screens/EventsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import ReportsScreen from '../screens/ReportsScreen';
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
import SendThankYouMessage from '../screens/SendThankYouMessage';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/* ----------------------------------------
   TAB PRIORITY (controls initial redirect)
-----------------------------------------*/
const TAB_PRIORITY = [
  { permission: 'dashboard_view', route: 'Dashboard' },
  { permission: 'event_add', route: 'Create Events' },
  { permission: 'event_view', route: 'Events' },
  { permission: 'user_view', route: 'User Management' },
  { permission: 'invitation_send', route: 'Send Invitations' },
];

/* ----------------------------------------
   BOTTOM TABS
-----------------------------------------*/
function BottomTabs({ onLogout }) {
  const { permissions, loading } = usePermissions();
  const insets = useSafeAreaInsets();
 // console.log('permissions',permissions)

  // Safety loader (should almost never show now)
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={{ marginTop: 10 }}>Loading permissions…</Text>
      </View>
    );
  }

  // Decide FIRST tab ONCE
  const initialTab = useMemo(() => {
    const found = TAB_PRIORITY.find(p =>
      permissions.includes(p.permission)
    );
    return found ? found.route : 'Profile';
  }, [permissions]);

  return (
    <Tab.Navigator
      initialRouteName={initialTab}
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
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 8,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      })}
    >
      {permissions.includes('dashboard_view') && (
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
      )}

      {permissions.includes('event_add') && (
        <Tab.Screen name="Create Events" component={CreateEventScreen} />
      )}

      {permissions.includes('event_view') && (
        <Tab.Screen name="Events" component={EventsScreen} />
      )}

      {permissions.includes('user_view') && (
        <Tab.Screen
          name="User Management"
          component={UserManagementStack}
        />
      )}

      {permissions.includes('invitation_send') && (
        <Tab.Screen
          name="Send Invitations"
          component={InvitationsScreen}
        />
      )}

      {/* Profile ALWAYS visible */}
      <Tab.Screen name="Profile">
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

/* ----------------------------------------
   HOME STACK
-----------------------------------------*/
function HomeStack({ onLogout }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeTabs">
        {(props) => <BottomTabs {...props} onLogout={onLogout} />}
      </Stack.Screen>

      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="EventLogs" component={EventLogsScreen} />
      <Stack.Screen name="Scanner" component={ScannerScreen} />
      <Stack.Screen name="EditEvent" component={EditEventScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="ScanPermissions" component={ScanPermissionsScreen} />
      <Stack.Screen name="ManualCheckin" component={ManualCheckin} />
      <Stack.Screen name="SendThankYouMessage" component={SendThankYouMessage} />
    </Stack.Navigator>
  );
}

/* ----------------------------------------
   USER MANAGEMENT STACK
-----------------------------------------*/
function UserManagementStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Users" component={UserManagementScreen} />
      <Stack.Screen name="AddUser" component={AddUserScreen} />
      <Stack.Screen name="EditUser" component={EditUserScreen} />
      <Stack.Screen
        name="UserPermissions"
        component={UserPermissions}
      />
    </Stack.Navigator>
  );
}

/* ----------------------------------------
   MAIN EXPORT
-----------------------------------------*/
export default function AppNavigator({ onLogout }) {
  return <HomeStack onLogout={onLogout} />;
}
