import React, { useEffect, useState } from "react";
import {
  FlatList,
  SafeAreaView,
  Platform,
  StatusBar,
  ToastAndroid
} from "react-native";
import {
  Text,
  Card,
  ActivityIndicator,
  Surface,
  Avatar,
  Chip,
  Divider,
  Badge
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

  useEffect(() => {
    if (route.params?.eventId) {
      setEventId(route.params.eventId);
    }
    fetchEvents();
  }, [route.params]);

  useEffect(() => {
    if (eventId) {
      fetchEventLogs();
    }
  }, [eventId]);

  useEffect(() => {
    if (events.length > 0 && eventId) {
      const foundEvent = events.find(event => event._id === eventId || event.id === eventId);
      setCurrentEvent(foundEvent);
    }
  }, [events, eventId]);

  const fetchEventLogs = async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await api.get(
        `${config.BASE_URL}/api/events/checkins/${eventId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCheckInLogs(res.data || []);
    } catch (error) {
      const errormessage = error.response?.data.message || 'Failed to fetch event logs';
      const status = error.response?.status;

      if (status === 403) {

        if (Platform.OS === 'android') {
          ToastAndroid.show(errormessage, ToastAndroid.SHORT);  
        } else {
          Toast.show({ type: 'error', text1: errormessage });
        }
        navigation.goBack();
        return;
        Toast.show({ type: 'error', text1: errormessage });
      }
    }
  };

  const fetchEvents = async () => {
    setIsLoading(true); 
    try {
      const token = await AsyncStorage.getItem("authToken");
      const res = await api.get(
        `${config.BASE_URL}/api/getallevents/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setEvents(res.data.events);
    } catch (err) {
      //console.error("Failed to fetch events:", err);
      const errormessage = err.response?.data.message || 'Failed to fetch events';
      if (Platform.OS === 'android') {
        ToastAndroid.show(errormessage, ToastAndroid.SHORT);  
      } else {
        Toast.show({ type: 'error', text1: errormessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusChipProps = (statusMessage) => {
    if (statusMessage.includes("Completed")) {
      return { style: styles.completedChip, textStyle: styles.completedChipText };
    } else if (statusMessage.includes("remaining")) {
      return { style: styles.pendingChip, textStyle: styles.pendingChipText };
    } else {
      return { style: styles.neutralChip, textStyle: styles.neutralChipText };
    }
  };

  const getStatusIcon = (statusMessage) => {
    if (statusMessage.includes("Completed")) return "check";
    if (statusMessage.includes("remaining")) return "clock";
    return "account";
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#f8f9fa"
          translucent={false}
        />
        <Surface style={styles.center} elevation={0}>
          <ActivityIndicator size="small" />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Loading check-in data...
          </Text>
        </Surface>
      </SafeAreaView>
    );
  }

  if (!currentEvent) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#f8f9fa"
          translucent={false}
        />
        <Surface style={styles.center} elevation={0}>
          <Text variant="bodyLarge">No event data found for this ID</Text>
        </Surface>
      </SafeAreaView>
    );
  }

  const checkInRate = Math.round(
    (currentEvent.scannedGuestsCount / currentEvent.totalGuests) * 100
  );

  const renderLog = ({ item }) => {
    let statusMessage = "";
    if (item.type === "single") {
      statusMessage =
        item.remainednumberofscans === 0 ? "✅ Completed" : "⏳ Not yet scanned";
    } else if (item.type === "double") {
      if (item.remainednumberofscans === 1) {
        statusMessage = "🔁 1 scan remaining";
      } else if (item.remainednumberofscans === 0) {
        statusMessage = "✅ Completed";
      } else {
        statusMessage = `⏳ ${item.remainednumberofscans} scans remaining`;
      }
    }

    const statusChipProps = getStatusChipProps(statusMessage);
    const statusIcon = getStatusIcon(statusMessage);

    return (
      <Card style={styles.logCard} mode="contained">
        <Card.Content>
          <Surface style={styles.logHeader} elevation={0}>
            <Avatar.Text 
              size={40}
              label={`${item.firstName?.[0] || 'G'}${item.lastName?.[0] || 'U'}`}
              style={styles.avatar}
              labelStyle={styles.avatarText}
            />
            <Surface style={styles.logInfo} elevation={0}>
              <Text variant="bodyLarge" style={styles.logName}>
                {item.firstName} {item.lastName}
              </Text>
              <Text variant="bodyMedium" style={styles.logPhone}>
                {item.phone}
              </Text>
            </Surface>
            <Surface style={styles.logTimeInfo} elevation={0}>
              <Text variant="bodySmall" style={styles.logTime}>
                {item.scannedAt ? new Date(item.scannedAt).toLocaleString() : 'No scan time'}
              </Text>
              <Text variant="bodySmall" style={styles.logScannedBy}>
                Scanned by: {item.scannedByUser?.firstName || 'Unknown'}{" "}
                {item.scannedByUser?.lastName || ''}
              </Text>
            </Surface>
          </Surface>
          
          <Divider style={styles.divider} />
          
          <Surface style={styles.logFooter} elevation={0}>
            <Chip
              mode="outlined"
              compact
              icon="account"
              style={styles.typeChip}
            >
              {item.type?.charAt(0).toUpperCase() + item.type?.slice(1) || 'Unknown'}
            </Chip>
            <Chip
              mode="outlined"
              compact
              icon={statusIcon}
              {...statusChipProps}
            >
              {statusMessage.replace('✅ ', '').replace('⏳ ', '').replace('🔁 ', '')}
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
        backgroundColor="#f8f9fa"
        translucent={false}
      />
      <FlatList
        data={checkInLogs}
        keyExtractor={(item) => item._id?.toString() || item.id?.toString() || Math.random().toString()}
        renderItem={renderLog}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Header Card */}
            <Card style={styles.headerCard} mode="contained">
              <Card.Content>
                <Text variant="headlineSmall" style={styles.eventTitle}>
                  {currentEvent.eventName}
                </Text>
                <Text variant="bodyMedium" style={styles.eventSubtitle}>
                  {new Date(currentEvent.eventDate).toDateString()} • {currentEvent.location}
                </Text>
              </Card.Content>
            </Card>

            {/* Stats Row */}
            <Surface style={styles.statsRow} elevation={0}>
              <Card style={styles.statCard} mode="contained">
                <Card.Content style={styles.statContent}>
                  <Text variant="labelSmall" style={styles.statLabel}>
                    Total Attendees
                  </Text>
                  <Text variant="headlineMedium" style={styles.statValue}>
                    {currentEvent.totalGuests}
                  </Text>
                </Card.Content>
              </Card>
              
              <Card style={styles.statCard} mode="contained">
                <Card.Content style={styles.statContent}>
                  <Text variant="labelSmall" style={styles.statLabel}>
                    Check-ins Recorded
                  </Text>
                  <Text variant="headlineMedium" style={styles.statValue}>
                    {currentEvent.scannedGuestsCount || 0}
                  </Text>
                </Card.Content>
              </Card>
              
              <Card style={styles.statCard} mode="contained">
                <Card.Content style={styles.statContent}>
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
              Check-in Logs
            </Text>
          </>
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard} mode="contained">
            <Card.Content style={styles.emptyContent}>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No check-in logs found
              </Text>
            </Card.Content>
          </Card>
        }
      />
    </SafeAreaView>
  );
};

