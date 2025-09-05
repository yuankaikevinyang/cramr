import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { ArrowLeft, Pause, Play } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  AppState,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useUser } from '../../contexts/UserContext';

class AudioManager {
  private static instance: AudioManager;
  private sounds: { [key: string]: Audio.Sound } = {};
  private currentTrack: string | null = null;
  private isInitialized: boolean = false;
  private isLoading: boolean = false;

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async initialize() {
    if (this.isInitialized || this.isLoading) {
      return;
    }
    
    this.isLoading = true;
    console.log('AudioManager: Initializing for the first time...');
    
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      // Load sounds
      await this.loadSounds();
      this.isInitialized = true;
      console.log('AudioManager: Initialization complete');
    } catch (error) {
      console.error('AudioManager: Error during initialization:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private async loadSounds() {
    const soundFiles = [
      { key: 'rain', file: require('../../assets/sounds/rain.mp3') },
      { key: 'jazz', file: require('../../assets/sounds/jazz.mp3') },
      { key: 'hiphop', file: require('../../assets/sounds/hiphop.mp3') },
      { key: 'ambient', file: require('../../assets/sounds/ambient.mp3') }
    ];

    for (const { key, file } of soundFiles) {
      try {
        const sound = new Audio.Sound();
        await sound.loadAsync(file, {
          shouldPlay: false,
          isLooping: true,
          volume: 0.5,
        });
        
        await sound.setIsLoopingAsync(true);
        await sound.setVolumeAsync(0.5);
        
        this.sounds[key] = sound;
        console.log(`AudioManager: Loaded ${key} sound`);
      } catch (error) {
        console.error(`AudioManager: Failed to load ${key} sound:`, error);
      }
    }
  }

  getSoundKeyFromTitle(title: string): string {
    return title.toLowerCase().replace(/\s+/g, '');
  }

  getTitleFromSoundKey(soundKey: string): string | null {
    const keyToTitle: { [key: string]: string } = {
      'rain': 'Rain',
      'jazz': 'Jazz',
      'hiphop': 'Hip Hop',
      'ambient': 'Ambient'
    };
    return keyToTitle[soundKey] || null;
  }

  async getCurrentlyPlayingTrack(): Promise<string | null> {
    for (const [soundKey, sound] of Object.entries(this.sounds)) {
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            return this.getTitleFromSoundKey(soundKey);
          }
        } catch (error) {
          console.error(`AudioManager: Error checking ${soundKey}:`, error);
        }
      }
    }
    return null;
  }

  async playTrack(trackTitle: string): Promise<boolean> {
    const soundKey = this.getSoundKeyFromTitle(trackTitle);
    const sound = this.sounds[soundKey];

    if (!sound) {
      console.log(`AudioManager: Sound for ${trackTitle} not available`);
      return false;
    }

    try {
      await this.stopAllTracks();
    
      const status = await sound.getStatusAsync();
      if (!status.isLoaded) {
        console.error(`AudioManager: Sound ${trackTitle} is not loaded`);
        return false;
      }
      
      await sound.setPositionAsync(0);
      await sound.playAsync();
      this.currentTrack = trackTitle;
      console.log(`AudioManager: Started ${trackTitle}`);
      return true;
    } catch (error) {
      console.error(`AudioManager: Error playing ${trackTitle}:`, error);
      return false;
    }
  }

  async stopTrack(trackTitle: string): Promise<boolean> {
    const soundKey = this.getSoundKeyFromTitle(trackTitle);
    const sound = this.sounds[soundKey];

    if (!sound) {
      return false;
    }

    try {
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await sound.stopAsync();
      }
      
      if (this.currentTrack === trackTitle) {
        this.currentTrack = null;
      }
      console.log(`AudioManager: Stopped ${trackTitle}`);
      return true;
    } catch (error) {
      console.error(`AudioManager: Error stopping ${trackTitle}:`, error);
      return false;
    }
  }

  async stopAllTracks(): Promise<void> {
    for (const [soundKey, sound] of Object.entries(this.sounds)) {
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            await sound.stopAsync();
          }
        } catch (error) {
          console.error(`AudioManager: Error stopping ${soundKey}:`, error);
        }
      }
    }
    this.currentTrack = null;
  }

  async cleanup(): Promise<void> {
    for (const [soundKey, sound] of Object.entries(this.sounds)) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error(`AudioManager: Error unloading ${soundKey}:`, error);
      }
    }
    this.sounds = {};
    this.currentTrack = null;
    this.isInitialized = false;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  isLoadingState(): boolean {
    return this.isLoading;
  }

  getCurrentTrack(): string | null {
    return this.currentTrack;
  }
}

