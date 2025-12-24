import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  FlatList,
  Dimensions,
  ToastAndroid
} from 'react-native';
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
      const errormessage = error.response?.data?.message || 'Failed to fetch event details';
      Toast.show({
        type: 'error',
        text1: errormessage
      });
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

      Toast.show({
        type: 'success',
        text1: response.data.message
      });
    } catch (error) {
      const errormessage = error.response?.data?.message || 'Failed to update call status';
      Toast.show({
        type: 'error',
        text1: errormessage
      });
    } finally {
      setUpdatingCallStatus(null);
    }
  };

  const getPackageColumns = () => {
    const packageName = event?.packagename || 'Basic';
    const baseColumns = [
      { key: 'serial', label: 'S/N', width: 60 },
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
          { key: 'smsSent', label: 'SMS Sent', width: 90 }
        ];
      
      case 'standard':
        return [
          ...baseColumns,
          { key: 'rsvpStatus', label: 'RSVP Status', width: 100 },
          { key: 'smsSent', label: 'SMS Sent', width: 90 },
          { key: 'callStatus', label: 'Call Status', width: 150 }
        ];
      
      case 'pro':
        return [
          ...baseColumns,
          { key: 'rsvpStatus', label: 'RSVP Status', width: 100 },
          { key: 'smsSent', label: 'SMS Sent', width: 90 },
          { key: 'callStatus', label: 'Call Status', width: 150 },
          { key: 'reminderSent', label: 'Reminder Sent', width: 120 }
        ];
      
      case 'elite':
        return [
          ...baseColumns,
          { key: 'rsvpStatus', label: 'RSVP Status', width: 100 },
          { key: 'smsSent', label: 'SMS Sent', width: 90 },
          { key: 'callStatus', label: 'Call Status', width: 150 },
          { key: 'reminder1Sent', label: 'Reminder1 Sent', width: 130 },
          { key: 'reminder2Sent', label: 'Reminder2 Sent', width: 130 }
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
      Toast.show({
        type: 'error',
        text1: 'Failed to load scanner permissions'
      });
    } finally {
      setLoadingPermissions(false);
    }
  };

  const addScanner = async (tenantId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await api.post(
        `${config.BASE_URL}/api/events/${eventId}/scan-permissions`, 
        { tenant_id: tenantId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      await fetchScanPermissions();
      Toast.show({
        type: 'success',
        text1: 'Tenant added as scanner successfully!'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to add tenant as scanner'
      });
    }
  };

  const removeScanner = async (scannerId) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      await api.delete(`${config.BASE_URL}/api/events/${eventId}/scan-permissions/${scannerId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      await fetchScanPermissions();
      Toast.show({
        type: 'success',
        text1: 'Scan permission removed successfully!'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to remove scan permission'
      });
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
        text1: responsemessage
      });
      }
      setEvent({ ...event, active: false, cancelled: true });
      
    } catch (error) {
      const errormessage = error.response?.data?.message || 'Failed to cancel event';
      if(Platform.OS==='android'){
        ToastAndroid.show(errormessage,ToastAndroid.SHORT);
        
      }else{
         Toast.show({
        type: 'error',
        text1: errormessage
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
      const errormessage = error.response?.data?.message || 'Failed to delete event';
      if(Platform.OS==='android'){
        ToastAndroid.show(errormessage,ToastAndroid.SHORT);
      }
      else{
 Toast.show({
        type: 'error',
        text1: errormessage
      });
      }
     
    } finally {
      setDeleteDialogVisible(false);
    }
  };

  const handleMarkAsCompleted = async () => {
    setUpdating(true);
    try {
     // await AsyncStorage.removeItem("authToken");
      const token = await AsyncStorage.getItem('authToken');
     // const testingtoken='Invalid Token';
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
        text1: responsemessage
      });
      }
      
    } catch (error) {
      const errormessage = error.response?.data?.message || 'Failed to mark event as completed';
      if(Platform.OS==='android'){
        ToastAndroid.show(errormessage,ToastAndroid.SHORT);
      }
      else{
Toast.show({
        type: 'error',
        text1: errormessage
      });
      }
      
    } finally {
      setUpdating(false);
      setCompleteDialogVisible(false);
    }
  };

  const viewReport = () => {
    navigation.navigate('Reports', { 
      id: eventId,
    });
  };

  const manageScanners = () => {
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
          <ActivityIndicator size="small" />
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
    const columns = getPackageColumns();
    
    return (
      <Surface style={styles.guestRow} elevation={0}>
        {columns.map((column) => (
          <Surface key={column.key} style={[styles.guestCell, { width: column.width }]} elevation={0}>
            {renderGuestCell(item, column.key, index)}
          </Surface>
        ))}
      </Surface>
    );
  };

  const renderGuestCell = (item, key, index) => {
    switch (key) {
      case 'serial':
        return <Text variant="bodySmall">{(currentPage - 1) * itemsPerPage + index + 1}</Text>;
      
      case 'firstName':
        return <Text variant="bodySmall">{item.firstName || 'N/A'}</Text>;
      
      case 'lastName':
        return <Text variant="bodySmall">{item.lastName || 'N/A'}</Text>;
      
      case 'phone':
        return <Text variant="bodySmall">{item.phone || 'N/A'}</Text>;
      
      case 'type':
        return (
          <Text variant="bodySmall">
            {item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : 'N/A'}
          </Text>
        );
      
      case 'status':
        return (
          <Chip
            mode="outlined"
            compact
            style={[
              styles.statusChip,
              item.status === 'Confirmed' ? styles.confirmedChip : styles.pendingChip
            ]}
            textStyle={item.status === 'Confirmed' ? styles.confirmedChipText : styles.pendingChipText}
          >
            {item.status || 'Pending'}
          </Chip>
        );
      
      case 'rsvpStatus':
        return <Text variant="bodySmall">{item.rsvpStatus || 'Pending'}</Text>;
      
      case 'smsSent':
        return <Text variant="bodySmall">{item.smsSent ? 'Yes' : 'No'}</Text>;
      
      case 'callStatus':
        return renderCallStatusButtons(item);
      
      case 'reminderSent':
        return <Text variant="bodySmall">{item.Remainder1Sent ? 'Yes' : 'No'}</Text>;
      
      case 'reminder1Sent':
        return <Text variant="bodySmall">{item.Remainder1Sent ? 'Yes' : 'No'}</Text>;
      
      case 'reminder2Sent':
        return <Text variant="bodySmall">{item.Remainder2Sent ? 'Yes' : 'No'}</Text>;
      
      default:
        return <Text variant="bodySmall">N/A</Text>;
    }
  };

  const renderTableHeader = () => {
    const columns = getPackageColumns();
    
    return (
      <Surface style={styles.tableHeader} elevation={1}>
        {columns.map((column) => (
          <Surface key={column.key} style={[styles.headerCell, { width: column.width }]} elevation={0}>
            <Text variant="labelSmall" style={styles.headerCellText}>
              {column.label}
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
      <Surface style={styles.loadingContainer} elevation={0}>
        <ActivityIndicator size="small" />
        <Text variant="bodyLarge" style={styles.loadingText}>
          Loading event details...
        </Text>
      </Surface>
    );
  }

  if (!event) {
    return (
      <Surface style={styles.errorContainer} elevation={0}>
        <Text variant="headlineMedium">Event Not Found</Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Back to Events
        </Button>
      </Surface>
    );
  }

  const isNotDealt = isEventNotDealt();
  const showAllButtons = event.active && !event.cancelled && !isNotDealt;
  const showOnlyDelete = event.cancelled || isNotDealt;
  const showLimitedButtons = !event.active && !event.cancelled && !isNotDealt;

  const pageNumbers = getPageNumbers();
  const tableWidth = getTableWidth();
  const needsHorizontalScroll = tableWidth > screenWidth - 32;

  // Fixed: Use proper color values instead of theme names
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
        backgroundColor="#f8f9fa"
        translucent={false}
      />
      
      {/* Dialogs */}
      <Portal>
        {/* Cancel Event Dialog */}
        <Dialog visible={cancelDialogVisible} onDismiss={() => setCancelDialogVisible(false)}>
          <Dialog.Title>Cancel Event</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to cancel this event? This action cannot be undone.
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCancelDialogVisible(false)}>Cancel</Button>
            <Button 
              onPress={handleCancelEvent}
              mode="contained"
              loading={updating}
            >
              Cancel Event
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Complete Event Dialog */}
        <Dialog visible={completeDialogVisible} onDismiss={() => setCompleteDialogVisible(false)}>
          <Dialog.Title>Mark as Completed</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to mark this event as completed?
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCompleteDialogVisible(false)}>Cancel</Button>
            <Button 
              onPress={handleMarkAsCompleted}
              mode="contained"
              loading={updating}
            >
              Mark Complete
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete Event Dialog */}
        <Dialog visible={deleteDialogVisible} onDismiss={() => setDeleteDialogVisible(false)}>
          <Dialog.Title>Delete Event</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to delete this event?
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>Cancel</Button>
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
          <Card>
            <Card.Title
              title="Manage Scan Permissions"
              titleVariant="titleLarge"
              right={(props) => (
                <IconButton
                  {...props}
                  icon="close"
                  onPress={() => setPermissionModalVisible(false)}
                />
              )}
            />
            <Card.Content>
              {loadingPermissions ? (
                <Surface style={styles.loadingPermissions} elevation={0}>
                  <ActivityIndicator size="small" />
                  <Text variant="bodyMedium">Loading permissions...</Text>
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
                            <Text variant="bodyLarge">
                              {scanner.tenant?.firstName} {scanner.tenant?.lastName}
                            </Text>
                            <Text variant="bodyMedium" style={styles.scannerEmail}>
                              {scanner.tenant?.email}
                            </Text>
                          </Surface>
                          <Button
                            mode="outlined"
                            onPress={() => removeScanner(scanner.id)}
                            style={styles.removeButton}
                            textColor="#DC2626"
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
                            <Text variant="bodyLarge">
                              {tenant.firstName} {tenant.lastName}
                            </Text>
                            <Text variant="bodyMedium" style={styles.scannerEmail}>
                              {tenant.email}
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
        <Surface style={styles.header} elevation={1}>
          <Button
            mode="outlined"
            icon="arrow-left"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
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
              <Text variant="labelLarge">Package:</Text>
              <Chip mode="flat" style={styles.packageChip}>
                {event.packagename || 'Basic'}
              </Chip>
            </Surface>

            {/* Event Status Notices */}
            {event.cancelled && (
              <Card style={styles.noticeCard} mode="outlined">
                <Card.Content style={styles.noticeContent}>
                  <IconButton icon="alert-circle" iconColor="#DC2626" size={20} />
                  <Surface style={styles.noticeText} elevation={0}>
                    <Text variant="titleSmall" style={styles.noticeTitle}>
                      Event Cancelled
                    </Text>
                    <Text variant="bodyMedium">
                      This event has been cancelled and is no longer active.
                    </Text>
                  </Surface>
                </Card.Content>
              </Card>
            )}

            {isNotDealt && !event.cancelled && (
              <Card style={styles.noticeCard} mode="outlined">
                <Card.Content style={styles.noticeContent}>
                  <IconButton icon="clock-alert" iconColor="#8B5CF6" size={20} />
                  <Surface style={styles.noticeText} elevation={0}>
                    <Text variant="titleSmall" style={styles.noticeTitle}>
                      Event Not Dealt
                    </Text>
                    <Text variant="bodyMedium">
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
                  <IconButton icon="calendar" size={20} />
                  <Surface style={styles.detailContent} elevation={0}>
                    <Text variant="labelMedium">Date</Text>
                    <Text variant="bodyMedium">{formatDate(event.eventDate)}</Text>
                  </Surface>
                </Surface>

                <Surface style={styles.detailItem} elevation={0}>
                  <IconButton icon="clock" size={20} />
                  <Surface style={styles.detailContent} elevation={0}>
                    <Text variant="labelMedium">Time</Text>
                    <Text variant="bodyMedium">{event.eventTime}</Text>
                  </Surface>
                </Surface>
              </Surface>

              <Surface style={styles.detailRow} elevation={0}>
                <Surface style={styles.detailItem} elevation={0}>
                  <IconButton icon="map-marker" size={20} />
                  <Surface style={styles.detailContent} elevation={0}>
                    <Text variant="labelMedium">Location</Text>
                    <Text variant="bodyMedium">{event.location}</Text>
                  </Surface>
                </Surface>

                <Surface style={styles.detailItem} elevation={0}>
                  <IconButton icon="tag" size={20} />
                  <Surface style={styles.detailContent} elevation={0}>
                    <Text variant="labelMedium">Category</Text>
                    <Text variant="bodyMedium">
                      {event.category ? event.category.charAt(0).toUpperCase() + event.category.slice(1) : 'N/A'}
                    </Text>
                  </Surface>
                </Surface>
              </Surface>
            </Surface>

            {/* Description */}
            <Surface style={styles.descriptionContainer} elevation={0}>
              <Text variant="titleLarge">Description</Text>
              <Card style={styles.descriptionCard} mode="outlined">
                <Card.Content>
                  <Text variant="bodyMedium">{event.description}</Text>
                </Card.Content>
              </Card>
            </Surface>

            {/* Guest List */}
            <Surface style={styles.guestsContainer} elevation={0}>
              <Text variant="titleLarge">
                Guest List ({event.totalGuests} guests)
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
                          >
                            Previous
                          </Button>
                          
                          {pageNumbers.map((page) => (
                            <Button
                              key={page}
                              mode={currentPage === page ? "contained" : "outlined"}
                              onPress={() => paginate(page)}
                              style={styles.paginationButton}
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
                    <IconButton icon="account-group" size={40} />
                    <Text variant="bodyLarge">No guests added yet.</Text>
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    flexWrap: 'wrap',
    padding: 16,
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  backButton: {
    marginBottom: 12,
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
    minWidth: 100,
  },
  actionButtonContent: {
    flexDirection: 'row-reverse',
  },
  scannerButton: {
    backgroundColor: '#EA580C',
  },
  reportButton: {
    backgroundColor: '#10B981',
  },
  cancelButton: {
    backgroundColor: '#EAB308',
  },
  completeButton: {
    backgroundColor: '#8B5CF6',
  },
  editButton: {
    backgroundColor: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  card: {
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    backgroundColor: 'transparent',
  },
  eventTitle: {
    flex: 1,
    marginRight: 12,
    fontWeight: 'bold',
  },
  // Fixed: Proper chip styles with color values
  upcomingChip: {
    backgroundColor: '#D1FAE5',
  },
  upcomingChipText: {
    color: '#065F46',
  },
  completedChip: {
    backgroundColor: '#F3F4F6',
  },
  completedChipText: {
    color: '#374151',
  },
  cancelledChip: {
    backgroundColor: '#FEE2E2',
  },
  cancelledChipText: {
    color: '#DC2626',
  },
  notDealtChip: {
    backgroundColor: '#EDE9FE',
  },
  notDealtChipText: {
    color: '#8B5CF6',
  },
  statusChip: {
    height: 24,
  },
  packageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  packageChip: {
    marginLeft: 8,
    backgroundColor: '#E0F2FE',
  },
  noticeCard: {
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  noticeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeText: {
    marginLeft: 8,
    flex: 1,
    backgroundColor: 'transparent',
  },
  noticeTitle: {
    fontWeight: 'bold',
  },
  detailsContainer: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 16,
    backgroundColor: 'transparent',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'transparent',
  },
  detailContent: {
    marginLeft: 8,
    backgroundColor: 'transparent',
  },
  descriptionContainer: {
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  descriptionCard: {
    marginTop: 8,
  },
  guestsContainer: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  guestsCard: {
    marginBottom: 16,
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
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
  },
  headerCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
  },
  headerCellText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  guestRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'transparent',
  },
  guestCell: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    backgroundColor: 'transparent',
  },
  // Call Status Styles
  callStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'transparent',
  },
  callStatusButton: {
    margin: 0,
    paddingHorizontal: 4,
  },
  reachableButton: {
    borderColor: '#10B981',
  },
  reachableButtonActive: {
    backgroundColor: '#10B981',
  },
  notReachableButton: {
    borderColor: '#EF4444',
  },
  notReachableButtonActive: {
    backgroundColor: '#EF4444',
  },
  callStatusButtonText: {
    fontSize: 12,
  },
  callStatusButtonTextActive: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  callStatusLoading: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  confirmedChip: {
    backgroundColor: '#D1FAE5',
  },
  pendingChip: {
    backgroundColor: '#FEF3C7',
  },
  confirmedChipText: {
    color: '#065F46',
  },
  pendingChipText: {
    color: '#92400E',
  },
  noGuestsCard: {
    marginTop: 8,
  },
  noGuestsContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  paginationCard: {
    marginTop: 16,
  },
  paginationInfo: {
    textAlign: 'center',
    marginBottom: 12,
    color: '#6B7280',
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
  },
  nextButtonContent: {
    flexDirection: 'row',
  },
  // Modal Styles
  modalContainer: {
    margin: 20,
    maxHeight: '80%',
  },
  modalBody: {
    maxHeight: 400,
  },
  loadingPermissions: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 8,
  },
  modalDivider: {
    marginVertical: 16,
  },
  scannerCard: {
    marginBottom: 8,
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
  scannerEmail: {
    color: '#6B7280',
  },
  addButton: {
    backgroundColor: '#D1FAE5',
  },
  removeButton: {
    borderColor: '#FECACA',
  },
  noScannersText: {
    textAlign: 'center',
    color: '#6B7280',
    fontStyle: 'italic',
    padding: 20,
  },
  deleteDialogButton: {
    backgroundColor: '#EF4444',
  },
});

export default EventDetails;