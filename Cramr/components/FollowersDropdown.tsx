import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState, } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/Colors';

interface Friend {
  id: string;
  username: string;
  full_name: string;
}

interface FollowersDropdownProps {
  selectedFriends: string[];
  onFriendsChange: (friends: string[]) => void;
  theme: any;
  isDarkMode: boolean;
}

const FollowersDropdown: React.FC<FollowersDropdownProps> = ({
  selectedFriends,
  onFriendsChange,
  theme,
  isDarkMode,
}) => {
  const { user: loggedInUser } = useUser();
  const currentUserId = loggedInUser?.id;

  // Consistent color usage from Colors.ts
  const textColor = isDarkMode ? Colors.dark.text : Colors.light.text;
  const textInputColor = isDarkMode ? Colors.dark.textInput : Colors.light.textInput;
  const placeholderColor = isDarkMode ? Colors.dark.placeholderText : Colors.light.placeholderText;

  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Load friends when component starts
  useEffect(() => {
    loadFriends();
  }, [currentUserId]);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://132.249.242.182:8080/users/${currentUserId}/following`);
      
      if (response.ok) {
        const data = await response.json();
        setFriends(data.following || []);
      }
    } catch (error) {
      console.log('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter friends based on search
  const getFilteredFriends = () => {
    if (!searchQuery) return [];
    
    return friends.filter(friend => {
      const name = (friend.full_name || friend.username).toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());
      const notAlreadySelected = !selectedFriends.includes(friend.id);
      
      return matchesSearch && notAlreadySelected;
    });
  };

  // Get selected friends for display
  const getSelectedFriends = () => {
    return friends.filter(friend => selectedFriends.includes(friend.id));
  };

  // Add or remove friend from selection
  const toggleFriend = (friendId: string) => {
    if (selectedFriends.includes(friendId)) {
      // Remove friend
      const newSelection = selectedFriends.filter(id => id !== friendId);
      onFriendsChange(newSelection);
    } else {
      // Add friend
      onFriendsChange([...selectedFriends, friendId]);
    }
  };

  // Render a selected friend tag
  const renderSelectedTag = (friend: Friend) => (
    <TouchableOpacity
      key={friend.id}
      style={[styles.selectedTag, { backgroundColor: textInputColor }]}
      onPress={() => toggleFriend(friend.id)}
    >
      <Text style={[styles.tagText, { color: textColor }]}>
        {friend.full_name || friend.username}
      </Text>
      <Ionicons name="close" size={14} color={'#E36062'} />
    </TouchableOpacity>
  );

  // Render a friend in search results
  const renderFriendItem = ({ item }: { item: Friend }) => {
    const isSelected = selectedFriends.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[
          styles.friendItem,
          { backgroundColor: theme.inputBackground },
          isSelected && { backgroundColor: theme.rsvpBackground }
        ]}
        onPress={() => toggleFriend(item.id)}
      >
        <View style={{flexDirection:'column', justifyContent:'space-between'}}>
          <Text style={[styles.friendName, { 
          color: textColor 
          }]}>
            {item.full_name}
          </Text>
          <Text style={[styles.friendUsername, { 
            color: textColor 
          }]}>
            @{item.username}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const selectedFriends_display = getSelectedFriends();
  const filteredFriends = getFilteredFriends();

  return (
    <View style={styles.container}>
      {/* Show selected friends as tags */}
      {selectedFriends_display.length > 0 && (
        <View style={styles.selectedContainer}>
          {selectedFriends_display.map(renderSelectedTag)}
        </View>
      )}

      {/* Search box */}
      <View style={[styles.searchBox, { backgroundColor: textInputColor}]}>
        <Ionicons name="search" size={18} color={textColor} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search friends to invite..."
          placeholderTextColor={theme.placeholderColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Show search results */}
      {loading && (
        <Text style={[styles.message, { color: textColor }]}>
          Loading...
        </Text>
      )}
      
      {!loading && friends.length === 0 && (
        <Text style={[styles.message, { color: placeholderColor }]}>
          No friends found. Follow some people first!
        </Text>
      )}
      
      {!loading && searchQuery && filteredFriends.length === 0 && friends.length > 0 && (
        <Text style={[styles.message, { color: theme.placeholderColor }]}>
          No friends match &ldquo;{searchQuery}&rdquo;
        </Text>
      )}
      
      {!loading && searchQuery && filteredFriends.length > 0 && (
        <FlatList
          data={filteredFriends}
          renderItem={renderFriendItem}
          keyExtractor={item => item.id}
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  
  // Selected friends tags
  selectedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 50,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  
  // Search box
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    padding: 5,
  },
  
  // Search results
  resultsList: {
    height: 200,
    flexGrow: 0,
  },
  friendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    marginBottom: 6,
    borderRadius: 8,
  },
  friendName: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  friendUsername: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  
  // Messages
  message: {
    textAlign: 'center',
    fontSize: 14,
    padding: 16,
    fontFamily: 'Poppins-Regular',
    fontStyle: 'italic',
  },
});

export default FollowersDropdown