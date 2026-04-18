import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  Card,
  Title,
  Subheading,
  Button,
  TextInput,
  Portal,
  Dialog,
  Searchbar,
  Chip,
  Surface,
  Divider,
  HelperText,
  FAB,
  List
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import config from './config';
import api from '../utils/api';

const SendThankYouMessage = ({ navigation }) => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [thankYouMessage, setThankYouMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [searchQuery, events]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.get(`/api/scannedevents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(response.data || []);
      setFilteredEvents(response.data || []);
    } catch (error) {
      let errorMessage = 'Something went wrong. Please try again.';
      
        if (error.response) {
          // Server responded with a status code
         
      
          errorMessage = error.response?.data?.message || 'Failed to load events,Please try again';
      
         
      
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
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    if (searchQuery.trim() === '') {
      setFilteredEvents(events);
    } else {
      const filtered = events.filter(event =>
        event.eventName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  };

  const handleEventSelect = (event) => {
    setSelectedEvent(event);
    setSearchQuery(event.eventName);
    setShowEventDialog(false);
  };

  const handleSendMessage = async () => {
    if (!selectedEvent) {
      Alert.alert('Error', 'Please select an event first');
      return;
    }

    if (!thankYouMessage.trim()) {
      Alert.alert('Error', 'Please enter a thank you message');
      return;
    }

    setSending(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      await api.post(
        `/api/events/${selectedEvent.id}/send-thank-you`,
        { message: thankYouMessage },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `Thank you message sent successfully for "${selectedEvent.eventName}"!`
      });
      
      // Reset form
      setThankYouMessage('');
      setSelectedEvent(null);
      setSearchQuery('');
      
      // Navigate back after success
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
      
    } catch (error) {
      let errorMessage = 'Failed to send thank you message. Please try again.';
      
      if (error.response) {
        errorMessage = error.response?.data?.message || errorMessage;
      } else if (error.request) {
        errorMessage = 'Unable to reach the server. Check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage
      });
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Surface style={styles.headerContainer} elevation={0}>
            <Title style={styles.headerTitle}>Send Thank You Message</Title>
            <Subheading style={styles.headerSubtitle}>
              Send personalized thank you messages to event attendees
            </Subheading>
          </Surface>

          {/* Event Selection Card */}
          <Card style={styles.card} mode="contained">
            <Card.Content>
              <Title style={styles.cardTitle}>Select Event</Title>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator animating={true} size="large" color="#000000" />
                  <Text style={styles.loadingText}>Loading events...</Text>
                </View>
              ) : (
                <View>
                  <Searchbar
                    placeholder="Search for an event..."
                    onChangeText={setSearchQuery}
                    value={searchQuery}
                    onFocus={() => setShowEventDialog(true)}
                    style={styles.searchBar}
                    icon="magnify"
                  />
                  
                  {selectedEvent && (
                    <Card style={styles.selectedEventCard} mode="contained">
                      <Card.Content>
                        <Text variant="bodySmall" style={styles.selectedEventLabel}>
                          Selected Event:
                        </Text>
                        <Text variant="bodyLarge" style={styles.selectedEventName}>
                          {selectedEvent.eventName}
                        </Text>
                        <Text variant="bodySmall" style={styles.selectedEventDate}>
                          Date: {formatDate(selectedEvent.eventDate)}
                        </Text>
                      </Card.Content>
                    </Card>
                  )}
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Thank You Message Input Card */}
          <Card style={styles.card} mode="contained">
            <Card.Content>
              <Title style={styles.cardTitle}>Thank You Message</Title>
              <TextInput
                mode="outlined"
                placeholder="Type your thank you message here..."
                value={thankYouMessage}
                onChangeText={setThankYouMessage}
                multiline
                numberOfLines={6}
                style={styles.messageInput}
                textAlignVertical="top"
              />
              <HelperText type="info" style={styles.helperText}>
                Characters: {thankYouMessage.length}
              </HelperText>
            </Card.Content>
          </Card>

          {/* Message Preview Card */}
          {thankYouMessage.trim() !== '' && (
            <Card style={styles.card} mode="contained">
              <Card.Content>
                <Title style={styles.cardTitle}>Preview</Title>
                <Surface style={styles.previewContainer} elevation={0}>
                  <Text style={styles.previewText}>{thankYouMessage}</Text>
                </Surface>
              </Card.Content>
            </Card>
          )}

          {/* Info Card */}
          <Card style={styles.card} mode="contained">
            <Card.Content>
              <Title style={styles.cardTitle}>Important Notes</Title>
              <List.Item
                title="Personalized Messages"
                description="Each attendee will receive a personalized thank you message"
                left={props => <List.Icon {...props} icon="email" color="#666666" />}
              />
              <Divider style={styles.divider} />
              <List.Item
                title="Delivery Status"
                description="Messages will be sent via SMS to all attendees"
                left={props => <List.Icon {...props} icon="check-circle" color="#666666" />}
              />
              <Divider style={styles.divider} />
              <List.Item
                title="One-time Send"
                description="Thank you messages can only be sent once per event"
                left={props => <List.Icon {...props} icon="alert" color="#666666" />}
              />
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Send Button */}
        <Surface style={styles.buttonContainer} elevation={4}>
          <Button
            mode="contained"
            icon="send"
            onPress={handleSendMessage}
            disabled={!selectedEvent || !thankYouMessage.trim() || sending}
            loading={sending}
            style={styles.sendButton}
            contentStyle={styles.buttonContent}
          >
            {sending ? 'Sending...' : 'Send Thank You Message'}
          </Button>
        </Surface>
      </KeyboardAvoidingView>

      {/* Event Selection Dialog */}
      <Portal>
        <Dialog 
          visible={showEventDialog} 
          onDismiss={() => setShowEventDialog(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Select Event</Dialog.Title>
          <Dialog.Content>
            <Searchbar
              placeholder="Search events..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.dialogSearchBar}
              autoFocus
            />
            <ScrollView style={styles.eventList} showsVerticalScrollIndicator={false}>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <Surface
                    key={event.id}
                    style={styles.eventItem}
                    elevation={0}
                    onTouchEnd={() => handleEventSelect(event)}
                  >
                    <View>
                      <Text style={styles.eventItemName}>{event.eventName}</Text>
                      <Text style={styles.eventItemDate}>
                        {formatDate(event.eventDate)}
                      </Text>
                    </View>
                  </Surface>
                ))
              ) : (
                <Text style={styles.noEventsText}>No events found</Text>
              )}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowEventDialog(false)} textColor="#666666">
              Cancel
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
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
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
  },
  cardTitle: {
    color: '#000000',
    marginBottom: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666666',
  },
  searchBar: {
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
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
  messageInput: {
    backgroundColor: '#ffffff',
    minHeight: 120,
  },
  helperText: {
    marginTop: 4,
  },
  previewContainer: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  previewText: {
    color: '#333333',
    lineHeight: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sendButton: {
    borderRadius: 12,
    backgroundColor: '#000000',
  },
  buttonContent: {
    paddingVertical: 6,
  },
  divider: {
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  dialog: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    maxHeight: '80%',
  },
  dialogTitle: {
    color: '#000000',
    fontWeight: '600',
  },
  dialogSearchBar: {
    marginBottom: 16,
    backgroundColor: '#f5f5f5',
  },
  eventList: {
    maxHeight: 400,
  },
  eventItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  eventItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  eventItemDate: {
    fontSize: 12,
    color: '#666666',
  },
  noEventsText: {
    textAlign: 'center',
    padding: 20,
    color: '#666666',
  },
});

export default SendThankYouMessage;