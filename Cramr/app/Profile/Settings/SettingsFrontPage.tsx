import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { useUser } from '../../../contexts/UserContext';

import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors } from '../../../constants/Colors';

const SettingsFrontPage = () => {
  const router = useRouter();
  const { logout } = useUser();

  const [modalVisible, setModalVisible] = useState(false);

  // Colors
  const {isDarkMode, toggleDarkMode} = useUser();
  const backgroundColor = (!isDarkMode ? Colors.light.background : Colors.dark.background);
  const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text);
  const textInputColor = (!isDarkMode ? Colors.light.textInput : Colors.dark.textInput);

  const handleSignOut = async () => {
    try {
      await logout();
      setModalVisible(false);
      router.push('/SignIn/Loginscreen');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

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

        <Text style={[styles.heading, { color: textColor, marginTop: -40 }]}>Settings</Text>

        <TouchableOpacity
        style={[styles.item, { backgroundColor: textInputColor }]}
        onPress={() => router.push('../Settings/Profile')}
        >
        <Text style={[styles.itemText, { color: textColor }]}>Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
        style={[styles.item, { backgroundColor: textInputColor }]}
        onPress={() => router.push('../Settings/AccountPage')}
        >
        <Text style={[styles.itemText, { color: textColor }]}>Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
        style={[styles.item, { backgroundColor: textInputColor }]}
        onPress={() => router.push('../Settings/PreferencesPage')}
        >
        <Text style={[styles.itemText, { color: textColor }]}>Preferences</Text>
        </TouchableOpacity>

        <TouchableOpacity
        style={[styles.item, { backgroundColor: textInputColor }]}
        onPress={() => router.push('../Settings/AboutPage')}
        >
        <Text style={[styles.itemText, { color: textColor }]}>About</Text>
        </TouchableOpacity>


        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={[styles.signOutText, { color: textColor }]}>Sign out</Text>
        </TouchableOpacity>

        {/* Sign-out Confirmation Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <View style={[styles.modalCard, { backgroundColor: textInputColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Sign out?</Text>
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleSignOut}
                >
                  <Text style={styles.confirmText}>Yes</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor moved to inline style
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
  signOutButton: {
    backgroundColor: '#5CAEF1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  signOutText: {
    // color moved to inline style
    fontSize: 16,
    fontWeight: '600',
    // textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    // backgroundColor moved to inline style
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  modalButton: {
    padding: 10,
    borderRadius: 10,
  },
  cancelButton: {
    backgroundColor: '#E5E5E5',
    paddingHorizontal: 15
  },
  confirmButton: {
    backgroundColor: '#5CAEF1',
    paddingHorizontal: 25
  },
  cancelText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Poppins-Regular',
  },
  confirmText: {
    fontSize: 16,
    color: '#000000',
    fontFamily: 'Poppins-Regular',
  },
});

export default SettingsFrontPage