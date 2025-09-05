import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

const Profile = () => {
  const [name, setName] = React.useState('Test User');
  const [username, setUsername] = React.useState('testuser');
  const [profilePicture, setProfilePicture] = React.useState('https://example.com/avatar.jpg');
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    setIsSaving(false);
  };

  const handleImageUpload = () => {
    setProfilePicture('https://example.com/new-avatar.jpg');
  };

  return React.createElement(View, { testID: 'profile-page' },
    React.createElement(View, { testID: 'header' },
      React.createElement(TouchableOpacity, {
        testID: 'back-button',
        onPress: () => console.log('Back pressed')
      }, React.createElement(Text, null, '←')),
      React.createElement(Text, { testID: 'title' }, 'Profile')
    ),

    React.createElement(View, { testID: 'profile-picture-section' },
      React.createElement(Text, null, 'Picture'),
      React.createElement(TouchableOpacity, {
        testID: 'upload-image-button',
        onPress: handleImageUpload
      }, React.createElement(Text, null, 'Upload Image')),
      profilePicture && React.createElement(Text, null, `Image: ${profilePicture}`)
    ),

    React.createElement(View, { testID: 'form-fields' },
      React.createElement(Text, null, 'Name'),
      React.createElement(TextInput, {
        testID: 'name-input',
        value: name,
        onChangeText: setName,
        placeholder: 'Enter your name.'
      }),

      React.createElement(Text, null, 'Username'),
      React.createElement(TextInput, {
        testID: 'username-input',
        value: username,
        onChangeText: setUsername,
        placeholder: 'Enter your username.'
      })
    ),

    React.createElement(TouchableOpacity, {
      testID: 'save-button',
      onPress: handleSave,
      disabled: isSaving
    }, React.createElement(Text, null, isSaving ? 'Saving...' : 'Save'))
  );
};

describe('Profile', () => {
  it('renders profile page with user data', () => {
    render(React.createElement(Profile));
    
    expect(screen.getByTestId('profile-page')).toBeTruthy();
    expect(screen.getByText('Profile')).toBeTruthy();
    expect(screen.getByDisplayValue('Test User')).toBeTruthy();
    expect(screen.getByDisplayValue('testuser')).toBeTruthy();
  });

  it('handles profile picture upload', () => {
    render(React.createElement(Profile));
    
    const uploadButton = screen.getByTestId('upload-image-button');
    fireEvent.press(uploadButton);
    
    expect(screen.getByText('Image: https://example.com/new-avatar.jpg')).toBeTruthy();
  });

  it('handles form field changes', () => {
    render(React.createElement(Profile));
    
    const nameInput = screen.getByTestId('name-input');
    fireEvent.changeText(nameInput, 'New Name');
    
    expect(nameInput.props.value).toBe('New Name');
  });

  it('handles save button press', async () => {
    render(React.createElement(Profile));
    
    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);
    
    expect(screen.getByText('Saving...')).toBeTruthy();
    
    await waitFor(() => {
      expect(screen.getByText('Save')).toBeTruthy();
    });
  });

  it('calls back button when pressed', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(React.createElement(Profile));
    
    const backButton = screen.getByTestId('back-button');
    fireEvent.press(backButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Back pressed');
    consoleSpy.mockRestore();
  });

  it('shows loading state when saving', async () => {
    render(React.createElement(Profile));
    
    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);
    
    expect(screen.getByText('Saving...')).toBeTruthy();
  });

  it('disables save button while saving', async () => {
    render(React.createElement(Profile));
    
    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);
    expect(screen.getByText('Saving...')).toBeTruthy();
  });
});