export default function AmbientNoise() {
  const router = useRouter();
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const audioManager = AudioManager.getInstance();
  const isHandlingAction = useRef(false);

  // Colors
  const {isDarkMode} = useUser();
  const backgroundColor = (!isDarkMode ? Colors.light.background : Colors.dark.background);
  const textColor = (!isDarkMode ? Colors.light.text : Colors.dark.text);
  const cardBackgroundColor = (!isDarkMode ? '#FFFFFF' : Colors.dark.textInput);

  const musicTracks = [
    { id: 'rain', title: 'Rain', isPlaying: playingTrack === 'Rain' },
    { id: 'jazz', title: 'Jazz', isPlaying: playingTrack === 'Jazz' },
    { id: 'hiphop', title: 'Hip Hop', isPlaying: playingTrack === 'Hip Hop' },
    { id: 'ambient', title: 'Ambient', isPlaying: playingTrack === 'Ambient' }
  ];

  useEffect(() => {
    let isMounted = true;

    const initializeAudio = async () => {
      console.log('Component: Starting initialization...');
      
      try {
        // Initialize audio manager
        await audioManager.initialize();
        
        if (!isMounted) return;
        
        // Sync current state
        const actualPlayingTrack = await audioManager.getCurrentlyPlayingTrack();
        console.log('Component: Currently playing track:', actualPlayingTrack);
        
        if (isMounted) {
          setPlayingTrack(actualPlayingTrack);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Component: Error during initialization:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    const handleAppStateChange = (nextAppState: string) => {
      console.log('App state changed to:', nextAppState);
      
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        console.log('App going to background, music should continue');
      } else if (nextAppState === 'active') {
        console.log('App coming to foreground, syncing state');
        syncPlayingState();
      }
    };

    const syncPlayingState = async () => {
      try {
        const actualPlayingTrack = await audioManager.getCurrentlyPlayingTrack();
        if (actualPlayingTrack !== playingTrack) {
          setPlayingTrack(actualPlayingTrack);
        }
      } catch (error) {
        console.error('Component: Error syncing state:', error);
      }
    };

    initializeAudio();

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      isMounted = false;
      subscription?.remove();
    };
  }, []);

  const handlePlayPause = async (trackTitle: string) => {
    if (isHandlingAction.current || !audioManager.isReady()) {
      console.log('Component: Action blocked - busy or not ready');
      return;
    }

    try {
      isHandlingAction.current = true;
      console.log(`\n--- Component HandlePlayPause: ${trackTitle} ---`);
      const actualPlayingTrack = await audioManager.getCurrentlyPlayingTrack();
      const isCurrentlyPlaying = actualPlayingTrack === trackTitle;
      
      console.log(`Component: UI state: ${playingTrack}, Actual: ${actualPlayingTrack}, Clicking: ${trackTitle}`);

      if (isCurrentlyPlaying) {
        const success = await audioManager.stopTrack(trackTitle);
        if (success) {
          setPlayingTrack(null);
        }
      } else {
        const success = await audioManager.playTrack(trackTitle);
        if (success) {
          setPlayingTrack(trackTitle);
        }
      }
      
      console.log(`--- End Component HandlePlayPause ---\n`);
    } catch (error) {
      console.error('Component: Error in handlePlayPause:', error);
    } finally {
      isHandlingAction.current = false;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft 
            size={24} 
            color={textColor}
          />
        </TouchableOpacity>

        <Text style={[styles.heading, { color: textColor }]}>Music</Text>

        {isLoading && (
          <></>
        )}


        <View style={styles.musicGrid}>
          {musicTracks.map((track) => (
            <TouchableOpacity
              key={track.id}
              style={[
                styles.musicCard, 
                { backgroundColor: cardBackgroundColor },
                track.isPlaying && { borderWidth: 2, borderColor: textColor }
              ]}
              onPress={() => handlePlayPause(track.title)}
              disabled={isLoading || isHandlingAction.current}
            >
              <Text style={[styles.trackTitle, { color: textColor }]}>{track.title}</Text>
              <View style={[styles.playButton, { borderColor: textColor }]}>
                {track.isPlaying ? (
                  <Pause size={30} color={textColor} />
                ) : (
                  <Play size={30} color={textColor} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  heading: {
    fontSize: 18,
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: -40,
    fontFamily: 'Poppins-SemiBold',
  },
  backButton: {
    width: 25,
    height: 25,
    marginBottom: 12,
  },
  musicGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 15,
  },
  musicCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 15,
    padding: 20,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  trackTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 10,
    textAlign: 'center',
    alignSelf: 'center',
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: -60,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Poppins-Regular',
  },
  backgroundInfo: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'Poppins-Regular',
  },
});