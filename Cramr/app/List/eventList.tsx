import EventCollapsible from '@/components/EventCollapsible';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PublicStudySessionFactory } from '@/Logic/PublicStudySessionFactory';
import * as Location from 'expo-location';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Colors } from '../../constants/Colors';

import { useUser } from '@/contexts/UserContext';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Filters } from './filter';

import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';

interface EventListProps {
  filters?: Filters | null;
  selectedEventId?: string | null;
  searchQuery?: string;
  creatorUserId?: string;
  onMap?: boolean | false;
  isDistanceVisible?: boolean;
  eventDistances?: { [eventId: string]: number };
  onClearSelectedEvent?: () => void;
  onCenterMapOnEvent?: (eventId: string) => void;
}

export default function EventList({
  filters,
  selectedEventId,
  searchQuery,
  creatorUserId,
  onMap,
  isDistanceVisible,
  eventDistances,
  onClearSelectedEvent,
  onCenterMapOnEvent,
}: EventListProps) {
  const { isDarkMode, user } = useUser();
  const textColor = !isDarkMode ? Colors.light.text : Colors.dark.text;
  const router = useRouter();

  const [refreshing, setRefreshing] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const userId = user?.id;

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsedEvents, setCollapsedEvents] = useState<Set<string>>(new Set());
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const itemPositionsRef = useRef<Map<string, number>>(new Map());

  const [busyEventId, setBusyEventId] = useState<string | null>(null);
  const { scheduleEventReminder } = usePushNotifications();

  // -------- fetch / refresh ----------
  const fetchEvents = async () => {
    try {
      if (!refreshing && !isRefreshing && events.length === 0) setLoading(true);
      setError(null);

      const factory = new PublicStudySessionFactory();
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const eventsData = await response.json();

      const processedEvents = await Promise.all(
        eventsData.map(async (event: any) => {
          try {
            // geocode (best effort)
            let coordinates = { lat: 33.1581, lng: -117.3506, isAccurate: false };
            if (event.location) {
              try {
                const studySession = factory.createStudySession(event.location, event.date_and_time, event.title);
                const geocodeResult = await studySession.addressToCoordinates();
                if (geocodeResult?.geometry?.location) {
                  coordinates = {
                    lat: geocodeResult.geometry.location.lat,
                    lng: geocodeResult.geometry.location.lng,
                    isAccurate: true,
                  };
                }
              } catch {}
            }

            // RSVP
            let isRSVPed = false;
            try {
              const rsvpRes = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${event.id}/rsvpd?user_id=${userId}`
              );
              if (rsvpRes.ok) {
                const rsvpData = await rsvpRes.json();
                isRSVPed = rsvpData.rsvp?.status === 'accepted';
              }
            } catch {}

            // Saved
            let isSaved = false;
            try {
              const savedRes = await fetch(
                `${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${userId}/saved-events/${event.id}`
              );
              if (savedRes.ok) {
                const savedData = await savedRes.json();
                isSaved = savedData.is_saved;
              }
            } catch {}

            return { ...event, coordinates, isRSVPed, isSaved, geocodeError: !coordinates.isAccurate };
          } catch {
            return {
              ...event,
              coordinates: { lat: 0, lng: 0, isAccurate: false },
              isRSVPed: false,
              isSaved: false,
              geocodeError: true,
            };
          }
        })
      );

      // sort by approx distance
      const sorted = processedEvents.sort((a, b) => {
        const da = compareDistanceFromLocation(a.coordinates.lat, a.coordinates.lng);
        const db = compareDistanceFromLocation(b.coordinates.lat, b.coordinates.lng);
        return da - db;
      });

      setEvents(sorted);
    } catch (e: any) {
      setError(e?.message || 'Unknown error');
      setEvents([]);
    } finally {
      if ((!refreshing && !isRefreshing) || events.length === 0) setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    if (refreshing || isRefreshing) return;
    setRefreshing(true);
    setIsRefreshing(true);
    if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    try {
      await Promise.all([fetchEvents(), new Promise(res => setTimeout(res, 800))]);
    } catch {
      Alert.alert('Refresh Failed', 'Unable to refresh events. Please try again.');
    } finally {
      refreshTimeoutRef.current = setTimeout(() => {
        setRefreshing(false);
        setIsRefreshing(false);
      }, 200);
    }
  }, [refreshing, isRefreshing]);

  useEffect(() => {
    fetchEvents();
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
    return () => {
      if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(React.useCallback(() => { fetchEvents(); }, []));

  // -------- helpers ----------
  const compareDistanceFromLocation = (lat: number, long: number) => {
    const latDistance = (location?.coords.latitude || 0) - lat;
    const longDistance = (location?.coords.longitude || 0) - long;
    return Math.sqrt(latDistance ** 2 + longDistance ** 2);
  };

  const handleEventToggle = (eventId: string) => {
    if (selectedEventId && onClearSelectedEvent) onClearSelectedEvent();
    setCollapsedEvents(prev => {
      const s = new Set(prev);
      s.has(eventId) ? s.delete(eventId) : s.add(eventId);
      return s;
    });
  };

  const toggleRSVP = async (eventId: string, current: boolean) => {
    if (busyEventId) return;
    setBusyEventId(eventId);
    try {
      if (current) {
        const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/rsvpd`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        });
        if (!res.ok) throw new Error(await res.text());
        setEvents(prev => prev.map(e => e.id === eventId
          ? { ...e, isRSVPed: false, accepted_count: Math.max(0, (e.accepted_count || 0) - 1) }
          : e
        ));
      } else {
        const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/events/${eventId}/rsvpd`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, status: 'accepted' }),
        });
        if (!res.ok) throw new Error(await res.text());
        setEvents(prev => prev.map(e => e.id === eventId
          ? { ...e, isRSVPed: true, accepted_count: (e.accepted_count || 0) + 1 }
          : e
        ));
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unexpected error');
    } finally {
      setBusyEventId(null);
    }
  };

  const toggleSave = async (eventId: string, current: boolean) => {
    if (busyEventId) return;
    setBusyEventId(eventId);
    try {
      if (current) {
        const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${userId}/saved-events/${eventId}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error(await res.text());
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, isSaved: false } : e));
      } else {
        const res = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/users/${userId}/saved-events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event_id: eventId }),
        });
        if (!res.ok) throw new Error(await res.text());
        setEvents(prev => prev.map(e => e.id === eventId ? { ...e, isSaved: true } : e));
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unexpected error');
    } finally {
      setBusyEventId(null);
    }
  };

  const openEvent = (id: string) => {
    // navigate to detail
    router.push({ pathname: '/ViewEvent/viewevent', params: { eventId: id } });
  };

  // -------- filters ----------
  const filteredEvents = events.filter((event: any) => {
    if (!filters) return true;
    if (filters.attendees) {
      const count = event.accepted_count ?? event.rsvped_count ?? 0;
      if (count < filters.attendees) return false;
    }
    return true;
  });

  const creatorFilteredEvents = creatorUserId
    ? filteredEvents.filter((event: any) => event.creator_id === creatorUserId)
    : filteredEvents;
    
    const normalizedQuery = (searchQuery || '').trim().toLowerCase();
    const searchedEvents = normalizedQuery
      ? creatorFilteredEvents.filter((event: any) => {
          const titleText = (event.title || '').toLowerCase();               // ← added
          const creator = (event.creator_name || event.creator_id || '').toLowerCase();
          const locationText = (event.location || '').toLowerCase();
          const tagsText = Array.isArray(event.tags) ? event.tags.join(' ').toLowerCase() : '';
          return (
            titleText.includes(normalizedQuery) ||                           // ← added
            creator.includes(normalizedQuery) ||
            locationText.includes(normalizedQuery) ||
            tagsText.includes(normalizedQuery)
          );
        })
      : creatorFilteredEvents;

  useEffect(() => {
    if (selectedEventId) {
      setCollapsedEvents(new Set(events.map(e => e.id).filter(id => id !== selectedEventId)));
    }
  }, [selectedEventId, events]);

  const scrollToSelectedIfReady = useCallback(() => {
    if (!selectedEventId) return;
    const y = itemPositionsRef.current.get(selectedEventId);
    if (typeof y === 'number') {
      const topPadding = 5;
      scrollViewRef.current?.scrollTo({ y: Math.max(0, y - topPadding), animated: true });
      return true;
    }
    return false;
  }, [selectedEventId, onMap]);

  useEffect(() => {
    if (!selectedEventId) return;
    if (!scrollToSelectedIfReady()) {
      const t = setTimeout(() => {
        scrollToSelectedIfReady();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [selectedEventId, searchedEvents, collapsedEvents, scrollToSelectedIfReady]);

  // -------- render ----------
  if (loading && events.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#5CAEF1" />
        <Text style={[styles.loadingText, { color: textColor, fontFamily: 'Poppins-Regular' }]}>Loading events...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Pressable style={styles.retryButton} onPress={fetchEvents}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
      style={{ flex: 1 }}
      bounces
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={isDarkMode ? ['#5CAEF1', '#7CC8FF'] : ['#5CAEF1', '#4A9EE0']}
          tintColor={isDarkMode ? '#5CAEF1' : '#4A9EE0'}
          progressBackgroundColor={isDarkMode ? '#2D2D2D' : '#FFFFFF'}
          titleColor={textColor}
          // IMPORTANT: no size="default" (Android expects number)
        />
      }
    >
      {searchedEvents.map((event: any) => {
        const isCollapsed = collapsedEvents.has(event.id);
        const include = (creatorUserId ? event.creator_id === creatorUserId : event.creator_id !== userId);
        if (!include) return null;
        if (onMap && event.event_format === 'Online') return null;

        return (
          <View
            key={event.id}
            onLayout={(e) => {
              const y = e.nativeEvent.layout.y;
              itemPositionsRef.current.set(event.id, y);
            }}
          >
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
            isSaved={event.isSaved}
            onSavedChange={() => toggleSave(event.id, event.isSaved)}
            isRsvped={event.isRSVPed}
            onRsvpedChange={() => toggleRSVP(event.id, event.isRSVPed)}
            isCollapsed={isCollapsed}
            onToggleCollapse={() => handleEventToggle(event.id)}
            onCenterMapOnEvent={onCenterMapOnEvent}
            isDistanceVisible={!!isDistanceVisible}
            distanceUnit={filters?.unit || 'mi'}
            distance={isDistanceVisible && eventDistances ? eventDistances[event.id] : null}
            isDarkMode={isDarkMode}
            style={{ marginBottom: 5 }}
            // 🔑 navigate on click (visuals unchanged)
            onOpen={() => openEvent(event.id)}
          />
          </View>
        );
      })}
      <View style={[styles.extraSpace, { height: Math.max(searchedEvents.length * 75 + 160, 300) }]} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {},
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  loadingText: { marginTop: 10, fontSize: 14 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 50 },
  errorText: { fontSize: 16, color: '#ff0000', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#5CAEF1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  extraSpace: {},
});
