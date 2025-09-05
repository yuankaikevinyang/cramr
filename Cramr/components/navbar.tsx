import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';

type Page = 'listView' | 'map' | 'addEvent' | 'studyTools' | 'profile';

type Props = {
  current: Page;
  onNavigate: (page: Page) => void;
  light?: boolean;          // true = light theme, false = dark
  style?: ViewStyle;        // optional style override
};

export default function BottomNav({ current, onNavigate, light = true, style }: Props) {
  const bg = light ? '#ffffff' : '#2d2d2d';
  const border = light ? '#e0e0e0' : '#4a5568';
  const icon = light ? '#000000' : '#ffffff';

  return (
    <View style={[styles.container, { backgroundColor: bg, borderTopColor: border }, style]}>
      <NavBtn
        active={current === 'listView'}
        onPress={() => onNavigate('listView')}
        children={
          <MaterialCommunityIcons name="clipboard-list-outline" size={24} color={icon} />
        }
      />
      <NavBtn
        active={current === 'map'}
        onPress={() => onNavigate('map')}
        children={<Ionicons name="map-outline" size={24} color={icon} />}
      />
      <NavBtn
        active={current === 'addEvent'}
        onPress={() => onNavigate('addEvent')}
        children={<Feather name="plus-square" size={24} color={icon} />}
      />
      <NavBtn
        active={current === 'studyTools'}
        onPress={() => onNavigate('studyTools')}
        children={<Feather name="tool" size={24} color={icon} />}
      />
      <NavBtn
        active={current === 'profile'}
        onPress={() => onNavigate('profile')}
        children={<Ionicons name="person-circle-outline" size={24} color={icon} />}
      />
    </View>
  );
}

/* ---------- internal ---------- */

function NavBtn({
  active,
  onPress,
  children,
}: {
  active: boolean;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity style={styles.navButton} onPress={onPress}>
      {children}
      {active ? <View style={styles.activeDot} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
    zIndex: 1001,
    elevation: 5,
  },
  navButton: {
    alignItems: 'center',
    padding: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5caef1',
    position: 'absolute',
    bottom: -5,
  },
});