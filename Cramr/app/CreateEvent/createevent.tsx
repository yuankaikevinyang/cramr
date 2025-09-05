import Slider from '@/components/Slider';
import { useUser } from '@/contexts/UserContext';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import GooglePlacesTextInput, { Place } from 'react-native-google-places-textinput';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import FollowersDropdown from '../../components/FollowersDropdown';
import { Colors } from '../../constants/Colors';

const CreateEventScreen = () => {
  // State for theme
  const router = useRouter();
  const { user: loggedInUser } = useUser();
  const {isDarkMode} = useUser();
  
  // Consistent color usage from Colors.ts
  const backgroundColor = isDarkMode ? Colors.dark.background : Colors.light.background;
  const textColor = isDarkMode ? Colors.dark.text : Colors.light.text;
  const textInputColor = isDarkMode ? Colors.dark.textInput : Colors.light.textInput;
  const placeholderColor = isDarkMode ? Colors.dark.placeholderText : Colors.light.placeholderText;

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

  // Other state variables
  const [title, setTitle] = useState('');
  const [bannerColor, setBannerColor] = useState(0 || null);
  const [description, setDescription] = useState('');
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [classField, setClassField] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [location, setLocation] = useState('');
  const [studyRoom, setStudyRoom] = useState('');
  const [virtualRoomLink, setVirtualRoomLink] = useState('');

  const [dateTime, setDateTime] = useState(() => {
    const now = new Date();
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [capacity, setCapacity] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentPage, setCurrentPage] = useState('addEvent');

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

  // Helper function to format date string
  const formatDate = (dateAndTime: Date | string | null) => {
    if (!dateAndTime) return 'Select Date';
    try {
      const date = new Date(dateAndTime);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Select Date';
      return date.toLocaleDateString();
    } catch {
      return 'Select Date';
    }
  };

  // Helper function to format time string
  const formatTime = (dateAndTime: Date | string | null) => {
    if (!dateAndTime) return 'Select Time';
    try {
      const date = new Date(dateAndTime);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Select Time';
      return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true  // This ensures AM/PM format
      });
    } catch {
      return 'Select Time';
    }
  };

