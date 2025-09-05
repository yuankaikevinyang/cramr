import Slider from '@/components/Slider';
import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import FollowersDropdown from '../../components/FollowersDropdown';
import { Colors } from '../../constants/Colors';

const EditEventScreen = () => {
  const router = useRouter();
  const { eventId } = useLocalSearchParams();
  
  // Predefined study session tags
  const studyTags = [
    'Pomodoro',
    'Music',
    'Quiet',
    'Group Study',
    'Flash Cards',
    'Note Taking',
    'Reading',
    'Research',
    'Exam Prep',
    'Discussion',
    'Problem Sets',
    'Collaborative'
  ];

  // State for theme
  const {isDarkMode, toggleDarkMode, user} = useUser();
  
  // Consistent color usage from Colors.ts
  const backgroundColor = isDarkMode ? Colors.dark.background : Colors.light.background;
  const textColor = isDarkMode ? Colors.dark.text : Colors.light.text;
  const textInputColor = isDarkMode ? Colors.dark.textInput : Colors.light.textInput;
  const placeholderColor = isDarkMode ? Colors.dark.placeholderText : Colors.light.placeholderText;
  const dividerColor = isDarkMode ? Colors.dark.divider : Colors.light.divider;
  const cancelButtonColor = isDarkMode ? Colors.dark.cancelButton : Colors.light.cancelButton;

  // Other state variables
  const [isOnline, setIsOnline] = useState(false);
  const [eventFormat, setEventFormat] = useState('In-Person');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [virtualRoomLink, setVirtualRoomLink] = useState('');
  const [studyRoom, setStudyRoom] = useState('');
  const [classField, setClassField] = useState('');
  const [dateTime, setDateTime] = useState(() => {
    const now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [capacity, setCapacity] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [currentPage, setCurrentPage] = useState('addEvent');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Theme object using consistent Colors.ts values
  const theme = {
    backgroundColor: backgroundColor,
    textColor: textColor,
    inputBackground: textInputColor,
    placeholderColor: placeholderColor,
    rsvpBackground: '#5CAEF1',
    rsvpText: '#ffffff',
    cardBackground: isDarkMode ? '#2d2d2d' : '#ffffff',
    navBackground: isDarkMode ? '#2d2d2d' : '#ffffff',
    navBorder: isDarkMode ? '#4a5568' : '#e0e0e0',
  };

  // Function to handle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Load event data when component mounts
  useEffect(() => {
    loadEventData();
  }, []);

  useEffect(() => {
    eventFormat === 'In-Person' && setIsOnline(false);
    eventFormat === 'Online' && setIsOnline(true);
  }, [eventFormat]);

  const loadEventData = async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}`);
      console.log('Event id:' + eventId);
      if (!response.ok) {
        throw new Error('Failed to load event');
      }
      const eventData = await response.json();
      
      // Populate form fields with event data
      setTitle(eventData.title || '');
      setDescription(eventData.description || '');
      setLocation(eventData.location || '');
      
      // Handle class field (split into department and number)
      setClassField(eventData.class || '');
      
      setCapacity(eventData.capacity?.toString() || '');
      setSelectedTags(eventData.tags || []);

      setIsOnline(eventData.event_format === 'Online');

      if (eventData.date_and_time) {
        const eventDate = new Date(eventData.date_and_time);
        if (!isNaN(eventDate.getTime())) {
          setDateTime(eventDate);
        }
      }
      
      // Set online/offline based on location
      setIsOnline(eventData.event_format === 'Online');
      setVirtualRoomLink(eventData.virtual_room_link || '');
      setStudyRoom(eventData.study_room || '');

    } catch (error) {
      console.error('Error loading event:', error);
      Alert.alert('Error', 'Failed to load event data');
    }
  };

 // Helper function to format date string (use UTC)
const formatDate = (dateAndTime: Date | string | null) => {
  if (!dateAndTime) return 'Select Date';
  try {
    const date = new Date(dateAndTime);
    if (isNaN(date.getTime())) return 'Select Date';
    
    // Use UTC methods
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    
    return `${month}/${day}/${year}`;
  } catch {
    return 'Select Date';
  }
};

// Helper function to format time string (use UTC)
const formatTime = (dateAndTime: Date | string | null) => {
  if (!dateAndTime) return 'Select Time';
  try {
    const date = new Date(dateAndTime);
    if (isNaN(date.getTime())) return 'Select Time';
    
    // Use UTC methods
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    
    const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const minutesStr = minutes.toString().padStart(2, '0');
    
    return `${hour12}:${minutesStr} ${ampm}`;
  } catch {
    return 'Select Time';
  }
};

  // Updated onChange handlers from create event
  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      // Combine the selected date with the current time
      const newDateTime = new Date(selectedDate);
      newDateTime.setHours(dateTime.getHours());
      newDateTime.setMinutes(dateTime.getMinutes());
      setDateTime(newDateTime);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (selectedTime) {
      // Convert the selected UTC time back to local time
      const utcTime = new Date(selectedTime.getTime() - selectedTime.getTimezoneOffset() * 60000);
      
      // Combine the selected time with the current date
      const newDateTime = new Date(dateTime);
      newDateTime.setHours(utcTime.getHours());
      newDateTime.setMinutes(utcTime.getMinutes());
      setDateTime(newDateTime);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    setIsSubmitting(true);
    try {
      const eventData = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        class: classField.trim(),
        date_and_time: dateTime,
        tags: selectedTags,
        capacity: parseInt(capacity) || 5,
        virtual_room_link: virtualRoomLink.trim(),
        study_room: studyRoom.trim(),
        event_format: isOnline ? 'Online' : 'In-Person',

      };

      console.log('Saving event data:', { eventId, eventData, user: user?.id });

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      console.log('Save response status:', response.status);
      const responseText = await response.text();
      console.log('Save response body:', responseText);

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      const result = JSON.parse(responseText);
      Alert.alert('Success', 'Event updated successfully', [
      ]);
      router.back();
    } catch (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const handleDeleteModal = async () => {
    setIsDeleteModalVisible(true);
  };

  const handleCancelDelete = async () => {
    setIsDeleteModalVisible(false);
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      Alert.alert('Success', 'Event deleted successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', 'Failed to delete event');
    } finally {
      setIsSubmitting(false);
      setIsDeleteModalVisible(false);
    }
  };

  const handleNavigation = (page: string) => {
    if (currentPage !== page) {
      setCurrentPage(page);
      if (page === 'listView') {
        router.push('/List');
      } else if (page === 'map') {
        router.push('/Map/map');
      } else if (page === 'addEvent') {
        // Already on addEvent page, no navigation needed
      } else if (page === 'bookmarks') {
        // router.push('/bookmarks');
      } else       if (page === 'profile') {
        router.push('/Profile/Internal');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <KeyboardAwareScrollView
        style={{ flex: 1, backgroundColor }}
        contentContainerStyle={styles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={50}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft color={textColor} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.headerText, { color: textColor, marginTop: -25, marginBottom: 20 }]}>Edit Event</Text>
          </View>

          <Text style={[styles.subheaderText, { color: textColor, marginBottom: 5 }]}> Name </Text>
          <TextInput
            placeholder="Enter name of event."
            placeholderTextColor={placeholderColor}
            value={title}
            onChangeText={setTitle}
            style={[styles.input, { color: textColor, backgroundColor: textInputColor }]}
          />

          <Text style={[styles.subheaderText, { color: textColor, marginBottom: 10 }]}> Tags </Text>
          <View style={styles.tagsContainer}>
            {studyTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagButton,
                  {
                    borderColor: selectedTags.includes(tag) ? textColor : 'transparent',
                    backgroundColor: textInputColor
                  }
                ]}
                onPress={() => toggleTag(tag)}
              >
                <Text
                  style={[
                    styles.tagText,
                    {
                      color: textColor
                    }
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={[styles.subheaderText, { color: textColor, marginBottom: 5 }]}> Class/Subject </Text>
          <View style={{flexDirection: 'row', justifyContent: 'space-between', width: 100}}>
            <TextInput
            placeholder="Ex.: CSE 100"
            placeholderTextColor={placeholderColor}
            value={classField}
            onChangeText={setClassField}
            style={[styles.input, { color: textColor, backgroundColor: textInputColor, width: 100 }]}
            />
          </View>

          <Text style={[styles.subheaderText, { color: textColor, marginBottom: 5 }]}> Location </Text>
          <Slider
            leftLabel='In-Person'
            rightLabel='Online  '
            onChangeSlider={setIsOnline}
            value={isOnline}
            width={210}
            lightMode={!isDarkMode}
            style={{ marginBottom: 10 }}
          />
          {isOnline === false && (
            <>
              <TextInput
                placeholder="Enter address."
                placeholderTextColor={placeholderColor}
                value={location}
                onChangeText={setLocation}
                style={[styles.input, { color: textColor, backgroundColor: textInputColor }]}
              />
              <TextInput
                placeholder="Enter study room."
                placeholderTextColor={placeholderColor}
                value={studyRoom}
                onChangeText={setStudyRoom}
                style={[styles.input, { color: textColor, backgroundColor: textInputColor, width: 150 }]}
              />
            </>
          )}
          {isOnline === true && (
            <TextInput
              placeholder="Enter link to virtual study room."
              placeholderTextColor={placeholderColor}
              value={virtualRoomLink}
              onChangeText={setVirtualRoomLink}
              style={[styles.input, { color: textColor, backgroundColor: textInputColor }]}
            />
          )}

          {/* Date/Time Picker - Updated to match create event */}
          <Text style={[styles.subheaderText, { color: textColor, marginBottom: 5 }]}> Date & Time </Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              style={[styles.dateTimeButton, { backgroundColor: textInputColor, borderWidth: 0 }]}
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Ionicons name="calendar-outline" size={20} color={textColor} />
              <Text style={[styles.normalText, { color: textColor }]}>
                {formatDate(dateTime)}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.dateTimeButton, { backgroundColor: textInputColor, borderWidth: 0 }]}
              onPress={() => setShowTimePicker(!showTimePicker)}
            >
              <Ionicons name="time-outline" size={20} color={textColor} />
              <Text style={[styles.normalText, { color: textColor }]}>
                {formatTime(dateTime)}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.subheaderText, { color: textColor, marginBottom: 5 }]}> Capacity </Text>
          <View style={{ flexDirection: "row", justifyContent: 'space-between', alignItems: 'center', width: 100 }}>
            <TextInput
              placeholder="5"
              placeholderTextColor={placeholderColor}
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="numeric"
              style={[styles.input, { color: textColor, backgroundColor: textInputColor, width: 50 }]}
            />
            <Text style={[styles.normalText, { color: textColor, marginLeft: 5, marginBottom: 13 }]}> people </Text>
          </View>

          {/* Invite People Dropdown */}
          <Text style={[styles.subheaderText, { color: textColor, marginBottom: 5 }]}> People </Text>
          <FollowersDropdown
            selectedFriends={selectedFriends}
            onFriendsChange={setSelectedFriends}
            theme={theme}
            isDarkMode={isDarkMode}
          />

          <Text style={[styles.subheaderText, { color: textColor, marginBottom: 5 }]}> Description </Text>
          <TextInput
            placeholder="Enter description."
            placeholderTextColor={placeholderColor}
            value={description}
            onChangeText={setDescription}
            multiline
            style={[styles.input, styles.textArea, { color: textColor, backgroundColor: textInputColor }]}
          />
          
          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSave}
            style={[styles.saveButton, { backgroundColor: '#5CAEF1' }]}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.subheaderText, { color: textColor}]}>
                  Saving...
                </Text>
              </View>
            ) : (
              <Text style={[styles.subheaderText, { color: textColor }]}>
                Save
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 0.5, backgroundColor: dividerColor, marginTop: 15, marginBottom: 5 }} />

          {/* Delete Button */}
          <TouchableOpacity
            onPress={handleDeleteModal}
            style={[styles.saveButton, { backgroundColor: '#E36062' }]}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.subheaderText, { color: textColor}]}>
                  Deleting...
                </Text>
              </View>
            ) : (
              <Text style={[styles.subheaderText, { color: textColor }]}>
                Delete
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* Date Picker Modal - Updated to match create event */}
      {showDatePicker && (
        <DateTimePicker
          value={dateTime}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onDateChange}
          minimumDate={new Date()}
          themeVariant={isDarkMode ? 'dark' : 'light'}
          textColor={isDarkMode ? '#FFFFFF' : '#000000'}
        />
      )}

      {/* Time Picker Modal - Updated to match create event */}
      {showTimePicker && (
        <DateTimePicker
          value={new Date(dateTime.getTime() + dateTime.getTimezoneOffset() * 60000)}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
          themeVariant={isDarkMode ? 'dark' : 'light'}
          textColor={isDarkMode ? '#FFFFFF' : '#000000'}
        />
      )}

        <Modal
            animationType="fade"
            transparent={true}
            visible={isDeleteModalVisible}
            onRequestClose={handleDelete}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, {backgroundColor: backgroundColor, padding: 15}]}>
                    <Text style={[styles.normalText, {color: textColor, textAlign: 'center', marginTop: 10}]}>
                        Delete event?
                    </Text>
                        
                    <View style={{flexDirection: 'row', gap: 10, width: '100%', marginTop: 20}}>
                        <TouchableOpacity
                            style={{flex: 1, backgroundColor: cancelButtonColor, height: 35, borderRadius: 10, alignItems: 'center', justifyContent: 'center'}}
                            onPress={handleCancelDelete}
                        >
                            <Text style={[styles.normalText, {color: textColor}]}>Cancel</Text>
                        </TouchableOpacity>
                          
                        <TouchableOpacity
                            style={{flex: 1, backgroundColor: '#E36062', height: 35, borderRadius: 10, alignItems: 'center', justifyContent: 'center'}}
                            onPress={handleDelete}
                        >
                            <Text style={[styles.normalText, {color: textColor}]}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
        </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Text
  headerText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
  },
  subheaderText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
  },
  subheaderBoldText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  normalText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  normalBoldText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },

  container: {
    flex: 1,
  },
  logoContainer: {
    height: 27,
    width: 120,
  },
  scrollContent: {
    paddingBottom: 50, // Reduced padding
  },
  content: {
    padding: 20,
    paddingBottom: 40, // Extra space at bottom
  },
  input: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
    fontFamily: 'Poppins-Regular'
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  // New tag styles
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    gap: 8,
  },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 5,
  },
  tagText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
  },
  saveButton: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  loadingContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#5CAEF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12, 
    zIndex: 1001, 
  },
  navButton: {
    alignItems: 'center',
    padding: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5caef1',
    position: 'absolute',
    bottom: -5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 0,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default EditEventScreen;