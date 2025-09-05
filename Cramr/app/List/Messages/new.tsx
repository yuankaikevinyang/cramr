import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import FollowersDropdown from '../../../components/FollowersDropdown';
import { Colors } from '../../../constants/Colors';

const NewMessageScreen = () => {
  const { isDarkMode, user: loggedInUser } = useUser();
  const router = useRouter();

  // Consistent color scheme using Colors.ts
  const backgroundColor = !isDarkMode ? Colors.light.background : Colors.dark.background;
  const textColor = !isDarkMode ? Colors.light.text : Colors.dark.text;
  const textInputColor = !isDarkMode ? Colors.light.textInput : Colors.dark.textInput;
  const placeholderColor = !isDarkMode ? Colors.light.placeholderText : Colors.dark.placeholderText;
  const trackColor = !isDarkMode ? Colors.light.track : Colors.dark.track;
  
  // Additional theme colors for consistent styling
  const cardBackgroundColor = !isDarkMode ? Colors.light.textInput : Colors.dark.textInput;
  const borderColor = !isDarkMode ? '#e0e0e0' : Colors.dark.track;
  const sendButtonColor = '#5CAEF1'; // Keep brand color for send button
  const sendButtonTextColor = '#FFFFFF'; // White text on blue button

  const [selectedRecipient, setSelectedRecipient] = useState<string[]>([]);
  const [messageText, setMessageText] = useState('');
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

  const handleSendMessage = async () => {
    if (selectedRecipient.length === 0 || !messageText.trim()) {
      Alert.alert('Error', 'Please select a recipient and enter a message');
      return;
    }

    if (!loggedInUser?.id) {
      Alert.alert('Error', 'You must be logged in to send a message');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send the message to the selected recipient
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_id: loggedInUser.id,
          recipient_id: selectedRecipient[0], // Only send to first selected recipient
          content: messageText.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Message sent successfully!');
        router.back();
      } else {
        Alert.alert('Error', data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Network error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Card Container */}
      <View style={[styles.whiteBox, { backgroundColor: cardBackgroundColor }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: textColor }]}>New Message</Text>
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              { 
                backgroundColor: sendButtonColor,
                opacity: selectedRecipient.length > 0 && messageText.trim() && !isSubmitting ? 1 : 0.5 
              }
            ]}
            onPress={handleSendMessage}
            disabled={selectedRecipient.length === 0 || !messageText.trim() || isSubmitting}
          >
            <Text style={[styles.sendButtonText, { color: sendButtonTextColor }]}>
              {isSubmitting ? 'Sending...' : 'Send'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Message Form */}
        <View style={styles.formContainer}>
          {/* To Field */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: textColor }]}>To:</Text>
            <FollowersDropdown
              selectedFriends={selectedRecipient}
              onFriendsChange={setSelectedRecipient}
              theme={theme}
              isDarkMode={isDarkMode}
            />
          </View>

          {/* Message Field */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: textColor }]}>Message:</Text>
            <TextInput
              style={[styles.messageInput, { 
                backgroundColor: textInputColor, 
                color: textColor,
                borderColor: borderColor
              }]}
              placeholder="Type your message here..."
              placeholderTextColor={placeholderColor}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              textAlignVertical="top"
              editable={!isSubmitting}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  whiteBox: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sendButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    borderWidth: 1,
  },
  messageInput: {
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    height: 200,
    borderWidth: 1,
  },
});

export default NewMessageScreen;