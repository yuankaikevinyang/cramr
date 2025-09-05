import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';

import React, { useEffect, useState } from 'react';
import {
    FlatList,
    Image,
    RefreshControl,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../../../constants/Colors';

interface Conversation {
  conversation_id: string;
  other_user: {
    id: string;
    username: string;
    full_name: string;
    profile_picture_url?: string;
  };
  last_message: {
    id: string;
    content: string;
    is_from_me: boolean;
    created_at: string;
  };
}

const Messages = () => {
  const { isDarkMode, user: loggedInUser } = useUser();
  const router = useRouter();

  const backgroundColor = !isDarkMode ? Colors.light.background : Colors.dark.background;
  const textColor = !isDarkMode ? Colors.light.text : Colors.dark.text;
  const cardBackgroundColor = !isDarkMode ? '#fff' : '#2d2d2d';
  const borderColor = !isDarkMode ? '#e0e0e0' : '#4a5568';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConversations = async () => {
    if (!loggedInUser?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${loggedInUser.id}/conversations`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setConversations(data.conversations);
        }
      } else {
        console.error('Failed to fetch conversations');
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [loggedInUser?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const removeConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(c => c.conversation_id !== conversationId));
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = diffInHours / 24;
      return `${Math.floor(diffInDays)}d ago`;
    }
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[styles.messageContainer, { backgroundColor: cardBackgroundColor, borderColor }]}
      onPress={() => router.push({
        pathname: 'List/Messages/chat' as any,
        params: { 
          recipientId: item.other_user.id,
          recipientName: item.other_user.full_name,
          profilePictureUrl: item.other_user.profile_picture_url
        }
      })}
    >
      <Image 
        source={
          item.other_user.profile_picture_url 
            ? { uri: item.other_user.profile_picture_url }
            : require('../../../assets/images/avatar_1.png')
        } 
        style={styles.avatar}
      />
      <View style={styles.messageInfo}>
        <Text style={[styles.name, { color: textColor }]}>{item.other_user.full_name}</Text>
        <Text style={[styles.lastMessage, { color: textColor }]}>
          {item.last_message.is_from_me ? 'You: ' : ''}{item.last_message.content}
        </Text>
        <Text style={[styles.timeAgo, { color: textColor }]}>
          {formatTimeAgo(item.last_message.created_at)}
        </Text>
      </View>
      {/* <TouchableOpacity
        onPress={() => removeConversation(item.conversation_id)}
        style={styles.removeButton}
      >
        <Ionicons name="close" size={22} color="#E36062" />
      </TouchableOpacity> */}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={24} color={textColor} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleWrapper}>
          <Text style={[styles.headerTitle, {color: textColor}]}>Messages</Text>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('List/Messages/new' as any)}
        >
          <Ionicons name="create-outline" size={27} color={textColor}/>
        </TouchableOpacity>
      </View>



      {/* Message List */}
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.conversation_id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={textColor}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: textColor }]}>
              {isLoading ? 'Loading conversations...' : 'No conversations yet'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // ---------- Header ----------
  header: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative', // needed for absolute positioning of the button
  },
  
  backButton: {
    position: 'absolute',
    left: 20,
    marginTop: -5,
  },
  
  headerTitleWrapper: {
    position: 'absolute',
    alignItems: 'center', 
  },
  
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  
  createButton: {
    position: 'absolute',
    right: 20,
    marginTop: -5,
  },
  
  

  // ---------- Message Item ----------
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 24,
    marginRight: 12,
  },
  messageInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginTop: 2,
  },
  timeAgo: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  removeButton: {
    padding: 5,
    
  },

  // ---------- Empty State ----------
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
});

export default Messages;