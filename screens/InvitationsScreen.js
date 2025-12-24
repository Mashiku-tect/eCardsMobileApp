import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar
} from 'react-native';
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
import {  useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
        console.error('Error fetching events:', error);
        Alert.alert('Error', 'Failed to load events');
      } finally {
        setLoadingEvents(false);
      }
    };

  useEffect(() => {
    

    fetchEvents();
  }, []);

  //refresh upon screen focus
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
      console.error('Error sending invitations:', error);
      Alert.alert('Error', 'Failed to send invitations');
    } finally {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <ScrollView style={{ padding: 16 }}>
        {/* Header */}
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Title>Send Invitations</Title>
          <Subheading style={{ color: '#666' }}>
            Send SMS invitations to event guests
          </Subheading>
        </View>

        {/* Event Selection Card */}
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Title style={{ marginBottom: 16 }}>Select Event</Title>
            
            {loadingEvents ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
                <ActivityIndicator size="small" color="#6200ee" />
                <Text style={{ marginLeft: 12 }}>Loading events...</Text>
              </View>
            ) : (
              <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Button
                      mode={selectedEvent === '' ? 'contained' : 'outlined'}
                      onPress={() => setSelectedEvent('')}
                      compact
                    >
                      None Selected
                    </Button>
                    
                    {getAvailableEvents().map(event => (
                      <Button
                        key={event.id}
                        mode={selectedEvent === event.id ? 'contained' : 'outlined'}
                        onPress={() => setSelectedEvent(event.id)}
                        compact
                      >
                        {event.eventName}
                      </Button>
                    ))}
                  </View>
                </ScrollView>
                
                {selectedEvent && getAvailableEvents().find(e => e.id === selectedEvent) && (
                  <Card style={{ marginTop: 16, backgroundColor: '#f0f4ff' }}>
                    <Card.Content>
                      <Text variant="bodySmall" style={{ color: '#666' }}>Selected Event:</Text>
                      <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
                        {getAvailableEvents().find(e => e.id === selectedEvent)?.eventName}
                      </Text>
                      <Text variant="bodySmall">
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
        <Card style={{ marginBottom: 16 }}>
          <Card.Content>
            <Title style={{ marginBottom: 8 }}>Send Invitations</Title>
            <Text style={{ marginBottom: 16, color: '#666' }}>
              Send SMS invitations to all guests of the selected event
            </Text>
            
            <Button
              mode="contained"
              icon="send"
              onPress={sendInvitations}
              disabled={sending || !selectedEvent}
              loading={sending}
              style={{ marginBottom: 16 }}
            >
              {sending ? 'Sending...' : 'Send Invitations'}
            </Button>

            {sending && (
              <View style={{ marginTop: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text>Sending Progress</Text>
                  <Text style={{ fontWeight: 'bold' }}>{sendProgress}%</Text>
                </View>
                <ProgressBar progress={sendProgress / 100} color="#6200ee" />
                <Text style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                  Sending invitations to all guests...
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Info Card */}
        <Card>
          <Card.Content>
            <Title>Important Notes</Title>
            <List.Item
              title="Event Selection"
              description="Only upcoming events with unsent invitations are shown"
              left={props => <List.Icon {...props} icon="calendar-check" />}
            />
            <Divider />
            <List.Item
              title="Guest Coverage"
              description="All guests with valid phone numbers will receive SMS"
              left={props => <List.Icon {...props} icon="account-group" />}
            />
            <Divider />
            <List.Item
              title="Reminders"
              description="Automatic reminders will be scheduled"
              left={props => <List.Icon {...props} icon="bell" />}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Summary Dialog */}
      <Portal>
        <Dialog visible={summaryModalVisible} onDismiss={() => setSummaryModalVisible(false)}>
          <Dialog.Title>Invitations Sent Successfully!</Dialog.Title>
          <Dialog.Content>
            {sendSummary && (
              <View>
                {/* Summary Stats */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
                  <View style={{ alignItems: 'center' }}>
                    <Surface style={{ backgroundColor: '#e8f5e8', padding: 16, borderRadius: 50 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#4caf50' }}>
                        {sendSummary.summary.sent}
                      </Text>
                    </Surface>
                    <Text style={{ marginTop: 8 }}>Sent</Text>
                  </View>
                  
                  <View style={{ alignItems: 'center' }}>
                    <Surface style={{ backgroundColor: '#fff3e0', padding: 16, borderRadius: 50 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#ff9800' }}>
                        {sendSummary.summary.skipped}
                      </Text>
                    </Surface>
                    <Text style={{ marginTop: 8 }}>Skipped</Text>
                  </View>
                  
                  <View style={{ alignItems: 'center' }}>
                    <Surface style={{ backgroundColor: '#e3f2fd', padding: 16, borderRadius: 50 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#2196f3' }}>
                        {sendSummary.summary.remindersCreated}
                      </Text>
                    </Surface>
                    <Text style={{ marginTop: 8 }}>Reminders</Text>
                  </View>
                </View>

                {/* Event Info */}
                {eventDetails && (
                  <Card style={{ marginBottom: 16 }}>
                    <Card.Content>
                      <Text variant="bodySmall" style={{ color: '#666' }}>Event:</Text>
                      <Text variant="bodyLarge" style={{ fontWeight: 'bold' }}>
                        {eventDetails.eventName}
                      </Text>
                      <Text variant="bodySmall">
                        {formatDate(eventDetails.eventDate)}
                      </Text>
                    </Card.Content>
                  </Card>
                )}

                {/* Reminders */}
                {sendSummary.reminders && sendSummary.reminders.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Scheduled Reminders:</Text>
                    {sendSummary.reminders.map((reminder, index) => (
                      <Chip
                        key={index}
                        icon="clock"
                        mode="outlined"
                        style={{ marginBottom: 4 }}
                      >
                        Reminder {reminder.reminder_number}: {formatDate(reminder.scheduled_at)}
                      </Chip>
                    ))}
                  </View>
                )}

                {/* Details */}
                <View style={{ backgroundColor: '#f5f5f5', padding: 12, borderRadius: 8 }}>
                  <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Summary Details:</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>Invitations Sent:</Text>
                    <Text style={{ fontWeight: 'bold' }}>{sendSummary.summary.sent}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text>Invitations Skipped:</Text>
                    <Text style={{ fontWeight: 'bold' }}>{sendSummary.summary.skipped}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text>Reminders Created:</Text>
                    <Text style={{ fontWeight: 'bold' }}>{sendSummary.summary.remindersCreated}</Text>
                  </View>
                </View>
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSummaryModalVisible(false)}>
              Close
            </Button>
            <Button mode="contained" onPress={() => {
              setSummaryModalVisible(false);
              navigation.navigate('Reports');
            }}>
              View Report
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
};

export default SendInvitations;