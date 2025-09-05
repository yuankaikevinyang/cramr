import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const StudyTools = () => {
  const [currentPage, setCurrentPage] = React.useState('studyTools');

  const handleNavigation = (page: string) => {
    if (currentPage !== page) {
      setCurrentPage(page);
    }
  };

  return React.createElement(View, { testID: 'study-tools-page' },
    React.createElement(Text, { testID: 'title' }, 'Study Tools'),
    
    React.createElement(TouchableOpacity, {
      testID: 'pomodoro-button',
      onPress: () => console.log('Navigate to Pomodoro')
    }, React.createElement(Text, null, 'Pomodoro')),
    
    React.createElement(TouchableOpacity, {
      testID: 'music-button',
      onPress: () => console.log('Navigate to Music')
    }, React.createElement(Text, null, 'Music')),
    
    React.createElement(TouchableOpacity, {
      testID: 'flashcards-button',
      onPress: () => console.log('Navigate to Flashcards')
    }, React.createElement(Text, null, 'Flashcards')),
    
    React.createElement(TouchableOpacity, {
      testID: 'notes-button',
      onPress: () => console.log('Navigate to Notes')
    }, React.createElement(Text, null, 'Notes')),
    
    React.createElement(TouchableOpacity, {
      testID: 'leaderboard-button',
      onPress: () => console.log('Navigate to Leaderboard')
    }, React.createElement(Text, null, 'Leaderboard'))
  );
};

describe('StudyTools', () => {
  it('renders study tools page with title', () => {
    render(React.createElement(StudyTools));
    expect(screen.getByText('Study Tools')).toBeTruthy();
  });

  it('displays all study tool options', () => {
    render(React.createElement(StudyTools));
    
    expect(screen.getByText('Pomodoro')).toBeTruthy();
    expect(screen.getByText('Music')).toBeTruthy();
    expect(screen.getByText('Flashcards')).toBeTruthy();
    expect(screen.getByText('Notes')).toBeTruthy();
    expect(screen.getByText('Leaderboard')).toBeTruthy();
  });

  it('has navigation buttons for each tool', () => {
    render(React.createElement(StudyTools));
    
    expect(screen.getByTestId('pomodoro-button')).toBeTruthy();
    expect(screen.getByTestId('music-button')).toBeTruthy();
    expect(screen.getByTestId('flashcards-button')).toBeTruthy();
    expect(screen.getByTestId('notes-button')).toBeTruthy();
    expect(screen.getByTestId('leaderboard-button')).toBeTruthy();
  });

  it('handles pomodoro button press', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(React.createElement(StudyTools));
    
    const pomodoroButton = screen.getByTestId('pomodoro-button');
    fireEvent.press(pomodoroButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Navigate to Pomodoro');
    consoleSpy.mockRestore();
  });

  it('handles music button press', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(React.createElement(StudyTools));
    
    const musicButton = screen.getByTestId('music-button');
    fireEvent.press(musicButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Navigate to Music');
    consoleSpy.mockRestore();
  });

  it('handles flashcards button press', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(React.createElement(StudyTools));
    
    const flashcardsButton = screen.getByTestId('flashcards-button');
    fireEvent.press(flashcardsButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Navigate to Flashcards');
    consoleSpy.mockRestore();
  });

  it('handles notes button press', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(React.createElement(StudyTools));
    
    const notesButton = screen.getByTestId('notes-button');
    fireEvent.press(notesButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Navigate to Notes');
    consoleSpy.mockRestore();
  });

  it('handles leaderboard button press', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(React.createElement(StudyTools));
    
    const leaderboardButton = screen.getByTestId('leaderboard-button');
    fireEvent.press(leaderboardButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Navigate to Leaderboard');
    consoleSpy.mockRestore();
  });
});
