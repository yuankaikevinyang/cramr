import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Modal, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Colors } from '../../constants/Colors';
import { useUser } from '../../contexts/UserContext';
import EventList from '../List/eventList';

// Define user interface
interface User {
  id: string;
  profile_picture_url?: string;
  banner_color?: number;
  name?: string;
  username?: string;
  school?: string;
  major?: string;
  class_level?: string;
  pronouns?: string;
  is_transfer?: boolean;
  bio?: string;
  prompt_1: string;
  prompt_1_answer: string;
  prompt_2: string;
  prompt_2_answer: string;
  prompt_3: string;
  prompt_3_answer: string;
}

export default function External() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user: loggedInUser, updateUserData } = useUser();
  const profileId = params.userId as string || loggedInUser?.id; // Use logged-in user's ID as fallback

  // Debug logging
  console.log('URL params:', params);
  console.log('profileId from URL:', params.userId);
  console.log('Final profileId being used:', profileId);
  console.log('Logged in user:', loggedInUser);

  const userId = loggedInUser?.id; // Use logged-in user's ID

  // Colors
  const {isDarkMode, toggleDarkMode} = useUser();
  const backgroundColor = (!isDarkMode ? Colors.light.background : Colors.dark.background)
  const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text)
  const textInputColor = (!isDarkMode ? Colors.light.textInput : Colors.dark.textInput)
  const bannerColors = Colors.bannerColors
  const buttonColor = Colors.button
  const cancelButtonColor = (!isDarkMode ? Colors.light.cancelButton : Colors.dark.cancelButton)

  // User
  const [user, setUser] = useState<User | null>(null);

  // Pull to refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Form state
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [bannerColor, setBannerColor] = useState<number | null>(null)
  const [name, setName] = useState<string>();
  const [username, setUsername] = useState<string>();
  const [school, setSchool] = useState<string>();
  const [major, setMajor] = useState<string>();
  const [classLevel, setClassLevel] = useState<string>();
  const [pronouns, setPronouns] = useState<string>();
  const [isTransfer, setIsTransfer] = useState<boolean>(false);
  const [bio, setBio] = useState<string>();
  const [prompt1, setPrompt1] = useState<string | null>(null);
  const [prompt1Answer, setPrompt1Answer] = useState<string | null>(null);
  const [prompt2, setPrompt2] = useState<string | null>(null);
  const [prompt2Answer, setPrompt2Answer] = useState<string | null>(null);
  const [prompt3, setPrompt3] = useState<string | null>(null);
  const [prompt3Answer, setPrompt3Answer] = useState<string | null>(null);
  const [followers, setFollowers] = useState<string | null>(null);
  const [following, setFollowing] = useState<string | null>(null);
  const [followersIds, setFollowersIds] = useState<string[] | null>(null);
  const [followingIds, setFollowingIds] = useState<string[] | null>(null);

  // Extract user data fetching into a separate function
  const fetchUserData = useCallback(async () => {
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${profileId}/profile`);
      
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        
        // Populate form fields with database data
        setProfilePicture(userData.profile_picture_url || null);
        setBannerColor(Number(userData.banner_color) || null);
        setName(userData.full_name);
        setUsername(userData.username);
        setSchool(userData.school || null);
        setMajor(userData.major || null);
        setClassLevel(userData.year || null);
        setPronouns(userData.pronouns || null);
        setIsTransfer(userData.transfer || false);
        setBio(userData.bio || null);
        setPrompt1(userData.prompt_1 || null);
        setPrompt1Answer(userData.prompt_1_answer || null);
        setPrompt2(userData.prompt_2 || null);
        setPrompt2Answer(userData.prompt_2_answer || null);
        setPrompt3(userData.prompt_3 || null);
        setPrompt3Answer(userData.prompt_3_answer || null);
        setFollowers(userData.followers);
        setFollowing(userData.following);
      } else {
        console.error('Failed to fetch user data. Status:', response.status);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, [profileId]);

  // Pull user data from database
  useEffect(() => {
    fetchUserData();
  }, [fetchUserData, userId]);

  // Add a refresh key state to force child components to refresh
    const [refreshKey, setRefreshKey] = useState(0);
  
    // Update the onRefresh function
    const onRefresh = React.useCallback(async () => {
      setRefreshing(true);
      try {
        // Refresh user data first
        await fetchUserData();

        // Force child components to refresh by incrementing the key
        setRefreshKey(prev => prev + 1);
        
      } catch (error) {
        console.error('Error during refresh:', error);
      } finally {
        setRefreshing(false);
      }
    }, [loggedInUser?.id,]);

  // More Modal
  const [isMoreModalVisible, setIsMoreModalVisible] = useState(false);

  const handlePressMore = () => {
    setIsMoreModalVisible(true);
  };

    const handleCancelMore = () => {
    setIsMoreModalVisible(false);
    setIsBlockCheck(false);
  };

  // Block logic
  const [isBlockCheck, setIsBlockCheck] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Check if user is blocked
  useEffect(() => {
    const checkBlockStatus = async () => {
      if (loggedInUser?.id && profileId) {
        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${loggedInUser.id}/blocks/check/${profileId}`);
          if (response.ok) {
            const data = await response.json();
            setIsBlocked(data.is_blocked);
          }
        } catch (error) {
          console.error('Error checking block status:', error);
        }
      }
    };
    
    checkBlockStatus();
  }, [loggedInUser?.id, profileId]);
  
  const handleBlockCheck = () => {
    setIsBlockCheck(true);
  }

  const handleBlock = async () => {
    try {
      // Use the logged-in user's ID (you'll need to get this from your auth context or state)
      const loggedInUserId = loggedInUser?.id; // Use logged-in user's ID
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${loggedInUserId}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blockedId: profileId })
      });
      
      if (response.ok) {
        Alert.alert('Success', 'User blocked!');
        setIsBlocked(true);
        setIsMoreModalVisible(false);
        setIsBlockCheck(false);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to block user');
      }
    } catch (error) {
      console.error('Block error:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const handleUnblock = async () => {
    try {
      const loggedInUserId = loggedInUser?.id;
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${loggedInUserId}/blocks/${profileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        Alert.alert('Success', 'User unblocked!');
        setIsBlocked(false);
        setIsMoreModalVisible(false);
        setIsBlockCheck(false);
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.error || 'Failed to unblock user');
      }
    } catch (error) {
      console.error('Unblock error:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  const handleCancelBlock = () => {
    setIsBlockCheck(false);
    setIsMoreModalVisible(false);
  }



  // Follow Modal
  const [isFollowModalVisible, setIsFollowModalVisible] = useState(false);

  // Following logic
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const checkFollowingStatus = async () => {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${profileId}/followers`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          // Check if the current user is in the followers list of the profile
          const isUserFollowing = data.followers.some(
            (user: { id: string }) => user.id === userId
          );
          
          setIsFollowing(isUserFollowing);
          console.log('is following? ', isUserFollowing);
        } else {
          Alert.alert('Error', 'Failed to check following status');
        }
      } catch (error) {
        console.error('Follow error:', error);
        Alert.alert('Error', 'Network error occurred');
      }
    };
    
    if (profileId && userId) {
      checkFollowingStatus();
    }
  }, [profileId, userId]);

  const handleFollow = async () => {
    try {
      const loggedInUserId = loggedInUser?.id;
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${loggedInUserId}/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: profileId })
      });
      
      if (response.ok) {
        setIsFollowing(true);
        // Refresh user data to update follower count
        const userResponse = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${profileId}/profile`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setFollowers(userData.followers);
          setFollowing(userData.following);
          setFollowersIds(userData.follower_ids);
          setFollowingIds(userData.following_ids);
        }
        
        // Update the logged-in user's following count in UserContext
        if (loggedInUser) {
          const newFollowingCount = (loggedInUser.following || 0) + 1;
          updateUserData({ following: newFollowingCount });
        }
      } else {
        Alert.alert('Error', 'Failed to follow user');
      }
    } catch (error) {
      console.error('Follow error:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  }
  
  const handleUnfollowCheck = () => {
    setIsFollowModalVisible(true);
  }

  const handleCancelUnfollow = () => {
    setIsFollowModalVisible(false);
  }
  
  const handleUnfollow = async () => {
    try {
      const loggedInUserId = loggedInUser?.id;
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${loggedInUserId}/follow/${profileId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        setIsFollowing(false);
        setIsFollowModalVisible(false);
        // Refresh user data to update follower count
        const userResponse = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${profileId}/profile`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setFollowers(userData.followers);
          setFollowing(userData.following);
          setFollowersIds(userData.follower_ids);
          setFollowingIds(userData.following_ids);
        }
        
        // Update the logged-in user's following count in UserContext
        if (loggedInUser) {
          const newFollowingCount = Math.max((loggedInUser.following || 0) - 1, 0);
          updateUserData({ following: newFollowingCount });
        }
      } else {
        Alert.alert('Error', 'Failed to unfollow user');
      }
    } catch (error) {
      console.error('Unfollow error:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  }

  return (
    <SafeAreaView style={{backgroundColor: backgroundColor}}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={'#5CAEF1'}
            colors={['#5CAEF1']}
          />
        }
      >
        <View style={[styles.container, {backgroundColor: backgroundColor, height: 1000}]}>
          <View style={styles.topButtonsContainer}>
            <ArrowLeft 
              size={24} 
              color={textColor}
              onPress={() => router.back()}
            />

            <TouchableOpacity onPress={handlePressMore}>
              <Icon name="more-horiz" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <View style={[styles.bannerContainer, {backgroundColor: bannerColors[bannerColor || 0], marginTop: 20}]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between',}}>
              <View style={styles.leftOfBannerContainer}>
                <Image source={profilePicture ? {uri: profilePicture} : require('../../assets/images/default_profile.jpg')} style={styles.profilePictureContainer}/>
              </View>
              <View style={styles.rightOfBannerContainer}>
                <Text style={[styles.headerText, {color: textColor}]}>{name}</Text>
                <Text style={[styles.subheaderText, {color: textColor, marginTop: 3}]}>@{username}</Text>
                <Text style={[styles.subheaderText, {color: textColor, marginTop: 3}]}>
                  <Text style={[styles.subheaderBoldText, {color: textColor}]}>{followers}</Text> Followers
                  <View style={styles.dotContainer}>
                    <View style={[styles.dot, {backgroundColor: textColor}]} />
                  </View>
                  <Text style={[styles.subheaderBoldText, {color: textColor}]}>{following}</Text> Following
                </Text>
                <View style={[styles.tagContainer, {marginTop: 3}]}>
                                {school !== null && (
                                  <View style={[styles.tag, {borderColor: textColor}]}>
                                    <Text style={[styles.normalText, {color: textColor}]}>
                                      {school}
                                    </Text>
                                  </View>
                                )}
                                {major !== null && (
                                  <View style={[styles.tag, {borderColor: textColor}]}>
                                    <Text style={[styles.normalText, {color: textColor}]}>
                                      {major}
                                    </Text>
                                  </View>
                                )}
                                {classLevel !== null && (
                                  <View style={[styles.tag, {borderColor: textColor}]}>
                                    <Text style={[styles.normalText, {color: textColor}]}>
                                      {classLevel}
                                    </Text>
                                  </View>
                                )}
                                {pronouns !== null && (
                                  <View style={[styles.tag, {borderColor: textColor}]}>
                                    <Text style={[styles.normalText, {color: textColor}]}>
                                      {pronouns}
                                    </Text>
                                  </View>
                                )}
                                {isTransfer && (
                                  <View style={[styles.tag, {borderColor: textColor}]}>
                                    <Text style={[styles.normalText, {color: textColor}]}>
                                      Transfer
                                    </Text>
                                  </View>
                                )}
                              </View>
              </View>
            </View>

            {isFollowing ? (
              <TouchableOpacity onPress={handleUnfollowCheck} style={[styles.buttonContainer, {backgroundColor: cancelButtonColor}]}>
                <Text style={[styles.subheaderText, {color: textColor}]}>Following</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={handleFollow} style={[styles.buttonContainer, {backgroundColor: buttonColor}]}>
                <Text style={[styles.subheaderText, {color: textColor}]}>Follow</Text>
              </TouchableOpacity>
            )}
          </View>

          {bio !== null && (<View style={[styles.promptAnswerContainer, {marginTop: 10, backgroundColor: textInputColor}]}>
              <Text style={[styles.normalText, {color: textColor}]}>
                {bio}
              </Text>
          </View>)}

          {prompt1 !== null && (
            <View style={[styles.promptContainer, {marginTop: 10}]}>
              <Text style={[styles.subheaderBoldText, {color: textColor}]}>{prompt1}</Text>
              {prompt1Answer !== null && (
                <View style={[styles.promptAnswerContainer, {marginTop: 5, backgroundColor: textInputColor}]}>
                  <Text style={[styles.normalText, {color: textColor}]}>
                    {prompt1Answer}
                  </Text>
                </View>
              )}
            </View>
          )}

          {prompt2 !== null && (
            <View style={[styles.promptContainer, {marginTop: 10}]}>
              <Text style={[styles.subheaderBoldText, {color: textColor}]}>{prompt2}</Text>
              {prompt2Answer !== null && (
                <View style={[styles.promptAnswerContainer, {marginTop: 5, backgroundColor: textInputColor}]}>
                  <Text style={[styles.normalText, {color: textColor}]}>
                    {prompt2Answer}
                  </Text>
                </View>
              )}
            </View>
          )}

          {prompt3 !== null && (
            <View style={[styles.promptContainer, {marginTop: 10}]}>
              <Text style={[styles.subheaderBoldText, {color: textColor}]}>{prompt3}</Text>
              {prompt3Answer !== null && (
                <View style={[styles.promptAnswerContainer, {marginTop: 5, backgroundColor: textInputColor}]}>
                  <Text style={[styles.normalText, {color: textColor}]}>
                    {prompt3Answer}
                  </Text>
                </View>
              )}
            </View>
          )}

          <Text style={[styles.subheaderBoldText, {color: textColor, marginTop: 10}]}>{name}'s Events</Text>

          <EventList
            key={refreshKey}
            creatorUserId={profileId}
            />
            
          {/* More Options Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={isMoreModalVisible}
          >
            {isBlockCheck === false && (
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, {backgroundColor: backgroundColor}]}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.blockButton]}
                    onPress={isBlocked ? handleUnblock : handleBlockCheck}
                  >
                    <Text style={[styles.normalText, {color: '#E36062'}]}>
                      {isBlocked ? 'Unblock' : 'Block'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={handleCancelMore}
                  >
                    <View style={{backgroundColor: cancelButtonColor, width:'100%', height: 35, borderRadius: 10, alignItems: 'center', justifyContent: 'center'}}>
                      <Text style={[styles.normalText, {color: textColor}]}>Cancel</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {isBlockCheck === true && (
              <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, {backgroundColor: backgroundColor, padding: 15}]}>
                  <Text style={[styles.normalText, {color: textColor, textAlign: 'center', marginTop: 10}]}>
                    {isBlocked ? `Unblock ${username}?` : `Block ${username}?`}
                  </Text>
                  
                  <View style={{flexDirection: 'row', gap: 10, width: '100%', marginTop: 20}}>
                    <TouchableOpacity
                      style={{flex: 1, backgroundColor: cancelButtonColor, height: 35, borderRadius: 10, alignItems: 'center', justifyContent: 'center'}}
                      onPress={handleCancelBlock}
                    >
                      <Text style={[styles.normalText, {color: textColor}]}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={{flex: 1, backgroundColor: '#E36062', height: 35, borderRadius: 10, alignItems: 'center', justifyContent: 'center'}}
                      onPress={isBlocked ? handleUnblock : handleBlock}
                    >
                      <Text style={[styles.normalText, {color: textColor}]}>
                        {isBlocked ? 'Unblock' : 'Block'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}


          </Modal>

          {/* Unfollow Confirmation Modal */}
          <Modal
            animationType="fade"
            transparent={true}
            visible={isFollowModalVisible}
            onRequestClose={handleCancelUnfollow}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, {backgroundColor: backgroundColor, padding: 15}]}>
                <Text style={[styles.normalText, {color: textColor, textAlign: 'center', marginTop: 10}]}>
                  Remove {username} from Following?
                </Text>
                
                <View style={{flexDirection: 'row', gap: 10, width: '100%', marginTop: 20}}>
                  <TouchableOpacity
                    style={{flex: 1, backgroundColor: cancelButtonColor, height: 35, borderRadius: 10, alignItems: 'center', justifyContent: 'center'}}
                    onPress={handleCancelUnfollow}
                  >
                    <Text style={[styles.normalText, {color: textColor}]}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={{flex: 1, backgroundColor: '#E36062', height: 35, borderRadius: 10, alignItems: 'center', justifyContent: 'center'}}
                    onPress={handleUnfollow}
                  >
                    <Text style={[styles.normalText, {color: textColor}]}>Unfollow</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Text
  headerText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
  },
  subheaderText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
  },
  subheaderBoldText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
  },
  normalText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  normalBoldText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },

  container: {
    padding: 20,
    height: 1000,
  },
  logoContainer: {
    height: 27,
    width: 120
  },
  topButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  iconContainer: {
    width: 25,
    height: 25,
  },
  bannerContainer: {
    // shadow for android
    elevation: 3,
    // shadow for ios
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 25,

    // internal
    flexDirection: 'column',
    padding: 15,
  },
  leftOfBannerContainer: {
    marginLeft: 5,
    marginRight: 10,
    justifyContent: 'center', // center vertically
    alignItems: 'center', // center horizontally
  },
  rightOfBannerContainer: {
    flex: 1, // takes up rest of space
    alignItems: 'center',
  },
  profilePictureContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  dotContainer: {
    paddingVertical: 3,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  tagContainer: {
    width: 230,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tag: {
    borderWidth: 1,
    borderRadius: 25,
    marginTop: 2,
    marginBottom: 2,
    marginLeft: 2, // space between tags
    marginRight: 2, // space between tags
    padding: 5,
  },
  promptContainer: {
    flexDirection: 'column',
  },
  promptAnswerContainer: {
    borderRadius: 15,
    padding: 10,
    
    // shadow for android
    elevation: 3,
    // shadow for ios
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonContainer: {
    width: '100%',
    height: 35,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 0,
    width: '80%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButton: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    alignItems: 'center',
  },
  blockButton: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  cancelButton: {
    borderBottomWidth: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
  },
});