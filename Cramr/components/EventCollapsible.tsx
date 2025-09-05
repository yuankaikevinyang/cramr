import { useRouter } from 'expo-router';
import { Bookmark, BookOpen, Calendar, Clock, Dot, Laptop, MapPin, Users } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';

interface RSVP {
  event_id: string;
  user_id: string;
  status: string;
  rsvp_date: string;
  username: string;
  full_name: string;
  profile_picture_url: string;
}

interface EventCollapsibleProps {
  eventId: string;
  ownerId: string;
  ownerProfile: string;
  title: string;
  tag1?: string | null;
  tag2?: string | null;
  tag3?: string | null;
  subject: string;
  isOnline: boolean;
  location?: string | null;
  studyRoom?: string | null;
  virtualRoomLink?: string | null;
  dateAndTime: Date;
  capacity: number;
  rsvpedCount: number;
  isOwner: boolean;
  isSaved: boolean;
  onSavedChange?: (saved: boolean) => void;
  isRsvped: boolean;
  onRsvpedChange?: (rsvped: boolean) => void;
  isDistanceVisible?: boolean | false;
  distanceUnit?: 'km' | 'mi';
  distance?: number | null;
  isDarkMode: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCenterMapOnEvent?: (eventId: string) => void;
  style?: object;

  /** NEW: called when user taps the card body to open detail */
  onOpen?: () => void;
}

