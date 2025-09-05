import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/Colors';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  recipient_id: string;
  is_read: boolean;
  created_at: string;
  sender_username?: string;
  sender_full_name?: string;
  sender_profile_picture?: string;
}

const ChatScreen = () => {
  const { isDarkMode, user: loggedInUser } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);

  const recipientId = params.recipientId as string;
  const recipientName = params.recipientName as string;

  // Consistent color scheme using Colors.ts
  const backgroundColor = !isDarkMode ? Colors.light.background : Colors.dark.background;
  const textColor = !isDarkMode ? Colors.light.text : Colors.dark.text;
  const textInputColor = !isDarkMode ? Colors.light.textInput : Colors.dark.textInput;
  const placeholderColor = !isDarkMode ? Colors.light.placeholderText : Colors.dark.placeholderText;
  const trackColor = !isDarkMode ? Colors.light.track : Colors.dark.track;
  
  // Additional theme colors for chat bubbles and header
  const headerBackgroundColor = !isDarkMode ? Colors.light.textInput : Colors.dark.textInput;
  const myMessageBubbleColor = '#5CAEF1'; // Keep brand color for sent messages
  const theirMessageBubbleColor = trackColor; // Use theme track color for received messages
  const myMessageTextColor = '#FFFFFF'; // White text on blue bubble
  const theirMessageTextColor = textColor; // Theme text color for received messages

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMessages = async (isRefresh = false) => {
    if (!loggedInUser?.id || !recipientId) {
      setIsLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/messages/conversation/${loggedInUser.id}/${recipientId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMessages(data.messages);
          
          // Scroll to bottom after fetching messages (only if not refreshing)
          if (!isRefresh && data.messages.length > 0) {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }, 100);
          }
        }
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [loggedInUser?.id, recipientId]);

  // Auto-refresh messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSending && !refreshing) {
        fetchMessages(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isSending, refreshing]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMessages(true);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !loggedInUser?.id || !recipientId) {
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender_id: loggedInUser.id,
          recipient_id: recipientId,
          content: messageText.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Add the new message to the list
        setMessages(prev => [...prev, data.message]);
        setMessageText('');
        
        // Scroll to bottom immediately after sending
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 50);
      } else {
        Alert.alert('Error', data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Network error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isFromMe = item.sender_id === loggedInUser?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isFromMe ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isFromMe 
            ? [styles.myMessageBubble, { backgroundColor: myMessageBubbleColor }]
            : [styles.theirMessageBubble, { backgroundColor: theirMessageBubbleColor }]
        ]}>
          <Text style={[
            styles.messageText,
            { color: isFromMe ? myMessageTextColor : theirMessageTextColor }
          ]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.chatHeader, { backgroundColor }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowLeft size={24} color={textColor} />
          </TouchableOpacity>
          
          <View style={[styles.chatHeaderBubble, { backgroundColor: headerBackgroundColor }]}>
            <Image 
              source={
                params.profilePictureUrl 
                  ? { uri: params.profilePictureUrl }
                  : require('../../../assets/images/avatar_1.png')
              } 
              style={styles.chatProfilePicture}
            />
            <View style={styles.chatHeaderInfo}>
              <Text style={[styles.chatName, { color: textColor }]}>
                {recipientName || 'Chat'}
              </Text>
              <Text style={[styles.chatUsername, { color: placeholderColor }]}>
                @{recipientName?.toLowerCase().replace(/\s+/g, '_') || 'user'}
              </Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={[styles.messagesList, { backgroundColor }]}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={textColor}
            />
          }
          onContentSizeChange={() => {
            // Scroll to bottom when content size changes (new messages added)
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          onLayout={() => {
            // Scroll to bottom when layout changes
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
        />

        {/* Message Input */}
        <View style={[styles.messageInputContainer, { backgroundColor }]}>
          <View style={[styles.messageInputWrapper, { backgroundColor: textInputColor }]}>
            <TextInput
              style={[styles.messageInput, { color: textColor }]}
              placeholder="Send a message..."
              placeholderTextColor={placeholderColor}
              value={messageText}
              onChangeText={setMessageText}
              multiline
              maxLength={500}
              editable={!isSending}
            />
            
            <TouchableOpacity 
              style={[styles.messageSendButton, { opacity: isSending ? 0.5 : 1 }]}
              onPress={handleSendMessage}
              disabled={isSending}
            >
              <Ionicons name="send" size={20} color={myMessageBubbleColor} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header Styles
  chatHeader: {
    width: '100%',
    paddingHorizontal: 15,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  
  backButton: {
    position: 'absolute',
    left: 15,
    zIndex: 1,
  },
  
  chatHeaderBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
    width: '90%',
    marginLeft: '10%',
    justifyContent: 'flex-start',
  },
  
  chatHeaderInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  
  chatProfilePicture: {
    width: 50,
    height: 50,
    borderRadius: 20,
    marginRight: 12,
  },

  chatName: {
    fontSize: 18,
    fontFamily: 'Poppins-Regular',
  },

  chatUsername: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },

  // Messages Styles
  messagesList: {
    flex: 1,
  },

  messagesContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },

  messageContainer: {
    marginVertical: 5,
  },

  myMessageContainer: {
    alignItems: 'flex-end',
  },

  theirMessageContainer: {
    alignItems: 'flex-start',
  },

  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },

  myMessageBubble: {
    // backgroundColor set dynamically
  },

  theirMessageBubble: {
    // backgroundColor set dynamically
  },

  messageText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },

  // Input Styles
  messageInputContainer: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
  },

  messageInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },

  messageInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    padding: 5,
  },

  messageSendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ChatScreen;