import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ProfileInternal = () => {
  const [name, setName] = React.useState('John Doe');
  const [username, setUsername] = React.useState('johndoe');
  const [bio, setBio] = React.useState('Student at University');
  const [isEditing, setIsEditing] = React.useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const toggleNotifications = () => {
    setNotificationsEnabled(!notificationsEnabled);
  };

  return React.createElement(View, { testID: 'profile-internal-page' },
    React.createElement(Text, { testID: 'title' }, 'Profile'),
    
    React.createElement(View, { testID: 'profile-info' },
      React.createElement(Text, { testID: 'name-label' }, 'Name'),
      isEditing ? 
        React.createElement(TextInput, {
          testID: 'name-input',
          value: name,
          onChangeText: setName,
          placeholder: 'Enter your name'
        }) :
        React.createElement(Text, { testID: 'name-display' }, name),
      
      React.createElement(Text, { testID: 'username-label' }, 'Username'),
      isEditing ? 
        React.createElement(TextInput, {
          testID: 'username-input',
          value: username,
          onChangeText: setUsername,
          placeholder: 'Enter your username'
        }) :
        React.createElement(Text, { testID: 'username-display' }, username),
      
      React.createElement(Text, { testID: 'bio-label' }, 'Bio'),
      isEditing ? 
        React.createElement(TextInput, {
          testID: 'bio-input',
          value: bio,
          onChangeText: setBio,
          placeholder: 'Enter your bio'
        }) :
        React.createElement(Text, { testID: 'bio-display' }, bio)
    ),
    
    React.createElement(View, { testID: 'settings-section' },
      React.createElement(Text, null, 'Settings'),
      React.createElement(View, { testID: 'notification-setting' },
        React.createElement(Text, null, 'Notifications'),
        React.createElement(Switch, {
          testID: 'notification-switch',
          value: notificationsEnabled,
          onValueChange: toggleNotifications
        })
      )
    ),
    
    React.createElement(View, { testID: 'action-buttons' },
      isEditing ? 
        React.createElement(TouchableOpacity, {
          testID: 'save-button',
          onPress: handleSave
        }, React.createElement(Text, null, 'Save')) :
        React.createElement(TouchableOpacity, {
          testID: 'edit-button',
          onPress: handleEdit
        }, React.createElement(Text, null, 'Edit'))
    ),
    
    React.createElement(TouchableOpacity, {
      testID: 'settings-button',
      onPress: () => console.log('Navigate to Settings')
    }, React.createElement(Text, null, 'Settings')),
    
    React.createElement(TouchableOpacity, {
      testID: 'followers-button',
      onPress: () => console.log('Navigate to Followers')
    }, React.createElement(Text, null, 'Followers'))
  );
};

describe('ProfileInternal', () => {
  it('renders profile page with title', () => {
    render(React.createElement(ProfileInternal));
    expect(screen.getByText('Profile')).toBeTruthy();
  });

  it('displays user information', () => {
    render(React.createElement(ProfileInternal));
    
    expect(screen.getByText('John Doe')).toBeTruthy();
    expect(screen.getByText('johndoe')).toBeTruthy();
    expect(screen.getByText('Student at University')).toBeTruthy();
  });

  it('shows edit button initially', () => {
    render(React.createElement(ProfileInternal));
    expect(screen.getByText('Edit')).toBeTruthy();
  });

  it('switches to edit mode when edit button is pressed', () => {
    render(React.createElement(ProfileInternal));
    
    const editButton = screen.getByTestId('edit-button');
    fireEvent.press(editButton);
    
    expect(screen.getByTestId('name-input')).toBeTruthy();
    expect(screen.getByTestId('username-input')).toBeTruthy();
    expect(screen.getByTestId('bio-input')).toBeTruthy();
    expect(screen.getByText('Save')).toBeTruthy();
  });

  it('saves changes when save button is pressed', () => {
    render(React.createElement(ProfileInternal));
    
    const editButton = screen.getByTestId('edit-button');
    fireEvent.press(editButton);
    
    const nameInput = screen.getByTestId('name-input');
    fireEvent.changeText(nameInput, 'Jane Doe');
    
    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);
    
    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.getByText('Edit')).toBeTruthy();
  });

  it('has notification toggle', () => {
    render(React.createElement(ProfileInternal));
    expect(screen.getByTestId('notification-switch')).toBeTruthy();
  });

  it('toggles notification setting', () => {
    render(React.createElement(ProfileInternal));
    
    const notificationSwitch = screen.getByTestId('notification-switch');
    fireEvent(notificationSwitch, 'valueChange', false);
    
    expect(notificationSwitch.props.value).toBe(false);
  });

  it('has navigation buttons', () => {
    render(React.createElement(ProfileInternal));
    
    expect(screen.getByTestId('settings-button')).toBeTruthy();
    expect(screen.getByTestId('followers-button')).toBeTruthy();
  });

  it('handles settings button press', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(React.createElement(ProfileInternal));
    
    const settingsButton = screen.getByTestId('settings-button');
    fireEvent.press(settingsButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Navigate to Settings');
    consoleSpy.mockRestore();
  });

  it('handles followers button press', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(React.createElement(ProfileInternal));
    
    const followersButton = screen.getByTestId('followers-button');
    fireEvent.press(followersButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Navigate to Followers');
    consoleSpy.mockRestore();
  });
});
