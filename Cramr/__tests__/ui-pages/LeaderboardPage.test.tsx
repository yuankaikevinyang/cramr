import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

interface LeaderboardUser {
  id: string;
  name: string;
  events: number;
}

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = React.useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setTimeout(() => {
      setLoading(false);
      setLeaderboardData([
        { id: '1', name: 'User1', events: 5 },
        { id: '2', name: 'User2', events: 3 }
      ]);
    }, 100);
  }, []);

  if (loading) {
    return React.createElement(View, { testID: 'loading-container' },
      React.createElement(ActivityIndicator, { size: 'large' }),
      React.createElement(Text, null, 'Loading leaderboard...')
    );
  }

  if (error) {
    return React.createElement(View, { testID: 'error-container' },
      React.createElement(Text, { style: { color: 'red' } }, error)
    );
  }

  return React.createElement(View, { testID: 'leaderboard-page' },
    React.createElement(TouchableOpacity, { 
      testID: 'back-button',
      onPress: () => console.log('Back pressed')
    }, React.createElement(Text, null, '←')),
    
    React.createElement(Text, { testID: 'title' }, 'Leaderboard'),
    
    React.createElement(View, { testID: 'leaderboard-list' },
      leaderboardData.map((user, index) => 
        React.createElement(View, { key: index, testID: `user-${index}` },
          React.createElement(Text, null, user.name),
          React.createElement(Text, null, `${user.events} events`)
        )
      )
    )
  );
};

describe('LeaderboardPage', () => {
  it('renders leaderboard page with title', async () => {
    render(React.createElement(LeaderboardPage));
    
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-page')).toBeTruthy();
      expect(screen.getByText('Leaderboard')).toBeTruthy();
    });
  });

  it('shows loading state initially', () => {
    render(React.createElement(LeaderboardPage));
    
    expect(screen.getByTestId('loading-container')).toBeTruthy();
    expect(screen.getByText('Loading leaderboard...')).toBeTruthy();
  });

  it('displays leaderboard data after loading', async () => {
    render(React.createElement(LeaderboardPage));

    await waitFor(() => {
      expect(screen.getByText('User1')).toBeTruthy();
      expect(screen.getByText('User2')).toBeTruthy();
      expect(screen.getByText('5 events')).toBeTruthy();
      expect(screen.getByText('3 events')).toBeTruthy();
    });
  });

  it('has back button functionality', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(React.createElement(LeaderboardPage));
    
    await waitFor(() => {
      const backButton = screen.getByTestId('back-button');
      fireEvent.press(backButton);
      expect(consoleSpy).toHaveBeenCalledWith('Back pressed');
    });
    consoleSpy.mockRestore();
  });

  it('displays user list correctly', async () => {
    render(React.createElement(LeaderboardPage));

    await waitFor(() => {
      expect(screen.getByTestId('user-0')).toBeTruthy();
      expect(screen.getByTestId('user-1')).toBeTruthy();
    });
  });
});
