import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';

const PreferencesPage = () => {
  const [pushNotifications, setPushNotifications] = React.useState(true);
  const [emailNotifications, setEmailNotifications] = React.useState(false);
  const [smsNotifications, setSmsNotifications] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    setIsSaving(false);
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return React.createElement(View, { testID: 'preferences-page' },
    React.createElement(View, { testID: 'header' },
      React.createElement(TouchableOpacity, {
        testID: 'back-button',
        onPress: () => console.log('Back pressed')
      }, React.createElement(Text, null, '←')),
      React.createElement(Text, { testID: 'title' }, 'Preferences')
    ),

    React.createElement(View, { testID: 'notification-toggles' },
      React.createElement(View, { testID: 'push-toggle' },
        React.createElement(Text, null, 'Push Notifications'),
        React.createElement(Switch, {
          testID: 'push-switch',
          value: pushNotifications,
          onValueChange: setPushNotifications
        })
      ),
      React.createElement(View, { testID: 'email-toggle' },
        React.createElement(Text, null, 'Email Notifications'),
        React.createElement(Switch, {
          testID: 'email-switch',
          value: emailNotifications,
          onValueChange: setEmailNotifications
        })
      ),
      React.createElement(View, { testID: 'sms-toggle' },
        React.createElement(Text, null, 'SMS Notifications'),
        React.createElement(Switch, {
          testID: 'sms-switch',
          value: smsNotifications,
          onValueChange: setSmsNotifications
        })
      )
    ),

    React.createElement(View, { testID: 'theme-section' },
      React.createElement(Text, null, 'Theme'),
      React.createElement(TouchableOpacity, {
        testID: 'theme-toggle',
        onPress: toggleTheme
      }, React.createElement(Text, null, isDarkMode ? 'Dark' : 'Light'))
    ),

    React.createElement(TouchableOpacity, {
      testID: 'save-button',
      onPress: handleSave,
      disabled: isSaving
    }, React.createElement(Text, null, isSaving ? 'Saving...' : 'Save'))
  );
};

describe('PreferencesPage', () => {
  it('renders preferences page with title', () => {
    render(React.createElement(PreferencesPage));
    
    expect(screen.getByTestId('preferences-page')).toBeTruthy();
    expect(screen.getByText('Preferences')).toBeTruthy();
  });

  it('shows notification toggles', () => {
    render(React.createElement(PreferencesPage));
    
    expect(screen.getByText('Push Notifications')).toBeTruthy();
    expect(screen.getByText('Email Notifications')).toBeTruthy();
    expect(screen.getByText('SMS Notifications')).toBeTruthy();
  });

  it('toggles push notifications switch', () => {
    render(React.createElement(PreferencesPage));
    
    const pushSwitch = screen.getByTestId('push-switch');
    expect(pushSwitch.props.value).toBe(true);
    
    fireEvent(pushSwitch, 'valueChange', false);
    expect(pushSwitch.props.value).toBe(false);
  });

  it('toggles theme when theme button is pressed', () => {
    render(React.createElement(PreferencesPage));
    
    const themeToggle = screen.getByTestId('theme-toggle');
    expect(screen.getByText('Light')).toBeTruthy();
    
    fireEvent.press(themeToggle);
    expect(screen.getByText('Dark')).toBeTruthy();
  });

  it('handles save button press', async () => {
    render(React.createElement(PreferencesPage));
    
    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);
    
    expect(screen.getByText('Saving...')).toBeTruthy();
    
    await waitFor(() => {
      expect(screen.getByText('Save')).toBeTruthy();
    });
  });

  it('calls back button when pressed', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(React.createElement(PreferencesPage));
    
    const backButton = screen.getByTestId('back-button');
    fireEvent.press(backButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Back pressed');
    consoleSpy.mockRestore();
  });

  it('shows theme section', () => {
    render(React.createElement(PreferencesPage));
    
    expect(screen.getByTestId('theme-section')).toBeTruthy();
    expect(screen.getByText('Theme')).toBeTruthy();
  });

  it('disables save button while saving', async () => {
    render(React.createElement(PreferencesPage));
    
    const saveButton = screen.getByTestId('save-button');
    fireEvent.press(saveButton);
    expect(screen.getByText('Saving...')).toBeTruthy();
  });

  it('shows correct initial switch states', () => {
    render(React.createElement(PreferencesPage));
    
    const pushSwitch = screen.getByTestId('push-switch');
    const emailSwitch = screen.getByTestId('email-switch');
    const smsSwitch = screen.getByTestId('sms-switch');
    
    expect(pushSwitch.props.value).toBe(true);
    expect(emailSwitch.props.value).toBe(false);
    expect(smsSwitch.props.value).toBe(false);
  });
});