const styles = {
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: 12,
  },
  listContent: {
    paddingBottom: 40,
  },
  headerCard: {
    margin: 16,
  },
  eventTitle: { 
    color: "#111827",
    fontWeight: 'bold',
  },
  eventSubtitle: { 
    marginTop: 4,
    color: "#6b7280",
  },
  statsRow: { 
    flexDirection: "row", 
    justifyContent: "space-around", 
    margin: 8,
    backgroundColor: 'transparent',
  },
  statCard: {
    flex: 1,
    margin: 6,
  },
  statContent: {
    alignItems: "center",
  },
  statLabel: { 
    color: "#6b7280",
    textAlign: 'center',
  },
  statValue: { 
    color: "#111827",
    fontWeight: "bold",
    textAlign: 'center',
  },
  logsTitle: {
    marginHorizontal: 16,
    marginVertical: 8,
    color: "#111827",
    fontWeight: '600',
  },
  logCard: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  logHeader: { 
    flexDirection: "row", 
    alignItems: "center",
    backgroundColor: 'transparent',
  },
  avatar: {
    backgroundColor: "#dbeafe",
    marginRight: 10,
  },
  avatarText: { 
    color: "#1d4ed8",
  },
  logInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  logName: { 
    color: "#111827",
    fontWeight: "600",
  },
  logPhone: { 
    color: "#6b7280",
  },
  logTimeInfo: {
    alignItems: "flex-end",
    backgroundColor: 'transparent',
  },
  logTime: { 
    color: "#111827",
    fontWeight: "600",
  },
  logScannedBy: { 
    color: "#6b7280",
  },
  divider: {
    marginVertical: 8,
  },
  logFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: 'transparent',
  },
  typeChip: {
    backgroundColor: '#F3F4F6',
  },
  // Status Chip Styles
  completedChip: {
    backgroundColor: "#dcfce7",
  },
  completedChipText: {
    color: "#166534",
  },
  pendingChip: {
    backgroundColor: "#fef9c3",
  },
  pendingChipText: {
    color: "#854d0e",
  },
  neutralChip: {
    backgroundColor: "#f3f4f6",
  },
  neutralChipText: {
    color: "#374151",
  },
  emptyCard: {
    margin: 16,
  },
  emptyContent: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    color: '#6b7280',
  },
};

export default CheckInLogsScreen;