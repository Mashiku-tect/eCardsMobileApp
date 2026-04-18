import React, { useEffect, useState } from "react";
import {
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Platform,
  ToastAndroid,
  StatusBar,
  StyleSheet
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from "@react-navigation/native";
import axios from "axios";
import {
  Text,
  Card,
  Button,
  IconButton,
  Badge,
  Divider,
  Surface,
  Chip,
  ProgressBar,
  DataTable,
  HelperText
} from "react-native-paper";

import config from './config';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const EventReport = ({ navigation }) => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const route = useRoute();
  const { id } = route.params;

  const fetchReport = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const res = await api.get(`${config.BASE_URL}/api/events/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReport(res.data);
    } catch (error) {
      const errorMessage = error.response?.data.message;
      if (error.response?.status === 403) {
        Platform.OS === 'android'
          ? ToastAndroid.showWithGravity(errorMessage, ToastAndroid.LONG, ToastAndroid.CENTER)
          : Toast.show({ type: 'error', text1: errorMessage });
        navigation.goBack();
      } else {
        Platform.OS === 'android'
          ? ToastAndroid.showWithGravity(errorMessage, ToastAndroid.LONG, ToastAndroid.CENTER)
          : Toast.show({ type: 'error', text1: errorMessage });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchReport(); }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReport();
  };

  const handleDownloadPDF = async () => {
    try {
      Alert.alert("Download", "Preparing your PDF report...");
      if (Platform.OS === 'web') {
        const res = await api.get(
          `${config.BASE_URL}/api/events/report/pdf/${id}`,
          { responseType: "blob" }
        );
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `event-report-${report.eventName}.pdf`);
        document.body.appendChild(link);
        link.click();
      } else {
        Linking.openURL(`${config.BASE_URL}/api/events/report/pdf/${id}`);
      }
    } catch (error) {
     // Alert.alert("Error", "Failed to download PDF");
      let errorMessage = 'Failed to download PDF. Please try again.';

  if (error.response) {


    errorMessage =error.response?.data?.message || 'Failed to download PDF. Please try again.';
    

    

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

  const StatCard = ({ title, value, icon }) => (
    <Card style={styles.statCard} mode="contained">
      <Card.Content style={styles.statCardContent}>
        <Surface style={styles.statIconContainer} elevation={0}>
          <IconButton 
            icon={icon} 
            iconColor="#333333" 
            size={24} 
            style={styles.statIcon}
          />
        </Surface>
        <Text variant="bodyMedium" style={styles.statTitle}>{title}</Text>
        <Text variant="titleMedium" style={styles.statValue}>{value}</Text>
      </Card.Content>
    </Card>
  );

  const GuestStatBox = ({ title, value }) => (
    <Surface style={styles.guestStatBox} elevation={1}>
      <Text variant="labelSmall" style={styles.guestStatTitle}>{title}</Text>
      <Text variant="bodyLarge" style={styles.guestStatValue}>{value}</Text>
    </Surface>
  );

  const StatusChip = ({ status, type = 'rsvp' }) => {
    const isAccepted = status === 'Accepted' || status === 'Checked In';
    const chipStyle = isAccepted ? styles.chipAccepted : 
                     type === 'rsvp' ? styles.chipDeclined : styles.chipPending;
    
    return (
      <Chip 
        mode="outlined" 
        style={[styles.statusChip, chipStyle]}
        textStyle={styles.chipText}
        compact
      >
        {status}
      </Chip>
    );
  };

  if (loading) {
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
            Loading report...
          </Text>
        </Surface>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#ffffff"
          translucent={false}
        />
        <Surface style={styles.errorContainer} elevation={0}>
          <Card style={styles.formContainer} mode="contained">
            <Card.Content style={styles.cardContent}>
              <Surface style={styles.errorIconContainer} elevation={0}>
                <IconButton 
                  icon="alert-circle-outline" 
                  size={64} 
                  iconColor="#666666"
                  style={styles.errorIcon}
                />
              </Surface>
              <Text variant="headlineSmall" style={styles.errorTitle}>
                No Report Available
              </Text>
              <Text variant="bodyMedium" style={styles.errorMessage}>
                Sorry, we couldn't find a report for this event.
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.goBack()}
                style={styles.primaryButton}
                icon="arrow-left"
                contentStyle={styles.buttonContent}
              >
                Back to Events
              </Button>
            </Card.Content>
          </Card>
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
      
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <Surface style={styles.header} elevation={0}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Text variant="headlineSmall" style={styles.title}>
            Event Report
          </Text>
        </Surface>

        {/* Event Info Card */}
        <Card style={styles.formContainer} mode="contained">
          <Card.Content style={styles.cardContent}>
            <Surface style={styles.eventHeader} elevation={0}>
              <Surface style={styles.eventInfo} elevation={0}>
                <Text variant="titleLarge" style={styles.eventName}>
                  {report?.eventName?? 'Uknown Event'}
                </Text>
                <Text variant="bodyMedium" style={styles.eventDate}>
                  {report?.date?? 'Event Date Not Set'}
                </Text>
              </Surface>
              <Button 
                mode="contained" 
                icon="download" 
                onPress={handleDownloadPDF} 
                style={styles.pdfButton}
                contentStyle={styles.buttonContent}
              >
                Download PDF
              </Button>
            </Surface>
          </Card.Content>
        </Card>

        {/* Stats Overview */}
        <Surface style={styles.statsContainer} elevation={0}>
          <Surface style={styles.statsRow} elevation={0}>
            <StatCard 
              title="Total Invited" 
              value={report?.totalInvited || 0} 
              icon="account-group"
            />
            <StatCard 
              title="Checked In" 
              value={report?.totalCheckedIn || 0} 
              icon="check-circle"
            />
          </Surface>
          <Surface style={styles.statsRow} elevation={0}>
            <StatCard 
              title="Attendance Rate" 
              value={`${report?.attendanceRate || 0}%`} 
              icon="chart-bar"
            />
            <StatCard 
              title="Event Date" 
              value={report?.date?? 'Not Set'} 
              icon="calendar"
            />
          </Surface>
        </Surface>

        {/* Guest Statistics */}
        <Card style={styles.formContainer} mode="contained">
          <Card.Content style={styles.cardContent}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Guest Statistics
            </Text>
            <Text variant="bodyMedium" style={styles.sectionSubtitle}>
              Detailed breakdown of guest invitations and check-ins
            </Text>
            
            <Surface style={styles.guestStatsGrid} elevation={0}>
              <GuestStatBox 
                title="Single Invites" 
                value={report?.singleInvites || 0}
              />
              <GuestStatBox 
                title="Double Invites" 
                value={report?.doubleInvites || 0}
              />
              <GuestStatBox 
                title="Single Checked-in" 
                value={report?.singleCheckedIn || 0}
              />
              <GuestStatBox 
                title="Double (Partial)" 
                value={report?.doublePartial || 0}
              />
              <GuestStatBox 
                title="Double (Full)" 
                value={report?.doubleFull || 0}
              />
            </Surface>
          </Card.Content>
        </Card>

        {/* Check-in Timeline */}
        <Card style={styles.formContainer} mode="contained">
          <Card.Content style={styles.cardContent}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Check-in Timeline
            </Text>
            <Text variant="bodyMedium" style={styles.sectionSubtitle}>
              Distribution of check-ins throughout the event
            </Text>
            
           <Surface style={styles.timelineContainer} elevation={0}>
  {(report?.timeline ?? []).map((slot, idx) => (
    <Surface key={idx} style={styles.timelineRow} elevation={0}>
      <Text variant="bodyMedium" style={styles.timelineTime}>
        {slot?.time ?? "-"}
      </Text>
      <Text variant="bodyMedium" style={styles.timelineCount}>
        {slot?.count ?? 0}
      </Text>
    </Surface>
  ))}
</Surface>

          </Card.Content>
        </Card>

        {/* Guest List Preview */}
        <Card style={styles.formContainer} mode="contained">
          <Card.Content style={styles.cardContent}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Guest List Preview
            </Text>
            <Text variant="bodyMedium" style={styles.sectionSubtitle}>
              Showing first 5 guests from the list
            </Text>
            
            <DataTable style={styles.dataTable}>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title textStyle={styles.tableHeaderText}>Name</DataTable.Title>
                <DataTable.Title textStyle={styles.tableHeaderText}>Type</DataTable.Title>
                <DataTable.Title textStyle={styles.tableHeaderText}>RSVP</DataTable.Title>
                <DataTable.Title textStyle={styles.tableHeaderText}>Status</DataTable.Title>
              </DataTable.Header>
              {report.guestList.slice(0, 5).map((guest, idx) => (
                <DataTable.Row key={idx} style={styles.tableRow}>
                  <DataTable.Cell textStyle={styles.tableCell}>{guest?.name ?? 'Guest'}</DataTable.Cell>
                  <DataTable.Cell>
                    <StatusChip status={guest?.type ?? 'Single'} />
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <StatusChip status={guest?.rsvp?? 'Pending'} type="rsvp" />
                  </DataTable.Cell>
                  <DataTable.Cell>
                    <StatusChip status={guest?.status?? 'Uknown'} type="status" />
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
            
            {report.guestList.length > 5 && (
              <HelperText type="info" style={styles.guestListInfo}>
                Showing first 5 guests. Download PDF for complete list of {report?.guestList?.length || 0} guests.
              </HelperText>
            )}
          </Card.Content>
        </Card>

        {/* Attendance Progress */}
        <Card style={styles.formContainer} mode="contained">
          <Card.Content style={styles.cardContent}>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Attendance Progress
            </Text>
            <Text variant="bodyMedium" style={styles.sectionSubtitle}>
              Current attendance rate: {report?.attendanceRate?? 0}%
            </Text>
            
           <ProgressBar
  progress={
    Math.min(
      Math.max((report?.attendanceRate ?? 0) / 100, 0),
      1
    )
  }
  style={styles.progressBar}
  color="#333333"
/>

            
            <Surface style={styles.progressLabels} elevation={0}>
              <Text variant="bodySmall" style={styles.progressLabel}>0%</Text>
              <Text variant="bodySmall" style={styles.progressLabel}>
                {report?.attendanceRate?? 0}%
              </Text>
              <Text variant="bodySmall" style={styles.progressLabel}>100%</Text>
            </Surface>
          </Card.Content>
        </Card>
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
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  errorIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  errorIcon: {
    backgroundColor: '#f5f5f5',
    width: 100,
    height: 100,
  },
  errorTitle: {
    color: '#333333',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  errorMessage: {
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
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
  formContainer: {
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
    marginBottom: 20,
  },
  cardContent: {
    paddingVertical: 20,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: 'transparent',
  },
  eventInfo: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  eventName: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333333',
  },
  eventDate: {
    color: '#666666',
  },
  pdfButton: {
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  primaryButton: {
    borderRadius: 12,
    marginTop: 20,
    elevation: 2,
    backgroundColor: '#000000',
  },
  statsContainer: {
    marginBottom: 20,
    gap: 12,
    backgroundColor: 'transparent',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
  },
  statCardContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statIconContainer: {
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  statIcon: {
    backgroundColor: '#f5f5f5',
  },
  statTitle: {
    color: '#666666',
    textAlign: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    marginTop: 4,
    color: '#333333',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
  },
  sectionSubtitle: {
    color: '#666666',
    marginBottom: 20,
    lineHeight: 20,
  },
  guestStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    backgroundColor: 'transparent',
  },
  guestStatBox: {
    flex: 1,
    minWidth: '30%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  guestStatTitle: {
    color: '#666666',
  },
  guestStatValue: {
    fontWeight: 'bold',
    marginTop: 4,
    color: '#333333',
  },
  timelineContainer: {
    backgroundColor: 'transparent',
  },
  timelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: 'transparent',
  },
  timelineTime: {
    color: '#333333',
  },
  timelineCount: {
    fontWeight: 'bold',
    color: '#333333',
  },
  dataTable: {
    marginTop: 8,
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
  },
  tableHeaderText: {
    color: '#333333',
    fontWeight: 'bold',
  },
  tableRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableCell: {
    color: '#333333',
  },
  statusChip: {
    alignSelf: 'flex-start',
    height: 30,
    borderWidth: 0,
    backgroundColor: '#f5f5f5',
  },
  chipAccepted: {
    // Keeping for future color variations if needed
  },
  chipDeclined: {
    // Keeping for future color variations if needed
  },
  chipPending: {
    // Keeping for future color variations if needed
  },
  chipText: {
    fontSize: 12,
    color: '#333333',
  },
  guestListInfo: {
    marginTop: 12,
    textAlign: 'center',
    color: '#666666',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f5f5f5',
    marginVertical: 12,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  progressLabel: {
    color: '#666666',
  },
});

export default EventReport;