import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  FlatList,
  Dimensions,
  ToastAndroid,
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
  Modal,
  Portal,
  Dialog,
  Paragraph
} from 'react-native-paper';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import Toast from 'react-native-toast-message';
import api from '../utils/api';

const { width: screenWidth } = Dimensions.get('window');

const EventDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId, eventName } = route.params;

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [updatingCallStatus, setUpdatingCallStatus] = useState(null);
  
  const [cancelDialogVisible, setCancelDialogVisible] = useState(false);
  const [completeDialogVisible, setCompleteDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  
  const [tenants, setTenants] = useState([]);
  const [scanners, setScanners] = useState([]);
  const [availableTenants, setAvailableTenants] = useState([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.get(`${config.BASE_URL}/api/events/eventdetails/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setEvent(response.data.event);
      setGuests(response.data.guests || []);
    } catch (error) {
     // const errormessage = error.response?.data?.message || 'Failed to fetch event details';

        let errorMessage = 'Failed to fetch Event Details . Please try again.';

  if (error.response) {

    errorMessage =error.response?.data?.message || 'Failed to fetch event Details. Please try again.';
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
    }
  };

  const isEventNotDealt = () => {
    if (!event) return false;
    
    const today = new Date();
    const eventDate = new Date(event.eventDate);
    
    today.setHours(0, 0, 0, 0);
    eventDate.setHours(0, 0, 0, 0);
    
    return eventDate < today;
  };

  const shouldDisableCallStatusButtons = () => {
    if (!event) return true;
    return event.cancelled || !event.active || isEventNotDealt();
  };

  const updateCallStatus = async (guestId, status) => {
    if (shouldDisableCallStatusButtons()) {
      return;
    }

    setUpdatingCallStatus(guestId);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.put(
        `${config.BASE_URL}/api/events/${eventId}/guests/${guestId}/status`,
        { field: 'callStatus', value: status },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const updatedGuests = guests.map(guest => 
        guest.id === guestId ? { ...guest, callStatus: status } : guest
      );
      setGuests(updatedGuests);
      const responsemessage=response.data?.message || 'Call Status Updated Successfully';
      if(Platform.OS==='android'){
        ToastAndroid.show(responsemessage,ToastAndroid.LONG)
      }
      else{

      Toast.show({
        type: 'success',
        text1: response.data.message
      });

      }

    } catch (error) {
      //const errormessage = error.response?.data?.message || 'Failed to update call status';
    
        let errorMessage = 'Failed to Update Guest Call status. Please try again.';

  if (error.response) {


    errorMessage =error.response?.data?.message || 'Failed to Update Guest Call status. Please try again.';
    

    

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
      setUpdatingCallStatus(null);
    }
  };

  // Render channel status for SMS/WhatsApp
  const renderChannelStatus = (smsSent, whatsappSent) => {
    // If both failed
    if (!smsSent && !whatsappSent) {
      return (
        <View style={styles.channelContainer}>
          <IconButton 
            icon="close-circle" 
            size={16} 
            iconColor="#dc2626"
            style={styles.channelIcon}
          />
          <Text style={styles.notSentText}>Not sent</Text>
        </View>
      );
    }
    
    // If sent via WhatsApp only
    if (whatsappSent) {
      return (
        <View style={styles.channelContainer}>
          {/* WhatsApp icon - using message-outline as placeholder, you can use a custom WhatsApp icon if available */}
          <IconButton 
            icon="whatsapp" 
            size={16} 
            iconColor="#25d366"
            style={styles.channelIcon}
          />
          <Text style={styles.whatsappText}>WhatsApp</Text>
        </View>
      );
    }
    
    // If sent via SMS only (default fallback)
    return (
      <View style={styles.channelContainer}>
        <IconButton 
          icon="message-text" 
          size={16} 
          iconColor="#3b82f6"
          style={styles.channelIcon}
        />
        <Text style={styles.smsText}>SMS</Text>
      </View>
    );
  };

  const getPackageColumns = () => {
    const packageName = event?.packagename || 'Basic';
    const baseColumns = [
      { key: 'serial', label: 'S/N', width: 60 },
      { key: 'guestCode', label: 'Guest Code', width: 110 },
      { key: 'firstName', label: 'First Name', width: 100 },
      { key: 'lastName', label: 'Last Name', width: 100 },
      { key: 'phone', label: 'Phone', width: 120 },
      { key: 'type', label: 'Type', width: 80 },
    ];

    switch (packageName.toLowerCase()) {
      case 'basic':
        return [
          ...baseColumns,
          { key: 'rsvpStatus', label: 'RSVP Status', width: 100 },
          { key: 'invitation', label: 'Invitation', width: 100 }
        ];
      
      case 'standard':
        return [
          ...baseColumns,
          { key: 'rsvpStatus', label: 'RSVP Status', width: 100 },
          { key: 'invitation', label: 'Invitation', width: 100 },
          { key: 'callStatus', label: 'Call Status', width: 150 }
        ];
      
      case 'pro':
        return [
          ...baseColumns,
          { key: 'rsvpStatus', label: 'RSVP Status', width: 100 },
          { key: 'invitation', label: 'Invitation', width: 100 },
          { key: 'reminder1', label: 'Reminder 1', width: 100 },
          { key: 'callStatus', label: 'Call Status', width: 150 }
        ];
      
      case 'elite':
        return [
          ...baseColumns,
          { key: 'rsvpStatus', label: 'RSVP Status', width: 100 },
          { key: 'invitation', label: 'Invitation', width: 100 },
          { key: 'reminder1', label: 'Reminder 1', width: 100 },
          { key: 'reminder2', label: 'Reminder 2', width: 100 },
          { key: 'callStatus', label: 'Call Status', width: 150 }
        ];
      
      default:
        return baseColumns;
    }
  };

  const getTableWidth = () => {
    const columns = getPackageColumns();
    return columns.reduce((total, column) => total + column.width, 0);
  };

  const fetchScanPermissions = async () => {
    try {
      setLoadingPermissions(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.get(`${config.BASE_URL}/api/events/${eventId}/scan-permissions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setScanners(response.data.scanners || []);
      
      const tenantsResponse = await api.get(`${config.BASE_URL}/api/users/tenants`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTenants(tenantsResponse.data.tenants || []);
      
      const scannerIds = response.data.scanners.map(scanner => scanner.tenant_id);
      const available = tenantsResponse.data.tenants.filter(tenant => 
        !scannerIds.includes(tenant.id)
      );
      setAvailableTenants(available);
      
    } catch (error) {
      let errorMessage = 'Failed to load Scann Permissions. Please try again.';

  if (error.response) {


    errorMessage =error.response?.data?.message || 'Failed to Load Scann Permissions. Please try again.';
    

    

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
      setLoadingPermissions(false);
    }
  };

  const addScanner = async (tenantId) => {
    if(!tenantId){
      return;
    }

    try {
      const token = await AsyncStorage.getItem('authToken');
    const response=  await api.post(
        `${config.BASE_URL}/api/events/${eventId}/scan-permissions`, 
        { tenant_id: tenantId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      await fetchScanPermissions();
      const responsemessage=response.data?.message || 'Tenant added as scanner successfully';
      if(Platform.OS==='android'){
        ToastAndroid.show(responsemessage,ToastAndroid.LONG)
      }
      else{
Toast.show({
        type: 'success',
        text1:'Success',
        text12: responsemessage
      });
      }
      
    } catch (error) {
       let errorMessage = 'Failed to add tenant as scanner. Please try again.';

  if (error.response) {


    errorMessage =error.response?.data?.message || 'Failed to add tenant as scanner. Please try again.';

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
    }
  };

  const removeScanner = async (scannerId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
    const response=  await api.delete(`${config.BASE_URL}/api/events/${eventId}/scan-permissions/${scannerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      await fetchScanPermissions();
      const responsemessage=response.data?.message || 'Scan permission removed successfully!';
      if(Platform.OS==='android'){
        ToastAndroid.show(responsemessage,ToastAndroid.LONG)
      }
      else{
 Toast.show({
        type: 'success',
        text1:'Success',
        text1: responsemessage
      });
      }
     
    } catch (error) {
       let errorMessage = 'Failed to remove scann permission. Please try again.';

  if (error.response) {


    errorMessage =error.response?.data?.message || 'Failed to remove scann permission. Please try again.';
    

    

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
    }
  };

  const handleCancelEvent = async () => {
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.put(
        `${config.BASE_URL}/api/events/cancel/${eventId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      const responsemessage=response?.data?.message || 'Event cancelled successfully';
      if(Platform.OS==='android'){
        ToastAndroid.show(responsemessage,ToastAndroid.SHORT);
      }
      else{
Toast.show({
        type: 'success',
        text1:'Success',
        text2: responsemessage
      });
      }
      setEvent({ ...event, active: false, cancelled: true });
      
    } catch (error) {
      let errorMessage = 'Failed to Cancel Event. Please try again.';

  if (error.response) {


    errorMessage =error.response?.data?.message || 'Failed to Cancel Event. Please try again.';
    

    

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
      setUpdating(false);
      setCancelDialogVisible(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.delete(`${config.BASE_URL}/api/events/delete/${eventId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
       const responsemessage=response?.data?.message || 'Event deleted successfully';
       if(Platform.OS==='android'){
        ToastAndroid.show(responsemessage,ToastAndroid.SHORT);
        }else{
      Toast.show({
        type: 'success',
        text1: responsemessage
      });
    }
      navigation.navigate('HomeTabs', { screen: 'Events' });
    } catch (error) {
       let errorMessage = 'Failed to Delete Event. Please try again.';

  if (error.response) {


    errorMessage =error.response?.data?.message || 'Failed to Delete Event. Please try again.';
    

    

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
      setDeleteDialogVisible(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await api.put(
        `${config.BASE_URL}/api/events/complete/${eventId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setEvent({ ...event, active: false });
      const responsemessage=response?.data?.message || 'Event marked as completed';
      if(Platform.OS==='android'){
        ToastAndroid.show(responsemessage,ToastAndroid.SHORT);
      }
      else{
Toast.show({
        type: 'success',
        text1:'Success',
        text2: responsemessage
      });
      }
      
    } catch (error) {
       let errorMessage = 'Failed to Mark Event as completed. Please try again.';

  if (error.response) {


    errorMessage =error.response?.data?.message || 'Failed to Mark Event As Completed. Please try again.';
    

    

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
      setUpdating(false);
      setCompleteDialogVisible(false);
    }
  };

  const viewReport = () => {
    if(!eventId) return;
    navigation.navigate('Reports', { 
      id: eventId,
    });
  };

  const manageScanners = () => {
    if(!eventId) return;
    navigation.navigate('ScanPermissions', { eventId });
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentGuests = guests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(guests.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const goToPreviousPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const goToNextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      
      if (currentPage <= 3) {
        endPage = Math.min(totalPages, maxVisiblePages);
      }
      
      if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - maxVisiblePages + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  const renderCallStatusButtons = (guest) => {
    const currentStatus = guest.callStatus || 'Not Called';
    const isDisabled = shouldDisableCallStatusButtons();
    
    if (updatingCallStatus === guest.id) {
      return (
        <Surface style={styles.callStatusLoading} elevation={0}>
          <ActivityIndicator size="small" color="#000000" />
        </Surface>
      );
    }

    if (currentStatus === 'Reachable') {
      return (
        <Surface style={styles.callStatusContainer} elevation={0}>
          <Button
            mode="contained"
            compact
            disabled={true}
            style={[styles.callStatusButton, styles.reachableButtonActive]}
            labelStyle={styles.callStatusButtonTextActive}
          >
            Reachable
          </Button>
          <Button
            mode="outlined"
            compact
            onPress={() => updateCallStatus(guest.id, 'Not Reachable')}
            disabled={isDisabled}
            style={[styles.callStatusButton, styles.notReachableButton]}
            labelStyle={styles.callStatusButtonText}
          >
            Not Reachable
          </Button>
        </Surface>
      );
    }

    if (currentStatus === 'Not Reachable') {
      return (
        <Surface style={styles.callStatusContainer} elevation={0}>
          <Button
            mode="outlined"
            compact
            onPress={() => updateCallStatus(guest.id, 'Reachable')}
            disabled={isDisabled}
            style={[styles.callStatusButton, styles.reachableButton]}
            labelStyle={styles.callStatusButtonText}
          >
            Reachable
          </Button>
          <Button
            mode="contained"
            compact
            disabled={true}
            style={[styles.callStatusButton, styles.notReachableButtonActive]}
            labelStyle={styles.callStatusButtonTextActive}
          >
            Not Reachable
          </Button>
        </Surface>
      );
    }

    // Default state - Not Called
    return (
      <Surface style={styles.callStatusContainer} elevation={0}>
        <Button
          mode="outlined"
          compact
          onPress={() => updateCallStatus(guest.id, 'Reachable')}
          disabled={isDisabled}
          style={[styles.callStatusButton, styles.reachableButton]}
          labelStyle={styles.callStatusButtonText}
        >
          Reachable
        </Button>
        <Button
          mode="outlined"
          compact
          onPress={() => updateCallStatus(guest.id, 'Not Reachable')}
          disabled={isDisabled}
          style={[styles.callStatusButton, styles.notReachableButton]}
          labelStyle={styles.callStatusButtonText}
        >
          Not Reachable
        </Button>
      </Surface>
    );
  };

 const renderGuestItem = ({ item, index }) => {
  // Ensure getPackageColumns always returns an array
  const columns = getPackageColumns() ?? [];

  return (
    <Surface style={styles.guestRow} elevation={0}>
      {columns.map((column, colIndex) => (
        <Surface
          key={column?.key ?? colIndex} // fallback key
          style={[styles.guestCell, { width: column?.width ?? 100 }]} // fallback width
          elevation={0}
        >
          {renderGuestCell?.(item ?? {}, column?.key ?? "", index)}
        </Surface>
      ))}
    </Surface>
  );
};


  const renderGuestCell = (item, key, index) => {
    const packageName = event?.packagename || 'Basic';
    
    switch (key) {
      case 'serial':
        return <Text variant="bodySmall" style={styles.guestCellText}>{(currentPage - 1) * itemsPerPage + index + 1}</Text>;
      
      case 'firstName':
        return <Text variant="bodySmall" style={styles.guestCellText}>{item.firstName || 'N/A'}</Text>;

      case 'guestCode':
        return <Text variant="bodySmall" style={styles.guestCellText}>{item.guestCode || 'N/A'}</Text>;
      
      case 'lastName':
        return <Text variant="bodySmall" style={styles.guestCellText}>{item.lastName || 'N/A'}</Text>;
      
      case 'phone':
        return <Text variant="bodySmall" style={styles.guestCellText}>{item.phone || 'N/A'}</Text>;
      
      case 'type':
        return (
          <Text variant="bodySmall" style={styles.guestCellText}>
            {item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'N/A'}
          </Text>
        );
      
      case 'rsvpStatus':
        return (
          <Chip
            mode="outlined"
            compact
            style={[
              styles.rsvpChip,
              item?.rsvpStatus === 'Accepted' ? styles.acceptedChip : 
              item?.rsvpStatus === 'Declined' ? styles.declinedChip : 
              styles.pendingChip
            ]}
            textStyle={styles.rsvpChipText}
          >
            {item.rsvpStatus || 'Pending'}
          </Chip>
        );
      
      case 'invitation':
        return renderChannelStatus(
          item.invitationSmsSent || item.smsSent, // fallback to old field
          item.invitationWhatsappSent
        );
      
      case 'callStatus':
        return renderCallStatusButtons(item);
      
      case 'reminder1':
        return renderChannelStatus(
          item.reminder1SmsSent || item.Remainder1Sent,
          item.reminder1WhatsappSent
        );
      
      case 'reminder2':
        return renderChannelStatus(
          item.reminder2SmsSent || item.Remainder2Sent,
          item.reminder2WhatsappSent
        );
      
      case 'reminderSent': // For Pro package compatibility
        return renderChannelStatus(
          item.reminder1SmsSent || item.Remainder1Sent,
          item.reminder1WhatsappSent
        );
      
      default:
        return <Text variant="bodySmall" style={styles.guestCellText}>N/A</Text>;
    }
  };

  const renderTableHeader = () => {
  // Ensure columns is always an array
  const columns = getPackageColumns() ?? [];

  return (
    <Surface style={styles.tableHeader} elevation={1}>
      {columns.map((column, index) => (
        <Surface
          key={column?.key ?? index} // fallback key
          style={[styles.headerCell, { width: column?.width ?? 100 }]} // default width
          elevation={0}
        >
          <Text variant="labelSmall" style={styles.headerCellText}>
            {column?.label ?? ""}
          </Text>
        </Surface>
      ))}
    </Surface>
  );
};


  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#ffffff"
          translucent={false}
        />
        <Surface style={styles.loadingContainer} elevation={0}>
          <ActivityIndicator size="small" color="#000000" />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Loading event details...
          </Text>
        </Surface>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#ffffff"
          translucent={false}
        />
        <Surface style={styles.errorContainer} elevation={0}>
          <Text variant="headlineMedium" style={styles.errorTitle}>Event Not Found</Text>
          <Button
            mode="contained"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Back to Events
          </Button>
        </Surface>
      </SafeAreaView>
    );
  }

  const isNotDealt = isEventNotDealt();
  const showAllButtons = event.active && !event.cancelled && !isNotDealt;
  const showOnlyDelete = event.cancelled || isNotDealt;
  const showLimitedButtons = !event.active && !event.cancelled && !isNotDealt;

  const pageNumbers = getPageNumbers();
  const tableWidth = getTableWidth();
  const needsHorizontalScroll = tableWidth > screenWidth - 32;

  const getStatusChipProps = () => {
    if (event.cancelled) {
      return { style: styles.cancelledChip, textStyle: styles.cancelledChipText };
    }
    if (isNotDealt) {
      return { style: styles.notDealtChip, textStyle: styles.notDealtChipText };
    }
    if (!event.active) {
      return { style: styles.completedChip, textStyle: styles.completedChipText };
    }
    return { style: styles.upcomingChip, textStyle: styles.upcomingChipText };
  };

  const getStatusText = () => {
    if (event.cancelled) return 'Cancelled';
    if (isNotDealt) return 'Not Dealt';
    if (!event.active) return 'Completed';
    return 'Upcoming';
  };

  const statusChipProps = getStatusChipProps();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#ffffff"
        translucent={false}
      />
      
      {/* Dialogs */}
      <Portal>
        {/* Cancel Event Dialog */}
        <Dialog 
          visible={cancelDialogVisible} 
          onDismiss={() => setCancelDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Cancel Event</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={styles.dialogText}>
              Are you sure you want to cancel this event? This action cannot be undone.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setCancelDialogVisible(false)}
              textColor="#666666"
            >
              Cancel
            </Button>
            <Button 
              onPress={handleCancelEvent}
              mode="contained"
              loading={updating}
              style={styles.cancelEventButton}
            >
              Cancel Event
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Complete Event Dialog */}
        <Dialog 
          visible={completeDialogVisible} 
          onDismiss={() => setCompleteDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Mark as Completed</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={styles.dialogText}>
              Are you sure you want to mark this event as completed?
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setCompleteDialogVisible(false)}
              textColor="#666666"
            >
              Cancel
            </Button>
            <Button 
              onPress={handleMarkAsCompleted}
              mode="contained"
              loading={updating}
              style={styles.completeEventButton}
            >
              Mark Complete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Event Dialog */}
        <Dialog 
          visible={deleteDialogVisible} 
          onDismiss={() => setDeleteDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Delete Event</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={styles.dialogText}>
              Are you sure you want to delete this event?
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={() => setDeleteDialogVisible(false)}
              textColor="#666666"
            >
              Cancel
            </Button>
            <Button 
              onPress={handleDeleteEvent}
              mode="contained"
              style={styles.deleteDialogButton}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Scan Permissions Modal */}
        <Modal
          visible={permissionModalVisible}
          onDismiss={() => setPermissionModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Card style={styles.modalCard}>
            <Card.Title
              title="Manage Scan Permissions"
              titleVariant="titleLarge"
              titleStyle={styles.modalTitle}
              right={(props) => (
                <IconButton
                  {...props}
                  icon="close"
                  onPress={() => setPermissionModalVisible(false)}
                  iconColor="#666666"
                />
              )}
            />
            <Card.Content>
              {loadingPermissions ? (
                <Surface style={styles.loadingPermissions} elevation={0}>
                  <ActivityIndicator size="small" color="#000000" />
                  <Text variant="bodyMedium" style={styles.loadingPermissionsText}>Loading permissions...</Text>
                </Surface>
              ) : (
                <ScrollView style={styles.modalBody}>
                  {/* Current Scanners */}
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Current Scanners
                  </Text>
                  {scanners.length > 0 ? (
                    scanners.map((scanner) => (
                      <Card key={scanner.id} style={styles.scannerCard} mode="outlined">
                        <Card.Content style={styles.scannerContent}>
                          <Surface style={styles.scannerInfo} elevation={0}>
                            <Text variant="bodyLarge" style={styles.scannerName}>
                              {scanner.tenant?.firstName?? 'eCards'} {scanner.tenant?.lastName?? 'User'}
                            </Text>
                            <Text variant="bodyMedium" style={styles.scannerEmail}>
                              {scanner.tenant?.email ?? 'ecardsuser@mashikutech.co.tz'}
                            </Text>
                          </Surface>
                          <Button
                            mode="outlined"
                            onPress={() => removeScanner(scanner.id)}
                            style={styles.removeButton}
                            textColor="#666666"
                          >
                            Remove
                          </Button>
                        </Card.Content>
                      </Card>
                    ))
                  ) : (
                    <Text variant="bodyMedium" style={styles.noScannersText}>
                      No scanners assigned yet.
                    </Text>
                  )}

                  <Divider style={styles.modalDivider} />

                  {/* Add New Scanner */}
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Add Scanner
                  </Text>
                  {availableTenants.length > 0 ? (
                    availableTenants.map((tenant) => (
                      <Card key={tenant.id} style={styles.scannerCard} mode="outlined">
                        <Card.Content style={styles.scannerContent}>
                          <Surface style={styles.scannerInfo} elevation={0}>
                            <Text variant="bodyLarge" style={styles.scannerName}>
                              {tenant?.firstName ?? 'eCards'} {tenant?.lastName ?? 'User'}
                            </Text>
                            <Text variant="bodyMedium" style={styles.scannerEmail}>
                              {tenant?.email?? 'ecardsuser@mashikutech.co.tz'}
                            </Text>
                          </Surface>
                          <Button
                            mode="contained"
                            onPress={() => addScanner(tenant.id)}
                            style={styles.addButton}
                          >
                            Add
                          </Button>
                        </Card.Content>
                      </Card>
                    ))
                  ) : (
                    <Text variant="bodyMedium" style={styles.noScannersText}>
                      No available tenants to add.
                    </Text>
                  )}
                </ScrollView>
              )}
            </Card.Content>
          </Card>
        </Modal>
      </Portal>

      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <Surface style={styles.header} elevation={0}>
          <Button
            mode="outlined"
            icon="arrow-left"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            textColor="#333333"
          >
            Back to Events
          </Button>
          
          <Surface style={styles.actionButtons} elevation={0}>
            {/* Manage Scanners Button */}
            {(showAllButtons || (showLimitedButtons && event.active)) && (
              <Button
                mode="contained"
                icon="account-multiple"
                onPress={manageScanners}
                style={[styles.actionButton, styles.scannerButton]}
                contentStyle={styles.actionButtonContent}
              >
                Scanners
              </Button>
            )}

            {/* View Report Button */}
            {!isNotDealt && (
              <Button
                mode="contained"
                icon="chart-bar"
                onPress={viewReport}
                style={[styles.actionButton, styles.reportButton]}
                contentStyle={styles.actionButtonContent}
              >
                Report
              </Button>
            )}

            {/* Cancel and Complete buttons */}
            {showAllButtons && (
              <>
                <Button
                  mode="contained"
                  icon="close-circle"
                  onPress={() => setCancelDialogVisible(true)}
                  loading={updating}
                  style={[styles.actionButton, styles.cancelButton]}
                  contentStyle={styles.actionButtonContent}
                >
                  Cancel
                </Button>

                <Button
                  mode="contained"
                  icon="check-circle"
                  onPress={() => setCompleteDialogVisible(true)}
                  loading={updating}
                  style={[styles.actionButton, styles.completeButton]}
                  contentStyle={styles.actionButtonContent}
                >
                  Complete
                </Button>
              </>
            )}
            
            {/* Edit Button */}
            {(showAllButtons || (showLimitedButtons && event.active)) && (
              <Button
                mode="contained"
                icon="pencil"
                onPress={() => navigation.navigate('EditEvent', { id: eventId })}
                style={[styles.actionButton, styles.editButton]}
                contentStyle={styles.actionButtonContent}
              >
                Edit
              </Button>
            )}
            
            {/* Delete Button */}
            <Button
              mode="contained"
              icon="delete"
              onPress={() => setDeleteDialogVisible(true)}
              style={[styles.actionButton, styles.deleteButton]}
              contentStyle={styles.actionButtonContent}
            >
              Delete
            </Button>
          </Surface>
        </Surface>

        {/* Event Card */}
        <Card style={styles.card} mode="contained">
          <Card.Content>
            <Surface style={styles.cardHeader} elevation={0}>
              <Text variant="headlineMedium" style={styles.eventTitle}>
                {event.eventName}
              </Text>
              <Chip
                mode="outlined"
                {...statusChipProps}
              >
                {getStatusText()}
              </Chip>
            </Surface>

            {/* Package Info */}
            <Surface style={styles.packageInfo} elevation={0}>
              <Text variant="labelLarge" style={styles.packageLabel}>Package:</Text>
              <Chip mode="flat" style={styles.packageChip} textStyle={styles.packageChipText}>
                {event.packagename || 'Basic'}
              </Chip>
            </Surface>

            {/* Event Status Notices */}
            {event.cancelled && (
              <Card style={[styles.noticeCard, styles.cancelledNotice]} mode="outlined">
                <Card.Content style={styles.noticeContent}>
                  <IconButton icon="alert-circle" iconColor="#999999" size={20} />
                  <Surface style={styles.noticeText} elevation={0}>
                    <Text variant="titleSmall" style={styles.noticeTitle}>
                      Event Cancelled
                    </Text>
                    <Text variant="bodyMedium" style={styles.noticeDescription}>
                      This event has been cancelled and is no longer active.
                    </Text>
                  </Surface>
                </Card.Content>
              </Card>
            )}

            {isNotDealt && !event.cancelled && (
              <Card style={[styles.noticeCard, styles.notDealtNotice]} mode="outlined">
                <Card.Content style={styles.noticeContent}>
                  <IconButton icon="clock-alert" iconColor="#999999" size={20} />
                  <Surface style={styles.noticeText} elevation={0}>
                    <Text variant="titleSmall" style={styles.noticeTitle}>
                      Event Not Dealt
                    </Text>
                    <Text variant="bodyMedium" style={styles.noticeDescription}>
                      This event date has passed and was not processed.
                    </Text>
                  </Surface>
                </Card.Content>
              </Card>
            )}

            {/* Event Details */}
            <Surface style={styles.detailsContainer} elevation={0}>
              <Surface style={styles.detailRow} elevation={0}>
                <Surface style={styles.detailItem} elevation={0}>
                  <IconButton icon="calendar" size={20} iconColor="#666666" />
                  <Surface style={styles.detailContent} elevation={0}>
                    <Text variant="labelMedium" style={styles.detailLabel}>Date</Text>
                    <Text variant="bodyMedium" style={styles.detailText}>{event?.eventDate
  ? formatDate(event.eventDate)
  : "No date available"}
</Text>
                  </Surface>
                </Surface>

                <Surface style={styles.detailItem} elevation={0}>
                  <IconButton icon="clock" size={20} iconColor="#666666" />
                  <Surface style={styles.detailContent} elevation={0}>
                    <Text variant="labelMedium" style={styles.detailLabel}>Time</Text>
                    <Text variant="bodyMedium" style={styles.detailText}>{event?.eventTime?? 'Not Set'}</Text>
                  </Surface>
                </Surface>
              </Surface>

              <Surface style={styles.detailRow} elevation={0}>
                <Surface style={styles.detailItem} elevation={0}>
                  <IconButton icon="map-marker" size={20} iconColor="#666666" />
                  <Surface style={styles.detailContent} elevation={0}>
                    <Text variant="labelMedium" style={styles.detailLabel}>Location</Text>
                    <Text variant="bodyMedium" style={styles.detailText}>{event?.location?? 'Not Set'}</Text>
                  </Surface>
                </Surface>

                <Surface style={styles.detailItem} elevation={0}>
                  <IconButton icon="tag" size={20} iconColor="#666666" />
                  <Surface style={styles.detailContent} elevation={0}>
                    <Text variant="labelMedium" style={styles.detailLabel}>Category</Text>
                    <Text variant="bodyMedium" style={styles.detailText}>
                      {event.category ? event.category.charAt(0).toUpperCase() + event.category.slice(1) : 'N/A'}
                    </Text>
                  </Surface>
                </Surface>
              </Surface>
            </Surface>

            {/* Description */}
            <Surface style={styles.descriptionContainer} elevation={0}>
              <Text variant="titleLarge" style={styles.descriptionTitle}>Description</Text>
              <Card style={styles.descriptionCard} mode="outlined">
                <Card.Content>
                  <Text variant="bodyMedium" style={styles.descriptionText}>{event?.description ?? 'No description'}</Text>
                </Card.Content>
              </Card>
            </Surface>

            {/* Guest List */}
            <Surface style={styles.guestsContainer} elevation={0}>
              <Text variant="titleLarge" style={styles.guestsTitle}>
                Guest List ({event?.totalGuests || 0} guests)
              </Text>
              {guests.length > 0 ? (
                <>
                  <Card style={styles.guestsCard} mode="outlined">
                    <Card.Content style={styles.guestsTable}>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={true}
                        style={needsHorizontalScroll ? styles.horizontalScroll : null}
                      >
                        <Surface style={[styles.tableContainer, { width: tableWidth }]} elevation={0}>
                          {renderTableHeader()}
                          <FlatList
                            data={currentGuests}
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={renderGuestItem}
                            scrollEnabled={false}
                          />
                        </Surface>
                      </ScrollView>
                    </Card.Content>
                  </Card>
                  
                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <Card style={styles.paginationCard} mode="outlined">
                      <Card.Content>
                        <Text variant="bodyMedium" style={styles.paginationInfo}>
                          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, guests.length)} of {guests.length} Records
                        </Text>
                        <Surface style={styles.paginationControls} elevation={0}>
                          <Button
                            mode="outlined"
                            onPress={goToPreviousPage}
                            disabled={currentPage === 1}
                            icon="chevron-left"
                            textColor="#333333"
                          >
                            Previous
                          </Button>
                          
                          {pageNumbers.map((page) => (
                            <Button
                              key={page}
                              mode={currentPage === page ? "contained" : "outlined"}
                              onPress={() => paginate(page)}
                              style={styles.paginationButton}
                              textColor={currentPage === page ? "#ffffff" : "#333333"}
                            >
                              {page}
                            </Button>
                          ))}
                          
                          <Button
                            mode="outlined"
                            onPress={goToNextPage}
                            disabled={currentPage === totalPages}
                            icon="chevron-right"
                            contentStyle={styles.nextButtonContent}
                            textColor="#333333"
                          >
                            Next
                          </Button>
                        </Surface>
                      </Card.Content>
                    </Card>
                  )}
                </>
              ) : (
                <Card style={styles.noGuestsCard} mode="outlined">
                  <Card.Content style={styles.noGuestsContent}>
                    <IconButton icon="account-group" size={40} iconColor="#CCCCCC" />
                    <Text variant="bodyLarge" style={styles.noGuestsText}>No guests added yet.</Text>
                  </Card.Content>
                </Card>
              )}
            </Surface>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
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
    marginTop: 12,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  errorTitle: {
    color: '#000000',
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    flexWrap: 'wrap',
    backgroundColor: '#ffffff',
  },
  backButton: {
    marginBottom: 12,
    borderColor: '#e0e0e0',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-end',
    flex: 1,
    backgroundColor: 'transparent',
  },
  actionButton: {
    borderRadius: 8,
    minWidth: 100,
  },
  actionButtonContent: {
    paddingVertical: 4,
    flexDirection: 'row-reverse',
  },
  scannerButton: {
    backgroundColor: '#333333',
  },
  reportButton: {
    backgroundColor: '#555555',
  },
  cancelButton: {
    backgroundColor: '#777777',
  },
  completeButton: {
    backgroundColor: '#999999',
  },
  editButton: {
    backgroundColor: '#333333',
  },
  deleteButton: {
    backgroundColor: '#000000',
  },
  card: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    flexWrap: 'wrap',
    backgroundColor: 'transparent',
  },
  eventTitle: {
    flex: 1,
    marginRight: 12,
    fontWeight: 'bold',
    color: '#000000',
    fontSize: 28,
  },
  // Chip styles
  upcomingChip: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  upcomingChipText: {
    color: '#666666',
  },
  completedChip: {
    backgroundColor: '#f9f9f9',
    borderColor: '#e0e0e0',
  },
  completedChipText: {
    color: '#666666',
  },
  cancelledChip: {
    backgroundColor: '#f9f9f9',
    borderColor: '#e0e0e0',
  },
  cancelledChipText: {
    color: '#666666',
  },
  notDealtChip: {
    backgroundColor: '#f9f9f9',
    borderColor: '#e0e0e0',
  },
  notDealtChipText: {
    color: '#666666',
  },
  statusChip: {
    height: 32,
  },
  packageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  packageLabel: {
    color: '#000000',
    marginRight: 8,
  },
  packageChip: {
    backgroundColor: '#f5f5f5',
  },
  packageChipText: {
    color: '#666666',
  },
  noticeCard: {
    marginBottom: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  cancelledNotice: {
    borderLeftColor: '#999999',
  },
  notDealtNotice: {
    borderLeftColor: '#999999',
  },
  noticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeText: {
    marginLeft: 12,
    flex: 1,
    backgroundColor: 'transparent',
  },
  noticeTitle: {
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  noticeDescription: {
    color: '#666666',
  },
  detailsContainer: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 16,
    backgroundColor: 'transparent',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'transparent',
  },
  detailContent: {
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  detailLabel: {
    color: '#000000',
    marginBottom: 4,
  },
  detailText: {
    color: '#666666',
  },
  descriptionContainer: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  descriptionTitle: {
    color: '#000000',
    marginBottom: 12,
  },
  descriptionCard: {
    borderRadius: 12,
    borderColor: '#f0f0f0',
  },
  descriptionText: {
    color: '#666666',
    lineHeight: 22,
  },
  guestsContainer: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  guestsTitle: {
    color: '#000000',
    marginBottom: 16,
  },
  guestsCard: {
    marginBottom: 16,
    borderRadius: 12,
    borderColor: '#f0f0f0',
  },
  guestsTable: {
    padding: 0,
  },
  horizontalScroll: {
    minHeight: 200,
  },
  tableContainer: {
    flexDirection: 'column',
    backgroundColor: 'transparent',
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 16,
    backgroundColor: '#f9f9f9',
  },
  headerCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  headerCellText: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000000',
  },
  guestRow: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'transparent',
  },
  guestCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    backgroundColor: 'transparent',
  },
  guestCellText: {
    color: '#666666',
    textAlign: 'center',
  },
  // RSVP Chip Styles
  rsvpChip: {
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptedChip: {
    backgroundColor: '#d1fae5',
    borderColor: '#10b981',
  },
  declinedChip: {
    backgroundColor: '#fee2e2',
    borderColor: '#ef4444',
  },
  pendingChip: {
    backgroundColor: '#fef3c7',
    borderColor: '#f59e0b',
  },
  rsvpChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Channel Status Styles
  channelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  channelIcon: {
    margin: 0,
    padding: 0,
    width: 24,
    height: 24,
  },
  notSentText: {
    fontSize: 12,
    color: '#dc2626',
    marginLeft: 4,
    fontWeight: '500',
  },
  whatsappText: {
    fontSize: 12,
    color: '#25d366',
    marginLeft: 4,
    fontWeight: '500',
  },
  smsText: {
    fontSize: 12,
    color: '#3b82f6',
    marginLeft: 4,
    fontWeight: '500',
  },
  // Call Status Styles
  callStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginLeft:50,
    backgroundColor: 'transparent',
  },
  callStatusButton: {
    margin: 0,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  reachableButton: {
    borderColor: '#333333',
  },
  reachableButtonActive: {
    backgroundColor: '#333333',
  },
  notReachableButton: {
    borderColor: '#666666',
  },
  notReachableButtonActive: {
    backgroundColor: '#666666',
  },
  callStatusButtonText: {
    fontSize: 12,
    color: '#666666',
  },
  callStatusButtonTextActive: {
    color: '#ffffff',
    fontSize: 12,
  },
  callStatusLoading: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  noGuestsCard: {
    marginTop: 8,
    borderRadius: 12,
    borderColor: '#f0f0f0',
  },
  noGuestsContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noGuestsText: {
    color: '#666666',
    marginTop: 12,
  },
  paginationCard: {
    marginTop: 16,
    borderRadius: 12,
    borderColor: '#f0f0f0',
  },
  paginationInfo: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#666666',
  },
  paginationControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
    backgroundColor: 'transparent',
  },
  paginationButton: {
    minWidth: 40,
    borderRadius: 6,
  },
  nextButtonContent: {
    flexDirection: 'row',
  },
  // Dialog Styles
  dialog: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  dialogTitle: {
    color: '#000000',
    fontWeight: '600',
  },
  dialogText: {
    color: '#666666',
    lineHeight: 22,
  },
  cancelEventButton: {
    backgroundColor: '#777777',
  },
  completeEventButton: {
    backgroundColor: '#999999',
  },
  deleteDialogButton: {
    backgroundColor: '#000000',
  },
  // Modal Styles
  modalContainer: {
    margin: 20,
    maxHeight: '80%',
  },
  modalCard: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    color: '#000000',
    fontWeight: '600',
  },
  modalBody: {
    maxHeight: 400,
  },
  loadingPermissions: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingPermissionsText: {
    color: '#666666',
    marginTop: 12,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 8,
    color: '#000000',
    fontWeight: '600',
  },
  modalDivider: {
    marginVertical: 20,
    backgroundColor: '#f0f0f0',
  },
  scannerCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderColor: '#f0f0f0',
  },
  scannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scannerInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scannerName: {
    color: '#000000',
    marginBottom: 4,
  },
  scannerEmail: {
    color: '#666666',
  },
  addButton: {
    backgroundColor: '#333333',
    borderRadius: 8,
  },
  removeButton: {
    borderColor: '#e0e0e0',
    borderRadius: 8,
  },
  noScannersText: {
    textAlign: 'center',
    color: '#666666',
    fontStyle: 'italic',
    padding: 20,
  },
});

export default EventDetails;
