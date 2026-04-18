import React, { useEffect, useState } from 'react';
import { 
  FlatList, 
  RefreshControl,
  StatusBar,
  Platform,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&auto=format&fit=crop&w=2012&q=80",
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2098&q=80",
    "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    // New images added below
    "https://images.unsplash.com/photo-1547592180-85f173990554?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1541535645162-428c40b7c4b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=2071&q=80",
    "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
    "https://images.unsplash.com/photo-1492684223066-dd23140edf6d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&auto=format&fit=crop&w=2069&q=80",
    "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1519677100203-5f5a1c56b7b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1567942712661-82b9b407abbf?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?ixlib=rb-4.0.3&auto=format&fit=crop&w=2012&q=80"
  ];

  // Function to get random image for each event
  // const getRandomEventImage = (eventId) => {
  //   const index = (eventId?.toString().length || 0) % randomEventImages.length;
  //   return randomEventImages[index];
  // };

  const getRandomEventImage = () => {
  const index = Math.floor(Math.random() * randomEventImages.length);
  return randomEventImages[index];
};


  // useEffect(() => {
  //   fetchEvents();
  // }, []);

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
          
        }
      );

      if (response.data) {
        setEvents(response.data.events || []);
      } else {
        setError(response.data.message || 'Failed to fetch events');
      }
    } catch (error) {
      //console.error('Error fetching events:', error);
      
      let errorMessage = 'Failed to fetch events';
      //let errorMessage = 'Failed to Update First attendee status. Please try again.';

  if (error.response) {


    errorMessage =error.response?.data?.message || 'Failed to fetch events. Please try again.';
    

    

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
  if (!eventId) {
    //console.warn("handleEventAction: missing eventId", { action, eventId, eventName });
    return;
  }

  const safeEventName = eventName ?? "Event";

  switch (action) {
    case "details":
      navigation.navigate("EventDetails", {
        eventId,
        eventName: safeEventName,
      });
      break;

    case "scan":
      navigation.navigate("Scanner", {
        eventId,
        eventName: safeEventName,
      });
      break;

    case "logs":
      navigation.navigate("EventLogs", {
        eventId,
        eventName: safeEventName,
      });
      break;

    case "manual-checkin":
      navigation.navigate("ManualCheckin", {
        eventId,
        eventName: safeEventName,
      });
      break;

    default:
      //console.warn("handleEventAction: unknown action", action);
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
        </Surface>

        <Surface style={styles.details} elevation={0}>
          <Surface style={styles.detailItem} elevation={0}>
            <IconButton icon="calendar" size={16} iconColor="#666666" />
            <Text variant="bodyMedium" style={styles.detailText}>
              {item.eventDate ? formatDate(item.eventDate) : 'Date not set'}
            </Text>
          </Surface>
          
          <Surface style={styles.detailItem} elevation={0}>
            <IconButton icon="map-marker" size={16} iconColor="#666666" />
            <Text variant="bodyMedium" style={styles.detailText} numberOfLines={1}>
              {item.location || 'Location not specified'}
            </Text>
          </Surface>
          
          <Surface style={styles.detailItem} elevation={0}>
            <IconButton icon="account-group" size={16} iconColor="#666666" />
            <Text variant="bodyMedium" style={styles.detailText}>
              {item.totalGuests ? `${item.totalGuests} attendees` : 'No attendees info'}
            </Text>
          </Surface>
          
          <Surface style={styles.detailItem} elevation={0}>
            <IconButton icon={getCategoryIcon(item.category)} size={16} iconColor="#666666" />
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
        <StatusBar 
          barStyle="dark-content"
          backgroundColor="#ffffff"
          translucent={false}
        />
        <Surface style={styles.loadingContainer} elevation={0}>
          <ActivityIndicator size="small" color="#000000" />
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
        backgroundColor="#ffffff"
        translucent={false}
      />
      
      <Surface style={styles.header} elevation={0}>
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
            colors={['#000000']}
            tintColor={'#000000'}
          />
        }
        ListEmptyComponent={
          <Surface style={styles.emptyState} elevation={0}>
            {error ? (
              <>
                <IconButton icon="alert-circle" size={64} iconColor="#999999" />
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
                <IconButton icon="calendar-blank" size={64} iconColor="#CCCCCC" />
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
    padding: 20,
    paddingTop: 10,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 28,
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#666666',
    marginBottom: 20,
    fontSize: 16,
  },
  createButton: {
    alignSelf: 'flex-start',
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  createButtonContent: {
    paddingVertical: 6,
    flexDirection: 'row-reverse',
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
  },
  card: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  cardImage: {
    height: 160,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    paddingTop: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  title: {
    color: '#000000',
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
    fontSize: 20,
  },
  details: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  detailText: {
    color: '#666666',
    marginLeft: 8,
    flex: 1,
    fontSize: 15,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#F0F0F0',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
  },
  viewButton: {
    backgroundColor: '#333333',
  },
  scanButton: {
    backgroundColor: '#555555',
  },
  logsButton: {
    backgroundColor: '#777777',
  },
  manualCheckinButton: {
    backgroundColor: '#999999',
  },
  actionButtonLabel: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    marginTop: 40,
    backgroundColor: 'transparent',
  },
  emptyStateText: {
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 20,
  },
  emptyStateSubtext: {
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
  },
};

export default EventsScreen;