import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  View,
  ToastAndroid
} from 'react-native';
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
      const errormessage = error.response?.data?.message || 'Failed to fetch event';
      if(Platform.OS==='android'){
        ToastAndroid.show(errormessage,ToastAndroid.LONG);
      }
      else{
Toast.show({
        type: 'error',
        text1: errormessage
      });
      }
      
    } finally {
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
    
    if (!formData.name) newErrors.name = 'Event name is required';
    if (!formData.location) newErrors.location = 'Location is required';
    if (!formData.description) newErrors.description = 'Description is required';
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      if(Platform.OS==='android'){
        ToastAndroid.show('Please fill in all required fields',ToastAndroid.LONG);
      }
      else{
Toast.show({
        type: 'error',
        text1: 'Please fill in all required fields'
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
      data.append("name", formData.name);
      data.append("date", formData.startDate.toISOString().split('T')[0]);
      data.append("endDate", formData.endDate.toISOString().split('T')[0]);
      data.append("time", formData.startTime.toTimeString().split(' ')[0]);
      data.append("endTime", formData.endTime.toTimeString().split(' ')[0]);
      data.append("location", formData.location);
      data.append("description", formData.description);
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
  const responsemessage=res?.data?.message;
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
          backgroundColor="#F0F4F8"
          translucent={false}
        />
        <Surface style={styles.loadingContainer} elevation={0}>
          <ActivityIndicator size="small" />
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
        backgroundColor="#F0F4F8"
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
              <Card>
                <Card.Title 
                  title="Select Category" 
                  titleVariant="titleLarge"
                  left={(props) => <IconButton {...props} icon="format-list-bulleted" />}
                />
                <Card.Content>
                  {categories.map((category) => (
                    <List.Item
                      key={category.value}
                      title={category.label}
                      left={props => <List.Icon {...props} icon={category.icon} />}
                      right={props => 
                        formData.category === category.value ? 
                        <List.Icon {...props} icon="check" color="#3B82F6" /> : null
                      }
                      onPress={() => {
                        handleChange('category', category.value);
                        setCategoryModalVisible(false);
                      }}
                      style={[
                        styles.listItem,
                        formData.category === category.value && styles.selectedListItem
                      ]}
                    />
                  ))}
                </Card.Content>
                <Card.Actions>
                  <Button onPress={() => setCategoryModalVisible(false)}>
                    Cancel
                  </Button>
                </Card.Actions>
              </Card>
            </Modal>

            {/* Package Selection Modal */}
            <Modal 
              visible={packageModalVisible} 
              onDismiss={() => setPackageModalVisible(false)}
              contentContainerStyle={styles.modalContainer}
            >
              <Card>
                <Card.Title 
                  title="Select Package" 
                  titleVariant="titleLarge"
                  left={(props) => <IconButton {...props} icon="package-variant" />}
                />
                <Card.Content>
                  {packages.map((pkg) => (
                    <Card 
                      key={pkg.value} 
                      mode="outlined" 
                      style={[
                        styles.packageCard,
                        formData.package === pkg.value && styles.selectedPackageCard
                      ]}
                      onPress={() => {
                        handleChange('package', pkg.value);
                        setPackageModalVisible(false);
                      }}
                    >
                      <Card.Content>
                        <Surface style={styles.packageHeader} elevation={0}>
                          <Text variant="titleMedium" style={styles.packageName}>
                            {pkg.label}
                          </Text>
                          <Chip mode="outlined" compact>
                            {pkg.price}
                          </Chip>
                        </Surface>
                        <Text variant="bodyMedium" style={styles.packageDescription}>
                          {pkg.description}
                        </Text>
                        {formData.package === pkg.value && (
                          <Surface style={styles.selectedIndicator} elevation={0}>
                            <List.Icon icon="check-circle" color="#10B981" />
                            <Text variant="bodySmall" style={styles.selectedText}>
                              Selected
                            </Text>
                          </Surface>
                        )}
                      </Card.Content>
                    </Card>
                  ))}
                </Card.Content>
                <Card.Actions>
                  <Button onPress={() => setPackageModalVisible(false)}>
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
                    value={formData.name}
                    onChangeText={(text) => handleChange('name', text)}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.name}
                    returnKeyType="next"
                  />
                  <HelperText type="error" visible={!!errors.name}>
                    {errors.name}
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
                    >
                      {formatDate(formData.startDate)}
                    </Button>
                    {showStartDatePicker && (
                      <DateTimePicker
                        value={formData.startDate}
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
                    >
                      {formatDate(formData.endDate)}
                    </Button>
                    {showEndDatePicker && (
                      <DateTimePicker
                        value={formData.endDate}
                        mode="date"
                        display="default"
                        onChange={handleEndDateChange}
                        minimumDate={formData.startDate}
                      />
                    )}
                  </Surface>
                </Surface>

                {/* Start and End Time */}
                <Surface style={styles.row} elevation={0}>
                  <Surface style={styles.dateInput} elevation={0}>
                    <Text variant="bodyMedium" style={styles.label}>
                      Start Time *
                    </Text>
                    <Button
                      mode="outlined"
                      onPress={() => setShowStartTimePicker(true)}
                      icon="clock"
                      style={styles.dateButton}
                    >
                      {formatTime(formData.startTime)}
                    </Button>
                    {showStartTimePicker && (
                      <DateTimePicker
                        value={formData.startTime}
                        mode="time"
                        display="default"
                        onChange={handleStartTimeChange}
                      />
                    )}
                  </Surface>

                  <Surface style={styles.dateInput} elevation={0}>
                    <Text variant="bodyMedium" style={styles.label}>
                      End Time *
                    </Text>
                    <Button
                      mode="outlined"
                      onPress={() => setShowEndTimePicker(true)}
                      icon="clock"
                      style={styles.dateButton}
                    >
                      {formatTime(formData.endTime)}
                    </Button>
                    {showEndTimePicker && (
                      <DateTimePicker
                        value={formData.endTime}
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
                    value={formData.location}
                    onChangeText={(text) => handleChange('location', text)}
                    mode="outlined"
                    style={styles.input}
                    error={!!errors.location}
                    returnKeyType="next"
                  />
                  <HelperText type="error" visible={!!errors.location}>
                    {errors.location}
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
                    >
                      {getSelectedPackage()}
                    </Button>
                  </Surface>
                </Surface>

                {/* Excel File Upload */}
                <Surface style={styles.uploadContainer} elevation={0}>
                  <Text variant="bodyMedium" style={styles.label}>
                    Guest List (Excel File) {!existingFile && '*'}
                  </Text>
                  <Button
                    mode="contained"
                    onPress={pickDocument}
                    icon="file-upload"
                    style={styles.uploadButton}
                  >
                    Upload Excel File
                  </Button>
                  
                  {formData.fileName && (
                    <Surface style={[
                      styles.fileInfo, 
                      uploadStatus === 'success' ? styles.successFile : styles.defaultFile
                    ]} elevation={1}>
                      <IconButton icon="file-document" size={20} iconColor={uploadStatus === 'success' ? '#10B981' : '#6B7280'} />
                      <Surface style={styles.fileInfoContent} elevation={0}>
                        <Text variant="bodyMedium" style={styles.fileName}>
                          {formData.fileName}
                        </Text>
                        <Text variant="bodySmall" style={styles.fileStatus}>
                          {uploadStatus === 'success' 
                            ? 'File successfully uploaded. This will replace your existing guest list.'
                            : 'Please upload an Excel file with your guest list.'}
                        </Text>
                      </Surface>
                    </Surface>
                  )}
                  
                  {!formData.fileName && !existingFile && (
                    <Text variant="bodySmall" style={styles.uploadHint}>
                      Upload an Excel file (.xlsx, .xls) or CSV containing your guest list
                    </Text>
                  )}
                </Surface>

                {/* Description */}
                <View style={styles.inputContainer}>
                  <TextInput
                    label="Description *"
                    value={formData.description}
                    onChangeText={(text) => handleChange('description', text)}
                    mode="outlined"
                    style={[styles.input, styles.textArea]}
                    multiline
                    numberOfLines={4}
                    error={!!errors.description}
                    blurOnSubmit={true}
                    returnKeyType="done"
                  />
                  <HelperText type="error" visible={!!errors.description}>
                    {errors.description}
                  </HelperText>
                </View>

                {/* Form Actions */}
                <Surface style={styles.actions} elevation={0}>
                  <Button
                    mode="outlined"
                    onPress={() => navigation.goBack()}
                    style={styles.cancelButton}
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
    backgroundColor: '#F0F4F8',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  loadingText: {
    marginTop: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  title: {
    color: '#1F2937',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    textAlign: 'center',
  },
  formCard: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    marginBottom: 0,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  dateInput: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  dateButton: {
    marginTop: 4,
  },
  label: {
    marginBottom: 8,
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
  },
  durationValue: {
    color: '#059669',
    fontWeight: 'bold',
  },
  pickerContainer: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  pickerButton: {
    marginTop: 4,
  },
  pickerButtonContent: {
    justifyContent: 'space-between',
  },
  uploadContainer: {
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  uploadButton: {
    marginBottom: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  existingFile: {
    backgroundColor: '#EFF6FF',
  },
  defaultFile: {
    backgroundColor: '#F9FAFB',
  },
  successFile: {
    backgroundColor: '#ECFDF5',
  },
  fileInfoContent: {
    flex: 1,
    marginLeft: 12,
    backgroundColor: 'transparent',
  },
  fileName: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#374151',
  },
  fileStatus: {
    color: '#6B7280',
  },
  uploadHint: {
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 20,
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 1,
    marginLeft: 8,
  },
  // Modal Styles
  modalContainer: {
    padding: 20,
    margin: 20,
  },
  listItem: {
    paddingVertical: 8,
    borderRadius: 8,
  },
  selectedListItem: {
    backgroundColor: '#EFF6FF',
  },
  packageCard: {
    marginBottom: 8,
    borderColor: '#E5E7EB',
  },
  selectedPackageCard: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
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
  },
  packageDescription: {
    color: '#6B7280',
    marginBottom: 8,
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  selectedText: {
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '500',
  },
  bottomPadding: {
    height: Platform.OS === 'ios' ? 40 : 20,
  },
};

export default EditEvent;