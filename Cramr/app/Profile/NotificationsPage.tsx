import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';

type Notification = {
  id: string;
  sender: string;
  message: string;
  date: string;
  type?: string;
  event_id?: string;
  event_title?: string;
  is_read?: boolean;
  created_at?: string;
  user_has_responded?: boolean;
};

export default function NotificationsPage({ navigation }: { navigation: any }) {
  const router = useRouter();
  const {isDarkMode, toggleDarkMode} = useUser();
  const backgroundColor = (!isDarkMode ? Colors.light.background : Colors.dark.background)
  const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text)
  const textInputColor = (!isDarkMode ? Colors.light.textInput : Colors.dark.textInput)
  const bannerColors = Colors.bannerColors

  const [notifications, setNotifications] = useState<{ [date: string]: Notification[] }>({});
  const [refreshing, setRefreshing] = useState(false);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);
  const [respondedInvitations, setRespondedInvitations] = useState<Set<string>>(new Set());
  const { user } = useUser();
  // const userId = 'a163cdc9-6db7-4498-a73b-a439ed221dec';
  // Use actual user ID from context, fallback to hardcoded for testing
  const userId = user?.id;

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications for user:', userId);
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${userId}/notifications`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Notifications response:', data);
        if (data.success) {
          // Transform the backend data to match the original format
          const transformedNotifications: { [date: string]: Notification[] } = {};
          
          Object.entries(data.notifications).forEach(([date, notifs]: [string, any]) => {
            transformedNotifications[date] = notifs.map((notif: any) => ({
              id: notif.id,
              sender: notif.sender,
              message: notif.message,
              date: notif.date,
              type: notif.type,
              event_id: notif.event_id,
              event_title: notif.event_title,
              is_read: notif.is_read,
              created_at: notif.created_at
            }));
          });
          
          console.log('Transformed notifications:', transformedNotifications);
          setNotifications(transformedNotifications);
        }
      } else {
        console.error('Failed to fetch notifications:', response.status);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const handleEventInvitation = async (eventId: string, status: 'accepted' | 'declined', notificationId: string) => {
    if (!eventId) {
      Alert.alert('Error', 'Event ID not found');
      return;
    }

    console.log('Handling event invitation:', { eventId, status, notificationId, userId });
    setProcessingInvitation(notificationId);

    try {
      const requestBody = {
        user_id: userId,
        status: status
      };
      console.log('Sending RSVP request:', requestBody);
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/rsvpd`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('RSVP response status:', response.status);
      const result = await response.json();
      console.log('RSVP response:', result);
      
      if (response.ok) {
        if (result.success) {
          // Mark notification as read
          await markNotificationAsRead(notificationId);
          
          // Add to responded invitations set
          setRespondedInvitations(prev => new Set([...prev, notificationId]));
          
          // Refresh notifications to update the UI
          await fetchNotifications();
        } else {
          Alert.alert('Error', result.message || 'Failed to process invitation');
        }
      } else {
        Alert.alert('Error', result.error || 'Failed to process invitation');
      }
    } catch (error) {
      console.error('Error processing event invitation:', error);
      Alert.alert('Error', 'Failed to process invitation. Please try again.');
    } finally {
      setProcessingInvitation(null);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${userId}/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const isEventInvitation = (notification: Notification) => {
    return notification.type === 'event_invite';
  };

  const shouldShowInvitationButtons = (notification: Notification) => {
    return isEventInvitation(notification) && 
           notification.event_id && 
           !respondedInvitations.has(notification.id);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: backgroundColor }}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Top bar with back arrow and title */}
        <View style={styles.headerRow}>
          <ArrowLeft onPress={() => router.back()} color={textColor} />
        </View>

        <Text style={[styles.title, { color: textColor }]}>Notifications</Text>

        {/* Notifications List */}
        {Object.entries(notifications).map(([date, notifs]) => (
          <View key={date} style={{ marginBottom: 14 }}>
            <Text style={[styles.dateHeader, { color: textColor }]}>{date}</Text>
            {notifs.map(notif => (
              <View key={notif.id} style={[styles.notifBox, { backgroundColor: textInputColor }]}>
                <Text>
                  <Text style={[styles.bold, { color: textColor }]}>{notif.sender}</Text>
                  <Text style={{ color: textColor, fontFamily: 'Poppins-Regular' }}> {notif.message}</Text>
                </Text>
                
                {/* Event Invitation Action Buttons */}
                {shouldShowInvitationButtons(notif) && (
                  <View>
                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.acceptButton,
                          { opacity: processingInvitation === notif.id ? 0.6 : 1 }
                        ]}
                        onPress={() => handleEventInvitation(notif.event_id!, 'accepted', notif.id)}
                        disabled={processingInvitation === notif.id}
                      >
                        <Text style={[styles.acceptButtonText, {color: textColor}]}>
                          {processingInvitation === notif.id ? 'Processing...' : 'Accept'}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          styles.rejectButton,
                          { opacity: processingInvitation === notif.id ? 0.6 : 1 }
                        ]}
                        onPress={() => handleEventInvitation(notif.event_id!, 'declined', notif.id)}
                        disabled={processingInvitation === notif.id}
                      >
                        <Text style={[styles.rejectButtonText, {color: textColor}]}>
                          {processingInvitation === notif.id ? 'Processing...' : 'Decline'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    {/* View Event Button */}
                    <TouchableOpacity
                      style={[
                        styles.actionButton,
                        styles.viewEventButton,
                        { opacity: processingInvitation === notif.id ? 0.6 : 1 }
                      ]}
                      onPress={() => router.push(`/ViewEvent/viewevent?eventId=${notif.event_id}`)}
                      disabled={processingInvitation === notif.id}
                    >
                      <Text style={[styles.viewEventButtonText, {color: textColor}]}>
                        View Event
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                

              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 10,
    padding: 2,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 18,
    color: '#222',
    marginBottom: 10,
    alignSelf: 'center',
  },
  dateHeader: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    marginVertical: 5,
    marginLeft: 5
  },
  notifBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
  },
  bold: {
    fontFamily: 'Poppins-SemiBold',
    color: '#222',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#369942',
  },
  rejectButton: {
    backgroundColor: '#E36062',
  },
  acceptButtonText: {
    color: 'white',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  rejectButtonText: {
    color: 'white',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  viewEventButton: {
    backgroundColor: '#5CAEF1',
    marginTop: 8,
  },
  viewEventButtonText: {
    color: 'white',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },

});