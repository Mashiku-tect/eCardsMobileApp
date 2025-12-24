import React, { useEffect, useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
  Platform,
  ToastAndroid,
  SafeAreaView,
  StatusBar,
 
} from "react-native";
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
  DataTable
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
    } catch (err) {
     // console.error("PDF Download Error:", err);
      Alert.alert("Error", "Failed to download PDF");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={{ marginTop: 16 }}>Loading report...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!report) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Card style={{ width: '100%', alignItems: 'center', padding: 24 }}>
            <IconButton icon="alert-circle-outline" size={64} />
            <Text variant="titleLarge" style={{ marginTop: 16 }}>No Report Available</Text>
            <Text variant="bodyMedium" style={{ textAlign: 'center', marginTop: 8 }}>
              Sorry, we couldn't find a report for this event.
            </Text>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  const StatCard = ({ title, value, icon, color }) => (
    <Card style={{ flex: 1, margin: 4 }}>
      <Card.Content style={{ alignItems: 'center' }}>
        <IconButton icon={icon} iconColor={color} size={24} />
        <Text variant="bodySmall">{title}</Text>
        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginTop: 4 }}>{value}</Text>
      </Card.Content>
    </Card>
  );

  const GuestStatBox = ({ title, value, backgroundColor }) => (
    <Surface style={{ flex: 1, margin: 4, padding: 12, borderRadius: 8, backgroundColor }}>
      <Text variant="labelSmall">{title}</Text>
      <Text variant="bodyLarge" style={{ fontWeight: 'bold', marginTop: 4 }}>{value}</Text>
    </Surface>
  );

  const StatusChip = ({ status, type = 'rsvp' }) => {
    const isAccepted = status === 'Accepted' || status === 'Checked In';
    const color = isAccepted ? '#4caf50' : type === 'rsvp' ? '#f44336' : '#ff9800';
    return <Chip textStyle={{ fontSize: 12 }} style={{ alignSelf: 'flex-start' }}>{status}</Chip>;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Card style={{ margin: 16 }}>
          <Card.Content style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text variant="titleLarge">{report.eventName}</Text>
              <Text variant="bodyMedium" style={{ color: '#666' }}>Event Report</Text>
            </View>
            <Button mode="contained" icon="download" onPress={handleDownloadPDF} compact>
              PDF
            </Button>
          </Card.Content>
        </Card>

        {/* Stats Overview */}
        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 16 }}>
          <StatCard title="Total Invited" value={report.totalInvited} icon="account-group" color="#3f51b5" />
          <StatCard title="Checked In" value={report.totalCheckedIn} icon="check-circle" color="#4caf50" />
        </View>
        <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 16 }}>
          <StatCard title="Attendance Rate" value={`${report.attendanceRate}%`} icon="chart-bar" color="#9c27b0" />
          <StatCard title="Event Date" value={report.date} icon="calendar" color="#ff9800" />
        </View>

        {/* Guest Statistics */}
        <Card style={{ margin: 16 }}>
          <Card.Title title="Guest Statistics" left={(props) => <IconButton {...props} icon="chart-box" />} />
          <Card.Content>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              <GuestStatBox title="Single Invites" value={report.singleInvites} backgroundColor="#e8eaf6" />
              <GuestStatBox title="Double Invites" value={report.doubleInvites} backgroundColor="#e8f5e8" />
              <GuestStatBox title="Single Checked-in" value={report.singleCheckedIn} backgroundColor="#f3e5f5" />
              <GuestStatBox title="Double (Partial)" value={report.doublePartial} backgroundColor="#fff3e0" />
              <GuestStatBox title="Double (Full)" value={report.doubleFull} backgroundColor="#e3f2fd" />
            </View>
          </Card.Content>
        </Card>

        {/* Check-in Timeline */}
        <Card style={{ margin: 16 }}>
          <Card.Title title="Check-in Timeline" left={(props) => <IconButton {...props} icon="timeline-clock" />} />
          <Card.Content>
            {report.timeline.map((slot, idx) => (
              <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
                <Text>{slot.time}</Text>
                <Text style={{ fontWeight: 'bold' }}>{slot.count}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Guest List Preview */}
        <Card style={{ margin: 16 }}>
          <Card.Title title="Guest List Preview" left={(props) => <IconButton {...props} icon="format-list-bulleted" />} />
          <Card.Content>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Name</DataTable.Title>
                <DataTable.Title>Type</DataTable.Title>
                <DataTable.Title>RSVP</DataTable.Title>
                <DataTable.Title>Status</DataTable.Title>
              </DataTable.Header>
              {report.guestList.slice(0, 5).map((guest, idx) => (
                <DataTable.Row key={idx}>
                  <DataTable.Cell>{guest.name}</DataTable.Cell>
                  <DataTable.Cell><StatusChip status={guest.type} /></DataTable.Cell>
                  <DataTable.Cell><StatusChip status={guest.rsvp} type="rsvp" /></DataTable.Cell>
                  <DataTable.Cell><StatusChip status={guest.status} type="status" /></DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
            {report.guestList.length > 5 && (
              <Text variant="bodySmall" style={{ textAlign: 'center', marginTop: 12, color: '#666' }}>
                Showing first 5 guests. Download PDF for complete list.
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Progress Bar for Attendance */}
        <Card style={{ margin: 16 }}>
          <Card.Content>
            <Text variant="titleSmall" style={{ marginBottom: 8 }}>Attendance Progress</Text>
            <ProgressBar progress={report.attendanceRate / 100} color="#4caf50" />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Text variant="bodySmall">0%</Text>
              <Text variant="bodySmall">{report.attendanceRate}%</Text>
              <Text variant="bodySmall">100%</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default EventReport;