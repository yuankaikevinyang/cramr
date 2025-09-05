import Slider from '@/components/Slider';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRouter } from 'expo-router';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { IconButton, TextInput, useTheme } from 'react-native-paper';
import { Colors } from '../../constants/Colors';
import { useUser } from '../../contexts/UserContext';
import EventList from './eventList';
import FilterModal, { Filters } from './filter';

export default function HomeScreen() {
  // Colors
  const {isDarkMode, toggleDarkMode, user, updateUserData} = useUser();
  const backgroundColor = (!isDarkMode ? Colors.light.background : Colors.dark.background)
  const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text)
  const textInputColor = (!isDarkMode ? Colors.light.textInput : Colors.dark.textInput)
  const placeholderTextColor = (!isDarkMode ? Colors.light.placeholderText : Colors.dark.placeholderText)
  const bannerColors = Colors.bannerColors
  const cancelButtonColor = (!isDarkMode ? Colors.light.cancelButton : Colors.dark.cancelButton)

  const theme = useTheme();
  const navigation = useNavigation();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState('listView');
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState<Filters | null>(null);

  // slider-based mode (left = events, right = people)
  const [searchMode, setSearchMode] = useState<'events' | 'people'>('events');

  const [searchQuery, setSearchQuery] = useState('');
  const [peopleResults, setPeopleResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [following, setFollowing] = useState<any[]>([]);
  const currentUserId = user?.id; // Use logged-in user's ID

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: backgroundColor, // This sets the header background
      },
      headerLeft: () => (
        <View style={[styles.fullWidthHeader]}>
          <Image
            source={require('../../assets/images/cramr_logo.png')}
            style={[styles.logo]}
            resizeMode="contain"
          />
        </View>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push('/List/Messages/messages')} style={styles.addButton}>
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={28}
            marginRight={-5}
            marginTop={10}
            color={textColor}
          />
        </TouchableOpacity>
      ),
      headerTitle: '', // Hide "index"
      headerShadowVisible: false, // Optional: removes shadow/border under header
    });
    loadFollowing();
  }, [backgroundColor]); // Add backgroundColor as dependency

  // Keep people search responsive when switching to People tab
  useEffect(() => {
    if (searchMode === 'people' && searchQuery.length >= 2) {
      searchPeople(searchQuery);
    }
  }, [searchMode]);

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

  const handleSaveFilters = (filterData: Filters) => {
    setFilters(filterData);
    setShowFilter(false);
  };

  // --- People search helpers ---
  const searchPeople = async (query: string) => {
    if (query.length < 2) {
      setPeopleResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
      const searchUrl = `${backendUrl}/users/search?q=${encodeURIComponent(query)}${currentUserId ? `&currentUserId=${currentUserId}` : ''}`;
      
      const response = await fetch(searchUrl);
      if (response.ok) {
        const data = await response.json();
        setPeopleResults(data || []);
      } else {
        setPeopleResults([]);
      }
    } catch {
      setPeopleResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchMode === 'people') searchPeople(text);
  };

  const followUser = async (userId: string) => {
  try {
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    const response = await fetch(`${backendUrl}/users/${currentUserId}/follow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (response.ok) {
      const userToFollow = peopleResults.find(p => p.id === userId);
      if (userToFollow) {
        setFollowing(prev => [...prev, userToFollow]);
        // Update the peopleResults to reflect the new follower count
        setPeopleResults(prev => prev.map(person => 
          person.id === userId 
            ? { ...person, followers: (person.followers || 0) + 1 }
            : person
        ));
        
        // Update current user's following count
        updateUserData({
          following: (user?.following || 0) + 1 // Increment following count
        });
      }
    }
  } catch {}
};

  const unfollowUser = async (userId: string) => {
  try {
    const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
    const response = await fetch(`${backendUrl}/users/${currentUserId}/follow/${userId}`, {
      method: 'DELETE',
    });
    if (response.ok) {
      setFollowing(prev => prev.filter(p => p.id !== userId));
      // Update the peopleResults to reflect the new follower count
      setPeopleResults(prev => prev.map(person => 
        person.id === userId 
          ? { ...person, followers: Math.max((person.followers || 0) - 1, 0) }
          : person
      ));
      
      // Update current user's following count
      updateUserData({
        following: Math.max((user?.following || 0) - 1, 0) // Decrement following count
      });
    }
  } catch {}
};

  const loadFollowing = async () => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${backendUrl}/users/${currentUserId}/following`);
      if (response.ok) {
        const data = await response.json();
        setFollowing(data.following || []);
      }
    } catch {}
  };

  // Function to refresh current user's data (including following/followers counts)
  const refreshCurrentUserData = async () => {
    try {
      const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
      const response = await fetch(`${backendUrl}/users/${currentUserId}`);
      if (response.ok) {
        const userData = await response.json();
        // Update the user context with new data
        if (userData.following !== undefined || userData.followers !== undefined) {
          updateUserData({
            following: userData.following,
            followers: userData.followers
          });
        }
      }
    } catch (error) {
      console.error('Error refreshing current user data:', error);
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  // Add this refresh function:
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh following data
      await loadFollowing();
      
      // Refresh current user data (following/followers counts)
      await refreshCurrentUserData();
      
      // If we're in people mode and have a search query, refresh the search results
      if (searchMode === 'people' && searchQuery.length >= 2) {
        await searchPeople(searchQuery);
      }
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const isFollowing = (userId: string) => following.some(user => user.id === userId);
  const navigateToProfile = (userId: string) => router.push(`/Profile/External?userId=${userId}`);

  // slider binding (left=false=Events, right=true=People)
  const sliderValue = searchMode === 'people';

  return (
    <View style={[styles.container, { backgroundColor: backgroundColor}]}>
      {/* Toggle Switch */}
      <Slider
        rightLabel="People"
        leftLabel="Events"
        width={175}
        onChangeSlider={(value) => !value ? setSearchMode('events') : setSearchMode('people')}
        lightMode={!isDarkMode}
        value={sliderValue}
        style={{marginBottom: 5, alignSelf: 'center'}}
      />

      {/* Search Bar + Filter (filter only shows on Events) */}
      <View style={styles.searchRow}>
        <View style={[styles.searchInputContainer, { backgroundColor: textInputColor, ...(searchMode === 'people' && {marginTop: 7}) }]}>
          <TextInput
            mode="flat"
            placeholder={searchMode === 'events' ? 'Search events...' : 'Search people...'}
            placeholderTextColor={placeholderTextColor}
            style={[styles.searchInput, { color: textColor}]}
            contentStyle={[styles.searchInputContent, {color: textColor}]} // Add this for font styling
            // This is causing issues with Android. 
            //outlineStyle={styles.searchInputOutline} // Add this for border radius
            left={<TextInput.Icon icon="magnify" color={textColor} />}
            underlineColor="transparent"
            activeUnderlineColor="transparent"
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
        </View>

        {searchMode === 'events' && (
          <IconButton
            icon="filter"
            size={28}
            onPress={() => setShowFilter(true)}
            style={[styles.filterButton, { backgroundColor: textInputColor }]}
            iconColor={textColor}
          />
        )}
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        onSave={handleSaveFilters}
      />

      {/* Event List (with filters + search from the upper grey bar) */}
      {searchMode === 'events' && <EventList filters={filters} searchQuery={searchQuery} />}

      {/* People Results */}
      {searchMode === 'people' && (
      <View style={styles.peopleContainer}>
        {searchLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5CAEF1" />
            <Text style={styles.loadingText}>Searching people...</Text>
          </View>
        ) : peopleResults.length > 0 ? (
          <ScrollView 
            style={styles.peopleList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={isDarkMode ? ['#5CAEF1', '#7CC8FF'] : ['#5CAEF1', '#4A9EE0']}
                tintColor={isDarkMode ? '#5CAEF1' : '#4A9EE0'}
                progressBackgroundColor={isDarkMode ? '#2D2D2D' : '#FFFFFF'}
              />
            }
          >
            {peopleResults.map((person: any) => {
              const following = isFollowing(person.id);
              return (
                <TouchableOpacity
                  key={person.id}
                  style={[styles.personCard, {backgroundColor: bannerColors[person.banner_color] || bannerColors[0]}]}
                  onPress={() => navigateToProfile(person.id)}
                >
                  <View style={styles.personInfo}>
                    <Image 
                      source={
                        person.profile_picture_url
                          ? { uri: person.profile_picture_url }
                          : require('../../assets/images/default_profile.jpg')
                      }
                      style={styles.personAvatar} 
                    />
                    <View style={styles.personDetails}>
                      <Text style={[styles.personName, {color:textColor, fontFamily: 'Poppins-Regular'}]}>{person.full_name || 'Unknown'}</Text>
                      <Text style={[styles.personUsername, {color:textColor, fontFamily: 'Poppins-Regular'}]}>@{person.username}</Text>
                      <Text style={[styles.personStats, {color: textColor, fontFamily: 'Poppins-Regular'}]}>
                        {person.following || 0} following • {person.followers || 0} followers
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.followButton, (following && [styles.followingButton, {backgroundColor: cancelButtonColor}])]}
                    onPress={(e) => {
                      e.stopPropagation();
                      if (following) unfollowUser(person.id);
                      else followUser(person.id);
                    }}
                  >
                    <Text style={[styles.followButtonText, {color: textColor}, (following && [styles.followingButtonText, {color: textColor}])]}>
                      {following ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : searchQuery.length >= 2 ? (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={isDarkMode ? ['#5CAEF1', '#7CC8FF'] : ['#5CAEF1', '#4A9EE0']}
                tintColor={isDarkMode ? '#5CAEF1' : '#4A9EE0'}
                progressBackgroundColor={isDarkMode ? '#2D2D2D' : '#FFFFFF'}
              />
            }
          >
            <Text style={[styles.emptyText, {color: textColor}]}>No people found</Text>
          </ScrollView>
        ) : (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={isDarkMode ? ['#5CAEF1', '#7CC8FF'] : ['#5CAEF1', '#4A9EE0']}
                tintColor={isDarkMode ? '#5CAEF1' : '#4A9EE0'}
                progressBackgroundColor={isDarkMode ? '#2D2D2D' : '#FFFFFF'}
              />
            }
          >
            <Text style={[styles.emptyText, {color: textColor}]}>Type at least 2 characters to search people</Text>
          </ScrollView>
        )}
      </View>
    )}


      {/* Bottom Navigation */}
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
          {currentPage === 'tool' && <View style={styles.activeDot} />}
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
    </View>
  );
}

// EXAMPLE: How to hide headers in other screens
// Add this to your Map screen component:
/*
useLayoutEffect(() => {
  navigation.setOptions({
    headerShown: false, // This completely hides the header
  });
}, [navigation]);
*/

// OR in your ListView screen component:
/*
useLayoutEffect(() => {
  navigation.setOptions({
    headerShown: false, // This completely hides the header
  });
}, [navigation]);
*/

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    justifyContent: 'flex-start',
    paddingBottom: 80,
  },
  logo: {
    height: 120,
    width: 120,
    marginTop: -30,
  },
  addButton: { marginRight: 8, borderRadius: 10 },

  // slider row
  sliderWrap: {
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 5,
  },

  // search row
  searchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 5, marginBottom: 5},
  searchInputContainer: {
    flex: 1,
    borderRadius: 10,
    marginRight: 8,
    justifyContent: 'center',
    overflow: 'hidden', // This ensures the border radius is respected
  },
  searchInput: { 
    backgroundColor: 'transparent', 
    height: 44, 
    fontSize: 16,
  },
  searchInputContent: {
    fontFamily: 'Poppins-Regular', // This applies the font to the input text and placeholder
  },
  searchInputOutline: {
    borderRadius: 10, // This ensures the outline respects the border radius
    borderWidth: 0, // Remove any border if you don't want it
  },
  filterButton: {
    borderRadius: 10,
  },
  toggleContainer: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 10,
  },
  toggleSwitch: {
    flexDirection: 'row',
    backgroundColor: '#e5e5e5',
    borderRadius: 25,
    padding: 4,
    width: 200,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#ffffff',
  },
  toggleText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#000000',
  },


  fullWidthHeader: {
    width: '100%',
    flexDirection: 'row',
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
  navButton: { alignItems: 'center', padding: 8 },
  activeDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#5caef1', position: 'absolute', bottom: -5,
  },

  // people results
  peopleContainer: { flex: 1, marginTop: 10 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  loadingText: { fontSize: 16, color: '#666', marginTop: 10 },
  peopleList: { flex: 1 },
  personCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 10, borderRadius: 20, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  personInfo: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  personAvatar: {
    width: 50, height: 50, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center', marginRight: 15,
  },
  personDetails: { flex: 1 },
  personName: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 2 },
  personUsername: { fontSize: 14, marginBottom: 2 },
  personStats: { fontSize: 12},
  followButton: { backgroundColor: '#5CAEF1', padding: 10, borderRadius: 10 },
  followButtonText: {fontSize: 14, fontFamily: 'Poppins-Regular',},
  followingButton: { backgroundColor: '#e0e0e0' },
  followingButtonText: { color: '#666' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  emptyText: { fontSize: 16, textAlign: 'center', fontFamily: 'Poppins-Regular' },
  debugText: { fontSize: 12, padding: 10, backgroundColor: '#f0f0f0', marginBottom: 10 },
});