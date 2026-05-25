import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, Linking, ActivityIndicator, Platform, ToastAndroid, StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import Toast from 'react-native-toast-message';
import api from '../utils/api';

const ScannerScreen = ({ route, navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [eventId, setEventId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [eventname, setEventName] = useState(null);

  // Get event ID from navigation params if available
  useEffect(() => {
    if (route.params?.eventId) {
      setEventId(route.params.eventId);
    }

    // Check for authorization to scan events from the server
    const checkAuthorization = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
          return;
        }

        // API call to check authorization
        const response = await api.get(`${config.BASE_URL}/api/events/${route.params.eventId}/check-access`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data?.authorized) {
          setAuthorized(true);
          setEventName(response.data.eventname);
        }
      } catch (error) {
        let errorMessage = 'Failed to Check Scanning Permission Access. Please try again.';

        if (error.response) {
          errorMessage = error.response?.data?.message || 'Failed to check scanning permission access';
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

        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();
  }, [route.params, navigation]);

  // Request camera permission
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  // Send scan data to backend - Modified to send raw encoded data
  const sendScanDataToBackend = async (scannedData) => {
    setProcessing(true);
    try {
      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        throw new Error('Authentication token not found');
      }

      if (!eventId) {
        throw new Error('Event ID not found');
      }

      // Send the raw scanned data directly to backend
      const response = await api.post(
        `${config.BASE_URL}/api/events/validate-scan`,
        {
          eventId: eventId,
          qrData: scannedData, // Send the raw encoded QR data
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        Alert.alert(
          "Scan Validated Successfully",
          `Guest: ${response.data.guestName || 'Unknown'}\nStatus: ${response.data.status || 'Valid'}`,
          [{ text: "OK", onPress: () => setScanned(false) }]
        );
      } 
    } catch (error) {
      //console.error('Error validating scan:', error);
      
      let errorMessage = "Failed to validate QR code";
      
      if (error.response) {
       
          errorMessage = error.response?.data?.message || "Event or QR code not found.";
        
      } else if (error.request) {
        errorMessage = "Unable to connect to server. Check your internet connection.";
      } 
      
      Alert.alert(
        "Error",
        errorMessage,
        [{ text: "OK", onPress: () => setScanned(false) }]
      );
    } finally {
      setProcessing(false);
    }
  };

  // Handle scanned QR/barcode
  const handleBarCodeScanned = ({ type, data }) => {
    if (scanned || processing) return; // Prevent multiple scans
    
    setScanned(true);
    
    // Send the raw encoded data to backend automatically
    sendScanDataToBackend(data);
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#f8f9fa"
          translucent={false}
        />
        <View style={styles.center}>
          <Text>Checking camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#f8f9fa"
          translucent={false}
        />
        <View style={styles.center}>
          <Text>Camera access is required to scan QR codes</Text>
          <Button 
            title="Grant Permission" 
            onPress={requestPermission} 
          />
          <Button 
            title="Open Settings" 
            onPress={() => Linking.openSettings()} 
            style={{ marginTop: 10 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  // While checking authorization
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#f8f9fa"
          translucent={false}
        />
        <View style={styles.centered}>
          <ActivityIndicator size="small" color="#000000" />
          <Text style={styles.loadingText}>Checking access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // If not authorized, return access denied
  if (!authorized) return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f8f9fa"
        translucent={false}
      />
      <View style={styles.centered}>
        <Text>Access Denied</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f8f9fa"
        translucent={false}
      />
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={scanned || processing ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'pdf417', 'upc_e', 'code39', 'ean13', 'ean8', 'code128']
          }}
        />

        {/* Scanner frame overlay */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <Text style={styles.scanText}>Position QR code within frame</Text>
          
          {eventId && (
            <Text style={styles.eventText}>
              Scanning for Event: {eventname ?? 'Unknown Event'}
            </Text>
          )}
        </View>

        {processing && (
          <View style={styles.processingContainer}>
            <View style={styles.processingBox}>
              <ActivityIndicator size="small" color="#000000" />
              <Text style={styles.processingText}>Validating QR code...</Text>
            </View>
          </View>
        )}

        {scanned && !processing && (
          <View style={styles.buttonContainer}>
            <Button title="Scan Again" onPress={() => setScanned(false)} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default ScannerScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 10,
    backgroundColor: '#ffffff',
  },
  buttonContainer: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 20,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#00FF00',
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  scanText: {
    color: 'white',
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  eventText: {
    color: 'white',
    marginTop: 10,
    fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 5,
    borderRadius: 5,
  },
  processingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  processingBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});