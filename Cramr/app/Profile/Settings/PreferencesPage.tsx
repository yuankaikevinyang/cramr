import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView, ScrollView, StyleSheet,
  Switch,
  Text,
  TouchableOpacity
} from 'react-native';
import Slider from '../../../components/Slider';
import { Colors } from '../../../constants/Colors';
import { useUser } from '../../../contexts/UserContext';

const PreferencesPage = () => {
  const router = useRouter();

  // Colors
  const {isDarkMode, toggleDarkMode} = useUser();
  const backgroundColor = (isDarkMode ? Colors.dark.background : Colors.light.background);
  const textColor = (isDarkMode ? Colors.dark.text : Colors.light.text);
  const trackColor = (isDarkMode ? Colors.dark.track : Colors.light.track);
  const thumbColor = (isDarkMode ? Colors.dark.thumb : Colors.light.thumb);

  const [switch1, setSwitch1] = useState(false);
  const [switch2, setSwitch2] = useState(false);
  const [switch3, setSwitch3] = useState(false);

  const styles = getStyles(isDarkMode, backgroundColor, textColor);

  const { user: loggedInUser } = useUser();
  const userId = loggedInUser?.id;

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setSwitch1(data.push_notifications_enabled);
          setSwitch2(data.email_notifications_enabled);
          setSwitch3(data.sms_notifications_enabled);
        } else {
          console.error('Failed to fetch preferences:', await response.text());
        }
      } catch (err) {
        console.error('Error fetching preferences:', err);
      }
    };
  
    fetchPreferences();
  }, []);

  const handleSavePreferences = async () => {
    try {
      const payload = {
        push_notifications_enabled: switch1,
        email_notifications_enabled: switch2,
        sms_notifications_enabled: switch3,
        theme: (isDarkMode === false && "light") || (isDarkMode === true && "dark")
      };
  
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${userId}/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log('Preferences updated:', data);
        alert('Preferences saved!');
      } else {
        console.error('Failed to save preferences:', await response.text());
        alert('Failed to save preferences.');
      }
    } catch (err) {
      console.error('Error saving preferences:', err);
      alert('An error occurred.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft 
            size={24} 
            color={textColor}
          />
        </TouchableOpacity>

        <Text style={styles.heading}>Preferences</Text>

        {/* Toggles */}
          <Text style={styles.toggleLabel}>Push Notifications</Text>
          <TouchableOpacity onPress={() => setSwitch1(!switch1)}>
            <Switch
            value={switch1}
            onValueChange={setSwitch1}
            trackColor={trackColor}
            thumbColor={thumbColor}
            />
          </TouchableOpacity>
        {/*
        <View style={styles.toggleGroup}>
          <Text style={styles.toggleLabel}>Email Notifications</Text>
          <Switch
            value={switch2}
            onValueChange={setSwitch2}
            trackColor={trackColor}
            thumbColor={thumbColor}
          />
        </View>

        <View style={styles.toggleGroup}>
          <Text style={styles.toggleLabel}>SMS Notifications</Text>
          <Switch
            value={switch3}
            onValueChange={setSwitch3}
            trackColor={trackColor}
            thumbColor={thumbColor}
          />
        </View>
        */}

        <Text style={[styles.sectionTitle, { marginTop: 15 }]}>Theme</Text>
        <Slider
          leftLabel="Light"
          rightLabel="Dark"
          width={150}
          onChangeSlider={toggleDarkMode}
          style={{marginTop: 10, marginBottom: 10}}
          lightMode={!isDarkMode}
          value={isDarkMode}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSavePreferences}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// Dynamic styling based on dark mode
const getStyles = (isDarkMode: boolean, backgroundColor: string, textColor: string) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: backgroundColor,
    },
    scrollContent: {
      padding: 24,
    },
    backButton: {
      width: 30,
      height: 30,
      marginBottom: 12,
    },
    backArrowImage: {
      width: 30,
      height: 30,
    },
    heading: {
      fontSize: 18,
      alignSelf: 'center',
      marginBottom: 20,
      marginTop: -25,
      color: textColor,
      fontFamily: 'Poppins-SemiBold',
    },
    toggleGroup: {
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    toggleLabel: {
      fontSize: 16,
      color: textColor,
      marginBottom: 5,
      fontFamily: 'Poppins-Regular',
    },
    switch: {
      width: 40,
      height: 30,
    },
    sectionTitle: {
      marginTop: 5,
      fontSize: 16,
      fontWeight: '500',
      color: textColor,
      fontFamily: 'Poppins-Regular',
    },
    saveButton: {
      backgroundColor: '#5CAEF1',
      padding: 10,
      borderRadius: 12,
      marginTop: 20,
    },
    saveButtonText: {
      color: textColor,
      fontSize: 16,
      textAlign: 'center',
      fontFamily: 'Poppins-Regular',
    },
  });

export default PreferencesPage