const EventCollapsible: React.FC<EventCollapsibleProps> = ({
  eventId,
  ownerId,
  ownerProfile,
  title,
  tag1,
  tag2,
  tag3,
  subject,
  isOnline,
  location,
  studyRoom,
  virtualRoomLink,
  dateAndTime,
  capacity,
  rsvpedCount,
  isOwner,
  isSaved,
  onSavedChange = () => {},
  isRsvped,
  onRsvpedChange = () => {},
  isDistanceVisible,
  distanceUnit,
  distance,
  isDarkMode,
  isCollapsed = false,
  onToggleCollapse = () => {},
  onCenterMapOnEvent = () => {},
  style,
  onOpen, // NEW
}) => {
  const router = useRouter();

  // Colors
  const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text);
  const textInputColor = (!isDarkMode ? Colors.light.textInput : Colors.dark.textInput);
  const cancelButtonColor = (!isDarkMode ? Colors.light.cancelButton : Colors.dark.cancelButton);
  const buttonColor = Colors.button;
  const bannerColors = Colors.bannerColors;

  const [RSVPs, setRSVPs] = useState<RSVP[]>([]);
  const [bannerColor, setBannerColor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const formatDate = (dateAndTime: Date | string | null) => {
    if (!dateAndTime) return 'Invalid date';
    try {
      const date = new Date(dateAndTime);
      if (isNaN(date.getTime())) return 'Invalid date';
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth() + 1;
      const day = date.getUTCDate();
      return `${month}/${day}/${year}`;
    } catch {
      return 'Invalid date';
    }
  };

  const formatTime = (dateAndTime: Date | string | null) => {
    if (!dateAndTime) return 'Select Time';
    try {
      const date = new Date(dateAndTime);
      if (isNaN(date.getTime())) return 'Select Time';
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const minutesStr = minutes.toString().padStart(2, '0');
      return `${hour12}:${minutesStr} ${ampm}`;
    } catch {
      return 'Select Time';
    }
  };

  const fetchRSVPs = useCallback(async () => {
    if (!eventId) return;
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/rsvps`);
      if (response.ok) {
        const data = await response.json();
        setRSVPs(data.rsvps);
      } else {
        setRSVPs([]);
      }
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
      setRSVPs([]);
    }
  }, [eventId]);

  useEffect(() => {
    const fetchBannerColor = async () => {
      if (!ownerId) return;
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${ownerId}`);
        if (response.ok) {
          const data = await response.json();
          setBannerColor(bannerColors[data.banner_color] || null);
        } else {
          setBannerColor(null);
        }
      } catch (error) {
        console.error('Error fetching banner color:', error);
        setBannerColor(null);
      }
    };
    fetchBannerColor();
  }, [bannerColors, ownerId]);

  useEffect(() => {
    fetchRSVPs();
  }, [fetchRSVPs]);

  const attendee1Profile = (RSVPs && RSVPs[0] && RSVPs[0].profile_picture_url) || null;
  const attendee2Profile = (RSVPs && RSVPs[1] && RSVPs[1].profile_picture_url) || null;
  const attendee3Profile = (RSVPs && RSVPs[2] && RSVPs[2].profile_picture_url) || null;
  const isOpen = !isCollapsed;

  const handleRSVPPress = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      onRsvpedChange?.(!isRsvped);
      setTimeout(async () => {
        await fetchRSVPs();
        setIsLoading(false);
      }, 500);
    } catch (error) {
      console.error('Error handling RSVP:', error);
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.eventContainer, { backgroundColor: textInputColor }, style]} data-event-id={eventId}>
      {/* Banner (collapse toggle) */}
      <TouchableOpacity onPress={onToggleCollapse} style={[styles.bannerContainer, { backgroundColor: bannerColor || '#FFFFFF' }]}>
        <Text style={[styles.normalBoldText, { color: textColor }]}>
          {title}
          {isDistanceVisible && (
            <>
              <Dot size={10} color={textColor} />
              <Text style={[styles.normalText, { color: textColor, marginBottom: 5 }]}>
                {distance} {distanceUnit} away
              </Text>
            </>
          )}
        </Text>
        <TouchableOpacity onPress={() => router.push({ pathname: '/Profile/External', params: { userId: ownerId } })}>
          <Image
            source={ownerProfile ? { uri: ownerProfile } : require('@/assets/images/default_profile.jpg')}
            style={styles.profilePictureContainer}
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {isOpen && (
        <TouchableOpacity
          style={styles.contentContainer}
          // NEW: open details if provided; otherwise keep old behavior (center map)
          onPress={() => (onOpen ? onOpen() : onCenterMapOnEvent?.(eventId))}
          activeOpacity={0.7}
        >
            <View style={[styles.tagContainer, { marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }]}>
              {(tag1 || tag2 || tag3) ? (
                <>
                <View style={{ flexDirection: 'row' }}>
                  {tag1 !== null && (
                    <View style={[styles.tag, { borderColor: textColor }]}>
                      <Text style={[styles.normalText, { color: textColor }]}>{tag1}</Text>
                    </View>
                  )}
                  {tag2 !== null && (
                    <View style={[styles.tag, { borderColor: textColor }]}>
                      <Text style={[styles.normalText, { color: textColor }]}>{tag2}</Text>
                    </View>
                  )}
              {tag3 !== null && (
                <View style={[styles.tag, { borderColor: textColor }]}>
                  <Text style={[styles.normalText, { color: textColor }]}>{tag3}</Text>
                </View>
              )}
              </View>
              <TouchableOpacity
              onPress={() => {
                onSavedChange?.(!isSaved);
              }}
            >
              {!isOwner && <Bookmark color={textColor} fill={isSaved ? textColor : 'none'} />}
            </TouchableOpacity>
            </>
            ) : (
              <TouchableOpacity
              onPress={() => {
                onSavedChange?.(!isSaved);
              }}
            >
              {!isOwner && <Bookmark color={textColor} fill={isSaved ? textColor : 'none'} style={{marginLeft: 305, marginBottom: -100, marginTop: 3}} />}
            </TouchableOpacity>
            )}
          </View>

          <View style={styles.mainContentContainer}>
            <View style={styles.eventDetailsContainer}>
              <View style={styles.iconTextContainer}>
                <BookOpen size={20} color={textColor} style={styles.eventIcon} />
                <Text style={[styles.normalText, { color: textColor }]}>{subject}</Text>
              </View>

              {!isOnline && (
                <View style={[styles.iconTextContainer, { marginTop: 3 }]}>
                  <MapPin size={20} color={textColor} style={styles.eventIcon} />
                  <Text style={[styles.normalText, { color: textColor }]}>
                    {location}
                    {studyRoom && `${studyRoom}`}
                  </Text>
                </View>
              )}

              {isOnline && (
                <View style={[styles.iconTextContainer, { marginTop: 3 }]}>
                  <Laptop size={20} color={textColor} style={styles.eventIcon} />
                  <TouchableOpacity
                    onPress={() =>
                      virtualRoomLink
                        ? Linking.openURL(
                            virtualRoomLink.startsWith('http://') || virtualRoomLink.startsWith('https://')
                              ? virtualRoomLink
                              : `http://${virtualRoomLink}`
                          )
                        : null
                    }
                  >
                    <Text style={[styles.normalText, { color: textColor }]}>{virtualRoomLink}</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={[styles.iconTextContainer, { marginTop: 3 }]}>
                <Calendar size={20} color={textColor} style={styles.eventIcon} />
                <Text style={[styles.normalText, { color: textColor }]}>{formatDate(dateAndTime)}</Text>
              </View>
              <View style={[styles.iconTextContainer, { marginTop: 3 }]}>
                <Clock size={20} color={textColor} style={styles.eventIcon} />
                <Text style={[styles.normalText, { color: textColor }]}>{formatTime(dateAndTime)}</Text>
              </View>

              <View style={[styles.iconTextContainer, { marginTop: 3 }]}>
                <Users size={20} color={textColor} style={styles.eventIcon} />
                <Text style={[styles.normalText, { color: textColor }]}>{RSVPs.length}/{capacity}</Text>

                {attendee1Profile != null && RSVPs[0] != null && (
                  <TouchableOpacity onPress={() => router.push({ pathname: '/Profile/External', params: { userId: RSVPs[0].user_id } })}>
                    <Image source={{ uri: attendee1Profile }} style={styles.smallProfilePictureContainer} />
                  </TouchableOpacity>
                )}
                {attendee1Profile == null && RSVPs[0] != null && (
                  <TouchableOpacity onPress={() => router.push({ pathname: '/Profile/External', params: { userId: RSVPs[0].user_id } })}>
                    <Image source={require('../assets/images/default_profile.jpg')} style={styles.smallProfilePictureContainer} />
                  </TouchableOpacity>
                )}

                {attendee2Profile != null && RSVPs[1] != null && (
                  <TouchableOpacity onPress={() => router.push({ pathname: '/Profile/External', params: { userId: RSVPs[1].user_id } })}>
                    <Image source={{ uri: attendee2Profile }} style={styles.smallProfilePictureContainer} />
                  </TouchableOpacity>
                )}
                {attendee2Profile == null && RSVPs[1] != null && (
                  <TouchableOpacity onPress={() => router.push({ pathname: '/Profile/External', params: { userId: RSVPs[1].user_id } })}>
                    <Image source={require('../assets/images/default_profile.jpg')} style={styles.smallProfilePictureContainer} />
                  </TouchableOpacity>
                )}

                {attendee3Profile != null && RSVPs[2] != null && (
                  <TouchableOpacity onPress={() => router.push({ pathname: '/Profile/External', params: { userId: RSVPs[2].user_id } })}>
                    <Image source={{ uri: attendee3Profile }} style={styles.smallProfilePictureContainer} />
                  </TouchableOpacity>
                )}
                {attendee3Profile == null && RSVPs[2] != null && (
                  <TouchableOpacity onPress={() => router.push({ pathname: '/Profile/External', params: { userId: RSVPs[2].user_id } })}>
                    <Image source={require('@/assets/images/default_profile.jpg')} style={styles.smallProfilePictureContainer} />
                  </TouchableOpacity>
                )}

                {RSVPs.length > 3 && (
                  <Text style={[styles.normalText, { color: textColor, marginLeft: 5 }]}>+{RSVPs.length - 3}</Text>
                )}
              </View>

              {isOwner && (
                <TouchableOpacity onPress={() => router.push({ pathname: '/CreateEvent/EditEvent', params: { eventId } })} style={{ marginTop: 10 }}>
                  <View style={[styles.buttonContainer, { backgroundColor: buttonColor }]}>
                    <Text style={[styles.subheaderText, { color: textColor }]}>Edit</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {!isOwner && (RSVPs.length < capacity || isRsvped) &&(
              <TouchableOpacity
                onPress={handleRSVPPress}
                style={[styles.rsvpButtonContainer, { opacity: isLoading ? 0.6 : 1 }]}
                disabled={isLoading}
              >
                 <View style={[styles.rsvpButton, { backgroundColor: isRsvped ? cancelButtonColor : '#5CAEF1', marginTop: -45, marginRight: 3 }]}>
                  <Text style={[styles.subheaderText, { color: textColor }]}>{isRsvped ? 'RSVPed' : 'RSVP'}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // Text
  headerText: { fontFamily: 'Poppins-SemiBold', fontSize: 18 },
  subheaderText: { fontFamily: 'Poppins-Regular', fontSize: 16 },
  subheaderBoldText: { fontFamily: 'Poppins-SemiBold', fontSize: 16 },
  normalText: { fontFamily: 'Poppins-Regular', fontSize: 14 },
  normalBoldText: { fontFamily: 'Poppins-SemiBold', fontSize: 14 },
  smallText: { fontFamily: 'Poppins-Regular', fontSize: 12, flexWrap: 'wrap' },

  eventContainer: {
    flexDirection: 'column',
    width: '100%',
    marginTop: 5,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bannerContainer: {
    width: '100%',
    borderRadius: 10,
    height: 50,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  contentContainer: { padding: 10, },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  tag: { borderWidth: 1, borderRadius: 20, marginLeft: 2, marginRight: 2, padding: 5 },
  mainContentContainer: { flexDirection: 'column', justifyContent: 'space-between' },
  eventDetailsContainer: { flex: 1 },
  eventIcon: { marginRight: 5 },
  iconTextContainer: { flexDirection: 'row', alignItems: 'center' },
  profilePictureContainer: { width: 30, height: 30, borderRadius: 15, marginLeft: 2 },
  smallProfilePictureContainer: { width: 25, height: 25, borderRadius: 12.5, marginLeft: 3, marginRight: 3 },
  buttonContainer: {
    width: '100%',
    padding: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 5
  },
  rsvpButtonContainer: { alignItems: 'flex-end', marginTop: 10 },
  rsvpButton: {
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

export default EventCollapsible;
