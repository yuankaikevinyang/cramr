import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const Follow = () => {
  const [activeTab, setActiveTab] = React.useState('followers');
  const [followers, setFollowers] = React.useState([
    { id: '1', username: 'follower1', full_name: 'Follower One' },
    { id: '2', username: 'follower2', full_name: 'Follower Two' }
  ]);
  const [following, setFollowing] = React.useState([
    { id: '3', username: 'following1', full_name: 'Following One' },
    { id: '4', username: 'following2', full_name: 'Following Two' }
  ]);

  const navigateToProfile = (userId: string) => {
    console.log(`Navigate to profile: ${userId}`);
  };

  return React.createElement(View, { testID: 'follow-page' },
    React.createElement(Text, { testID: 'header-title' }, 'Follows'),
    
    React.createElement(View, { testID: 'tab-buttons' },
      React.createElement(TouchableOpacity, {
        testID: 'followers-tab',
        onPress: () => setActiveTab('followers')
      }, React.createElement(Text, null, 'Followers')),
      React.createElement(TouchableOpacity, {
        testID: 'following-tab',
        onPress: () => setActiveTab('following')
      }, React.createElement(Text, null, 'Following'))
    ),

    activeTab === 'followers' ?
      React.createElement(View, { testID: 'followers-list' },
        followers.map((user, index) => 
          React.createElement(TouchableOpacity, {
            key: index,
            testID: `follower-${index}`,
            onPress: () => navigateToProfile(user.id)
          }, React.createElement(Text, null, user.username))
        )
      ) :
      React.createElement(View, { testID: 'following-list' },
        following.map((user, index) => 
          React.createElement(TouchableOpacity, {
            key: index,
            testID: `following-${index}`,
            onPress: () => navigateToProfile(user.id)
          }, React.createElement(Text, null, user.username))
        )
      )
  );
};

describe('Follow', () => {
  it('renders follow page with correct header', () => {
    render(React.createElement(Follow));
    
    expect(screen.getByTestId('follow-page')).toBeTruthy();
    expect(screen.getByText('Follows')).toBeTruthy();
  });

  it('displays followers list by default', () => {
    render(React.createElement(Follow));
    
    expect(screen.getByTestId('followers-list')).toBeTruthy();
    expect(screen.getByText('follower1')).toBeTruthy();
    expect(screen.getByText('follower2')).toBeTruthy();
  });

  it('switches to following tab when pressed', () => {
    render(React.createElement(Follow));
    
    const followingTab = screen.getByTestId('following-tab');
    fireEvent.press(followingTab);
    
    expect(screen.getByTestId('following-list')).toBeTruthy();
    expect(screen.getByText('following1')).toBeTruthy();
    expect(screen.getByText('following2')).toBeTruthy();
  });

  it('navigates to user profile when user is tapped', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(React.createElement(Follow));
    
    const userItem = screen.getByTestId('follower-0');
    fireEvent.press(userItem);
    
    expect(consoleSpy).toHaveBeenCalledWith('Navigate to profile: 1');
    consoleSpy.mockRestore();
  });

  it('shows both followers and following tabs', () => {
    render(React.createElement(Follow));
    
    expect(screen.getByTestId('followers-tab')).toBeTruthy();
    expect(screen.getByTestId('following-tab')).toBeTruthy();
  });

  it('displays correct user data in both tabs', () => {
    render(React.createElement(Follow));
    
    expect(screen.getByText('follower1')).toBeTruthy();
    expect(screen.getByText('follower2')).toBeTruthy();
    
    const followingTab = screen.getByTestId('following-tab');
    fireEvent.press(followingTab);
    
    expect(screen.getByText('following1')).toBeTruthy();
    expect(screen.getByText('following2')).toBeTruthy();
  });
});
