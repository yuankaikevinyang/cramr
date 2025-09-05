import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useUser } from '../../contexts/UserContext';

export default function StudyTools() {
  const router = useRouter();
  const navigation = useNavigation();

  // Colors
  const {isDarkMode, toggleDarkMode} = useUser();
  const backgroundColor = (!isDarkMode ? Colors.light.background : Colors.dark.background);
  const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text);
  const textInputColor = (!isDarkMode ? Colors.light.textInput : Colors.dark.textInput);

  const [currentPage, setCurrentPage] = useState('studyTools');

  const handleNavigation = (page: string) => {
    if (currentPage !== page) {
      setCurrentPage(page);
      if (page === 'listView') router.push('/List');
      if (page === 'map') router.push('/Map/map');
      if (page === 'addEvent') router.push('/CreateEvent/createevent');
      if (page === 'studyTools') router.push('/StudyTools/StudyTools');
      if (page === 'profile') router.push('/Profile/Internal');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <TouchableOpacity onPress={() => router.push('/List')}>
          <Image source={require('../../assets/images/cramr_logo.png')} style={[styles.logoContainer]} />
        </TouchableOpacity>

        <Text style={[styles.heading, { color: textColor }]}>Study Tools</Text>

        <TouchableOpacity
        style={[styles.item, { backgroundColor: textInputColor, flexDirection: 'row' }]}
        onPress={() => router.push('/StudyTools/PomodoroTimer')}
        >
          <Ionicons name="alarm" size={20} color={textColor} style={{ marginRight: 10 }} />
          <Text style={[styles.itemText, { color: textColor }]}>Pomodoro</Text>
        </TouchableOpacity>

        <TouchableOpacity
        style={[styles.item, { backgroundColor: textInputColor, flexDirection: 'row' }]}
        onPress={() => router.push('/StudyTools/AmbientNoise')}
        >
          <Ionicons name="musical-notes-outline" size={20} color={textColor} style={{ marginRight: 10 }} />
          <Text style={[styles.itemText, { color: textColor }]}>Music</Text>
        </TouchableOpacity>

        <TouchableOpacity
        style={[styles.item, { backgroundColor: textInputColor, flexDirection: 'row' }]}
        onPress={() => router.push('/StudyTools/FlashcardsList')}
        >
          <Ionicons name="flash" size={20} color={textColor} style={{ marginRight: 10 }} />
          <Text style={[styles.itemText, { color: textColor }]}>Flashcards</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Bottom Navigation - Moved outside ScrollView */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
            borderTopColor: isDarkMode ? '#4a5568' : '#e0e0e0',
          },
        ]}
      >
        <TouchableOpacity style={styles.navButton} onPress={() => handleNavigation('listView')}>
          <MaterialCommunityIcons
            name="clipboard-list-outline"
            size={24}
            color={isDarkMode ? '#ffffff' : '#000000'}
          />
          {currentPage === 'listView' && <View style={styles.activeDot} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => handleNavigation('map')}>
          <Ionicons name="map-outline" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
          {currentPage === 'map' && <View style={styles.activeDot} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => handleNavigation('addEvent')}>
          <Feather name="plus-square" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
          {currentPage === 'addEvent' && <View style={styles.activeDot} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => handleNavigation('studyTools')}>
          <Feather name="tool" size={24} color={isDarkMode ? '#ffffff' : '#000000'} />
          {currentPage === 'studyTools' && <View style={styles.activeDot} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => handleNavigation('profile')}>
          <Ionicons
            name="person-circle-outline"
            size={24}
            color={isDarkMode ? '#ffffff' : '#000000'}
          />
          {currentPage === 'profile' && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Add padding to prevent content from being hidden behind nav bar
  },
  logoContainer: {
    height: 27,
    width: 120,
    marginBottom: 20,
    marginTop: -4,
  },
  heading: {
    fontSize: 18,
    alignSelf: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins-Bold',
  },
  backArrowImage: {
    width: 25,
    height: 25,
  },
  backButton: {
    width: 25,
    height: 25,
    marginBottom: 12,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
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