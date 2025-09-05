import EventCollapsible from '@/components/EventCollapsible';
import Slider from '@/components/Slider';
import { useUser } from '@/contexts/UserContext';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../../constants/Colors';

interface Event {
    id: string;
    title: string;
    banner_color: number;
    description: string;
    location: string;
    date: string;
    time: string;
    creator_id: string;
    created_at: string;
    event_type: string;
    status: string;
    capacity: number;
    tags: string[];
    rsvped_count: number;
    rsvped_ids: string[];
    saved_ids: string[];
    class: string;
    creator_profile_picture: string;
}

interface SavedProps {
  userId: string | null;
  showSlider?: boolean; // Optional prop to show/hide the slider
  defaultView?: 'rsvped' | 'saved'; // Default view when no slider
}

export default function SavedEventsSection({ 
    userId, 
    showSlider = true, 
    defaultView = 'saved' 
}: SavedProps) {
    // Colors
    const { isDarkMode, user } = useUser();
    const backgroundColor = (!isDarkMode ? Colors.light.background : Colors.dark.background);
    const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text);
    const bannerColors = ['#AACC96', '#F4BEAE', '#52A5CE', '#FF7BAC', '#D3B6D3'];

    const [isSwitch, setIsSwitch] = useState<boolean>(defaultView === 'rsvped');
    
    // Events
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [events, setEvents] = useState<Event[]>([]);
    const [rsvpedEvents, setRsvpedEvents] = useState<Event[]>([]);
    const [savedEvents, setSavedEvents] = useState<Event[]>([]);

    // Fetch events and filter
    const fetchAndFilterEvents = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setError(null);
            const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
            
            if (!backendUrl) {
                throw new Error('Backend URL is not configured');
            }

            const response = await fetch(`${backendUrl}/events`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data: Event[] = await response.json();
            setEvents(data);

            // Filter events - check if using array-based approach or API-based approach
            // Try both approaches for compatibility
            const rsvped = data.filter(event => {
                // First try array-based approach
                if (event.rsvped_ids && Array.isArray(event.rsvped_ids)) {
                    return event.rsvped_ids.includes(userId);
                }
                // Could also check via API here if needed
                return false;
            });
            setRsvpedEvents(rsvped);

            const saved = data.filter(event => {
                // First try array-based approach
                if (event.saved_ids && Array.isArray(event.saved_ids)) {
                    return event.saved_ids.includes(userId);
                }
                // Could also check via API here if needed
                return false;
            });
            setSavedEvents(saved);

            setLoading(false);
        } catch (err) {
            console.error('Error fetching events:', err);
            setError(err instanceof Error ? err.message : 'Failed to load events');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchAndFilterEvents();
        }
    }, [userId]);

    // Function to refresh events with proper loading states
    const refreshEvents = async () => {
        if (!userId) return;
        
        setRefreshing(true);
        await fetchAndFilterEvents();
        setRefreshing(false);
    };

    // Handle saved change with error handling
    const handleSavedChange = async (eventId: string, saved: boolean) => {
        if (!userId) return;
        
        try {
            const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
            if (!backendUrl) {
                throw new Error('Backend URL is not configured');
            }

            const url = `${backendUrl}/users/${userId}/saved-events`;
            const method = saved ? 'POST' : 'DELETE';
            const body = saved ? { event_id: eventId } : undefined;
            const deleteUrl = saved ? url : `${url}/${eventId}`;
            
            const response = await fetch(deleteUrl, { 
                method, 
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            await refreshEvents();
        } catch (error) {
            console.error(`Error ${saved ? 'saving' : 'unsaving'} event:`, error);
        }
    };

    // Handle RSVP change with error handling
    const handleRsvpChange = async (eventId: string, rsvped: boolean) => {
        if (!userId) return;
        
        try {
            const backendUrl = process.env.EXPO_PUBLIC_BACKEND_URL;
            if (!backendUrl) {
                throw new Error('Backend URL is not configured');
            }

            const url = `${backendUrl}/events/${eventId}/rsvpd`;
            const method = rsvped ? 'POST' : 'DELETE';
            const body = rsvped ? { user_id: userId, status: 'accepted' } : { user_id: userId };
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            await refreshEvents();
        } catch (error) {
            console.error(`Error ${rsvped ? 'RSVPing' : 'unRSVPing'} event:`, error);
        }
    };

    // Render event list
    const renderEventList = (eventList: Event[], emptyMessage: string) => {
        if (loading) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#5CAEF1" />
                    <Text style={[styles.normalText, {color: textColor, marginTop: 10}]}>
                        Loading events...
                    </Text>
                </View>
            );
        }
        
        if (eventList.length === 0) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={[styles.normalText, {color: textColor}]}>{emptyMessage}</Text>
                </View>
            );
        }
        
        return eventList.map((event) => (
            <EventCollapsible
                key={event.id}
                eventId={event.id}
                title={event.title}
                bannerColor={bannerColors[event.banner_color]}
                ownerId={event.creator_id}
                ownerProfile={event.creator_profile_picture || 'https://via.placeholder.com/30'}
                tag1={event.tags?.[0] || null}
                tag2={event.tags?.[1] || null}
                tag3={event.tags?.[2] || null}
                subject={event.class}
                location={event.location}
                date={event.date}
                time={event.time}
                rsvpedCount={event.rsvped_count}
                capacity={event.capacity}
                isOwner={false}
                isSaved={event.saved_ids?.includes(userId || '') || false}
                onSavedChange={(saved) => handleSavedChange(event.id, saved)}
                isRsvped={event.rsvped_ids?.includes(userId || '') || false}
                onRsvpedChange={(rsvped) => handleRsvpChange(event.id, rsvped)}
                isDarkMode={isDarkMode}
                style={{marginBottom: 10}}
            />
        ));
    };

    if (!userId) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={[styles.normalText, {color: textColor}]}>
                    Please log in to view saved events
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {showSlider && (
                <View style={styles.sliderContainer}>
                    <Slider
                        leftLabel='RSVPed'
                        rightLabel='Saved'
                        width={180}
                        onChangeSlider={setIsSwitch}
                        lightMode={!isDarkMode}
                    />
                </View>
            )}

            {error && (
                <Text style={[styles.normalText, {color: 'red', marginBottom: 10}]}>
                    Error: {error}
                </Text>
            )}

            <ScrollView 
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={refreshEvents}
                        colors={[isDarkMode ? '#ffffff' : '#000000']}
                        tintColor={isDarkMode ? '#ffffff' : '#000000'}
                    />
                }
            >
                {!isSwitch && renderEventList(rsvpedEvents, 'No RSVPed events...')}
                {isSwitch && renderEventList(savedEvents, 'No saved events...')}
                <View style={{ height: 20 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    sliderContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    normalText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
    },
});