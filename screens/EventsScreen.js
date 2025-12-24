import React, { useEffect, useState } from 'react';
import { 
  FlatList, 
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Platform,
  Image
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  Text,
  Card,
  ActivityIndicator,
  Surface,
  IconButton,
  Button,
  Chip,
  Divider,
  Avatar,
  FAB
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import api from '../utils/api';

const EventsScreen = () => {
  const [events, setEvents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigation = useNavigation();

  // Array of random event images from Unsplash
  const randomEventImages = [
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80",
    "https://images.unsplash.com/photo-1531058020387-3be344556be6?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&auto=format&fit=crop&w=2012&q=80",
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2098&q=80",
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
  ];

  // Function to get random image for each event
  const getRandomEventImage = (eventId) => {
    // Use event ID to get consistent but different image for each event
    const index = (eventId?.toString().length || 0) % randomEventImages.length;
    return randomEventImages[index];
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication token not found. Please login again.');
        navigation.navigate('Login');
        return;
      }

      const response = await api.get(
        `${config.BASE_URL}/api/getallevents`, 
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.data) {
        setEvents(response.data.events || []);
      } else {
        setError(response.data.message || 'Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      
      let errorMessage = 'Failed to fetch events';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Session expired. Please login again.';
          await AsyncStorage.removeItem('userToken');
          navigation.navigate('Login');
        } else {
          errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchEvents();
    }, [])
  );

  const formatDate = (dateString) => {
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (error) {
      return dateString;
    }
  };

  const handleEventAction = (action, eventId, eventName) => {
    switch (action) {
      case 'details':
        navigation.navigate("EventDetails", { eventId, eventName });
        break;
      case 'scan':
        navigation.navigate("Scanner", { eventId, eventName });
        break;
      case 'logs':
        navigation.navigate("EventLogs", { eventId, eventName });
        break;
      case 'manual-checkin':
        navigation.navigate("ManualCheckin", { eventId, eventName });
        break;
      default:
        break;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'business':
        return 'briefcase';
      case 'education':
        return 'school';
      case 'entertainment':
        return 'music';
      case 'personal':
        return 'account';
      default:
        return 'calendar';
    }
  };

  const getStatusColor = (eventDate) => {
    const today = new Date();
    const eventDateObj = new Date(eventDate);
    
    if (eventDateObj < today) {
      return '#EF4444'; // Past event - red
    } else if (eventDateObj.toDateString() === today.toDateString()) {
      return '#10B981'; // Today - green
    } else {
      return '#3B82F6'; // Future event - blue
    }
  };

  const getStatusText = (eventDate) => {
    const today = new Date();
    const eventDateObj = new Date(eventDate);
    
    if (eventDateObj < today) {
      return 'Past';
    } else if (eventDateObj.toDateString() === today.toDateString()) {
      return 'Today';
    } else {
      return 'Upcoming';
    }
  };

  const renderItem = ({ item }) => (
    <Card style={styles.card} mode="contained">
      <Card.Cover 
        source={{ uri: getRandomEventImage(item.id) }} 
        style={styles.cardImage}
      />
      
      <Card.Content style={styles.cardContent}>
        <Surface style={styles.cardHeader} elevation={0}>
          <Text variant="titleLarge" style={styles.title} numberOfLines={2}>
            {item.eventName || 'Untitled Event'}
          </Text>
          {/* <Chip 
            mode="outlined" 
            compact
            textStyle={styles.statusChipText}
            style={[styles.statusChip, { borderColor: getStatusColor(item.eventDate) }]}
          >
            {getStatusText(item.eventDate)}
          </Chip> */}
        </Surface>

        <Surface style={styles.details} elevation={0}>
          <Surface style={styles.detailItem} elevation={0}>
            <IconButton icon="calendar" size={16} iconColor="#666" />
            <Text variant="bodyMedium" style={styles.detailText}>
              {item.eventDate ? formatDate(item.eventDate) : 'Date not set'}
            </Text>
          </Surface>
          
          <Surface style={styles.detailItem} elevation={0}>
            <IconButton icon="map-marker" size={16} iconColor="#666" />
            <Text variant="bodyMedium" style={styles.detailText} numberOfLines={1}>
              {item.location || 'Location not specified'}
            </Text>
          </Surface>
          
          <Surface style={styles.detailItem} elevation={0}>
            <IconButton icon="account-group" size={16} iconColor="#666" />
            <Text variant="bodyMedium" style={styles.detailText}>
              {item.totalGuests ? `${item.totalGuests} attendees` : 'No attendees info'}
            </Text>
          </Surface>
          
          <Surface style={styles.detailItem} elevation={0}>
            <IconButton icon={getCategoryIcon(item.category)} size={16} iconColor="#666" />
            <Text variant="bodyMedium" style={styles.detailText}>
              {item.category ? `${item.category.charAt(0).toUpperCase() + item.category.slice(1)}` : 'No category'}
            </Text>
          </Surface>
        </Surface>

        <Divider style={styles.divider} />

        <Surface style={styles.actionButtons} elevation={0}>
          <Button
            mode="contained"
            compact
            icon="eye"
            onPress={() => handleEventAction('details', item.id, item.eventName)}
            style={[styles.actionButton, styles.viewButton]}
            labelStyle={styles.actionButtonLabel}
          >
            Details
          </Button>

          <Button
            mode="contained"
            compact
            icon="qrcode-scan"
            onPress={() => handleEventAction('scan', item.id, item.eventName)}
            style={[styles.actionButton, styles.scanButton]}
            labelStyle={styles.actionButtonLabel}
          >
            Scan
          </Button>

          <Button
            mode="contained"
            compact
            icon="format-list-bulleted"
            onPress={() => handleEventAction('logs', item.id, item.eventName)}
            style={[styles.actionButton, styles.logsButton]}
            labelStyle={styles.actionButtonLabel}
          >
            Logs
          </Button>

          <Button
            mode="contained"
            compact
            icon="account-plus"
            onPress={() => handleEventAction('manual-checkin', item.id, item.eventName)}
            style={[styles.actionButton, styles.manualCheckinButton]}
            labelStyle={styles.actionButtonLabel}
          >
            Manual
          </Button>
        </Surface>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Surface style={styles.loadingContainer} elevation={0}>
          <ActivityIndicator size="small" />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Loading events...
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
      
      <Surface style={styles.header} elevation={1}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          My Events
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          Manage your events and check-ins
        </Text>
        
        <Button
          mode="contained"
          icon="plus"
          onPress={() => navigation.navigate('Create Events')}
          style={styles.createButton}
          contentStyle={styles.createButtonContent}
        >
          Create Event
        </Button>
      </Surface>
      
      <FlatList
        data={events}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={fetchEvents}
            colors={['#3B82F6']}
            tintColor={'#3B82F6'}
          />
        }
        ListEmptyComponent={
          <Surface style={styles.emptyState} elevation={0}>
            {error ? (
              <>
                <IconButton icon="alert-circle" size={64} iconColor="#EF4444" />
                <Text variant="titleLarge" style={styles.emptyStateText}>
                  Error Loading Events
                </Text>
                <Text variant="bodyMedium" style={styles.emptyStateSubtext}>
                  {error}
                </Text>
                <Button
                  mode="contained"
                  onPress={fetchEvents}
                  style={styles.retryButton}
                >
                  Try Again
                </Button>
              </>
            ) : (
              <>
                <IconButton icon="calendar-blank" size={64} iconColor="#c2c2c2" />
                <Text variant="titleLarge" style={styles.emptyStateText}>
                  No events yet
                </Text>
                <Text variant="bodyMedium" style={styles.emptyStateSubtext}>
                  Create your first event to get started
                </Text>
              </>
            )}
          </Surface>
        }
      />

      {/* <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('Create Events')}
        label="Create Event"
      /> */}
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
    color: '#6B7280',
  },
  header: {
    padding: 20,
    paddingTop: 10,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    color: '#1a1a1a',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    color: '#666',
    marginBottom: 15,
  },
  createButton: {
    alignSelf: 'flex-start',
  },
  createButtonContent: {
    flexDirection: 'row-reverse',
  },
  listContent: {
    padding: 15,
    paddingTop: 0,
  },
  card: {
    marginBottom: 20,
  },
  cardImage: {
    height: 160,
  },
  cardContent: {
    paddingTop: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  title: {
    color: '#1a1a1a',
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  statusChip: {
    height: 30,
  },
  statusChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  details: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  detailText: {
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  divider: {
    marginVertical: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 2,
  },
  viewButton: {
    backgroundColor: '#4e6bff',
  },
  scanButton: {
    backgroundColor: '#10b981',
  },
  logsButton: {
    backgroundColor: '#f59e0b',
  },
  manualCheckinButton: {
    backgroundColor: '#8b5cf6',
  },
  actionButtonLabel: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 20,
    backgroundColor: 'transparent',
  },
  emptyStateText: {
    color: '#4a4a4a',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyStateSubtext: {
    color: '#8a8d97',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3B82F6',
  },
};

export default EventsScreen;