import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Button, Alert, Linking, ActivityIndicator,Platform,ToastAndroid, SafeAreaView,StatusBar } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import Toast from 'react-native-toast-message';
import api from '../utils/api';

const ScannerScreen = ({ route,navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [eventId, setEventId] = useState(null);
    const [loading, setLoading] = useState(true); // 👈 show loading before authorization
  const [authorized, setAuthorized] = useState(false);
  const [eventname,setEventName]=useState(null);
  // Get event ID from navigation params if available
  useEffect(() => {
    if (route.params?.eventId) {
      setEventId(route.params.eventId);
    }

    //check for authorization to scannevents from the server

    const checkAuthorization = async () => {
      try {
        

        // Optionally retrieve a token from AsyncStorage
        const token = await AsyncStorage.getItem('authToken');
        if(!token){
          return;
        }

        // 🔥 API call to check authorization
        const response = await api.get(`${config.BASE_URL}/api/events/${route.params.eventId}/check-access`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // Example response shape: { authorized: true/false }
        //console.log("authorized",response.data.authorized)
        if (response.data?.authorized) {
          //setEventId(id);
          setAuthorized(true);
          setEventName(response.data.eventname)
        } 
      } catch (error) {
        //console.error("Authorization check failed:", error);
        const errormessage=error.response.data.message;

        if (Platform.OS === 'android') {
  ToastAndroid.showWithGravityAndOffset(
    errormessage,
    ToastAndroid.LONG,
    ToastAndroid.CENTER,
    0,
    50
  );
  navigation.goBack(); // simulate the same behavior as pressing "OK"
} else {
  // For iOS or fallback platforms
   Toast.show({
    type:'error',
    text1:'Permission denied',
    text2:errormessage
   })
}
        // Alert.alert(
        //   "Error",
        //   errormessage,
        //   [{ text: "OK", onPress: () => navigation.goBack() }]
        // );
      } finally {
        setLoading(false);
      }
    };

    checkAuthorization();

  }, [route.params,navigation]);

  // Request camera permission
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  // Send scan data to backend
  // Send scan data to backend
const sendScanDataToBackend = async (scannedData) => {
  setProcessing(true);
  try {
    const token = await AsyncStorage.getItem('authToken'); 

    let url;
    try {
      url = new URL(scannedData);
    } catch (e) {
      try {
        const parsedData = JSON.parse(scannedData);
        url = { searchParams: new URLSearchParams(parsedData) };
      } catch (jsonError) {
        throw new Error('Invalid QR code format');
      }
    }

    const searchParams = url.searchParams;
    const guestId = searchParams.get('guestId') || searchParams.get('guestid');
    const scannedEventId = searchParams.get('eventId') || searchParams.get('eventid');
    const qrToken = searchParams.get('token') || searchParams.get('qrToken');

    if (!guestId || !scannedEventId || !qrToken) {
      throw new Error('Missing required data in QR code');
    }

    if (String(eventId) !== String(scannedEventId)) {
      
      Alert.alert(
        "Validation Error",
        "This QR code is not valid for the current event.",
        [{ text: "OK", onPress: () => setScanned(false) }] // <-- reset here
      );
      return;
    }

    const response = await api.post(
      `${config.BASE_URL}/api/events/validate-scan`,
      {
        guestId,
        eventId: scannedEventId,
        qrToken,
        scannedEventId: eventId 
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (response.data.success) {
      Alert.alert(
        "Scan Validated Successfully",
        `Guest: ${response.data.guestName || 'Unknown'}\nStatus: ${response.data.status || 'Valid'}`,
        [{ text: "OK", onPress: () => setScanned(false) }] // <-- reset only after user taps OK
      );
    } else {
      Alert.alert(
        "Validation Failed",
        response.data.message || "This QR code is not valid.",
        [{ text: "OK", onPress: () => setScanned(false) }]
      );
    }
  } catch (error) {
    //console.error('Error validating scan:', error);
    Alert.alert(
      "Error",
      error.response?.data?.message || error.message || "Failed to validate QR code",
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
    Alert.alert(
      "QR Code Detected",
      "Processing scan...",
      [],
      { cancelable: false }
    );
    
    // Send data to backend automatically
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

  // ⏳ While checking authorization
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
         <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f8f9fa"
        translucent={false}
      />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Checking access...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // 🛑 If not authorized, return null wrapped in SafeAreaView
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
              Scanning for Event : {eventname}
            </Text>
          )}
        </View>

        {processing && (
          <View style={styles.processingContainer}>
            <View style={styles.processingBox}>
              <ActivityIndicator size="large" color="#00FF00" />
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
    backgroundColor: '#000000', // Black background for camera screen
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
    backgroundColor: '#F9FAFB', // soft neutral background
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});