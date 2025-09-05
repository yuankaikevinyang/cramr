import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useUser } from '../../contexts/UserContext';
import LeaderboardCard from './LeaderboardCard';

export default function LeaderboardPage() {
  const router = useRouter();
  
  // Colors
  const {isDarkMode} = useUser();
  const backgroundColor = (!isDarkMode ? Colors.light.background : Colors.dark.background);
  const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text);
  
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://132.249.242.182:8080/leaderboard');
      const data = await response.json();
      
      if (data.success) {
        setLeaderboardData(data.leaderboard);
      } else {
        setError('Failed to fetch leaderboard');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 10, color: textColor }}>Loading leaderboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'red' }}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={textColor} style={{marginLeft: 15}}/>
        </TouchableOpacity>

        <LeaderboardCard data={leaderboardData} title="Event Creators Leaderboard" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 5,
  },
  heading: {
    fontSize: 18,
    alignSelf: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  backButton: {
    width: 25,
    height: 25,
    marginBottom: 12,
  },
});