// Fix 2: Updated onChange handlers
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
    // Combine the selected time with the current date
    const newDateTime = new Date(dateTime);
    newDateTime.setHours(selectedTime.getHours());
    newDateTime.setMinutes(selectedTime.getMinutes());
    setDateTime(newDateTime);
  }
};

  const handleSubmit = async () => {
    // Validate required fields
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event name');
      return;
    }
    if (!classField.trim()) {
      Alert.alert('Error', 'Please enter a class name');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter an event description');
      return;
    }
    
    if (isOnline) {
      // For online events, require virtual room link
      if (!virtualRoomLink.trim()) {
        Alert.alert('Error', 'Please enter a virtual room link for online events');
        return;
      }
    } else {
      // For in-person events, require location
      if (!location.trim()) {
        Alert.alert('Error', 'Please enter a location for in-person events');
        return;
      }
    }

    if (!dateTime || isNaN(dateTime.getTime())) {
      Alert.alert('Error', 'Please select a valid date and time');
      return;
    }
    if (!capacity || isNaN(Number(capacity)) || Number(capacity) <= 0) {
      Alert.alert('Error', 'Please enter a valid capacity (must be a positive number)');
      return;
    }

    setIsSubmitting(true);

    // Check if user is logged in
    if (!loggedInUser?.id) {
      Alert.alert('Error', 'You must be logged in to create an event');
      setIsSubmitting(false);
      return;
    }

    const formatForPostgres = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
    
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };
    
    const eventData = {
      creator_id: loggedInUser.id,
      title: title.trim(),
      tags: selectedTags,
      class: classField.trim(),
      event_format: isOnline ? 'Online' : 'In-Person',
      location: location.trim(),
      study_room: !isOnline && studyRoom.trim() ? studyRoom.trim() : null,
      virtual_room_link: isOnline ? virtualRoomLink.trim() : null,
      date_and_time: formatForPostgres(dateTime),
      capacity: Number(capacity),
      invitePeople: selectedFriends,
      description: description.trim(),
    };

    try {
      console.log('Creating event with data:', eventData);
      console.log('Selected friends:', selectedFriends);
      console.log('isOnline:', isOnline);
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert('Success', 'Event created successfully!');
        // Clear form after successful creation
        setTitle('');
        setDescription('');
        setLocation('');
        setStudyRoom('');
        setClassField('');
        const now = new Date();
        now.setSeconds(0);
        now.setMilliseconds(0);
        setDateTime(now);
        setSelectedTags([]);
        setCapacity('');
        setSelectedFriends([]);
        // Navigate back to home after successful creation
        router.push('/List');
        return data;
      } else {
        Alert.alert('Error', data.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Network error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePlaceSelect = (place: Place) => {
    console.log('Selected place: ', place.details);
  };

  const handleNavigation = (page: string) => {
    if (currentPage !== page) {
      setCurrentPage(page);
      if (page === 'listView') {
        router.push('/List');
      } else if (page === 'map') {
        router.push('/Map/map');
      } else if (page === 'addEvent') {

      } else if (page === 'studyTools') {
        router.push('/StudyTools/StudyTools');
      } else if (page === 'profile') {
        router.push('/Profile/Internal');
      }
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: backgroundColor }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Platform.OS === 'ios' ? 120 : 100 }]}
        enableOnAndroid={true}
        extraScrollHeight={50}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        <View style={[styles.content, { backgroundColor: backgroundColor }]}>
          {/* Header */}
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={require('../../assets/images/cramr_logo.png')} style={[styles.logoContainer]} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.headerText, { color: textColor, marginTop: 20, marginBottom: 20 }]}>Create Event</Text>
          </View>

          <Text style={[styles.subheaderText, { color: textColor, marginBottom: 5 }]}> Name </Text>
          <TextInput
            placeholder="Enter name."
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
              {/* <TextInput
                placeholder="Ex.: 9500 Gilman Drive, La Jolla, CA 92093"
                placeholderTextColor={placeholderColor}
                value={location}
                onChangeText={setLocation}
                style={[styles.input, { color: textColor, backgroundColor: textInputColor }]}
              /> */}

              <GooglePlacesTextInput
                apiKey={process.env.EXPO_PUBLIC_GOOGLE_API_KEY}
                placeHolderText='Ex.: 9500 Gilman Drive, La Jolla, CA 92093'
                placeholderTextColor={placeholderColor}
                fetchDetails={true}
                detailsField={['formatedAddress', 'location']}
                onPlaceSelect={(place) => {
                  //send the place details to the database through the formattedAddress but have it display to the user displayname.text
                  console.log(place.details?.formattedAddress); 
                  setLocation(place.details?.displayName.text);
                }}
                value={location}
                scrollEnabled={false}
                style={{
                  //style for the textInput is incompatable with GoogleTextInputStyle 
                  input: {
                    fontSize: 14,
                    borderRadius:10,
                    fontFamily: "Poppins-Regular",
                    padding: 10,
                    marginBottom: 10,
                    backgroundColor: textInputColor,
                    borderWidth: 0,
                    color: textColor,
                  }
                }}
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

          {/* Date/Time Picker */}
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
              placeholder="Ex.: 5"
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
            onPress={handleSubmit}
            style={[styles.submitButton, { backgroundColor: '#5CAEF1' }]}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <View style={styles.loadingContainer}>
                <Text style={[styles.subheaderText, { color: textColor }]}>
                  Creating...
                </Text>
              </View>
            ) : (
              <Text style={[styles.subheaderText, { color: textColor }]}>
                Create
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* Date Picker Modal */}
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

      {/* Time Picker Modal */}
      {showTimePicker && (
        <DateTimePicker
          value={dateTime}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onTimeChange}
          themeVariant={isDarkMode ? 'dark' : 'light'}
          textColor={isDarkMode ? '#FFFFFF' : '#000000'}
        />
      )}

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomNav, { backgroundColor: theme.navBackground, borderTopColor: theme.navBorder }]}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => handleNavigation('listView')}
          >
            <MaterialCommunityIcons 
              name="clipboard-list-outline" 
              size={24} 
              color={textColor} 
            />
            {currentPage === 'listView' && <View style={styles.activeDot} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => handleNavigation('map')}
          >
            <Ionicons 
              name="map-outline" 
              size={24} 
              color={textColor} 
            />
            {currentPage === 'map' && <View style={styles.activeDot} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => handleNavigation('addEvent')}
          >
            <Feather 
              name="plus-square" 
              size={24} 
              color={textColor} 
            />
            {currentPage === 'addEvent' && <View style={styles.activeDot} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => handleNavigation('studyTools')}
          >
            <Feather 
              name="tool" 
              size={24} 
              color={textColor} 
            />
            {currentPage === 'studyTools' && <View style={styles.activeDot} />}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => handleNavigation('profile')}
          >
            <Ionicons 
              name="person-circle-outline" 
              size={24} 
              color={textColor} 
            />
            {currentPage === 'profile' && <View style={styles.activeDot} />}
          </TouchableOpacity>
        </View>
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
    marginTop: -5,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
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
  submitButton: {
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
});

export default CreateEventScreen;