import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';

const AmbientNoise = () => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentSound, setCurrentSound] = React.useState('rain');
  const [volume, setVolume] = React.useState(50);
  const [isLooping, setIsLooping] = React.useState(true);

  const sounds = [
    { id: 'rain', name: 'Rain', icon: '🌧️' },
    { id: 'ocean', name: 'Ocean Waves', icon: '🌊' },
    { id: 'forest', name: 'Forest', icon: '🌲' },
    { id: 'cafe', name: 'Cafe', icon: '☕' },
    { id: 'white-noise', name: 'White Noise', icon: '🔊' }
  ];

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const selectSound = (soundId: string) => {
    setCurrentSound(soundId);
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
  };

  const adjustVolume = (newVolume: number) => {
    setVolume(Math.max(0, Math.min(100, newVolume)));
  };

  return React.createElement(View, { testID: 'ambient-noise-page' },
    React.createElement(Text, { testID: 'title' }, 'Ambient Noise'),
    
    React.createElement(View, { testID: 'current-sound' },
      React.createElement(Text, { testID: 'current-sound-name' }, 
        sounds.find(s => s.id === currentSound)?.name || 'Rain'
      ),
      React.createElement(Text, { testID: 'current-sound-icon' }, 
        sounds.find(s => s.id === currentSound)?.icon || '🌧️'
      )
    ),
    
    React.createElement(View, { testID: 'controls' },
      React.createElement(TouchableOpacity, {
        testID: 'play-pause-button',
        onPress: togglePlay
      }, React.createElement(Text, null, isPlaying ? '⏸️ Pause' : '▶️ Play')),
      
      React.createElement(TouchableOpacity, {
        testID: 'stop-button',
        onPress: () => setIsPlaying(false)
      }, React.createElement(Text, null, '⏹️ Stop'))
    ),
    
    React.createElement(View, { testID: 'volume-control' },
      React.createElement(Text, null, `Volume: ${volume}%`),
      React.createElement(TouchableOpacity, {
        testID: 'volume-up',
        onPress: () => adjustVolume(volume + 10)
      }, React.createElement(Text, null, '🔊')),
      React.createElement(TouchableOpacity, {
        testID: 'volume-down',
        onPress: () => adjustVolume(volume - 10)
      }, React.createElement(Text, null, '🔉'))
    ),
    
    React.createElement(View, { testID: 'loop-setting' },
      React.createElement(Text, null, 'Loop'),
      React.createElement(Switch, {
        testID: 'loop-switch',
        value: isLooping,
        onValueChange: toggleLoop
      })
    ),
    
    React.createElement(View, { testID: 'sound-library' },
      React.createElement(Text, null, 'Sound Library'),
      ...sounds.map((sound, index) => 
        React.createElement(TouchableOpacity, {
          key: index,
          testID: `sound-${sound.id}`,
          onPress: () => selectSound(sound.id)
        }, 
          React.createElement(Text, null, `${sound.icon} ${sound.name}`)
        )
      )
    )
  );
};

describe('AmbientNoise', () => {
  it('renders ambient noise page with title', () => {
    render(React.createElement(AmbientNoise));
    expect(screen.getByText('Ambient Noise')).toBeTruthy();
  });

  it('displays current sound information', () => {
    render(React.createElement(AmbientNoise));
    
    expect(screen.getByText('Rain')).toBeTruthy();
    expect(screen.getByText('🌧️')).toBeTruthy();
  });

  it('shows play button initially', () => {
    render(React.createElement(AmbientNoise));
    expect(screen.getByText('▶️ Play')).toBeTruthy();
  });

  it('toggles play/pause state', () => {
    render(React.createElement(AmbientNoise));
    
    const playButton = screen.getByTestId('play-pause-button');
    fireEvent.press(playButton);
    
    expect(screen.getByText('⏸️ Pause')).toBeTruthy();
    
    fireEvent.press(playButton);
    expect(screen.getByText('▶️ Play')).toBeTruthy();
  });

  it('has stop button', () => {
    render(React.createElement(AmbientNoise));
    expect(screen.getByText('⏹️ Stop')).toBeTruthy();
  });

  it('stops playback when stop button is pressed', () => {
    render(React.createElement(AmbientNoise));
    
    const playButton = screen.getByTestId('play-pause-button');
    fireEvent.press(playButton);
    expect(screen.getByText('⏸️ Pause')).toBeTruthy();
    
    const stopButton = screen.getByTestId('stop-button');
    fireEvent.press(stopButton);
    expect(screen.getByText('▶️ Play')).toBeTruthy();
  });

  it('displays volume control', () => {
    render(React.createElement(AmbientNoise));
    
    expect(screen.getByText('Volume: 50%')).toBeTruthy();
    expect(screen.getByTestId('volume-up')).toBeTruthy();
    expect(screen.getByTestId('volume-down')).toBeTruthy();
  });

  it('adjusts volume up', () => {
    render(React.createElement(AmbientNoise));
    
    const volumeUpButton = screen.getByTestId('volume-up');
    fireEvent.press(volumeUpButton);
    
    expect(screen.getByText('Volume: 60%')).toBeTruthy();
  });

  it('adjusts volume down', () => {
    render(React.createElement(AmbientNoise));
    
    const volumeDownButton = screen.getByTestId('volume-down');
    fireEvent.press(volumeDownButton);
    
    expect(screen.getByText('Volume: 40%')).toBeTruthy();
  });

  it('has loop toggle', () => {
    render(React.createElement(AmbientNoise));
    expect(screen.getByTestId('loop-switch')).toBeTruthy();
  });

  it('toggles loop setting', () => {
    render(React.createElement(AmbientNoise));
    
    const loopSwitch = screen.getByTestId('loop-switch');
    fireEvent(loopSwitch, 'valueChange', false);
    
    expect(loopSwitch.props.value).toBe(false);
  });

  it('displays sound library', () => {
    render(React.createElement(AmbientNoise));
    
    expect(screen.getByText('Sound Library')).toBeTruthy();
    expect(screen.getByText('🌧️ Rain')).toBeTruthy();
    expect(screen.getByText('🌊 Ocean Waves')).toBeTruthy();
    expect(screen.getByText('🌲 Forest')).toBeTruthy();
    expect(screen.getByText('☕ Cafe')).toBeTruthy();
    expect(screen.getByText('🔊 White Noise')).toBeTruthy();
  });

  it('selects different sounds', () => {
    render(React.createElement(AmbientNoise));
    
    const oceanButton = screen.getByTestId('sound-ocean');
    fireEvent.press(oceanButton);
    
    expect(screen.getByText('Ocean Waves')).toBeTruthy();
    expect(screen.getByText('🌊')).toBeTruthy();
  });

  it('has all sound selection buttons', () => {
    render(React.createElement(AmbientNoise));
    
    expect(screen.getByTestId('sound-rain')).toBeTruthy();
    expect(screen.getByTestId('sound-ocean')).toBeTruthy();
    expect(screen.getByTestId('sound-forest')).toBeTruthy();
    expect(screen.getByTestId('sound-cafe')).toBeTruthy();
    expect(screen.getByTestId('sound-white-noise')).toBeTruthy();
  });
});
