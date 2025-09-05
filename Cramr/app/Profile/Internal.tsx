import EventCollapsible from '@/components/EventCollapsible';
import { useUser } from '@/contexts/UserContext';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Bell, Settings } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import EventList from '../List/eventList';

// --- Types ---
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
  following: number;
  follwers: number;
}

type LBEntry = { id: string; name: string; events: number; avatar?: string };
type AnyEvent = any; // keep flexible to match API (date_and_time, bannerColor/banner_color, etc.)

// --- Component ---
export default function Internal() {
  const router = useRouter();
  const { user: loggedInUser, updateUserData } = useUser();

  // Colors
  const {isDarkMode} = useUser();
  const backgroundColor = (!isDarkMode ? Colors.light.background : Colors.dark.background);
  const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text);
  const textInputColor = (!isDarkMode ? Colors.light.textInput : Colors.dark.textInput);
  const bannerColors = Colors.bannerColors;
  const sliderBackgroundColor = (!isDarkMode ? Colors.light.sliderBackground : Colors.dark.sliderBackground);

  // User/profile state
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const userId = loggedInUser?.id;

  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [bannerColor, setBannerColor] = useState<number | null>(null);
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

  // Events: full list for RSVPed/Saved (to render like My Events)
  const [decoratedEvents, setDecoratedEvents] = useState<AnyEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);

  // Refresh/Navigation
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currentPage, setCurrentPage] = useState('profile');

  // Leaderboard (your placement only)
  const [myRank, setMyRank] = useState<number | null>(null);
  const [myLBEntry, setMyLBEntry] = useState<LBEntry | null>(null);
  const [lbLoading, setLbLoading] = useState(false);

  // Collapsed state (to match EventList visuals)
  const [collapsedEvents, setCollapsedEvents] = useState<Set<string>>(new Set());

  // --- Fetchers ---
  const fetchUserData = async () => {
    if (!loggedInUser?.id) return;
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${loggedInUser.id}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);

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

        updateUserData({
          followers: userData.followers,
          following: userData.following,
        });
      } else {
        console.error('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const decorateEventsForUser = async () => {
    if (!userId) { setDecoratedEvents([]); return; }
    try {
      setEventsLoading(true);
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const eventsData: AnyEvent[] = await response.json();

      // mark RSVP/Saved for the current user
      const processed = await Promise.all(
        eventsData.map(async (event: AnyEvent) => {
          let isRSVPed = false;
          let isSaved = false;
          try {
            const rsvpRes = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${event.id}/rsvpd?user_id=${userId}`);
            if (rsvpRes.ok) {
              const rsvpData = await rsvpRes.json();
              isRSVPed = rsvpData?.rsvp?.status === 'accepted';
            }
          } catch {}

          try {
            const savedRes = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${userId}/saved-events/${event.id}`);
            if (savedRes.ok) {
              const savedData = await savedRes.json();
              isSaved = !!savedData?.is_saved;
            }
          } catch {}

          return { ...event, isRSVPed, isSaved };
        })
      );

      // simple, stable sort (EventList sorts by distance; here we keep chronological-ish)
      processed.sort((a, b) => (a.date_and_time || a.created_at || '').localeCompare(b.date_and_time || b.created_at || ''));

      setDecoratedEvents(processed);
      // start collapsed like EventList UX often does
      setCollapsedEvents(new Set(processed.map(e => e.id)));
    } catch (e: any) {
      console.error('decorateEventsForUser error:', e?.message || e);
      setDecoratedEvents([]);
    } finally {
      setEventsLoading(false);
    }
  };

  const fetchMyLeaderboardPlacement = async () => {
    try {
      setLbLoading(true);
      const response = await fetch('http://132.249.242.182:8080/leaderboard');
      const data = await response.json();
      if (data?.success && Array.isArray(data.leaderboard)) {
        const all: LBEntry[] = data.leaderboard;
        if (loggedInUser?.id) {
          const idx = all.findIndex(u => u.id === loggedInUser.id);
          if (idx >= 0) {
            setMyRank(idx + 1);
            setMyLBEntry(all[idx]);
          } else {
            setMyRank(null);
            setMyLBEntry(null);
          }
        }
      } else {
        setMyRank(null);
        setMyLBEntry(null);
      }
    } catch (e) {
      console.error('Leaderboard fetch error:', e);
      setMyRank(null);
      setMyLBEntry(null);
    } finally {
      setLbLoading(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await fetchUserData();
        await fetchMyLeaderboardPlacement();
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [loggedInUser?.id]);

  useEffect(() => {
    decorateEventsForUser();
  }, [userId, refreshKey]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchUserData();
      await fetchMyLeaderboardPlacement();
      setRefreshKey(k => k + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, [loggedInUser?.id]);

  // --- Navigation helper ---
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

  // --- UI ---
  const [visibleEvents, setVisibleEvents] = useState<'rsvped' | 'saved' | 'own'>('own');

  // Open in ViewEvent
  const openEvent = (eventId: string) => {
    router.push({ pathname: '/ViewEvent/viewevent', params: { eventId } });
  };

  const toggleRSVP = async (eventId: string, current: boolean) => {
    try {
      if (!userId) return;
      if (current) {
        const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/rsvpd`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/rsvpd`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, status: 'accepted' }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      setDecoratedEvents(prev => prev.map(e =>
        e.id === eventId
          ? { ...e, isRSVPed: !current, accepted_count: (e.accepted_count || 0) + (current ? -1 : 1) }
          : e
      ));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unexpected error');
    }
  };

  const toggleSave = async (eventId: string, current: boolean) => {
    try {
      if (!userId) return;
      if (current) {
        const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${userId}/saved-events/${eventId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${userId}/saved-events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id: eventId }),
        });
        if (!res.ok) throw new Error(await res.text());
      }
      setDecoratedEvents(prev => prev.map(e =>
        e.id === eventId ? { ...e, isSaved: !current } : e
      ));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unexpected error');
    }
  };
  const rsvpedEvents = useMemo(
    () => decoratedEvents.filter(e => !!e.isRSVPed && e.creator_id !== userId),
    [decoratedEvents, userId]
  );
  const savedEvents = useMemo(
    () => decoratedEvents.filter(e => !!e.isSaved && e.creator_id !== userId),
    [decoratedEvents, userId]
  );

  // Collapsible handling (matches EventList)
  const handleEventToggle = (eventId: string) => {
    setCollapsedEvents(prev => {
      const s = new Set(prev);
      s.has(eventId) ? s.delete(eventId) : s.add(eventId);
      return s;
    });
  };

  return (
    <View style={[styles.container, {backgroundColor: backgroundColor, height: 1000}]}>
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 30 }} 
        showsVerticalScrollIndicator={false} 
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#5CAEF1']}
            tintColor={'#5CAEF1'}
          />
        }
      >
        <View>
          {!loggedInUser && (
            <View style={styles.messageContainer}>
              <Text style={[styles.messageText, {color: textColor}]}>
                Please log in to view your profile
              </Text>
            </View>
          )}

          {isLoading && (
            <View style={styles.messageContainer}>
              <Text style={[styles.messageText, {color: textColor}]}>
                Loading profile...
              </Text>
            </View>
          )}

          {loggedInUser && !isLoading && (
            <>
              <View style={styles.topButtonsContainer}>
                <TouchableOpacity onPress={() => router.back()}>
                  <Image source={require('../../assets/images/cramr_logo.png')} style={[styles.logoContainer]} />
                </TouchableOpacity>
                <View style={styles.notificationsAndSettingsButtonContainer}>
                  <TouchableOpacity onPress={() => router.push('/Profile/NotificationsPage')}>
                    <Bell size={24} color={textColor} style={styles.iconContainer} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('./Settings/SettingsFrontPage')}>
                    <Settings size={24} color={textColor} style={styles.iconContainer} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.bannerContainer, {backgroundColor: bannerColors[bannerColor || 0], marginTop: 20}]}>
                <View style={styles.leftOfBannerContainer}>
                  <Image source={profilePicture ? {uri: profilePicture} : require('../../assets/images/default_profile.jpg')} style={styles.profilePictureContainer}/>
                </View>

                <View style={styles.rightOfBannerContainer}>
                  <Text style={[styles.headerText, {color: textColor}]}>{name}</Text>
                  <Text style={[styles.subheaderText, {color: textColor, marginTop: 3}]}>@{username}</Text>
                  <TouchableOpacity onPress={() => router.push('./Follow/follow')}>
                    <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 3}}>
                      <Text style={[styles.subheaderText, {color: textColor}]}>
                        <Text style={[styles.subheaderBoldText, {color: textColor}]}>
                          {loggedInUser?.followers || 0}
                        </Text> Followers
                      </Text>
                      <View style={styles.dotContainer}>
                        <View style={[styles.dot, {backgroundColor: textColor}]} />
                      </View>
                      <Text style={[styles.subheaderText, {color: textColor}]}>
                        <Text style={[styles.subheaderBoldText, {color: textColor}]}>
                          {loggedInUser?.following || 0}
                        </Text> Following
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View style={[styles.tagContainer, {marginTop: 3}]}>
                    {school !== null && (
                      <View style={[styles.tag, {borderColor: textColor}]}>
                        <Text style={[styles.normalText, {color: textColor}]}>{school}</Text>
                      </View>
                    )}
                    {major !== null && (
                      <View style={[styles.tag, {borderColor: textColor}]}>
                        <Text style={[styles.normalText, {color: textColor}]}>{major}</Text>
                      </View>
                    )}
                    {classLevel !== null && (
                      <View style={[styles.tag, {borderColor: textColor}]}>
                        <Text style={[styles.normalText, {color: textColor}]}>{classLevel}</Text>
                      </View>
                    )}
                    {pronouns !== null && (
                      <View style={[styles.tag, {borderColor: textColor}]}>
                        <Text style={[styles.normalText, {color: textColor}]}>{pronouns}</Text>
                      </View>
                    )}
                    {isTransfer && (
                      <View style={[styles.tag, {borderColor: textColor}]}>
                        <Text style={[styles.normalText, {color: textColor}]}>Transfer</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {bio !== null && (
                <View style={[styles.promptAnswerContainer, {marginTop: 10, backgroundColor: textInputColor}]}>
                  <Text style={[styles.normalText, {color: textColor}]}>{bio}</Text>
                </View>
              )}

              {prompt1 !== null && (
                <View style={[styles.promptContainer, {marginTop: 10}]}>
                  <Text style={[styles.subheaderBoldText, {color: textColor}]}>{prompt1}</Text>
                  {prompt1Answer !== null && (
                    <View style={[styles.promptAnswerContainer, {marginTop: 5, backgroundColor: textInputColor}]}>
                      <Text style={[styles.normalText, {color: textColor}]}>{prompt1Answer}</Text>
                    </View>
                  )}
                </View>
              )}

              {prompt2 !== null && (
                <View style={[styles.promptContainer, {marginTop: 10}]}>
                  <Text style={[styles.subheaderBoldText, {color: textColor}]}>{prompt2}</Text>
                  {prompt2Answer !== null && (
                    <View style={[styles.promptAnswerContainer, {marginTop: 5, backgroundColor: textInputColor}]}>
                      <Text style={[styles.normalText, {color: textColor}]}>{prompt2Answer}</Text>
                    </View>
                  )}
                </View>
              )}

              {prompt3 !== null && (
                <View style={[styles.promptContainer, {marginTop: 10}]}>
                  <Text style={[styles.subheaderBoldText, {color: textColor}]}>{prompt3}</Text>
                  {prompt3Answer !== null && (
                    <View style={[styles.promptAnswerContainer, {marginTop: 5, backgroundColor: textInputColor}]}>
                      <Text style={[styles.normalText, {color: textColor}]}>{prompt3Answer}</Text>
                    </View>
                  )}
                </View>
              )}

              {/* ----- Leaderboard (single row showing YOUR placement) ----- */}
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.subheaderBoldText, { color: textColor, marginBottom: 8 }]}>
                   Leaderboard
                </Text>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push('./LeaderboardPage')}
                  disabled={lbLoading}
                >
                  <View
                    style={[
                      styles.lbRowCard,
                      { backgroundColor: bannerColors[bannerColor || 0] || '#F2C3B7' } 
                    ]}
                  >
                    {/* Left: rank bubble, avatar, name */}
                    <View style={styles.lbLeft}>
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankBadgeText}>
                          {myRank ?? '-'}
                        </Text>
                      </View>
                      <Image
                        source={
                          myLBEntry?.avatar
                            ? { uri: myLBEntry.avatar }
                            : require('../../assets/images/default_profile.jpg')
                        }
                        style={styles.lbAvatar}
                      />
                      <Text style={styles.lbName} numberOfLines={1}>
                        {myLBEntry?.name || name || 'You'}
                      </Text>
                    </View>

                    {/* Right: events count */}
                    <Text style={styles.lbEvents}>
                      {(myLBEntry?.events ?? 0)} {(myLBEntry?.events ?? 0) === 1 ? 'event' : 'events'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
              {/* ----- /Leaderboard ----- */}


              
              <Text style={[styles.subheaderBoldText, { color: textColor, marginTop: 20, marginBottom: 10 }]}>
                Events
              </Text>
              <View style={{flexDirection: 'row', justifyContent: 'space-around', backgroundColor: sliderBackgroundColor, borderRadius: 25, marginBottom: 10}}>
                <TouchableOpacity onPress={() => setVisibleEvents('own')}>
                  <View style={{borderRadius: 25, justifyContent: 'center', alignItems: 'center', padding: 10, paddingHorizontal: 12,...(visibleEvents === 'own' ? {backgroundColor: textInputColor,} : {})}}>
                    <Text style={[styles.normalText, {color: textColor}]}> My Events </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setVisibleEvents('rsvped')}>
                  <View style={{borderRadius: 25, justifyContent: 'center', alignItems: 'center', padding: 10, ...(visibleEvents === 'rsvped' ? {backgroundColor: textInputColor,} : {})}}>
                    <Text style={[styles.normalText, {color: textColor}]}> RSVPed Events </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setVisibleEvents('saved')}>
                  <View style={{borderRadius: 25, justifyContent: 'center', alignItems: 'center', padding: 10, ...(visibleEvents === 'saved' ? {backgroundColor: textInputColor,} : {})}}>
                    <Text style={[styles.normalText, {color: textColor}]}> Saved Events </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* My Events */}
              {visibleEvents === 'own' && (
                <EventList key={`own-${refreshKey}`} creatorUserId={userId} />
              )}

              {/* RSVPed */}
              {visibleEvents === 'rsvped' && (
                <>
                  {eventsLoading && <Text style={[styles.normalText, { color: textColor, marginBottom: 8 }]}>Loading RSVPed events…</Text>}
                  {rsvpedEvents.map((event: AnyEvent) => {
                    const isCollapsed = collapsedEvents.has(event.id);
                    return (
                      <EventCollapsible
                        key={event.id}
                        eventId={event.id}
                        ownerId={event.creator_id}
                        ownerProfile={event.creator_profile_picture}
                        title={event.title}
                        tag1={event.tags?.[0] || null}
                        tag2={event.tags?.[1] || null}
                        tag3={event.tags?.[2] || null}
                        subject={event.class || 'invalid'}
                        isOnline={event.event_format === 'Online'}
                        location={event.location || 'invalid'}
                        studyRoom={event.study_room || null}
                        virtualRoomLink={event.virtual_room_link || null}
                        dateAndTime={event.date_and_time}
                        rsvpedCount={event.accepted_count || event.rsvped_count || 0}
                        capacity={event.capacity || '∞'}
                        isOwner={event.creator_id === userId}
                        isSaved={!!event.isSaved}
                        onSavedChange={() => toggleSave(event.id, !!event.isSaved)}
                        isRsvped={!!event.isRSVPed}
                        onRsvpedChange={() => toggleRSVP(event.id, !!event.isRSVPed)}
                        isCollapsed={isCollapsed}
                        onToggleCollapse={() => handleEventToggle(event.id)}
                        onOpen={() => openEvent(event.id)}
                        isDarkMode={isDarkMode}
                        style={{ marginBottom: 5 }}
                      />
                    );
                  })}
                  {(!eventsLoading && rsvpedEvents.length === 0) && (
                    <Text style={[styles.normalText, { color: textColor, opacity: 0.7, textAlign: 'center', marginTop: 8 }]}>
                      No RSVPed events yet.
                    </Text>
                  )}
                </>
              )}

              {/* Saved */}
              {visibleEvents === 'saved' && (
                <>
                  {eventsLoading && <Text style={[styles.normalText, { color: textColor, marginBottom: 8 }]}>Loading saved events…</Text>}
                  {savedEvents.map((event: AnyEvent) => {
                    const isCollapsed = collapsedEvents.has(event.id);
                    return (
                      <EventCollapsible
                        key={event.id}
                        eventId={event.id}
                        ownerId={event.creator_id}
                        ownerProfile={event.creator_profile_picture}
                        title={event.title}
                        tag1={event.tags?.[0] || null}
                        tag2={event.tags?.[1] || null}
                        tag3={event.tags?.[2] || null}
                        subject={event.class || 'invalid'}
                        isOnline={event.event_format === 'Online'}
                        location={event.location || 'invalid'}
                        studyRoom={event.study_room || null}
                        virtualRoomLink={event.virtual_room_link || null}
                        dateAndTime={event.date_and_time}
                        rsvpedCount={event.accepted_count || event.rsvped_count || 0}
                        capacity={event.capacity || '∞'}
                        isOwner={event.creator_id === userId}
                        isSaved={!!event.isSaved}
                        onSavedChange={() => toggleSave(event.id, !!event.isSaved)}
                        isRsvped={!!event.isRSVPed}
                        onRsvpedChange={() => toggleRSVP(event.id, !!event.isRSVPed)}
                        isCollapsed={isCollapsed}
                        onToggleCollapse={() => handleEventToggle(event.id)}
                        onOpen={() => openEvent(event.id)}
                        isDarkMode={isDarkMode}
                        style={{ marginBottom: 5 }}
                      />
                    );
                  })}
                  {(!eventsLoading && savedEvents.length === 0) && (
                    <Text style={[styles.normalText, { color: textColor, opacity: 0.7, textAlign: 'center', marginTop: 8 }]}>
                      No saved events yet.
                    </Text>
                  )}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomNav, { backgroundColor: textInputColor, borderTopColor: !isDarkMode ? '#e0e0e0' : '#4a5568' }]}> 
        <TouchableOpacity style={styles.navButton} onPress={() => handleNavigation('listView')}>
          <MaterialCommunityIcons name="clipboard-list-outline" size={24} color={textColor} />
          {currentPage === 'listView' && <View style={styles.activeDot} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => handleNavigation('map')}>
          <Ionicons name="map-outline" size={24} color={textColor} />
          {currentPage === 'map' && <View style={styles.activeDot} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => handleNavigation('addEvent')}>
          <Feather name="plus-square" size={24} color={textColor} />
          {currentPage === 'addEvent' && <View style={styles.activeDot} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => handleNavigation('studyTools')}>
          <Feather name="tool" size={24} color={textColor} />
          {currentPage === 'studyTools' && <View style={styles.activeDot} />}
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => handleNavigation('profile')}>
          <Ionicons name="person-circle-outline" size={24} color={textColor} />
          {currentPage === 'profile' && <View style={styles.activeDot} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  headerText: { fontFamily: 'Poppins-SemiBold', fontSize: 18 },
  subheaderText: { fontFamily: 'Poppins-Regular', fontSize: 16 },
  subheaderBoldText: { fontFamily: 'Poppins-SemiBold', fontSize: 16 },
  normalText: { fontFamily: 'Poppins-Regular', fontSize: 14 },
  normalBoldText: { fontFamily: 'Poppins-SemiBold', fontSize: 14 },

  container: { padding: 20, flex: 1 },
  logoContainer: { height: 27, width: 120, marginTop: 15 },
  topButtonsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  notificationsAndSettingsButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: 70, marginTop: 15 },
  iconContainer: { width: 25, height: 25 },

  bannerContainer: {
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderRadius: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  leftOfBannerContainer: { marginLeft: 5, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  rightOfBannerContainer: { flex: 1, alignItems: 'center' },
  profilePictureContainer: { width: 100, height: 100, borderRadius: 50 },

  dotContainer: { paddingVertical: 3, paddingHorizontal: 5, justifyContent: 'center', alignItems: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2 },

  tagContainer: { width: 230, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' },
  tag: { borderWidth: 1, borderRadius: 25, marginTop: 2, marginBottom: 2, marginLeft: 2, marginRight: 2, padding: 5 },

  promptContainer: { flexDirection: 'column' },
  promptAnswerContainer: {
    borderRadius: 15,
    padding: 10,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // Leaderboard row
  lbRowCard: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...(Platform.OS === 'ios'
      ? { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }
      : { elevation: 3 }),
  },
  
  lbLeft: { flexDirection: 'row', alignItems: 'center', maxWidth: '70%' },
  rankBadge: {
    width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5E7A3', marginRight: 10,
  },
  rankBadgeText: { fontFamily: 'Poppins-SemiBold', fontSize: 14 },
  lbAvatar: { width: 28, height: 28, borderRadius: 14, marginRight: 10 },
  lbName: { fontFamily: 'Poppins-SemiBold', fontSize: 14, flexShrink: 1 },
  lbEvents: { fontFamily: 'Poppins-SemiBold', fontSize: 14 },

  messageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  messageText: { fontFamily: 'Poppins-Regular', fontSize: 16, textAlign: 'center' },

  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12, zIndex: 1001, elevation: 5,
  },
  navButton: { alignItems: 'center', padding: 8 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#5caef1', position: 'absolute', bottom: -5 },
});
