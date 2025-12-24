import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  ToastAndroid
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Text,
  TextInput,
  Card,
  ActivityIndicator,
  Surface,
  IconButton,
  Button,
  Chip,
  Divider,
  Searchbar,
  Avatar,
  Badge
} from 'react-native-paper';
import axios from 'axios';
import config from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../utils/api';

const ManualCheckin = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId, eventName } = route.params;

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showspinner, setShowSpinner] = useState(false);
  const [guests, setGuests] = useState([]);

  useEffect(() => {
    if (!route.params?.eventId) {
      return;
    }

    const checkAuthorization = async () => {
      try {
        setShowSpinner(true);
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          return;
        }

        const response = await api.get(`${config.BASE_URL}/api/events/${route.params.eventId}/check-access`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

      } catch (error) {
        const errormessage = error.response?.data?.message;
        const status = error.response?.status;

        if (status === 403) {
          if (Platform.OS === 'android') {
            ToastAndroid.show(errormessage || 'Access Denied', ToastAndroid.SHORT);  
          } else {
            Toast.show({ type: 'error', text1: errormessage || 'Access Denied' });
          }
          
          navigation.goBack();
        } 
      } finally {
        setShowSpinner(false);
      }
    };

    checkAuthorization();
  }, [route.params, navigation]);

  useEffect(() => {
    fetchGuest();
  }, []);

  const fetchGuest = async () => {
    try {
      setShowSpinner(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.get(`${config.BASE_URL}/api/event-guest/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setGuests(response.data);
    } catch (error) {
      //console.error("Error fetching guest:", error);
      const errormessage=error.response?.data?.message || 'Failed to fetch guests';
      if(Platform.OS==='android'){
        ToastAndroid.show(errormessage,ToastAndroid.SHORT);
      }else{
         Toast.show({
        type: 'error',
        text1: errormessage
      });
      }
    } finally {
      setShowSpinner(false);
    }
  };

  const filteredGuests = guests.filter(guest => {
    const searchLower = searchQuery.toLowerCase();
    return (
      guest.firstName.toLowerCase().includes(searchLower) ||
      guest.lastName.toLowerCase().includes(searchLower) ||
      guest.phoneNumber.includes(searchQuery)
    );
  });

  const handleSingleCheckin = async (guest) => {
    setLoading(true);
    setSelectedGuest(guest.id);

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.patch(
        `${config.BASE_URL}/api/singlecheckin`,
        { guestId: guest.id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedGuests = guests.map((g) =>
        g.id === guest.id
          ? {
              ...g,
              checkedIn: true,
              remainedNumberOfScans: 0,
            }
          : g
      );

      setGuests(updatedGuests);

      Alert.alert(
        "Success",
        `${guest.firstName} ${guest.lastName} has been checked in.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      const errormessage = error.response?.data?.message;
      Alert.alert("Failed", errormessage || "Check-in failed");
    } finally {
      setLoading(false);
      setSelectedGuest(null);
    }
  };

  const handleDoubleFirstAttendee = async (guest) => {
    setLoading(true);
    setSelectedGuest(guest.id);

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.patch(
        `${config.BASE_URL}/api/doublecheckinfirstattendee`,
        { guestId: guest.id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedGuests = guests.map(g =>
        g.id === guest.id ? {
          ...g,
          remainedNumberOfScans: 1
        } : g
      );

      setGuests(updatedGuests);
      Alert.alert(
        'Success',
        `First attendee checked in for ${guest.firstName} ${guest.lastName}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      const errormessage = error.response?.data?.message;
      Alert.alert('Failed', errormessage || 'Failed to update first attendee status');
    } finally {
      setLoading(false);
      setSelectedGuest(null);
    }
  };

  const handleDoubleSecondAttendee = async (guest) => {
    setLoading(true);
    setSelectedGuest(guest.id);

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.patch(
        `${config.BASE_URL}/api/doublecheckinsecondattendee`,
        { guestId: guest.id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedGuests = guests.map(g =>
        g.id === guest.id ? {
          ...g,
          checkedIn: true,
          remainedNumberOfScans: 0
        } : g
      );

      setGuests(updatedGuests);
      Alert.alert(
        'Success',
        `Second attendee checked in for ${guest.firstName} ${guest.lastName}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      const errormessage = error.response?.data?.message;
      Alert.alert('Failed', errormessage || 'Failed to update first attendee status');
     // Alert.alert('Failed', 'Failed to update second attendee status');
    } finally {
      setLoading(false);
      setSelectedGuest(null);
    }
  };

  const handleDoubleBothAttendees = async (guest) => {
    setLoading(true);
    setSelectedGuest(guest.id);

    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.patch(
        `${config.BASE_URL}/api/bothattendee`,
        { guestId: guest.id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedGuests = guests.map(g =>
        g.id === guest.id ? {
          ...g,
          checkedIn: true,
          remainedNumberOfScans: 0
        } : g
      );

      setGuests(updatedGuests);
      Alert.alert(
        'Success',
        `Both attendees checked in for ${guest.firstName} ${guest.lastName}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      const errormessage = error.response?.data?.message;
      Alert.alert('Failed', errormessage || 'Failed to update first attendee status');
     // Alert.alert('Failed', 'Failed to update both attendees status');
    } finally {
      setLoading(false);
      setSelectedGuest(null);
    }
  };

  const renderActionButtons = (guest) => {
    if (guest.checkedIn || guest.remainedNumberOfScans === 0) {
      return (
        <Surface style={styles.statusContainer} elevation={0}>
          <IconButton icon="check-circle" size={16} iconColor="#10B981" />
          <Text variant="bodySmall" style={styles.checkedInText}>
            Checked In
          </Text>
        </Surface>
      );
    }

    if (guest.type === 'single') {
      return (
        <Button
          mode="contained"
          onPress={() => handleSingleCheckin(guest)}
          loading={loading && selectedGuest === guest.id}
          disabled={loading && selectedGuest === guest.id}
          style={[styles.actionButton, styles.singleButton]}
          labelStyle={styles.actionButtonLabel}
          compact
        >
          Check In
        </Button>
      );
    }

    if (guest.type === 'double') {
      if (guest.remainedNumberOfScans === 2) {
        return (
          <Surface style={styles.doubleButtonsContainer} elevation={0}>
            <Button
              mode="contained"
              onPress={() => handleDoubleFirstAttendee(guest)}
              loading={loading && selectedGuest === guest.id}
              disabled={loading && selectedGuest === guest.id}
              style={[styles.actionButton, styles.firstButton]}
              labelStyle={styles.actionButtonLabel}
              compact
            >
              Mark First
            </Button>
            <Button
              mode="contained"
              onPress={() => handleDoubleBothAttendees(guest)}
              loading={loading && selectedGuest === guest.id}
              disabled={loading && selectedGuest === guest.id}
              style={[styles.actionButton, styles.bothButton]}
              labelStyle={styles.actionButtonLabel}
              compact
            >
              Mark Both
            </Button>
          </Surface>
        );
      } else if (guest.remainedNumberOfScans === 1) {
        return (
          <Button
            mode="contained"
            onPress={() => handleDoubleSecondAttendee(guest)}
            loading={loading && selectedGuest === guest.id}
            disabled={loading && selectedGuest === guest.id}
            style={[styles.actionButton, styles.secondButton]}
            labelStyle={styles.actionButtonLabel}
            compact
          >
            Mark Second
          </Button>
        );
      }
    }

    return null;
  };

  const renderGuestRow = (guest) => (
    <Card 
      style={[
        styles.guestCard,
        (guest.checkedIn || guest.remainedNumberOfScans === 0) && styles.checkedInCard
      ]} 
      mode="contained"
    >
      <Card.Content style={styles.guestContent}>
        <Surface style={styles.guestRow} elevation={0}>
          {/* Name */}
          <Surface style={[styles.guestCell, styles.nameCell]} elevation={0}>
            <Avatar.Text 
              size={32}
              label={`${guest.firstName?.[0] || 'G'}${guest.lastName?.[0] || 'U'}`}
              style={styles.avatar}
            />
            <Surface style={styles.nameInfo} elevation={0}>
              <Text variant="bodyLarge" style={styles.guestName}>
                {guest.firstName} {guest.lastName}
              </Text>
              <Text variant="bodySmall" style={styles.phoneText}>
                {guest.phoneNumber}
              </Text>
            </Surface>
          </Surface>

          {/* Type */}
          <Surface style={[styles.guestCell, styles.typeCell]} elevation={0}>
            <Chip
              mode="outlined"
              compact
              style={[
                styles.typeChip,
                guest.type === 'double' ? styles.doubleChip : styles.singleChip
              ]}
              textStyle={styles.typeText}
            >
              {guest.type.toUpperCase()}
            </Chip>
          </Surface>

          {/* Remaining Scans */}
          <Surface style={[styles.guestCell, styles.scansCell]} elevation={0}>
            <Badge 
              size={24} 
              style={styles.scansBadge}
            >
              {guest.remainedNumberOfScans}
            </Badge>
          </Surface>

          {/* Action */}
          <Surface style={[styles.guestCell, styles.actionCell]} elevation={0}>
            {renderActionButtons(guest)}
          </Surface>
        </Surface>
      </Card.Content>
    </Card>
  );

  if (showspinner) {
    return (
      <Surface style={styles.loadingContainer} elevation={0}>
        <ActivityIndicator size="small" />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Loading...
        </Text>
      </Surface>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f8f9fa"
        translucent={false}
      />
      
      {/* Header */}
      <Card style={styles.headerCard} mode="contained">
        <Card.Content style={styles.headerContent}>
          <Surface style={styles.headerRow} elevation={0}>
            <IconButton 
              icon="arrow-left" 
              size={24} 
              onPress={() => navigation.goBack()}
            />
            <Surface style={styles.headerInfo} elevation={0}>
              <Text variant="headlineSmall" style={styles.headerTitle}>
                Manual Check-in
              </Text>
              <Text variant="bodyMedium" style={styles.eventName} numberOfLines={1}>
                {eventName || 'Event'}
              </Text>
            </Surface>
          </Surface>
        </Card.Content>
      </Card>

      {/* Search Bar */}
      <Surface style={styles.searchContainer} elevation={0}>
        <Searchbar
          placeholder="Search by name or phone number..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={styles.searchBar}
          iconColor="#666"
        />
      </Surface>

      {/* Results Count */}
      <Surface style={styles.resultsContainer} elevation={0}>
        <Text variant="bodyMedium" style={styles.resultsText}>
          {filteredGuests.length} guest{filteredGuests.length !== 1 ? 's' : ''} found
        </Text>
      </Surface>

      {/* Table Header */}
      <Card style={styles.tableHeaderCard} mode="contained">
        <Card.Content style={styles.tableHeaderContent}>
          <Surface style={styles.tableHeader} elevation={0}>
            <Text variant="labelSmall" style={styles.headerText}>Guest</Text>
            <Text variant="labelSmall" style={styles.headerText}>Type</Text>
            <Text variant="labelSmall" style={styles.headerText}>Remaining</Text>
            <Text variant="labelSmall" style={styles.headerText}>Action</Text>
          </Surface>
        </Card.Content>
      </Card>

      {/* Guests List */}
      <ScrollView style={styles.tableContainer}>
        {filteredGuests.length > 0 ? (
          filteredGuests.map(guest => (
            <Surface key={guest.id} elevation={0}>
              {renderGuestRow(guest)}
              <Divider />
            </Surface>
          ))
        ) : (
          <Card style={styles.emptyCard} mode="contained">
            <Card.Content style={styles.emptyContent}>
              <IconButton icon="account-group" size={64} iconColor="#c2c2c2" />
              <Text variant="titleMedium" style={styles.emptyStateText}>
                {searchQuery ? 'No guests found' : 'No guests available'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptyStateSubtext}>
                {searchQuery ? 'Try adjusting your search terms' : 'Guests will appear here once added to the event'}
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
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
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerContent: {
    paddingVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  eventName: {
    color: '#666',
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  searchBar: {
    elevation: 0,
    backgroundColor: '#f8f8f8',
  },
  resultsContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  resultsText: {
    color: '#666',
    fontWeight: '500',
  },
  tableHeaderCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  tableHeaderContent: {
    paddingVertical: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase',
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  guestCard: {
    marginBottom: 8,
  },
  checkedInCard: {
    backgroundColor: '#f0f9ff',
  },
  guestContent: {
    paddingVertical: 8,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  guestCell: {
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  nameCell: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeCell: {
    flex: 1,
    alignItems: 'center',
  },
  scansCell: {
    flex: 1,
    alignItems: 'center',
  },
  actionCell: {
    flex: 1.5,
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#dbeafe',
    marginRight: 8,
  },
  nameInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  guestName: {
    fontWeight: '600',
    color: '#1a1a1a',
  },
  phoneText: {
    color: '#4b5563',
  },
  typeChip: {
    height: 30,
  },
  singleChip: {
    backgroundColor: '#dbeafe',
  },
  doubleChip: {
    backgroundColor: '#f3e8ff',
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  scansBadge: {
    backgroundColor: '#3B82F6',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkedInText: {
    fontWeight: '600',
    color: '#10B981',
  },
  actionButton: {
    margin: 0,
    paddingHorizontal: 8,
  },
  singleButton: {
    backgroundColor: '#10B981',
  },
  firstButton: {
    backgroundColor: '#F59E0B',
  },
  secondButton: {
    backgroundColor: '#8B5CF6',
  },
  bothButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonLabel: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  doubleButtonsContainer: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'transparent',
  },
  emptyCard: {
    marginTop: 20,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
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
  },
};

export default ManualCheckin;