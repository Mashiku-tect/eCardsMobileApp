import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Platform,
  StatusBar,
  ToastAndroid,
  
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation,useFocusEffect } from '@react-navigation/native';
import {
  Text,
  Card,
  ActivityIndicator,
  Surface,
  IconButton,
  Chip,
  Button,
  ProgressBar,
  Divider,
  Badge
} from 'react-native-paper';
import axios from 'axios';
import config from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../utils/api';

const { width } = Dimensions.get('window');

const Dashboard = () => {
  const navigation = useNavigation();
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    completedEvents: {
      week: 0,
      month: 0,
      year: 0,
    },
    completionRate: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    cancellationRate: 0,
    notDealtEvents: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  // Date utility functions
  const isDatePast = (dateString) => {
    if (!dateString) return false;
    const eventDate = new Date(dateString);
    const currentDate = new Date();
    eventDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    return eventDate < currentDate;
  };

  const isDateFuture = (dateString) => {
    if (!dateString) return false;
    const eventDate = new Date(dateString);
    const currentDate = new Date();
    eventDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    return eventDate > currentDate;
  };

  const isDateToday = (dateString) => {
    if (!dateString) return false;
    const eventDate = new Date(dateString);
    const currentDate = new Date();
    eventDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === currentDate.getTime();
  };

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const token = await AsyncStorage.getItem('authToken');
     

      const statsResponse = await api.get(`${config.BASE_URL}/api/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (statsResponse.data.success) {
        setStats(prevStats => ({
          ...prevStats,
          ...statsResponse.data,
          completedEvents: {
            week: statsResponse.data.completedEvents?.week || 0,
            month: statsResponse.data.completedEvents?.month || 0,
            year: statsResponse.data.completedEvents?.year || 0,
          }
        }));
      }

      const activityResponse = await api.get(
        `${config.BASE_URL}/api/dashboard/recent-activity`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (activityResponse.data.success) {
        const activities = activityResponse.data.data || [];
        setRecentActivity(activities);

        const notDealtCount = activities.filter(
          (activity) =>
            activity?.active &&
            !activity?.completed &&
            !activity?.cancelled &&
            isDatePast(activity?.eventDate)
        ).length;

        const properActiveCount = activities.filter(
          (activity) =>
            activity?.active &&
            !activity?.completed &&
            !activity?.cancelled &&
            (isDateFuture(activity?.eventDate) || isDateToday(activity?.eventDate))
        ).length;

        setStats((prevStats) => ({
          ...prevStats,
          notDealtEvents: notDealtCount,
          activeEvents: properActiveCount,
        }));
      }
    } catch (error) {
  let errorMessage = 'Failed To Load Dashboard Data';

  if (axios.isAxiosError(error)) {
    // 1️⃣ Backend responded with error
    if (error.response) {
      const status = error.response.status;
      errorMessage =
        error.response.data?.message || 'Failed To Load Dashboard Data';

      if (status === 403) {
        if(Platform.OS==='android'){
          ToastAndroid.show(errorMessage,ToastAndroid.LONG)
        }
        else{
 Toast.show({
          type: 'error',
          text1: 'You do not have permissions to view the dashboard',
        });
        }
        
       
        return;
      }
    }
    // 2️⃣ No response from server (network error, server down)
    else if (error.request) {
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      } else {
        errorMessage = 'Unable to connect to the server. Check your internet connection.';
      }
    }
    // 3️⃣ Axios configuration error
    else {
      errorMessage = error.message;
    }
  } else {
    // Non-Axios error
    errorMessage = 'Unexpected error occurred';
  }

  setError(errorMessage);
  if(Platform.OS==='android'){
    ToastAndroid.show(errorMessage,ToastAndroid.LONG)
  }
  else{
Toast.show({
    type: 'error',
    text1: errorMessage,
  });
  }
  
} finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // useEffect(() => {
  //   fetchDashboardData();
  // }, []);


  //fetch data on screen focus
  useFocusEffect(
      React.useCallback(() => {
        fetchDashboardData();
      }, [])
    );
  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getStatusFromFlags = (activity) => {
    if (!activity) return 'Inactive';
    
    if (
      activity?.active &&
      !activity?.completed &&
      !activity?.cancelled &&
      isDatePast(activity?.eventDate)
    ) {
      return 'Not Dealt';
    }
    if (
      activity?.active &&
      !activity?.completed &&
      !activity?.cancelled &&
      (isDateFuture(activity?.eventDate) || isDateToday(activity?.eventDate))
    ) {
      return 'Upcoming';
    }
    if (activity?.cancelled) return 'Cancelled';
    if (activity?.completed) return 'Completed';
    if (activity?.active) return 'Upcoming';
    return 'Inactive';
  };

  const getStatusColor = (status) => {
    if (!status) return '#666666';
    
    switch (status.toLowerCase()) {
      case 'upcoming':
        return '#F59E0B';
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      case 'not dealt':
        return '#F97316';
      default:
        return '#666666';
    }
  };

  const getStatusBackgroundColor = (status) => {
    if (!status) return '#F5F5F5';
    
    switch (status.toLowerCase()) {
      case 'upcoming':
        return '#FFFBEB';
      case 'completed':
        return '#ECFDF5';
      case 'cancelled':
        return '#FEF2F2';
      case 'not dealt':
        return '#FFF7ED';
      default:
        return '#F5F5F5';
    }
  };

  const formatCurrency = (amount) => {
    const safeAmount = amount || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
    }).format(safeAmount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Invalid Date';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color }) => (
    <Card style={styles.statCard} mode="contained">
      <Card.Content>
        <Surface style={styles.statHeader}>
          <Surface style={styles.statTextContainer}>
            <Text variant="labelSmall" style={styles.statTitle}>
              {title}
            </Text>
            <Text variant="headlineSmall" style={styles.statValue}>
              {value}
            </Text>
          </Surface>
          <Surface style={[styles.statIcon, { backgroundColor: getStatusBackgroundColor(title) }]}>
            <IconButton 
              icon={icon} 
              size={20} 
              iconColor={color} 
              style={styles.statIconButton}
            />
          </Surface>
        </Surface>
        <Text variant="bodySmall" style={styles.statSubtitle}>
          {subtitle}
        </Text>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#ffffff"
          translucent={false}
        />
        <Surface style={styles.centerContainer}>
          <ActivityIndicator size="small" color="#000000" />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Loading dashboard data...
          </Text>
        </Surface>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#ffffff"
        translucent={false}
      />
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Surface style={styles.content} elevation={0}>
          <Surface style={styles.header} elevation={0}>
            <Text variant="headlineMedium" style={styles.title}>
              Event Dashboard
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Overview of your digital invitation events
            </Text>
          </Surface>

          {/* {error && (
            <Card style={styles.errorCard} mode="contained">
              <Card.Content style={styles.errorContent}>
                <IconButton icon="alert-circle" iconColor="#DC2626" size={20} />
                <Text variant="bodyMedium" style={styles.errorText}>
                  {error}
                </Text>
              </Card.Content>
            </Card>
          )} */}

          {/* Stats Grid */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.statsScroll}
          >
            <Surface style={styles.statsGrid} elevation={0}>
              <StatCard
                title="Total Events"
                value={(stats.totalEvents || 0).toString()}
                subtitle="All events created"
                icon="calendar"
                color="#333333"
              />
              <StatCard
                title="Upcoming Events"
                value={(stats.activeEvents || 0).toString()}
                subtitle="Scheduled for future/today"
                icon="clock"
                color="#333333"
              />
              <StatCard
                title="Not Dealt"
                value={(stats.notDealtEvents || 0).toString()}
                subtitle="Past due, not completed"
                icon="alert"
                color="#333333"
              />
              <StatCard
                title="Completion Rate"
                value={`${stats.completionRate || 0}%`}
                subtitle="Events successfully completed"
                icon="check-circle"
                color="#333333"
              />
              <StatCard
                title="Cancellation Rate"
                value={`${stats.cancellationRate || 0}%`}
                subtitle="Events cancelled by users"
                icon="close-circle"
                color="#333333"
              />
            </Surface>
          </ScrollView>

          {/* Revenue and Completed Events */}
          <Surface style={styles.middleSection} elevation={0}>
            {/* Revenue Card */}
            <Card style={styles.card} mode="contained">
              <Card.Content>
                <Text variant="titleLarge" style={styles.cardTitle}>
                  Revenue Overview
                </Text>
                <Surface style={styles.revenueGrid} elevation={0}>
                  <Card style={styles.revenueItem} mode="contained">
                    <Card.Content style={styles.revenueContent}>
                      <Surface style={[styles.revenueIcon, { backgroundColor: '#F5F5F5' }]}>
                        <IconButton icon="cash" iconColor="#333333" size={20} />
                      </Surface>
                      <Surface style={styles.revenueTextContainer}>
                        <Text variant="labelSmall" style={styles.revenueLabel}>Total Revenue</Text>
                        <Text variant="titleMedium" style={styles.revenueValue}>
                          {formatCurrency(stats?.totalRevenue ?? 0)}
                        </Text>
                      </Surface>
                    </Card.Content>
                  </Card>
                  <Card style={styles.revenueItem} mode="contained">
                    <Card.Content style={styles.revenueContent}>
                      <Surface style={[styles.revenueIcon, { backgroundColor: '#F5F5F5' }]}>
                        <IconButton icon="clock-alert" iconColor="#333333" size={20} />
                      </Surface>
                      <Surface style={styles.revenueTextContainer}>
                        <Text variant="labelSmall" style={styles.revenueLabel}>Pending Payments</Text>
                        <Text variant="titleMedium" style={styles.revenueValue}>
                          {formatCurrency(stats?.pendingPayments ?? 0)}
                        </Text>
                      </Surface>
                    </Card.Content>
                  </Card>
                </Surface>
                <Surface style={styles.progressContainer} elevation={0}>
                  <ProgressBar 
                    progress={
                      (stats.totalRevenue || 0) + (stats.pendingPayments || 0) > 0
                        ? (stats.totalRevenue || 0) / ((stats.totalRevenue || 0) + (stats.pendingPayments || 0))
                        : 0
                    }
                    color="#333333"
                    style={styles.progressBar}
                  />
                  <Surface style={styles.progressLabels} elevation={0}>
                    <Text variant="labelSmall" style={styles.progressLabel}>Collected</Text>
                    <Text variant="labelSmall" style={styles.progressLabel}>Pending</Text>
                  </Surface>
                </Surface>
              </Card.Content>
            </Card>

            {/* Completed Events Card */}
            <Card style={styles.card} mode="contained">
              <Card.Content>
                <Text variant="titleLarge" style={styles.cardTitle}>
                  Completed Events
                </Text>
                <Surface style={styles.completedList} elevation={0}>
                  <Surface style={styles.completedItem} elevation={0}>
                    <Text variant="bodyMedium" style={styles.completedLabel}>This Week</Text>
                    <Text variant="titleMedium" style={styles.completedValue}>
                      {stats.completedEvents?.week || 0}
                    </Text>
                  </Surface>
                  <Divider style={styles.divider} />
                  <Surface style={styles.completedItem} elevation={0}>
                    <Text variant="bodyMedium" style={styles.completedLabel}>This Month</Text>
                    <Text variant="titleMedium" style={styles.completedValue}>
                      {stats.completedEvents?.month || 0}
                    </Text>
                  </Surface>
                  <Divider style={styles.divider} />
                  <Surface style={styles.completedItem} elevation={0}>
                    <Text variant="bodyMedium" style={styles.completedLabel}>This Year</Text>
                    <Text variant="titleMedium" style={styles.completedValue}>
                      {stats.completedEvents?.year || 0}
                    </Text>
                  </Surface>
                </Surface>
              </Card.Content>
            </Card>
          </Surface>

          {/* Recent Activity */}
          <Card style={styles.card} mode="contained">
            <Card.Content>
              <Text variant="titleLarge" style={styles.cardTitle}>
                Recent Activity
              </Text>
              {recentActivity.length > 0 ? (
                <Surface style={styles.activityList} elevation={0}>
                  {recentActivity.map((activity) => {
                    const status = getStatusFromFlags(activity);
                    const statusColor = getStatusColor(status);
                    return (
                      <Surface key={activity?.id || Math.random()} style={styles.activityItem}>
                        <Surface style={styles.activityMain} elevation={0}>
                          <Text variant="bodyLarge" style={styles.activityName}>
                            {activity?.eventName || 'Unnamed Event'}
                          </Text>
                          <Text variant="bodySmall" style={styles.activityDate}>
                            {formatDate(activity?.eventDate)}
                          </Text>
                        </Surface>
                        <Surface style={styles.activitySide} elevation={0}>
                          <Badge 
                            size={24} 
                            style={[
                              styles.statusBadge, 
                              { 
                                backgroundColor: getStatusBackgroundColor(status),
                                color: statusColor
                              }
                            ]}
                          >
                            {status}
                          </Badge>
                          <Text variant="bodyMedium" style={styles.revenueText}>
                            {formatCurrency(activity?.revenue ?? 0)}
                          </Text>
                        </Surface>
                      </Surface>
                    );
                  })}
                </Surface>
              ) : (
                <Surface style={styles.emptyState} elevation={0}>
                  <IconButton icon="text-box-outline" size={40} iconColor="#CCCCCC" />
                  <Text variant="bodyMedium" style={styles.emptyText}>
                    No recent activity found
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  centerContainer: {
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
    marginBottom: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 28,
    marginBottom: 4,
  },
  subtitle: {
    color: '#666666',
    fontSize: 16,
  },
  errorCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    marginLeft: 8,
  },
  statsScroll: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#ffffff',
  },
  statCard: {
    minWidth: 160,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  statTextContainer: {
    backgroundColor: 'transparent',
  },
  statTitle: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '500',
  },
  statValue: {
    color: '#000000',
    marginTop: 4,
    fontWeight: 'bold',
    fontSize: 24,
  },
  statIcon: {
    borderRadius: 12,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statIconButton: {
    margin: 0,
  },
  statSubtitle: {
    color: '#888888',
    fontSize: 13,
  },
  middleSection: {
    flexDirection: width > 768 ? 'row' : 'column',
    gap: 20,
    marginBottom: 24,
    backgroundColor: '#ffffff',
  },
  card: {
    flex: 1,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  cardTitle: {
    color: '#000000',
    marginBottom: 20,
    fontWeight: '600',
    fontSize: 20,
  },
  revenueGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  revenueItem: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  revenueContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  revenueIcon: {
    borderRadius: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  revenueTextContainer: {
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  revenueLabel: {
    color: '#666666',
    fontSize: 12,
  },
  revenueValue: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 16,
    backgroundColor: 'transparent',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F0F0F0',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  progressLabel: {
    color: '#666666',
    fontSize: 12,
  },
  completedList: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  completedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  completedLabel: {
    color: '#666666',
  },
  completedValue: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 18,
  },
  divider: {
    backgroundColor: '#F0F0F0',
  },
  activityList: {
    gap: 16,
    backgroundColor: 'transparent',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  activityMain: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  activityName: {
    color: '#000000',
    marginBottom: 4,
    fontWeight: '500',
    fontSize: 16,
  },
  activityDate: {
    color: '#888888',
    fontSize: 14,
  },
  activitySide: {
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: 'transparent',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 24,
    fontSize: 12,
    fontWeight: '500',
  },
  revenueText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'transparent',
  },
  emptyText: {
    marginTop: 12,
    color: '#888888',
  },
});

export default Dashboard;