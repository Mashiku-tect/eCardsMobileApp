import React, { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  Platform,
  StatusBar,
  ToastAndroid,
  StyleSheet,
  RefreshControl
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  ActivityIndicator,
  Surface,
  Avatar,
  Chip,
  Divider,
  Badge,
  IconButton,
  Button
} from "react-native-paper";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import Toast from 'react-native-toast-message';
import api from '../utils/api';

const CheckInLogsScreen = ({route,navigation}) => {
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eventId, setEventId] = useState(null);
  const [checkInLogs, setCheckInLogs] = useState([]);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Combined fetch function to ensure proper sequence
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Step 1: Fetch events first
      const token = await AsyncStorage.getItem("authToken");
      
      // Fetch events
      const eventsRes = await api.get(
        `${config.BASE_URL}/api/getallevents/`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000 // 10 second timeout
        }
      );
      
      const fetchedEvents = eventsRes.data.events || [];
      setEvents(fetchedEvents);
      
      // Determine eventId - prioritize route params
      const targetEventId = route.params?.eventId || eventId;
      if (targetEventId) {
        setEventId(targetEventId);
        
        // Find the event in fetched events
        const foundEvent = fetchedEvents.find(
          event => event._id === targetEventId || event.id === targetEventId
        );
        
        if (!foundEvent) {
          setCurrentEvent(null);
          setError({ type: 'NO_EVENT', message: 'Event not found' });
          return;
        }
        
        setCurrentEvent(foundEvent);
        
        // Step 2: Fetch check-in logs for this event
        try {
          const logsRes = await api.get(
            `${config.BASE_URL}/api/events/checkins/${targetEventId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000
            }
          );
          setCheckInLogs(logsRes.data || []);
        } catch (logError) {
          // Handle log fetch error separately
          const status = logError.response?.status;
          if (status === 403) {
            const errorMessage = logError.response?.data?.message || 'Access denied to event logs';
            if (Platform.OS === 'android') {
              ToastAndroid.show(errorMessage, ToastAndroid.SHORT);  
            } else {
              Toast.show({ type: 'error', text1: errorMessage });
            }
            navigation.goBack();
            return;
          }
          
          // For other errors, still show the event but with empty logs
          setCheckInLogs([]);
          Toast.show({
            type: 'info',
            text1: 'Could not load check-in logs',
            text2: 'Event info loaded, but check-in data unavailable'
          });
        }
      } else {
        setError({ type: 'NO_EVENT_ID', message: 'No event ID provided' });
      }
    } catch (error) {
      let errorMessage = 'Failed to fetch data. Please try again.';
      let errorType = 'FETCH_ERROR';
      
      if (error.response) {
        errorMessage = error.response?.data?.message || 'Failed to fetch event logs';
        const status = error.response?.status;
        
        if (status === 403) {
          errorType = 'ACCESS_DENIED';
          if (Platform.OS === 'android') {
            ToastAndroid.show(errorMessage, ToastAndroid.SHORT);  
          } else {
            Toast.show({ type: 'error', text1: errorMessage });
          }
          navigation.goBack();
          return;
        }
      } else if (error.request) {
        errorMessage = 'Unable to reach the server. Check your internet connection.';
        errorType = 'NETWORK_ERROR';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
        errorType = 'TIMEOUT';
      } else {
        errorMessage = error.message;
      }
      
      setError({ type: errorType, message: errorMessage });
      
      if (Platform.OS === 'android') {
        ToastAndroid.show(errorMessage, ToastAndroid.LONG);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage
        });
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [route.params?.eventId, eventId, navigation]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const getStatusChipProps = (statusMessage) => {
    return { style: styles.statusChip, textStyle: styles.chipText };
  };

  const getStatusIcon = (statusMessage) => {
    if (statusMessage.includes("Completed")) return "check";
    if (statusMessage.includes("remaining")) return "clock";
    return "account";
  };

  // Loading state
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#ffffff"
          translucent={false}
        />
        <Surface style={styles.loadingContainer} elevation={0}>
          <ActivityIndicator size="small" color="#333333" />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Loading check-in data...
          </Text>
        </Surface>
      </SafeAreaView>
    );
  }

  // Error state - Show centered error for all errors
  if (error) {
    const errorIcon = error.type === 'NETWORK_ERROR' ? 'wifi-off' : 
                     error.type === 'TIMEOUT' ? 'clock-alert' : 
                     error.type === 'NO_EVENT' ? 'calendar-remove' : 
                     'alert-circle';
    
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#ffffff"
          translucent={false}
        />
        <Surface style={styles.header} elevation={0}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text variant="headlineSmall" style={styles.title}>
            Check-in Logs
          </Text>
        </Surface>
        
        <Card style={styles.formContainer} mode="contained">
          <Card.Content style={styles.errorContent}>
            <Surface style={styles.errorIconContainer} elevation={0}>
              <IconButton
                icon={errorIcon}
                size={64}
                iconColor="#333333"
                style={styles.errorIcon}
              />
            </Surface>
            <Text variant="titleMedium" style={styles.errorTitle}>
              {error.type === 'NO_EVENT' ? 'Event Not Found' : 
               error.type === 'NETWORK_ERROR' ? 'Connection Error' : 
               error.type === 'TIMEOUT' ? 'Request Timeout' : 
               'Unable to Load check-in Logs'}
            </Text>
            <Text variant="bodyMedium" style={styles.errorMessage}>
              {error.message}
            </Text>
            <Button
              mode="contained"
              onPress={fetchData}
              style={styles.retryButton}
              labelStyle={styles.retryButtonLabel}
              icon="refresh"
            >
              Retry
            </Button>
          </Card.Content>
        </Card>
      </SafeAreaView>
    );
  }

  // Main render with success state
  const checkInRate =
    currentEvent?.totalGuests > 0
      ? Math.round(
          (currentEvent.scannedGuestsCount / currentEvent.totalGuests) * 100
        )
      : 0;

  const renderLog = ({ item }) => {
    const safeItem = item ?? {};
    const type = safeItem.type;
    const remaining = safeItem.remainednumberofscans ?? 0;
    let statusMessage = "Unknown";

    if (type === "single") {
      statusMessage = remaining === 0 ? "Completed" : "Not yet scanned";
    } else if (type === "double") {
      if (remaining === 1) {
        statusMessage = "1 scan remaining";
      } else if (remaining === 0) {
        statusMessage = "Completed";
      } else {
        statusMessage = `${remaining} scans remaining`;
      }
    }

    const statusChipProps = getStatusChipProps?.(statusMessage) ?? {};
    const statusIcon = getStatusIcon?.(statusMessage);

    return (
      <Card style={styles.logCard} mode="contained">
        <Card.Content>
          <Surface style={styles.logHeader} elevation={0}>
            <Avatar.Text
              size={40}
              label={`${safeItem.firstName?.[0] ?? "G"}${safeItem.lastName?.[0] ?? "U"}`}
              style={styles.avatar}
              labelStyle={styles.avatarText}
            />
            <Surface style={styles.logInfo} elevation={0}>
              <Text variant="bodyLarge" style={styles.logName}>
                {safeItem.firstName ?? "Guest"} {safeItem.lastName ?? ""}
              </Text>
              <Text variant="bodyMedium" style={styles.logPhone}>
                {safeItem.phone ?? "No phone"}
              </Text>
              <Text variant="bodySmall" style={styles.logGuestCode}>
                Guest Code: {safeItem.guestCode ?? "N/A"}
              </Text>
            </Surface>
          </Surface>

          <Surface style={styles.logTimeInfo} elevation={0}>
            <Text variant="bodySmall" style={styles.logTime}>
              {safeItem.scannedAt
                ? new Date(safeItem.scannedAt).toLocaleString()
                : "No scan time"}
            </Text>
            <Text variant="bodySmall" style={styles.logScannedBy}>
              Scanned by:{" "}
              {safeItem.scannedByUser?.firstName ?? "Unknown"}{" "}
              {safeItem.scannedByUser?.lastName ?? ""}
            </Text>
          </Surface>

          <Divider style={styles.divider} />

          <Surface style={styles.logFooter} elevation={0}>
            <Chip
              mode="outlined"
              compact
              icon="account"
              style={styles.typeChip}
              textStyle={styles.chipText}
            >
              {type
                ? type.charAt(0).toUpperCase() + type.slice(1)
                : "Unknown"}
            </Chip>
            <Chip
              mode="outlined"
              compact
              icon={statusIcon}
              {...statusChipProps}
            >
              {statusMessage}
            </Chip>
          </Surface>
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#ffffff"
        translucent={false}
      />
      <FlatList
        data={checkInLogs}
        keyExtractor={(item) => item._id?.toString() || item.id?.toString() || Math.random().toString()}
        renderItem={renderLog}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#333333']}
            tintColor="#333333"
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <Surface style={styles.header} elevation={0}>
              <IconButton
                icon="arrow-left"
                size={24}
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              />
              <Text variant="headlineSmall" style={styles.title}>
                Check-in Logs
              </Text>
            </Surface>

            {/* Event Info Card */}
            <Card style={styles.formContainer} mode="contained">
              <Card.Content style={styles.cardContent}>
                <Text variant="titleLarge" style={styles.eventName}>
                  {currentEvent?.eventName ?? 'Unknown Event'}
                </Text>
                <Text variant="bodyMedium" style={styles.eventSubtitle}>
                  {(currentEvent?.eventDate
                    ? new Date(currentEvent.eventDate).toDateString()
                    : "No date")}
                  {" • "}
                  {currentEvent?.location ?? "No location"}
                </Text>
              </Card.Content>
            </Card>

            {/* Stats Row */}
            <Surface style={styles.statsRow} elevation={0}>
              <Card style={styles.statCard} mode="contained">
                <Card.Content style={styles.statContent}>
                  <IconButton 
                    icon="account-group" 
                    size={24} 
                    iconColor="#333333"
                    style={styles.statIcon}
                  />
                  <Text variant="labelSmall" style={styles.statLabel}>
                    Total Attendees
                  </Text>
                  <Text variant="headlineMedium" style={styles.statValue}>
                    {currentEvent?.totalGuests ?? 0}
                  </Text>
                </Card.Content>
              </Card>
              
              <Card style={styles.statCard} mode="contained">
                <Card.Content style={styles.statContent}>
                  <IconButton 
                    icon="check-circle" 
                    size={24} 
                    iconColor="#333333"
                    style={styles.statIcon}
                  />
                  <Text variant="labelSmall" style={styles.statLabel}>
                    Check-ins
                  </Text>
                  <Text variant="headlineMedium" style={styles.statValue}>
                    {currentEvent.scannedGuestsCount || 0}
                  </Text>
                </Card.Content>
              </Card>
              
              <Card style={styles.statCard} mode="contained">
                <Card.Content style={styles.statContent}>
                  <IconButton 
                    icon="chart-bar" 
                    size={24} 
                    iconColor="#333333"
                    style={styles.statIcon}
                  />
                  <Text variant="labelSmall" style={styles.statLabel}>
                    Check-in Rate
                  </Text>
                  <Text variant="headlineMedium" style={styles.statValue}>
                    {checkInRate}%
                  </Text>
                </Card.Content>
              </Card>
            </Surface>

            {/* Logs Title */}
            <Text variant="titleLarge" style={styles.logsTitle}>
              Check-in Records
            </Text>
          </>
        }
        ListEmptyComponent={
          <Card style={styles.formContainer} mode="contained">
            <Card.Content style={styles.emptyContent}>
              <Surface style={styles.emptyIconContainer} elevation={0}>
                <IconButton 
                  icon="calendar-check" 
                  size={48} 
                  iconColor="#666666"
                  style={styles.emptyIcon}
                />
              </Surface>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No check-in logs found
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                Check-ins will appear here once guests start arriving.
              </Text>
            </Card.Content>
          </Card>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    color: '#333333',
  },
  errorContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  errorIcon: {
    backgroundColor: '#f5f5f5',
    width: 80,
    height: 80,
  },
  errorTitle: {
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '600',
  },
  errorMessage: {
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#000000',
    borderRadius: 8,
  },
  retryButtonLabel: {
    color: '#ffffff',
    fontSize: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 0,
    backgroundColor: '#ffffff',
  },
  backButton: {
    marginRight: 8,
  },
  title: {
    color: '#333333',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  formContainer: {
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  cardContent: {
    paddingVertical: 20,
  },
  eventName: {
    color: '#333333',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventSubtitle: {
    color: '#666666',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statIcon: {
    backgroundColor: '#f5f5f5',
    marginBottom: 8,
  },
  statLabel: {
    color: '#666666',
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    color: '#333333',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logsTitle: {
    marginBottom: 16,
    color: '#333333',
    fontWeight: 'bold',
  },
  logCard: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  avatar: {
    backgroundColor: '#f5f5f5',
    marginRight: 12,
  },
  avatarText: {
    color: '#333333',
  },
  logInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  logName: {
    color: '#333333',
    fontWeight: '600',
    marginBottom: 2,
  },
  logPhone: {
    color: '#666666',
  },
  logGuestCode: {
    color: '#333333',
    marginTop: 4,
    fontWeight: '500',
  },
  logTimeInfo: {
    marginBottom: 12,
    backgroundColor: 'transparent',
  },
  logTime: {
    color: '#333333',
    fontWeight: '600',
    marginBottom: 2,
  },
  logScannedBy: {
    color: '#666666',
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#f0f0f0',
  },
  logFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  typeChip: {
    backgroundColor: '#f5f5f5',
    borderWidth: 0,
  },
  statusChip: {
    backgroundColor: '#f5f5f5',
    borderWidth: 0,
  },
  chipText: {
    color: '#333333',
    fontSize: 12,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  emptyIcon: {
    backgroundColor: '#f5f5f5',
    width: 80,
    height: 80,
  },
  emptyText: {
    color: '#333333',
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default CheckInLogsScreen;
