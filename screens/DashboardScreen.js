import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
      let errormessage;
      setError(error.response?.data?.message || 'Failed to load dashboard data');
      errormessage = error.response?.data?.message || 'Failed to load dashboard data';
      
      if(error.response?.status === 403){
        Toast.show({ 
          type: 'error', 
          text1: 'You do not have permissions to view the dashboard' 
        });
      } else {
        Toast.show({ 
          type: 'error', 
          text1: errormessage 
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
    if (!status) return 'default';
    
    switch (status.toLowerCase()) {
      case 'upcoming':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'Not Dealt':
        return 'warning';
      default:
        return 'default';
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
          <Surface style={[styles.statIcon, { backgroundColor: color + '20' }]}>
            <IconButton icon={icon} size={20} iconColor={color} />
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
          backgroundColor="#f8f9fa"
          translucent={false}
        />
        <Surface style={styles.centerContainer}>
          <ActivityIndicator size="small" />
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
        backgroundColor="#f8f9fa"
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

          {error && (
            <Card style={styles.errorCard} mode="contained">
              <Card.Content style={styles.errorContent}>
                <IconButton icon="alert-circle" iconColor="#DC2626" size={20} />
                <Text variant="bodyMedium" style={styles.errorText}>
                  {error}
                </Text>
              </Card.Content>
            </Card>
          )}

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
                color="#3B82F6"
              />
              <StatCard
                title="Upcoming Events"
                value={(stats.activeEvents || 0).toString()}
                subtitle="Scheduled for future/today"
                icon="clock"
                color="#F59E0B"
              />
              <StatCard
                title="Not Dealt"
                value={(stats.notDealtEvents || 0).toString()}
                subtitle="Past due, not completed"
                icon="alert"
                color="#F97316"
              />
              <StatCard
                title="Completion Rate"
                value={`${stats.completionRate || 0}%`}
                subtitle="Events successfully completed"
                icon="check-circle"
                color="#10B981"
              />
              <StatCard
                title="Cancellation Rate"
                value={`${stats.cancellationRate || 0}%`}
                subtitle="Events cancelled by users"
                icon="close-circle"
                color="#EF4444"
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
                      <IconButton icon="cash" iconColor="#2563EB" size={20} />
                      <Surface style={styles.revenueTextContainer}>
                        <Text variant="labelSmall">Total Revenue</Text>
                        <Text variant="titleMedium" style={styles.revenueValue}>
                          {formatCurrency(stats.totalRevenue)}
                        </Text>
                      </Surface>
                    </Card.Content>
                  </Card>
                  <Card style={styles.revenueItem} mode="contained">
                    <Card.Content style={styles.revenueContent}>
                      <IconButton icon="clock-alert" iconColor="#D97706" size={20} />
                      <Surface style={styles.revenueTextContainer}>
                        <Text variant="labelSmall">Pending Payments</Text>
                        <Text variant="titleMedium" style={styles.revenueValue}>
                          {formatCurrency(stats.pendingPayments)}
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
                    color="#10B981"
                    style={styles.progressBar}
                  />
                  <Surface style={styles.progressLabels} elevation={0}>
                    <Text variant="labelSmall">Collected</Text>
                    <Text variant="labelSmall">Pending</Text>
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
                    <Text variant="bodyMedium">This Week</Text>
                    <Text variant="titleMedium" style={styles.completedValue}>
                      {stats.completedEvents?.week || 0}
                    </Text>
                  </Surface>
                  <Divider />
                  <Surface style={styles.completedItem} elevation={0}>
                    <Text variant="bodyMedium">This Month</Text>
                    <Text variant="titleMedium" style={styles.completedValue}>
                      {stats.completedEvents?.month || 0}
                    </Text>
                  </Surface>
                  <Divider />
                  <Surface style={styles.completedItem} elevation={0}>
                    <Text variant="bodyMedium">This Year</Text>
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
                            style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}
                          >
                            {status}
                          </Badge>
                          <Text variant="bodyMedium" style={styles.revenueText}>
                            {formatCurrency(activity?.revenue)}
                          </Text>
                        </Surface>
                      </Surface>
                    );
                  })}
                </Surface>
              ) : (
                <Surface style={styles.emptyState} elevation={0}>
                  <IconButton icon="text-box-outline" size={40} iconColor="#9CA3AF" />
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
    backgroundColor: '#F9FAFB',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
  },
  header: {
    marginBottom: 20,
    backgroundColor: '#F9FAFB',
  },
  title: {
    color: '#1F2937',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#6B7280',
    marginTop: 4,
  },
  errorCard: {
    marginBottom: 16,
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
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#F9FAFB',
  },
  statCard: {
    minWidth: 160,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  statTextContainer: {
    backgroundColor: 'transparent',
  },
  statTitle: {
    color: '#6B7280',
  },
  statValue: {
    color: '#1F2937',
    marginTop: 4,
    fontWeight: 'bold',
  },
  statIcon: {
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  statSubtitle: {
    color: '#6B7280',
  },
  middleSection: {
    flexDirection: width > 768 ? 'row' : 'column',
    gap: 16,
    marginBottom: 16,
    backgroundColor: '#F9FAFB',
  },
  card: {
    flex: 1,
  },
  cardTitle: {
    color: '#1F2937',
    marginBottom: 16,
    fontWeight: '600',
  },
  revenueGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  revenueItem: {
    flex: 1,
  },
  revenueContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  revenueTextContainer: {
    marginLeft: 8,
    backgroundColor: 'transparent',
  },
  revenueValue: {
    color: '#1F2937',
    fontWeight: 'bold',
  },
  progressContainer: {
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  completedList: {
    gap: 8,
    backgroundColor: 'transparent',
  },
  completedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    backgroundColor: 'transparent',
  },
  completedValue: {
    color: '#1F2937',
    fontWeight: 'bold',
  },
  activityList: {
    gap: 12,
    backgroundColor: 'transparent',
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  activityMain: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  activityName: {
    color: '#1F2937',
    marginBottom: 2,
    fontWeight: '500',
  },
  activityDate: {
    color: '#6B7280',
  },
  activitySide: {
    alignItems: 'flex-end',
    gap: 4,
    backgroundColor: 'transparent',
  },
  statusBadge: {
    // Badge component handles its own styling
  },
  revenueText: {
    color: '#1F2937',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'transparent',
  },
  emptyText: {
    marginTop: 8,
    color: '#6B7280',
  },
});

export default Dashboard;