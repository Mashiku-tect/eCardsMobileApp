import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  StatusBar,
  ToastAndroid,
  Platform,
  StyleSheet,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Title,
  Subheading,
  Divider,
  Button,
  ProgressBar,
  TextInput,
  Portal,
  Dialog,
  Chip,
  List,
  IconButton,
  Surface
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import config from './config';
import api from '../utils/api';

const SendInvitations = ({ navigation }) => {
  const [selectedEvent, setSelectedEvent] = useState('');
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [summaryModalVisible, setSummaryModalVisible] = useState(false);
  const [sendSummary, setSendSummary] = useState(null);
  const [eventDetails, setEventDetails] = useState(null);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.get(`${config.BASE_URL}/api/getallevents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data.events || []);
    } catch (error) {
      const errormessage = error.response?.data?.message || 'Failed to load events';
      if (Platform.OS === 'android') {
        ToastAndroid.show(errormessage, ToastAndroid.LONG);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errormessage
        });
      }
    } finally {
      setLoadingEvents(false);
    }
  };

  // useEffect(() => {
  //   fetchEvents();
  // }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchEvents();
    }, [])
  );

  const sendInvitations = async () => {
    if (!selectedEvent) {
      Alert.alert('Error', 'Please select an event');
      return;
    }

    setSending(true);
    setSendProgress(0);
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const response = await api.post(
        `${config.BASE_URL}/api/invitations/send/SMS`,
        { eventId: selectedEvent },
        {
          headers: { Authorization: `Bearer ${token}` },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setSendProgress(percentCompleted);
          }
        }
      );
      
      setSendSummary(response.data);
      setSummaryModalVisible(true);
      
      const selected = events.find(e => e.id === selectedEvent);
      setEventDetails(selected);
      
    } catch (error) {
  let errorMessage = 'Something went wrong. Please try again.';

  if (error.response) {
    // Server responded with a status code
   

    errorMessage = error.response?.data?.message || 'Failed to send invitations';

   

  } else if (error.request) {
    // Request made but no response
    errorMessage = 'Unable to reach the server. Check your internet connection.';
  } else if (error.code === 'ECONNABORTED') {
    errorMessage = 'Request timed out. Please try again.';
  } else {
    // Something else happened
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
      setSending(false);
      setTimeout(() => setSendProgress(0), 2000);
    }
  };

  const getAvailableEvents = () => {
    return events.filter(event => {
      const eventDate = new Date(event.eventDate);
      const today = new Date();
      eventDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return (
        event.isInitialMessageSent === false &&
        event.cancelled === false &&
        eventDate >= today
      );
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Sending Overlay */}
      {sending && (
        <View style={styles.sendingOverlay}>
          <View style={styles.sendingContainer}>
            <ActivityIndicator 
              animating={true} 
              size="large" 
              color="#ffffff"
              style={styles.spinner}
            />
            <Text style={styles.sendingTitle}>Sending Invitations</Text>
            <Text style={styles.sendingSubtitle}>
              Please wait while we send SMS invitations to all guests...
            </Text>
            <View style={styles.progressContainer}>
              <ProgressBar 
                progress={sendProgress / 100} 
                color="#ffffff" 
                style={styles.progressBar}
              />
              <Text style={styles.progressText}>{sendProgress}% Complete</Text>
            </View>
          </View>
        </View>
      )}
      
      <ScrollView style={styles.container}>
        {/* Header */}
        <Surface style={styles.headerContainer} elevation={0}>
          <Title style={styles.headerTitle}>Send Invitations</Title>
          <Subheading style={styles.headerSubtitle}>
            Send SMS invitations to event guests
          </Subheading>
          <Button
            mode="outlined"
            icon="message-text-outline"
            onPress={() => navigation.navigate('SendThankYouMessage')}
            style={styles.thankYouNavButton}
            contentStyle={styles.buttonContent}
          >
            Go to Thank You Screen
          </Button>
        </Surface>

        {/* Event Selection Card */}
        <Card style={styles.card} mode="contained">
          <Card.Content>
            <Title style={styles.cardTitle}>Select Event</Title>
            
            {loadingEvents ? (
              <View style={styles.loadingOverlay}>
                <Surface style={styles.loadingContainer} elevation={0}>
                  <ActivityIndicator 
                    animating={true} 
                    size="large" 
                    color="#ffffff"
                    style={styles.spinner}
                  />
                  <Text style={styles.loadingTitle}>Loading Events</Text>
                  <Text style={styles.loadingSubtitle}>Fetching available events...</Text>
                </Surface>
              </View>
            ) : (
              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.eventsScroll}>
                  <Surface style={styles.eventsContainer} elevation={0}>
                    <Button
                      mode={selectedEvent === '' ? 'contained' : 'outlined'}
                      onPress={() => setSelectedEvent('')}
                      compact
                      style={[
                        styles.eventButton,
                        selectedEvent === '' ? styles.eventButtonSelected : styles.eventButtonDefault
                      ]}
                      textColor={selectedEvent === '' ? '#ffffff' : '#333333'}
                      disabled={sending}
                    >
                      None Selected
                    </Button>
                    
                    {getAvailableEvents().map(event => (
                      <Button
                        key={event.id}
                        mode={selectedEvent === event.id ? 'contained' : 'outlined'}
                        onPress={() => setSelectedEvent(event.id)}
                        compact
                        style={[
                          styles.eventButton,
                          selectedEvent === event.id ? styles.eventButtonSelected : styles.eventButtonDefault
                        ]}
                        textColor={selectedEvent === event.id ? '#ffffff' : '#333333'}
                        disabled={sending}
                      >
                        {event?.eventName ?? 'Uknown Event'}
                      </Button>
                    ))}
                  </Surface>
                </ScrollView>
                
                {selectedEvent && getAvailableEvents().find(e => e.id === selectedEvent) && (
                  <Card style={styles.selectedEventCard} mode="contained">
                    <Card.Content>
                      <Text variant="bodySmall" style={styles.selectedEventLabel}>Selected Event:</Text>
                      <Text variant="bodyLarge" style={styles.selectedEventName}>
                        {getAvailableEvents().find(e => e.id === selectedEvent)?.eventName}
                      </Text>
                      <Text variant="bodySmall" style={styles.selectedEventDate}>
                        Date: {formatDate(getAvailableEvents().find(e => e.id === selectedEvent)?.eventDate)}
                      </Text>
                    </Card.Content>
                  </Card>
                )}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Send Button Card */}
        <Card style={styles.card} mode="contained">
          <Card.Content>
            <Title style={styles.cardTitle}>Send Invitations</Title>
            <Text style={styles.cardDescription}>
              Send SMS invitations to all guests of the selected event
            </Text>
            
            <Button
              mode="contained"
              icon="send"
              onPress={sendInvitations}
              disabled={sending || !selectedEvent}
              loading={sending}
              style={styles.sendButton}
              contentStyle={styles.buttonContent}
            >
              {sending ? 'Sending...' : 'Send Invitations'}
            </Button>
          </Card.Content>
        </Card>

        {/* Info Card */}
        <Card style={styles.card} mode="contained">
          <Card.Content>
            <Title style={styles.cardTitle}>Important Notes</Title>
            <List.Item
              title="Event Selection"
              description="Only upcoming events with unsent invitations are shown"
              left={props => <List.Icon {...props} icon="calendar-check" color="#666666" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Guest Coverage"
              description="All guests with valid phone numbers will receive SMS"
              left={props => <List.Icon {...props} icon="account-group" color="#666666" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <Divider style={styles.divider} />
            <List.Item
              title="Reminders"
              description="Automatic reminders will be scheduled"
              left={props => <List.Icon {...props} icon="bell" color="#666666" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Summary Dialog */}
      <Portal>
        <Dialog visible={summaryModalVisible} onDismiss={() => setSummaryModalVisible(false)} style={styles.dialog}>
          <Dialog.Title style={styles.dialogTitle}>Invitations Sent Successfully!</Dialog.Title>
          <Dialog.Content>
            {sendSummary && (
              <View>
                {/* Summary Stats */}
                <Surface style={styles.statsContainer} elevation={0}>
                  <Surface style={styles.statItem} elevation={0}>
                    <Surface style={[styles.statCircle, styles.sentStat]} elevation={2}>
                      <Text style={styles.statNumber}>
                        {sendSummary.summary.sent}
                      </Text>
                    </Surface>
                    <Text style={styles.statLabel}>Sent</Text>
                  </Surface>
                  
                  <Surface style={styles.statItem} elevation={0}>
                    <Surface style={[styles.statCircle, styles.skippedStat]} elevation={2}>
                      <Text style={styles.statNumber}>
                        {sendSummary.summary.skipped}
                      </Text>
                    </Surface>
                    <Text style={styles.statLabel}>Skipped</Text>
                  </Surface>
                  
                  <Surface style={styles.statItem} elevation={0}>
                    <Surface style={[styles.statCircle, styles.remindersStat]} elevation={2}>
                      <Text style={styles.statNumber}>
                        {sendSummary.summary.remindersCreated}
                      </Text>
                    </Surface>
                    <Text style={styles.statLabel}>Reminders</Text>
                  </Surface>
                </Surface>

                {/* Event Info */}
                {eventDetails && (
                  <Card style={styles.eventInfoCard} mode="contained">
                    <Card.Content>
                      <Text variant="bodySmall" style={styles.eventInfoLabel}>Event:</Text>
                      <Text variant="bodyLarge" style={styles.eventInfoName}>
                        {eventDetails.eventName}
                      </Text>
                      <Text variant="bodySmall" style={styles.eventInfoDate}>
                        {formatDate(eventDetails.eventDate)}
                      </Text>
                    </Card.Content>
                  </Card>
                )}

                {/* Reminders */}
                {sendSummary.reminders && sendSummary.reminders.length > 0 && (
                  <Surface style={styles.remindersContainer} elevation={0}>
                    <Text style={styles.remindersTitle}>Scheduled Reminders:</Text>
                    {sendSummary.reminders.map((reminder, index) => (
                      <Chip
                        key={index}
                        icon="clock"
                        mode="outlined"
                        style={styles.reminderChip}
                        textStyle={styles.reminderChipText}
                      >
                        Reminder {reminder.reminder_number}: {formatDate(reminder.scheduled_at)}
                      </Chip>
                    ))}
                  </Surface>
                )}

                {/* Details */}
                <Surface style={styles.detailsContainer} elevation={1}>
                  <Text style={styles.detailsTitle}>Summary Details:</Text>
                  <Surface style={styles.detailRow} elevation={0}>
                    <Text style={styles.detailLabel}>Invitations Sent:</Text>
                    <Text style={styles.detailValue}>{sendSummary.summary.sent}</Text>
                  </Surface>
                  <Divider style={styles.detailDivider} />
                  <Surface style={styles.detailRow} elevation={0}>
                    <Text style={styles.detailLabel}>Invitations Skipped:</Text>
                    <Text style={styles.detailValue}>{sendSummary.summary.skipped}</Text>
                  </Surface>
                  <Divider style={styles.detailDivider} />
                  <Surface style={styles.detailRow} elevation={0}>
                    <Text style={styles.detailLabel}>Reminders Created:</Text>
                    <Text style={styles.detailValue}>{sendSummary.summary.remindersCreated}</Text>
                  </Surface>
                </Surface>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button 
              onPress={() => setSummaryModalVisible(false)}
              textColor="#666666"
            >
              Close
            </Button>
           
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
  },
  card: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
    minHeight: 150,
  },
  cardTitle: {
    color: '#000000',
    marginBottom: 16,
    fontWeight: '600',
  },
  cardDescription: {
    marginBottom: 16,
    color: '#666666',
  },
  // Loading overlay for events
  loadingOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    borderRadius: 12,
    marginVertical: 8,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  // Sending overlay for invitations
  sendingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  sendingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 300,
    minHeight: 300,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  spinner: {
    marginBottom: 24,
  },
  loadingTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  loadingSubtitle: {
    color: '#e0e0e0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  sendingTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  sendingSubtitle: {
    color: '#e0e0e0',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  progressContainer: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressText: {
    color: '#ffffff',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  eventsScroll: {
    marginBottom: 8,
  },
  eventsContainer: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'transparent',
  },
  eventButton: {
    borderRadius: 8,
  },
  eventButtonSelected: {
    backgroundColor: '#000000',
  },
  eventButtonDefault: {
    borderColor: '#e0e0e0',
  },
  selectedEventCard: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
  },
  selectedEventLabel: {
    color: '#666666',
    marginBottom: 4,
  },
  selectedEventName: {
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  selectedEventDate: {
    color: '#666666',
  },
  sendButton: {
    borderRadius: 12,
    backgroundColor: '#000000',
    marginBottom: 16,
  },
  thankYouNavButton: {
    marginTop: 16,
    borderRadius: 12,
    borderColor: '#000000',
  },
  buttonContent: {
    paddingVertical: 6,
  },
  listTitle: {
    color: '#333333',
    fontWeight: '500',
  },
  listDescription: {
    color: '#666666',
  },
  divider: {
    backgroundColor: '#f0f0f0',
    marginVertical: 4,
  },
  dialog: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  dialogTitle: {
    color: '#000000',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  statCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  sentStat: {
    backgroundColor: '#f0f0f0',
  },
  skippedStat: {
    backgroundColor: '#f5f5f5',
  },
  remindersStat: {
    backgroundColor: '#f9f9f9',
  },
  statNumber: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#000000',
  },
  statLabel: {
    color: '#666666',
    fontSize: 12,
  },
  eventInfoCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#f9f9f9',
  },
  eventInfoLabel: {
    color: '#666666',
    marginBottom: 2,
  },
  eventInfoName: {
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  eventInfoDate: {
    color: '#666666',
  },
  remindersContainer: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  remindersTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
  },
  reminderChip: {
    backgroundColor: 'transparent',
    borderColor: '#e0e0e0',
    marginBottom: 4,
  },
  reminderChipText: {
    color: '#666666',
    fontSize: 12,
  },
  detailsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
  },
  detailsTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#000000',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  detailLabel: {
    color: '#666666',
  },
  detailValue: {
    fontWeight: 'bold',
    color: '#000000',
  },
  detailDivider: {
    backgroundColor: '#e0e0e0',
    marginBottom: 8,
  },
  dialogActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  viewReportButton: {
    backgroundColor: '#000000',
  },
});

export default SendInvitations;
