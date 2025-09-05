import { useUser } from '@/contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import Slider from '../../../components/Slider'; // ✅ import your custom Slider
import { Colors } from '../../../constants/Colors';

interface Friend {
  id: string;
  username: string;
  full_name: string;
  profile_picture_url: string;
  banner_color: number;
  email: string;
  avatar?: string;
  status?: string;
}

const FollowList = () => {
  // Colors
  const {isDarkMode, toggleDarkMode} = useUser();
  const backgroundColor = (!isDarkMode ? Colors.light.background : Colors.dark.background)
  const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text)
  const textInputColor = (!isDarkMode ? Colors.light.textInput : Colors.dark.textInput)
  const placeholderTextColor = (!isDarkMode ? Colors.light.placeholderText : Colors.dark.placeholderText)
  const cancelButtonColor = (!isDarkMode ? Colors.light.cancelButton : Colors.dark.cancelButton)
  const cardBackgroundColor = (!isDarkMode ? '#fff' : '#2d2d2d')
  const borderColor = (!isDarkMode ? '#e0e0e0' : '#4a5568')
  const bannerColors = Colors.bannerColors;

  const router = useRouter();
  const scheme = useColorScheme();
  const lightMode = scheme !== 'dark';
  const { user, updateUserData } = useUser();

  const [activeTab, setActiveTab] = useState<'following' | 'followers'>('following');
  const [searchQuery, setSearchQuery] = useState('');
  const [following, setFollowing] = useState<Friend[]>([]);
  const [followers, setFollowers] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [unfollowModalVisible, setUnfollowModalVisible] = useState(false);
  const [userToUnfollow, setUserToUnfollow] = useState<Friend | null>(null);

  const currentUserId = user?.id; // Use logged-in user's ID

  useEffect(() => {
    if (activeTab === 'following') fetchFollowing();
    else fetchFollowers();
    // Clear search when switching tabs
    setSearchQuery('');
  }, [activeTab]);

  const fetchFollowing = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://132.249.242.182:8080/users/${currentUserId}/following`);
      if (res.ok) {
        const data = await res.json();
        setFollowing(data.following || []);
      } else setFollowing([]);
    } catch {
      setFollowing([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://132.249.242.182:8080/users/${currentUserId}/followers`);
      if (res.ok) {
        const data = await res.json();
        setFollowers(data.followers || []);
      } else setFollowers([]);
    } catch {
      setFollowers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollowCheck = (user: Friend) => {
    setUserToUnfollow(user);
    setUnfollowModalVisible(true);
  };
  const handleCancelUnfollow = () => {
    setUnfollowModalVisible(false);
    setUserToUnfollow(null);
  };



  const unfollowUser = async (userId: string) => {
    try {
      const res = await fetch(`http://132.249.242.182:8080/users/${currentUserId}/follow/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        Alert.alert('Success', 'Unfollowed successfully!');
        setFollowing(prev => prev.filter(u => u.id !== userId));
        setUnfollowModalVisible(false);
        setUserToUnfollow(null);
        
        // Update the UserContext to reflect the new following count immediately
        if (user) {
          const newFollowingCount = Math.max((user.following || 0) - 1, 0);
          updateUserData({ following: newFollowingCount });
        }
      } else {
        Alert.alert('Error', 'Failed to unfollow user');
      }
    } catch {
      Alert.alert('Error', 'Network error occurred');
    }
  };

  // Filter function for both following and followers
  const filterUsers = (users: Friend[]) => {
    return users.filter(user =>
      (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.username || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const filteredFollowing = filterUsers(following);
  const filteredFollowers = filterUsers(followers);

  const renderFollowingItem = ({ item }: { item: Friend }) => (
    <TouchableOpacity 
      style={[styles.userContainer, { backgroundColor: bannerColors[item.banner_color] || bannerColors[0], borderColor: borderColor }]}
      onPress={() => router.push(`/Profile/External?userId=${item.id}`)}
    >
      <Image 
          source={
            item.profile_picture_url
            ? { uri: item.profile_picture_url }
            : require('../../../assets/images/default_profile.jpg')
            }
          style={styles.avatar}
        />
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: textColor }]}>{item.full_name || 'Unknown'}</Text>
        <Text style={[styles.userUsername, { color: textColor }]}>@{item.username}</Text>
      </View>
      <TouchableOpacity 
        style={styles.removeButton} 
        onPress={(e) => {
          e.stopPropagation();
          handleUnfollowCheck(item);
        }}
      >
        <Ionicons name="close" size={24} color="#E36062" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderFollowerItem = ({ item }: { item: Friend }) => (
    <TouchableOpacity 
      style={[styles.userContainer, { backgroundColor: cardBackgroundColor, borderColor: borderColor }]}
      onPress={() => router.push(`/Profile/External?userId=${item.id}`)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.full_name?.charAt(0) || item.username?.charAt(0) || '?'}
        </Text>
      </View>
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: textColor }]}>{item.full_name || 'Unknown'}</Text>
        <Text style={[styles.userUsername, { color: textColor }]}>@{item.username}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: backgroundColor }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Friends</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* ✅ Slider toggle (Followers / Following) */}
      <View style={styles.segmentWrap}>
        <Slider
          leftLabel="Followers"
          rightLabel="Following"
          width={200}
          lightMode={!isDarkMode}
          value={activeTab === 'following'} 
          onChangeSlider={(val) => setActiveTab(val ? 'following' : 'followers')}
          style={{ height: 40, marginTop: -15 }}
        />
      </View>

      {/* ✅ Search bar for both tabs */}
      <View style={[styles.searchContainer, { backgroundColor: textInputColor, marginTop: 10}]}>
        <Ionicons name="search" size={20} color={placeholderTextColor} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder={`Search ${activeTab}...`}
          placeholderTextColor={placeholderTextColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Content based on active tab */}
      {activeTab === 'followers' ? (
        <FlatList
          data={filteredFollowers}
          renderItem={renderFollowerItem}
          keyExtractor={(item) => item.id}
          style={styles.followsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: placeholderTextColor }]}>
                {loading ? 'Loading...' : searchQuery ? 'No followers found matching your search' : 'No followers found'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={filteredFollowing}
          renderItem={renderFollowingItem}
          keyExtractor={(item) => item.id}
          style={styles.followsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: placeholderTextColor }]}>
                {loading ? 'Loading...' : searchQuery ? 'No following found matching your search' : 'Not following anyone yet'}
              </Text>
            </View>
          }
        />
      )}

      {/* Unfollow Modal */}
      <Modal animationType="fade" transparent visible={unfollowModalVisible} onRequestClose={handleCancelUnfollow}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBackgroundColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>
              Remove {userToUnfollow?.full_name || userToUnfollow?.username || 'this user'} from Following?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancelButton, { backgroundColor: cancelButtonColor }]} onPress={handleCancelUnfollow}>
                <Text style={[styles.modalCancelText, { color: textColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={() => userToUnfollow && unfollowUser(userToUnfollow.id)}
              >
                <Text style={[styles.modalConfirmText, { color: textColor }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1,
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins-SemiBold' },
  headerSpacer: { width: 34 },
  segmentWrap: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, alignItems: 'center' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 5,
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: 'Poppins-Regular' },
  followsList: { flex: 1, paddingHorizontal: 16 },
  userContainer: {
    flexDirection: 'row', alignItems: 'center',
    padding: 15, borderRadius: 15, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2,
    marginTop: 10
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFD700',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 18, fontFamily: 'Poppins-SemiBold', color: '#333' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontFamily: 'Poppins-SemiBold', marginBottom: 2 },
  userUsername: { fontSize: 14, fontFamily: 'Poppins-Regular' },
  removeButton: {borderRadius: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontFamily: 'Poppins-Regular', textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { borderRadius: 12, padding: 20, margin: 20, minWidth: 300 },
  modalTitle: { fontSize: 16, fontFamily: 'Poppins-Regular', textAlign: 'center', marginBottom: 20 },
  modalButtons: { flexDirection: 'row', gap: 10 },
  modalCancelButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  modalCancelText: { fontSize: 16, fontFamily: 'Poppins-Regular' },
  modalConfirmButton: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: '#E36062', alignItems: 'center' },
  modalConfirmText: { fontSize: 16, fontFamily: 'Poppins-Regular' },
});

export default FollowList;