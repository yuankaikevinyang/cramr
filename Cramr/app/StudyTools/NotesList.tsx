import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useUser } from '../../contexts/UserContext';

export default function NotesList() {
  const router = useRouter();

  // Colors
  const {isDarkMode, toggleDarkMode} = useUser();
  const backgroundColor = (!isDarkMode ? Colors.light.background : Colors.dark.background);
  const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text);
  const textInputColor = (!isDarkMode ? Colors.light.textInput : Colors.dark.textInput);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft 
            size={24} 
            color={textColor}
            onPress={() => router.back()}
          />
        </TouchableOpacity>

        <Text style={[styles.heading, { color: textColor }]}>Notes</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
    // backgroundColor moved to inline style
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 16,
    // color moved to inline style
    fontFamily: 'Poppins-Regular',
  },
});