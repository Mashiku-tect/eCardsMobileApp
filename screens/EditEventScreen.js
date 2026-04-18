import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  ToastAndroid
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
  Surface,
  IconButton,
  Modal,
  Portal,
  HelperText,
  Chip,
  Divider,
  Dialog,
  Paragraph,
  List
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import Toast from 'react-native-toast-message';
import api from '../utils/api';

const EditEvent = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { id, eventName: initialEventName } = route.params;
  
  const [formData, setFormData] = useState({
    name: '',
    startDate: new Date(),
    endDate: new Date(),
    startTime: new Date(),
    endTime: new Date(new Date().getHours() + 2),
    location: '',
    locationUrl: '',
    description: '',
    category: 'personal',
    package: 'Basic',
    excelFile: null,
    fileName: ''
  });
  
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [existingFile, setExistingFile] = useState('');
  const [fetching, setFetching] = useState(true);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [packageModalVisible, setPackageModalVisible] = useState(false);
  const [errors, setErrors] = useState({});

  // Validation functions
  const validateEventName = (text) => {
    // Allow letters, spaces, and & symbol only
    return /^[A-Za-z\s&]+$/.test(text.trim());
  };

  const validateLocation = (text) => {
    // Allow letters, spaces, and comma symbol only
    return /^[A-Za-z\s,]+$/.test(text.trim());
  };

  const validateDescription = (text) => {
    // Allow letters, spaces, numbers, and & symbol only
    return /^[A-Za-z0-9\s&]+$/.test(text.trim());
  };

  const validateLocationUrl = (text) => {
    return /^https?:\/\/\S+$/i.test(text.trim());
  };

  const categories = [
    { value: 'personal', label: 'Personal', icon: 'account' },
    { value: 'business', label: 'Business', icon: 'briefcase' },
    { value: 'education', label: 'Education', icon: 'school' },
    { value: 'entertainment', label: 'Entertainment', icon: 'music' },
    { value: 'other', label: 'Other', icon: 'dots-horizontal' }
  ];

  const packages = [
    { value: 'Basic', label: 'Basic', description: 'Essential features for small events', price: 'Free' },
    { value: 'Standard', label: 'Standard', description: 'Advanced features for growing events', price: '$49' },
    { value: 'Pro', label: 'Pro', description: 'Professional tools for large events', price: '$99' },
    { value: 'Elite', label: 'Elite', description: 'Enterprise-grade solutions', price: '$199' }
  ];

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setFetching(true);
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        await AsyncStorage.removeItem('authToken');
        navigation.navigate('Login');
        return;
      }

      const response = await api.get(
        `${config.BASE_URL}/api/events/eventdetails/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      const event = response.data.event;
      const eventDate = new Date(event.eventDate);
      const endDate = event.endDate ? new Date(event.endDate) : new Date(event.eventDate);
      
      const [startHours, startMinutes] = event.eventTime.split(':');
      let endHours, endMinutes;
      
      if (event.endTime) {
        [endHours, endMinutes] = event.endTime.split(':');
      } else {
        endHours = (parseInt(startHours) + 2) % 24;
        endMinutes = startMinutes;
      }
      
      setFormData({
        name: event.eventName || '',
        startDate: eventDate || new Date(),
        endDate: endDate || new Date(),
        startTime: new Date(new Date().setHours(parseInt(startHours), parseInt(startMinutes))) || new Date(),
        endTime: new Date(new Date().setHours(parseInt(endHours), parseInt(endMinutes))) || new Date(),
        location: event.location || '',
        locationUrl: event.locationUrl || '',
        description: event.description || '',
        category: event.category || 'personal',
        package: event.packagename || 'Basic',
        excelFile: null,
        fileName: ''
      });
      
      if (response.data.fileName) {
        setExistingFile(response.data.fileName);
      }
    } catch (error) {
  let errorMessage = 'Failed to fetch event. Please try again.';

  if (error.response) {
    

     errorMessage = error.response?.data?.message || 'Failed to fetch event Please Try Again';

    

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
finally {
      setFetching(false);
    }
  };

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleNameChange = (text) => {
    // Only allow letters, spaces, and & symbol
    const filtered = text.replace(/[^A-Za-z\s&]/g, '');
    handleChange('name', filtered);
  };

  const handleLocationChange = (text) => {
    // Only allow letters, spaces, and comma
    const filtered = text.replace(/[^A-Za-z\s,]/g, '');
    handleChange('location', filtered);
  };

  const handleDescriptionChange = (text) => {
    // Only allow letters, numbers, spaces, and & symbol
    const filtered = text.replace(/[^A-Za-z0-9\s&]/g, '');
    handleChange('description', filtered);
  };

  const handleLocationUrlChange = (text) => {
    handleChange('locationUrl', text);
  };

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      const newStartDate = selectedDate;
      setFormData(prev => ({
        ...prev,
        startDate: newStartDate
      }));

      const currentEndDate = prev.endDate;
      if (currentEndDate < newStartDate) {
        setFormData(prev => ({
          ...prev,
          endDate: newStartDate
        }));
      }
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        endDate: selectedDate
      }));
    }
  };

  const handleStartTimeChange = (event, selectedTime) => {
    setShowStartTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      const newStartTime = selectedTime;
      setFormData(prev => ({
        ...prev,
        startTime: newStartTime
      }));

      const currentEndTime = prev.endTime;
      const isSameDay = isSameDay(prev.startDate, prev.endDate);
      
      if (isSameDay && currentEndTime < newStartTime) {
        const newEndTime = new Date(newStartTime);
        newEndTime.setHours(newStartTime.getHours() + 2);
        setFormData(prev => ({
          ...prev,
          endTime: newEndTime
        }));
      }
    }
  };

  const handleEndTimeChange = (event, selectedTime) => {
    setShowEndTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      setFormData(prev => ({
        ...prev,
        endTime: selectedTime
      }));
    }
  };

  const isSameDay = (date1, date2) => {
    return date1.toDateString() === date2.toDateString();
  };

  const combineDateAndTime = (date, time) => {
    const combined = new Date(date);
    combined.setHours(time.getHours());
    combined.setMinutes(time.getMinutes());
    combined.setSeconds(time.getSeconds());
    return combined;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Event Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    } else if (!validateEventName(formData.name)) {
      newErrors.name = 'Event name can only contain letters, spaces, and & symbol';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Event name must be at least 3 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Event name must be less than 100 characters';
    }

    // Location validation
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    } else if (!validateLocation(formData.location)) {
      newErrors.location = 'Location can only contain letters, spaces, and comma';
    } else if (formData.location.trim().length < 5) {
      newErrors.location = 'Location must be at least 5 characters';
    } else if (formData.location.trim().length > 200) {
      newErrors.location = 'Location must be less than 200 characters';
    }

    if (formData.locationUrl.trim() && !validateLocationUrl(formData.locationUrl)) {
      newErrors.locationUrl = 'Location URL must be a valid link starting with http:// or https://';
    } else if (formData.locationUrl.trim().length > 500) {
      newErrors.locationUrl = 'Location URL must be less than 500 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (!validateDescription(formData.description)) {
      newErrors.description = 'Description can only contain letters, numbers, spaces, and & symbol';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (formData.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      // Show only the first error for better user experience
      const firstErrorKey = Object.keys(newErrors)[0];
      const firstErrorMessage = newErrors[firstErrorKey];
      
      if (Platform.OS === 'android') {
        ToastAndroid.show(firstErrorMessage, ToastAndroid.LONG);
      } else {
        Toast.show({
          type: 'error',
          text1: firstErrorMessage
        });
      }
      return false;
    }

    return validateTimes();
  };

  const validateTimes = () => {
    const startDateTime = combineDateAndTime(formData.startDate, formData.startTime);
    const endDateTime = combineDateAndTime(formData.endDate, formData.endTime);
    const currentDateTime = new Date();
    
    if (isSameDay(formData.endDate, currentDateTime) && startDateTime <= currentDateTime) {
      if(Platform.OS==='android'){
ToastAndroid.show('Start time cannot be in the past for events ending today',ToastAndroid.LONG);
      }
      else{
 Toast.show({
        type: 'error',
        text1: 'Start time cannot be in the past for events ending today'
      });
      }
     
      return false;
    }
    
    if (formData.endDate < formData.startDate) {
      if(Platform.OS==='android'){
  ToastAndroid.show('End date cannot be before start date',ToastAndroid.LONG)
      }
      else{
        Toast.show({
        type: 'error',
        text1: 'End date cannot be before start date'
      });
      }
      
      return false;
    }
    
    if (isSameDay(formData.startDate, formData.endDate) && formData.endTime <= formData.startTime) {
      if(Platform.OS==='android'){
ToastAndroid.show('End time must be after start time when events are on the same day',ToastAndroid.LONG);
      }
      else{
        Toast.show({
        type: 'error',
        text1: 'End time must be after start time when events are on the same day'
      });
      }
      
      return false;
    }
    
    const durationInDays = (formData.endDate - formData.startDate) / (1000 * 60 * 60 * 24);
    if (durationInDays > 30) {
      if(Platform.OS==='android'){
ToastAndroid.show('Event duration seems too long. Please check your dates',ToastAndroid.LONG)
      }
      else{
 Toast.show({
        type: 'error',
        text1: 'Event duration seems too long. Please check your dates.'
      });
      }
     
      return false;
    }
    
    if (endDateTime <= startDateTime) {
      if(Platform.OS==='android'){
ToastAndroid.show('Event end must be after event start',ToastAndroid.LONG)
      }
      else{
Toast.show({
        type: 'error',
        text1: 'Event end must be after event start'
      });
      }
      
      return false;
    }
    
    return true;
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv',
          'application/csv'
        ],
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      if (result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const validExtensions = ['.xlsx', '.xls', '.csv'];
        const fileExtension = file.name ? file.name.substring(file.name.lastIndexOf('.')).toLowerCase() : '';
        
        if (!validExtensions.includes(fileExtension)) {
          setUploadStatus('error');
          if(Platform.OS==='android'){
  ToastAndroid.show('Please upload a valid Excel file (.xlsx, .xls, or .csv)',ToastAndroid.LONG);
          }
          else{
       Toast.show({
            type: 'error',
            text1: 'Please upload a valid Excel file (.xlsx, .xls, or .csv)'
          });
          }
          
          return;
        }

        setFormData(prev => ({
          ...prev,
          excelFile: file,
          fileName: file.name
        }));
        setUploadStatus('success');
        setErrors(prev => ({ ...prev, excelFile: '' }));
        if(Platform.OS==='android'){
       ToastAndroid.show('Excel file uploaded successfully!',ToastAndroid.LONG)
        }
        else{
 Toast.show({
          type: 'success',
          text1: 'Excel file uploaded successfully!'
        });
        }
       
      }
    } catch (err) {
      if(Platform.OS==='android'){
ToastAndroid.show('Failed to pick document',ToastAndroid.LONG)
      }
      else{
 Toast.show({
        type: 'error',
        text1: 'Failed to pick document'
      });
      }
     
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('authToken');
      
      if (!token) {
        await AsyncStorage.removeItem('authToken');
        return;
      }

      const data = new FormData();
      data.append("name", formData.name.trim());
      data.append("date", formData.startDate.toISOString().split('T')[0]);
      data.append("endDate", formData.endDate.toISOString().split('T')[0]);
      data.append("time", formData.startTime.toTimeString().split(' ')[0]);
      data.append("endTime", formData.endTime.toTimeString().split(' ')[0]);
      data.append("location", formData.location.trim());
      data.append("locationUrl", formData.locationUrl.trim());
      data.append("description", formData.description.trim());
      data.append("category", formData.category);
      data.append("package", formData.package);

      if(!formData.excelFile){
        if(Platform.OS==='android'){
          ToastAndroid.show('Please Upload Excel File',ToastAndroid.LONG)
        }
        else{
          Toast.show({
            type:'error',
            text1:'Please Upload The Excel file'
          })
        }
        return;
      }
      
      data.append("excelFile", {
        uri: formData.excelFile.uri,
        type: formData.excelFile.mimeType || 'application/vnd.ms-excel',
        name: formData.excelFile.name || 'guest_list.xlsx'
      });

      const res = await api.put(
        `${config.BASE_URL}/api/events/update/${id}`,
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          timeout: 30000,
        }
      );
      
      const responsemessage = res?.data?.message;
      if(Platform.OS==='android'){
        ToastAndroid.show(responsemessage,ToastAndroid.LONG)
      }
      else{
        Toast.show({
          type: 'success',
          text1: responsemessage
        });
      }
      
      setTimeout(() => {
        navigation.navigate('EventDetails', { eventId: id, eventName: formData.name });
      }, 1500);
    } catch (err) {
      let errorMessage = "Error updating event";
      
      if (err.response) {
        errorMessage = err.response.data?.message || `Server error: ${err.response.status}`;
      } else if (err.request) {
        errorMessage = "No response from server. Please check your connection.";
      } else {
        errorMessage = err.message || "Unknown error occurred";
      }
      
      if(Platform.OS==='android'){
        ToastAndroid.show(errorMessage,ToastAndroid.LONG)
      }
      else{
        Toast.show({
          type: 'error',
          text1: errorMessage
        });
      }
      
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEventDuration = () => {
    const startDateTime = combineDateAndTime(formData.startDate, formData.startTime);
    const endDateTime = combineDateAndTime(formData.endDate, formData.endTime);
    const durationInHours = (endDateTime - startDateTime) / (1000 * 60 * 60);
    const durationInDays = (formData.endDate - formData.startDate) / (1000 * 60 * 60 * 24);
    
    if (durationInDays >= 1) {
      const days = Math.floor(durationInDays);
      const hours = Math.round((durationInDays - days) * 24);
      
      if (hours > 0) {
        return `${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`;
      } else {
        return `${days} day${days > 1 ? 's' : ''}`;
      }
    } else if (durationInHours < 1) {
      const minutes = Math.round(durationInHours * 60);
      return `${minutes} minutes`;
    } else if (durationInHours === 1) {
      return '1 hour';
    } else {
      return `${Math.round(durationInHours * 10) / 10} hours`;
    }
  };

 const isMultiDayEvent = () => {
  if (!formData?.startDate || !formData?.endDate) return false;
  return !isSameDay(formData.startDate, formData.endDate);
};


  const getSelectedCategory = () => {
    return categories.find(cat => cat.value === formData.category)?.label || 'Select Category';
  };

  const getSelectedPackage = () => {
    return packages.find(pkg => pkg.value === formData.package)?.label || 'Select Package';
  };

  if (fetching) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#ffffff"
          translucent={false}
        />
        <Surface style={styles.loadingContainer} elevation={0}>
          <ActivityIndicator size="small" color="#000000" />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Loading event data...
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
      
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView 
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Modals */}
          <Portal>
            {/* Category Selection Modal */}
            <Modal 
              visible={categoryModalVisible} 
              onDismiss={() => setCategoryModalVisible(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card style={styles.modalCard}>
  <Card.Title
    title="Select Category"
    titleVariant="titleLarge"
    titleStyle={styles.modalTitle}
    left={(props) => (
      <IconButton {...props} icon="format-list-bulleted" iconColor="#666666" />
    )}
  />

  <Card.Content>
    {Array.isArray(categories) && categories.length > 0 ? (
      categories.map((category) => {
        if (!category?.value || !category?.label) return null;

        return (
          <List.Item
            key={category.value}
            title={category.label}
            left={props => (
              <List.Icon
                {...props}
                icon={category.icon ?? 'help-circle'}
                color="#666666"
              />
            )}
            right={props =>
              formData?.category === category.value ? (
                <List.Icon {...props} icon="check" color="#333333" />
              ) : null
            }
            onPress={() => {
              handleChange?.('category', category.value);
              setCategoryModalVisible?.(false);
            }}
            style={[
              styles.listItem,
              formData?.category === category.value && styles.selectedListItem
            ]}
            titleStyle={styles.listItemTitle}
          />
        );
      })
    ) : (
      <List.Item title="No categories available" />
    )}
  </Card.Content>

  <Card.Actions>
    <Button onPress={() => setCategoryModalVisible?.(false)} textColor="#666666">
      Cancel
    </Button>
  </Card.Actions>
</Card>

            </Modal>

            {/* Package Selection Modal */}
           <Modal
  visible={!!packageModalVisible}
  onDismiss={() => setPackageModalVisible?.(false)}
  contentContainerStyle={styles.modalContainer}
>
  <Card style={styles.modalCard}>
    <Card.Title
      title="Select Package"
      titleVariant="titleLarge"
      titleStyle={styles.modalTitle}
      left={(props) => (
        <IconButton {...props} icon="package-variant" iconColor="#666666" />
      )}
    />

    <Card.Content>
      {Array.isArray(packages) && packages.length > 0 ? (
        packages.map((pkg) => {
          if (!pkg?.value || !pkg?.label) return null;

          const isSelected = formData?.package === pkg.value;

          return (
            <Card
              key={pkg.value}
              mode="outlined"
              style={[
                styles.packageCard,
                isSelected && styles.selectedPackageCard
              ]}
              onPress={() => {
                handleChange?.('package', pkg.value);
                setPackageModalVisible?.(false);
              }}
            >
              <Card.Content>
                <Surface style={styles.packageHeader} elevation={0}>
                  <Text variant="titleMedium" style={styles.packageName}>
                    {pkg.label}
                  </Text>
                </Surface>

                {isSelected && (
                  <Surface style={styles.selectedIndicator} elevation={0}>
                    <List.Icon icon="check-circle" color="#333333" />
                    <Text variant="bodySmall" style={styles.selectedText}>
                      Selected
                    </Text>
                  </Surface>
                )}
              </Card.Content>
            </Card>
          );
        })
      ) : (
        <Text variant="bodyMedium" style={{ textAlign: 'center', marginVertical: 16 }}>
          No packages available
        </Text>
      )}
    </Card.Content>

    <Card.Actions>
      <Button
        onPress={() => setPackageModalVisible?.(false)}
        textColor="#666666"
      >
        Cancel
      </Button>
    </Card.Actions>
  </Card>
</Modal>

          </Portal>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Surface style={styles.header} elevation={0}>
              <Text variant="headlineMedium" style={styles.title}>
                Edit Event
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Update your event details below
              </Text>
            </Surface>

            {/* Form */}
            <Card style={styles.formCard} mode="contained">
              <Card.Content>
                {/* Event Name */}
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Event Name *"
                    value={formData?.name?? 'Uknown Event'}
                    onChangeText={handleNameChange}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.name}
                    returnKeyType="next"
                    placeholder="e.g., Company Meeting & Conference"
                    maxLength={100}
                  />
                  <HelperText type="error" visible={!!errors.name}>
                    {errors.name}
                  </HelperText>
                  <HelperText type="info" visible={!errors.name && formData.name.length > 0}>
                    Allowed: Letters, spaces, and & symbol
                  </HelperText>
                </View>

                {/* Start and End Date */}
               <Surface style={styles.row} elevation={0}>
  <Surface style={styles.dateInput} elevation={0}>
    <Text variant="bodyMedium" style={styles.label}>
      Start Date *
    </Text>
    <Button
      mode="outlined"
      onPress={() => setShowStartDatePicker(true)}
      icon="calendar"
      style={styles.dateButton}
      textColor="#333333"
    >
      {formatDate(formData?.startDate)}
    </Button>

    {showStartDatePicker && (
      <DateTimePicker
        value={formData?.startDate ?? new Date()}
        mode="date"
        display="default"
        onChange={handleStartDateChange}
        minimumDate={new Date()}
      />
    )}
  </Surface>

  <Surface style={styles.dateInput} elevation={0}>
    <Text variant="bodyMedium" style={styles.label}>
      End Date *
    </Text>
    <Button
      mode="outlined"
      onPress={() => setShowEndDatePicker(true)}
      icon="calendar"
      style={styles.dateButton}
      textColor="#333333"
    >
      {formatDate(formData?.endDate)}
    </Button>

    {showEndDatePicker && (
      <DateTimePicker
        value={formData?.endDate ?? formData?.startDate ?? new Date()}
        mode="date"
        display="default"
        onChange={handleEndDateChange}
        minimumDate={formData?.startDate ?? new Date()}
      />
    )}
  </Surface>
</Surface>


                {/* Start and End Time */}
               <Surface style={styles.row} elevation={0}>
  {/* Start Time */}
  <Surface style={styles.dateInput} elevation={0}>
    <Text variant="bodyMedium" style={styles.label}>
      Start Time *
    </Text>
    <Button
      mode="outlined"
      onPress={() => setShowStartTimePicker(true)}
      icon="clock"
      style={styles.dateButton}
      textColor="#333333"
    >
      {formatTime(formData?.startTime)}
    </Button>
    {showStartTimePicker && (
      <DateTimePicker
        value={formData?.startTime ?? new Date()}
        mode="time"
        display="default"
        onChange={handleStartTimeChange}
      />
    )}
  </Surface>

  {/* End Time */}
  <Surface style={styles.dateInput} elevation={0}>
    <Text variant="bodyMedium" style={styles.label}>
      End Time *
    </Text>
    <Button
      mode="outlined"
      onPress={() => setShowEndTimePicker(true)}
      icon="clock"
      style={styles.dateButton}
      textColor="#333333"
    >
      {formatTime(formData?.endTime)}
    </Button>
    {showEndTimePicker && (
      <DateTimePicker
        value={formData?.endTime ?? formData?.startTime ?? new Date()}
        mode="time"
        display="default"
        onChange={handleEndTimeChange}
      />
    )}
  </Surface>
</Surface>


                {/* Duration Display */}
                <Surface style={styles.durationContainer} elevation={1}>
                  <Chip
                    icon={isMultiDayEvent() ? "calendar-range" : "calendar"}
                    mode="outlined"
                    style={styles.durationChip}
                    textStyle={styles.durationChipText}
                  >
                    {isMultiDayEvent() ? 'Multi-day Event' : 'Single-day Event'}
                  </Chip>
                  <Text variant="bodyMedium" style={styles.durationValue}>
                    {getEventDuration()}
                  </Text>
                </Surface>

                {/* Location */}
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Location *"
                    value={formData?.location?? 'Tanzania'}
                    onChangeText={handleLocationChange}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.location}
                    returnKeyType="next"
                    placeholder="e.g., New York, USA or Main Conference Hall"
                    maxLength={200}
                  />
                  <HelperText type="error" visible={!!errors.location}>
                    {errors.location}
                  </HelperText>
                  <HelperText type="info" visible={!errors.location && formData.location.length > 0}>
                    Allowed: Letters, spaces, and comma
                  </HelperText>
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    label="Location URL (Google Maps Link)"
                    value={formData?.locationUrl ?? ''}
                    onChangeText={handleLocationUrlChange}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.locationUrl}
                    returnKeyType="next"
                    placeholder="https://maps.google.com/..."
                    keyboardType="url"
                    autoCapitalize="none"
                    autoCorrect={false}
                    maxLength={500}
                  />
                  <HelperText type="error" visible={!!errors.locationUrl}>
                    {errors.locationUrl}
                  </HelperText>
                  <HelperText type="info" visible={!errors.locationUrl && formData.locationUrl.length > 0}>
                    Paste the full Google Maps link for this event location
                  </HelperText>
                </View>

                {/* Category and Package */}
                <Surface style={styles.row} elevation={0}>
                  <Surface style={styles.pickerContainer} elevation={0}>
                    <Text variant="bodyMedium" style={styles.label}>
                      Category *
                    </Text>
                    <Button
                      mode="outlined"
                      onPress={() => setCategoryModalVisible(true)}
                      icon="chevron-down"
                      style={styles.pickerButton}
                      contentStyle={styles.pickerButtonContent}
                      textColor="#333333"
                    >
                      {getSelectedCategory()}
                    </Button>
                  </Surface>

                  <Surface style={styles.pickerContainer} elevation={0}>
                    <Text variant="bodyMedium" style={styles.label}>
                      Package *
                    </Text>
                    <Button
                      mode="outlined"
                      onPress={() => setPackageModalVisible(true)}
                      icon="chevron-down"
                      style={styles.pickerButton}
                      contentStyle={styles.pickerButtonContent}
                      textColor="#333333"
                    >
                      {getSelectedPackage()}
                    </Button>
                  </Surface>
                </Surface>

                {/* Excel File Upload */}
                <Surface style={styles.uploadContainer} elevation={0}>
                  <Text variant="bodyMedium" style={styles.label}>
                    Guest List (Excel File) *
                  </Text>
                  <Button
                    mode="contained"
                    onPress={pickDocument}
                    icon="file-upload"
                    style={styles.uploadButton}
                  >
                    {formData.fileName ? 'Change File' : 'Upload Excel File'}
                  </Button>
                  
                  {formData.fileName && (
                    <Surface style={[
                      styles.fileInfo, 
                      uploadStatus === 'success' ? styles.successFile : styles.defaultFile
                    ]} elevation={1}>
                      <Text variant="bodyMedium" style={styles.fileName}>
                        {formData?.fileName?? 'Excel File'}
                      </Text>
                      <Text variant="bodySmall" style={styles.fileStatus}>
                        {uploadStatus === 'success' 
                          ? 'File successfully uploaded. This will replace your existing guest list.'
                          : 'Please upload an Excel file with your guest list.'}
                      </Text>
                    </Surface>
                  )}
                  
                  {!formData.fileName && !existingFile && (
                    <Text variant="bodySmall" style={styles.uploadHint}>
                      Upload an Excel file (.xlsx, .xls) or CSV containing your guest list
                    </Text>
                  )}
                  
                  <HelperText type="error" visible={!!errors.excelFile}>
                    {errors.excelFile}
                  </HelperText>
                </Surface>

                {/* Description */}
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Description *"
                    value={formData?.description?? 'This is the event description'}
                    onChangeText={handleDescriptionChange}
                    mode="outlined"
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={4}
                    error={!!errors.description}
                    blurOnSubmit={true}
                    returnKeyType="done"
                    placeholder="Describe your event, agenda, and important details..."
                    maxLength={500}
                  />
                  <HelperText type="error" visible={!!errors.description}>
                    {errors.description}
                  </HelperText>
                  <HelperText type="info" visible={!errors.description && formData.description.length > 0}>
                    Allowed: Letters, numbers, spaces, and & symbol ({formData.description.length}/500)
                  </HelperText>
                </View>

                {/* Form Actions */}
                <Surface style={styles.actions} elevation={0}>
                  <Button
                    mode="outlined"
                    onPress={() => navigation.goBack()}
                    style={styles.cancelButton}
                    textColor="#333333"
                  >
                    Cancel
                  </Button>
                  <Button
                    mode="contained"
                    onPress={handleSubmit}
                    loading={loading}
                    disabled={loading}
                    style={styles.submitButton}
                    icon="content-save"
                  >
                    Update Event
                  </Button>
                </Surface>
              </Card.Content>
            </Card>
            
            {/* Add extra padding at the bottom for keyboard */}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = {
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoidingView: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 8,
    backgroundColor: '#ffffff',
  },
  title: {
    color: '#000000',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    fontSize: 28,
  },
  subtitle: {
    color: '#666666',
    textAlign: 'center',
    fontSize: 16,
  },
  formCard: {
    marginBottom: 24,
    borderRadius: 16,
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 0,
    backgroundColor: '#ffffff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    backgroundColor: 'transparent',
    gap: 16,
  },
  dateInput: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dateButton: {
    marginTop: 4,
    borderColor: '#e0e0e0',
  },
  label: {
    marginBottom: 8,
    color: '#000000',
    fontSize: 14,
    fontWeight: '500',
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  durationChip: {
    backgroundColor: 'transparent',
    borderColor: '#e0e0e0',
  },
  durationChipText: {
    color: '#666666',
  },
  durationValue: {
    color: '#333333',
    fontWeight: '600',
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  pickerButton: {
    marginTop: 4,
    borderColor: '#e0e0e0',
  },
  pickerButtonContent: {
    justifyContent: 'space-between',
  },
  uploadContainer: {
    marginBottom: 20,
    backgroundColor: 'transparent',
  },
  uploadButton: {
    marginBottom: 12,
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  fileInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  existingFile: {
    backgroundColor: '#f5f5f5',
  },
  defaultFile: {
    backgroundColor: '#f9f9f9',
  },
  successFile: {
    backgroundColor: '#f5f5f5',
  },
  fileInfoContent: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  fileName: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
  },
  fileStatus: {
    color: '#666666',
  },
  uploadHint: {
    color: '#666666',
    fontStyle: 'italic',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 20,
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  cancelButton: {
    flex: 1,
    marginRight: 12,
    borderColor: '#e0e0e0',
    borderRadius: 12,
  },
  submitButton: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  // Modal Styles
  modalContainer: {
    padding: 20,
    margin: 20,
  },
  modalCard: {
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  modalTitle: {
    color: '#000000',
    fontWeight: '600',
  },
  listItem: {
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectedListItem: {
    backgroundColor: '#f5f5f5',
  },
  listItemTitle: {
    color: '#000000',
  },
  packageCard: {
    marginBottom: 12,
    borderRadius: 12,
    borderColor: '#f0f0f0',
    backgroundColor: '#ffffff',
  },
  selectedPackageCard: {
    borderColor: '#333333',
    backgroundColor: '#f9f9f9',
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  packageName: {
    fontWeight: 'bold',
    color: '#000000',
  },
  packagePriceChip: {
    backgroundColor: 'transparent',
    borderColor: '#e0e0e0',
  },
  packagePriceText: {
    color: '#666666',
  },
  packageDescription: {
    color: '#666666',
    marginBottom: 8,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  selectedText: {
    color: '#333333',
    marginLeft: 4,
    fontWeight: '500',
  },
  bottomPadding: {
    height: Platform.OS === 'ios' ? 40 : 20,
  },
};

export default EditEvent;
