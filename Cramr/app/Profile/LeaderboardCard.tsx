import { useRouter } from 'expo-router';
import React from 'react';

import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useUser } from '../../contexts/UserContext';

type Entry = {
  id: string;
  name: string;
  events: number;
  avatar?: string;
  ownerId?: string; // Added to identify the user for banner color
};

type Props = {
  data: Entry[]; 
  title?: string;
};

const defaultRankColors = {
  first: '#82BFE6',   // blue
  second: '#F2D7F5',  // pink
  third: '#DCD895',   // olive
};

export default function LeaderboardCard({ data, title = 'Leaderboard' }: Props) {
  const [first, second, third] = data.slice(0, 3);
  const { isDarkMode } = useUser();
  
  // Consistent color usage from Colors.ts
  const backgroundColor = isDarkMode ? Colors.dark.background : Colors.light.background;
  const textColor = isDarkMode ? Colors.dark.text : Colors.light.text;
  const textInputColor = isDarkMode ? Colors.dark.textInput : Colors.light.textInput;

  return (
    <View style={[styles.card, { backgroundColor: textInputColor }]}>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>

      {/* Podium */}
      <View style={styles.podiumWrap}>
        {/* 3rd */}
        {third && (
          <PodiumCol
            id={third?.id}
            isDarkMode={isDarkMode}
            height={90}
            color={defaultRankColors.third}
            rank={3}
            avatarUri={third?.avatar}
          />
        )}
        {/* 1st */}
        {first && (
          <PodiumCol
            id={first?.id}
            isDarkMode={isDarkMode}
            height={140}
            color={defaultRankColors.first}
            rank={1}
            big
            avatarUri={first?.avatar}
          />
        )}
        {/* 2nd */}
        {second && (
          <PodiumCol
            id={second?.id}
            isDarkMode={isDarkMode}
            height={110}
            color={defaultRankColors.second}
            rank={2}
            avatarUri={second?.avatar}
          />
        )}
      </View>

      <View style={styles.rule} />

      {/* List */}
      <FlatList
        data={data.slice(0, 3)}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Row
            id={item.id}
            rank={index + 1}
            name={item.name}
            events={item.events}
            color={
              index === 0
                ? defaultRankColors.first
                : index === 1
                ? defaultRankColors.second
                : defaultRankColors.third
            }
            avatarUri={item.avatar}
            textColor={textColor}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        scrollEnabled={false}
        contentContainerStyle={{ paddingTop: 8 }}
      />
    </View>
  );
}

/* ---------- Pieces ---------- */

function PodiumCol({
  id,
  isDarkMode,
  height,
  color,
  rank,
  big = false,
  avatarUri,
}: {
  id: string,
  isDarkMode: boolean;
  height: number;
  color: string;
  rank: number;
  big?: boolean;
  avatarUri?: string;
}) {
  const textColor = isDarkMode ? Colors.dark.text : Colors.light.text;
  const router = useRouter();
  return (
    <View style={styles.podiumCol}>
      <View style={[styles.avatarWrap, big && { width: 56, height: 56 }]}>
        <TouchableOpacity onPress={() => router.push({ pathname: '/Profile/External', params: { userId: id } })}>
        <Image
          source={
            avatarUri
              ? { uri: avatarUri }
              : require('../../assets/images/default_profile.jpg')
          }
          style={styles.avatar}
        />
        </TouchableOpacity>
      </View>
      <View style={[styles.block, { height, backgroundColor: color }]}>
        <Text style={[styles.blockNumber, { color: textColor }]}>{rank}</Text>
      </View>
    </View>
  );
}

function Row({
  id,
  rank,
  name,
  events,
  color,
  avatarUri,
  textColor,
}: {
  id: string;
  rank: number;
  name: string;
  events: number;
  color: string;
  avatarUri?: string;
  textColor: string;
}) {
  const router = useRouter();
  return (
    <View style={[styles.row, styles.shadow, { backgroundColor: color }]}>
      <Text style={[styles.rowRank, { color: textColor }]}>{rank}.</Text>
      <TouchableOpacity onPress={() => router.push({ pathname: '/Profile/External', params: { userId: id }})}>
      <Image
        source={
          avatarUri
            ? { uri: avatarUri }
            : require('../../assets/images/default_profile.jpg')
        }
        style={styles.rowAvatar}
      />
      </TouchableOpacity>
      <Text style={[styles.rowName, { color: textColor }]} numberOfLines={1}>
        {name}
      </Text>
      <Text style={[styles.rowEvents, { color: textColor }]}>{events} events</Text>
    </View>
  );
}

// Add the missing styles - you'll need to define these based on your design
const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 20,
    margin: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
    marginBottom: 16,
  },
  podiumWrap: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  podiumCol: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  block: {
    width: 60,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 8,
  },
  blockNumber: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
  rule: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rowRank: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    width: 30,
  },
  rowAvatar: {
    width: 32,
    height: 32,
    borderRadius: 50,
    marginLeft: -5,
    marginHorizontal: 10,
  },
  rowName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '400',
    fontFamily: 'Poppins-SemiBold',
  },
  rowEvents: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: 'Poppins-SemiBold',
  },
});