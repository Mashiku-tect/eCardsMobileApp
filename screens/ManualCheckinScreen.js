import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  Platform,
  Alert,
  ToastAndroid,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Text,
  Card,
  ActivityIndicator,
  Surface,
  IconButton,
  Button,
  Chip,
  Divider,
  Searchbar,
  Avatar
} from 'react-native-paper';
import axios from 'axios';
import config from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import api from '../utils/api';

const ITEMS_PER_PAGE = 15; // Number of guests to show per page

const getGuestDisplayName = (guest) => {
  const firstName = guest?.firstName?.trim() || 'eCards';
  const lastName = guest?.lastName?.trim();

  return lastName ? `${firstName} ${lastName}` : firstName;
};

const getGuestInitials = (guest) => {
  const firstInitial = guest?.firstName?.trim()?.[0] || 'G';
  const lastInitial = guest?.lastName?.trim()?.[0];

  return lastInitial ? `${firstInitial}${lastInitial}` : firstInitial;
};

const ManualCheckin = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId, eventName } = route.params;

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showspinner, setShowSpinner] = useState(false);
  const [allGuests, setAllGuests] = useState([]); // Store all guests
  const [fetchError, setFetchError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const fetchGuest = async (showLoading = true) => {
    try {
      if (showLoading) {
        setShowSpinner(true);
      }
      setFetchError(null);
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.get(`${config.BASE_URL}/api/event-guest/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setAllGuests(response.data);
      // Calculate total pages based on filtered data
      setTotalPages(Math.ceil(filterAndSortGuests(response.data, searchQuery).length / ITEMS_PER_PAGE));
    } catch (error) {
      let errorMessage = 'Failed to fetch event Guests. Please try again.';

      if (error.response) {
        errorMessage = error.response?.data?.message || 'Failed to fetch guests';
      } else if (error.request) {
        errorMessage = 'Unable to reach the server. Check your internet connection.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timed out. Please try again.';
      } else {
        errorMessage = error.message;
      }

      setFetchError(errorMessage);

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
      if (showLoading) {
        setShowSpinner(false);
      }
      setRefreshing(false);
      setInitialLoad(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGuest(false);
    setCurrentPage(1);
  };

  // Filter and sort guests based on search query
  const filterAndSortGuests = (guests, searchQuery) => {
    if (!Array.isArray(guests)) return [];
    
    let filtered = guests.filter((guest) => {
      if (!guest) return false;

      const searchLower = (searchQuery || '').toLowerCase();

      const firstName = guest.firstName?.toLowerCase() || '';
      const lastName = guest.lastName?.toLowerCase() || '';
      const phoneNumber = guest.phoneNumber || '';
      const guestCode = guest.guestcode?.toLowerCase() || '';

      return (
        firstName.includes(searchLower) ||
        lastName.includes(searchLower) ||
        phoneNumber.includes(searchQuery || '') ||
        guestCode.includes(searchLower)
      );
    });

    // Sort guests: not checked in first, then by name
    return filtered.sort((a, b) => {
      // Show unchecked guests first
      if (a.checkedIn !== b.checkedIn) {
        return a.checkedIn ? 1 : -1;
      }
      // Then sort by name
      const nameA = getGuestDisplayName(a).toLowerCase();
      const nameB = getGuestDisplayName(b).toLowerCase();
      return nameA.localeCompare(nameB);
    });
  };

  // Get current page's guests
  const getCurrentPageGuests = () => {
    const filtered = filterAndSortGuests(allGuests, searchQuery);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  };

  const currentGuests = getCurrentPageGuests();
  const totalFilteredGuests = filterAndSortGuests(allGuests, searchQuery).length;
  const totalFilteredPages = Math.ceil(totalFilteredGuests / ITEMS_PER_PAGE);

  // Update total pages when filtered guests change
  useEffect(() => {
    setTotalPages(totalFilteredPages);
  }, [totalFilteredPages]);

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

      // Update the guest in allGuests
      const updatedAllGuests = allGuests.map((g) =>
        g.id === guest.id
          ? {
              ...g,
              checkedIn: true,
              remainedNumberOfScans: 0,
            }
          : g
      );

      setAllGuests(updatedAllGuests);

      Alert.alert(
        "Success",
        `${getGuestDisplayName(guest)} has been checked in.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      let errorMessage = 'Failed to check in the Guest. Please try again.';

      if (error.response) {
        errorMessage = error.response?.data?.message || 'Failed To check in the Guest';
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

      const updatedAllGuests = allGuests.map(g =>
        g.id === guest.id ? {
          ...g,
          remainedNumberOfScans: 1
        } : g
      );

      setAllGuests(updatedAllGuests);
      Alert.alert(
        'Success',
        `First attendee checked in for ${getGuestDisplayName(guest)}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      let errorMessage = 'Failed to Update First attendee status. Please try again.';

      if (error.response) {
        errorMessage = error.response?.data?.message || 'Failed to Update First attendee status. Please try again.';
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
        },
      );

      const updatedAllGuests = allGuests.map(g =>
        g.id === guest.id ? {
          ...g,
          checkedIn: true,
          remainedNumberOfScans: 0
        } : g
      );

      setAllGuests(updatedAllGuests);
      Alert.alert(
        'Success',
        `Second attendee checked in for ${getGuestDisplayName(guest)}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      let errorMessage = 'Failed to Update Second attendee status. Please try again.';

      if (error.response) {
        errorMessage = error.response?.data?.message || 'Failed to Update Second attendee status. Please try again.';
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

      const updatedAllGuests = allGuests.map(g =>
        g.id === guest.id ? {
          ...g,
          checkedIn: true,
          remainedNumberOfScans: 0
        } : g
      );

      setAllGuests(updatedAllGuests);
      Alert.alert(
        'Success',
        `Both attendees checked in for ${getGuestDisplayName(guest)}.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      let errorMessage = 'Failed to Update Both attendee status. Please try again.';

      if (error.response) {
        errorMessage = error.response?.data?.message || 'Failed to Update Both attendee status. Please try again.';
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
    } finally {
      setLoading(false);
      setSelectedGuest(null);
    }
  };

  const renderActionButtons = (guest) => {
    if (guest.checkedIn || guest.remainedNumberOfScans === 0) {
      return (
        <Surface style={styles.statusContainer} elevation={0}>
          <IconButton 
            icon="check-circle" 
            size={16} 
            iconColor="#333333"
            style={styles.statusIcon}
          />
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
          style={styles.actionButton}
          labelStyle={styles.actionButtonLabel}
          contentStyle={styles.buttonContent}
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
              style={styles.actionButton}
              labelStyle={styles.actionButtonLabel}
              contentStyle={styles.buttonContent}
              compact
            >
              Mark First
            </Button>
            <Button
              mode="contained"
              onPress={() => handleDoubleBothAttendees(guest)}
              loading={loading && selectedGuest === guest.id}
              disabled={loading && selectedGuest === guest.id}
              style={styles.actionButton}
              labelStyle={styles.actionButtonLabel}
              contentStyle={styles.buttonContent}
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
            style={styles.actionButton}
            labelStyle={styles.actionButtonLabel}
            contentStyle={styles.buttonContent}
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
    <Card style={styles.guestCard} mode="contained">
      <Card.Content style={styles.guestContent}>
        <Surface style={styles.guestRow} elevation={0}>
          {/* Name and Guest Code */}
          <Surface style={[styles.guestCell, styles.nameCell]} elevation={0}>
            <Avatar.Text 
              size={32}
              label={getGuestInitials(guest)}
              style={styles.avatar}
              labelStyle={styles.avatarText}
            />
            <Surface style={styles.nameInfo} elevation={0}>
              <Text variant="bodyLarge" style={styles.guestName}>
                {getGuestDisplayName(guest)}
              </Text>
              <Text variant="bodySmall" style={styles.phoneText}>
                {guest?.phoneNumber?? '0626779507'}
              </Text>
              {/* Display Guest Code */}
              {guest.guestcode && (
                <Surface style={styles.guestCodeContainer} elevation={0}>
                  <IconButton 
                    icon="ticket" 
                    size={12} 
                    iconColor="#666666"
                    style={styles.codeIcon}
                  />
                  <Text variant="bodySmall" style={styles.guestCodeText}>
                    {guest.guestcode}
                  </Text>
                </Surface>
              )}
            </Surface>
          </Surface>

          {/* Type */}
          <Surface style={[styles.guestCell, styles.typeCell]} elevation={0}>
            <Chip
              mode="outlined"
              compact
              style={styles.typeChip}
              textStyle={styles.typeText}
            >
              {guest.type?.toUpperCase() || 'GUEST'}
            </Chip>
          </Surface>

          {/* Action */}
          <Surface style={[styles.guestCell, styles.actionCell]} elevation={0}>
            {renderActionButtons(guest)}
          </Surface>
        </Surface>
      </Card.Content>
    </Card>
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <Surface style={styles.paginationContainer} elevation={0}>
        <TouchableOpacity
          onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          style={[styles.paginationButton, currentPage === 1 && styles.paginationButtonDisabled]}
        >
          <IconButton
            icon="chevron-left"
            size={20}
            iconColor={currentPage === 1 ? "#CCCCCC" : "#333333"}
            style={styles.paginationIcon}
          />
        </TouchableOpacity>
        
        <Surface style={styles.pageInfo} elevation={0}>
          <Text variant="bodyMedium" style={styles.pageText}>
            Page {currentPage} of {totalPages}
          </Text>
          <Text variant="bodySmall" style={styles.totalText}>
            ({totalFilteredGuests} total guests)
          </Text>
        </Surface>
        
        <TouchableOpacity
          onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          style={[styles.paginationButton, currentPage === totalPages && styles.paginationButtonDisabled]}
        >
          <IconButton
            icon="chevron-right"
            size={20}
            iconColor={currentPage === totalPages ? "#CCCCCC" : "#333333"}
            style={styles.paginationIcon}
          />
        </TouchableOpacity>
      </Surface>
    );
  };

  // Show loading spinner only during initial load
  if (showspinner && initialLoad) {
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
            Loading guests...
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
      
      {/* Header */}
      <Surface style={styles.header} elevation={0}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
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

      {/* Search Bar */}
      <Card style={styles.formContainer} mode="contained">
        <Card.Content style={styles.cardContent}>
          <Searchbar
            placeholder="Search by name, phone number, or guest code..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchBar}
            iconColor="#666666"
            mode="outlined"
          />
          
          <Surface style={styles.resultsContainer} elevation={0}>
            <Text variant="bodyMedium" style={styles.resultsText}>
              {totalFilteredGuests} guest{totalFilteredGuests !== 1 ? 's' : ''} found
              {searchQuery && ` for "${searchQuery}"`}
            </Text>
          </Surface>
        </Card.Content>
      </Card>

      {/* Table Header */}
      <Card style={styles.formContainer} mode="contained">
        <Card.Content style={styles.tableHeaderContent}>
          <Surface style={styles.tableHeader} elevation={0}>
            <Text variant="labelSmall" style={styles.headerText}>GUEST</Text>
            <Text variant="labelSmall" style={styles.headerText}>TYPE</Text>
            <Text variant="labelSmall" style={styles.headerText}>ACTION</Text>
          </Surface>
        </Card.Content>
      </Card>

      {/* Guests List with Pull to Refresh */}
      <ScrollView
        style={styles.tableContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#333333']}
            tintColor="#333333"
          />
        }
      >
        {/* Show error state with retry button */}
        {fetchError && !initialLoad && (
          <Card style={styles.formContainer} mode="contained">
            <Card.Content style={styles.errorContent}>
              <Surface style={styles.errorIconContainer} elevation={0}>
                <IconButton
                  icon="wifi-off"
                  size={64}
                  iconColor="#333333"
                  style={styles.errorIcon}
                />
              </Surface>
              <Text variant="titleMedium" style={styles.errorText}>
                Connection Error
              </Text>
              <Text variant="bodyMedium" style={styles.errorSubtext}>
                {fetchError}
              </Text>
              <Button
                mode="contained"
                onPress={() => fetchGuest()}
                style={styles.retryButton}
                labelStyle={styles.retryButtonLabel}
                icon="refresh"
              >
                Retry
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Show guests if loaded successfully */}
        {!fetchError && currentGuests.length > 0 && (
          <>
            {currentGuests.map((guest, index) => (
              <React.Fragment key={guest?.id ?? index}>
                {renderGuestRow(guest)}
                <Divider style={styles.divider} />
              </React.Fragment>
            ))}
            
            {/* Pagination Controls */}
            {renderPagination()}
          </>
        )}

        {/* Show empty state only when not loading and no guests */}
        {!fetchError && currentGuests.length === 0 && !initialLoad && (
          <Card style={styles.formContainer} mode="contained">
            <Card.Content style={styles.emptyContent}>
              <Surface style={styles.emptyIconContainer} elevation={0}>
                <IconButton
                  icon="account-group"
                  size={64}
                  iconColor="#666666"
                  style={styles.emptyIcon}
                />
              </Surface>
              <Text variant="titleMedium" style={styles.emptyStateText}>
                {searchQuery ? 'No guests found' : 'No guests available'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptyStateSubtext}>
                {searchQuery
                  ? 'Try adjusting your search terms'
                  : 'Guests will appear here once added to the event'}
              </Text>
            </Card.Content>
          </Card>
        )}
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
    backgroundColor: '#ffffff',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 0,
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: '#ffffff',
  },
  backButton: {
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    color: '#333333',
    fontWeight: 'bold',
  },
  eventName: {
    color: '#666666',
  },
  formContainer: {
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  cardContent: {
    paddingVertical: 20,
  },
  searchBar: {
    backgroundColor: '#ffffff',
    elevation: 0,
  },
  resultsContainer: {
    marginTop: 16,
    backgroundColor: 'transparent',
  },
  resultsText: {
    color: '#666666',
    fontWeight: '500',
  },
  tableHeaderContent: {
    paddingVertical: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerText: {
    fontWeight: 'bold',
    color: '#333333',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableContainer: {
    flex: 1,
    marginHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  guestCard: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  guestContent: {
    paddingVertical: 12,
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
  actionCell: {
    flex: 1.5,
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#f5f5f5',
    marginRight: 12,
  },
  avatarText: {
    color: '#333333',
  },
  nameInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  guestName: {
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  phoneText: {
    color: '#666666',
  },
  guestCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  codeIcon: {
    margin: 0,
    padding: 0,
    width: 16,
    height: 16,
  },
  guestCodeText: {
    color: '#888888',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginLeft: 4,
  },
  typeChip: {
    height: 30,
    backgroundColor: '#f5f5f5',
    borderWidth: 0,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#333333',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  statusIcon: {
    backgroundColor: '#f5f5f5',
  },
  checkedInText: {
    fontWeight: '600',
    color: '#333333',
    marginLeft: 4,
  },
  actionButton: {
    borderRadius: 8,
    backgroundColor: '#000000',
  },
  actionButtonLabel: {
    fontSize: 12,
    color: '#ffffff',
  },
  buttonContent: {
    paddingVertical: 4,
  },
  doubleButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent',
  },
  divider: {
    marginVertical: 8,
    backgroundColor: '#f0f0f0',
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
  emptyStateText: {
    color: '#333333',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyStateSubtext: {
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
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
  errorText: {
    color: '#333333',
    marginTop: 15,
    marginBottom: 5,
    textAlign: 'center',
    fontWeight: '600',
  },
  errorSubtext: {
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  retryButton: {
    marginTop: 10,
    borderRadius: 8,
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  retryButtonLabel: {
    fontSize: 14,
    color: '#ffffff',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 10,
    backgroundColor: 'transparent',
  },
  paginationButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 8,
  },
  paginationButtonDisabled: {
    backgroundColor: '#fafafa',
    opacity: 0.5,
  },
  paginationIcon: {
    margin: 0,
    padding: 0,
  },
  pageInfo: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginHorizontal: 16,
  },
  pageText: {
    fontWeight: '600',
    color: '#333333',
  },
  totalText: {
    color: '#666666',
    marginTop: 2,
  },
});

export default ManualCheckin;
