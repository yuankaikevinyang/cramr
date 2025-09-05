import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

const CreateEvent = () => {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [date, setDate] = React.useState('');
  const [capacity, setCapacity] = React.useState('');
  const [isPublic, setIsPublic] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    
    setIsCreating(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    setIsCreating(false);
    console.log('Event created:', { title, description, location, date, capacity, isPublic });
  };

  const togglePrivacy = () => {
    setIsPublic(!isPublic);
  };

  return React.createElement(View, { testID: 'create-event-page' },
    React.createElement(Text, { testID: 'title' }, 'Create Event'),
    
    React.createElement(View, { testID: 'form' },
      React.createElement(Text, { testID: 'title-label' }, 'Event Title'),
      React.createElement(TextInput, {
        testID: 'title-input',
        value: title,
        onChangeText: setTitle,
        placeholder: 'Enter event title'
      }),
      
      React.createElement(Text, { testID: 'description-label' }, 'Description'),
      React.createElement(TextInput, {
        testID: 'description-input',
        value: description,
        onChangeText: setDescription,
        placeholder: 'Enter event description',
        multiline: true
      }),
      
      React.createElement(Text, { testID: 'location-label' }, 'Location'),
      React.createElement(TextInput, {
        testID: 'location-input',
        value: location,
        onChangeText: setLocation,
        placeholder: 'Enter location'
      }),
      
      React.createElement(Text, { testID: 'date-label' }, 'Date & Time'),
      React.createElement(TextInput, {
        testID: 'date-input',
        value: date,
        onChangeText: setDate,
        placeholder: 'Enter date and time'
      }),
      
      React.createElement(Text, { testID: 'capacity-label' }, 'Capacity'),
      React.createElement(TextInput, {
        testID: 'capacity-input',
        value: capacity,
        onChangeText: setCapacity,
        placeholder: 'Enter capacity',
        keyboardType: 'numeric'
      }),
      
      React.createElement(View, { testID: 'privacy-setting' },
        React.createElement(Text, null, 'Public Event'),
        React.createElement(Switch, {
          testID: 'privacy-switch',
          value: isPublic,
          onValueChange: togglePrivacy
        })
      )
    ),
    
    React.createElement(View, { testID: 'action-buttons' },
      React.createElement(TouchableOpacity, {
        testID: 'create-button',
        onPress: handleCreate,
        disabled: isCreating || !title.trim()
      }, React.createElement(Text, null, isCreating ? 'Creating...' : 'Create Event')),
      
      React.createElement(TouchableOpacity, {
        testID: 'cancel-button',
        onPress: () => console.log('Cancel pressed')
      }, React.createElement(Text, null, 'Cancel'))
    )
  );
};

describe('CreateEvent', () => {
  it('renders create event page with title', () => {
    render(React.createElement(CreateEvent));
    expect(screen.getByTestId('title')).toBeTruthy();
  });

  it('displays all form fields', () => {
    render(React.createElement(CreateEvent));
    
    expect(screen.getByText('Event Title')).toBeTruthy();
    expect(screen.getByText('Description')).toBeTruthy();
    expect(screen.getByText('Location')).toBeTruthy();
    expect(screen.getByText('Date & Time')).toBeTruthy();
    expect(screen.getByText('Capacity')).toBeTruthy();
    expect(screen.getByText('Public Event')).toBeTruthy();
  });

  it('has input fields for all form data', () => {
    render(React.createElement(CreateEvent));
    
    expect(screen.getByTestId('title-input')).toBeTruthy();
    expect(screen.getByTestId('description-input')).toBeTruthy();
    expect(screen.getByTestId('location-input')).toBeTruthy();
    expect(screen.getByTestId('date-input')).toBeTruthy();
    expect(screen.getByTestId('capacity-input')).toBeTruthy();
  });

  it('handles title input', () => {
    render(React.createElement(CreateEvent));
    
    const titleInput = screen.getByTestId('title-input');
    fireEvent.changeText(titleInput, 'Study Group Meeting');
    
    expect(titleInput.props.value).toBe('Study Group Meeting');
  });

  it('handles description input', () => {
    render(React.createElement(CreateEvent));
    
    const descriptionInput = screen.getByTestId('description-input');
    fireEvent.changeText(descriptionInput, 'Weekly study session');
    
    expect(descriptionInput.props.value).toBe('Weekly study session');
  });

  it('handles location input', () => {
    render(React.createElement(CreateEvent));
    
    const locationInput = screen.getByTestId('location-input');
    fireEvent.changeText(locationInput, 'Library Room 101');
    
    expect(locationInput.props.value).toBe('Library Room 101');
  });

  it('handles date input', () => {
    render(React.createElement(CreateEvent));
    
    const dateInput = screen.getByTestId('date-input');
    fireEvent.changeText(dateInput, '2024-01-15 14:00');
    
    expect(dateInput.props.value).toBe('2024-01-15 14:00');
  });

  it('handles capacity input', () => {
    render(React.createElement(CreateEvent));
    
    const capacityInput = screen.getByTestId('capacity-input');
    fireEvent.changeText(capacityInput, '10');
    
    expect(capacityInput.props.value).toBe('10');
  });

  it('has privacy toggle', () => {
    render(React.createElement(CreateEvent));
    expect(screen.getByTestId('privacy-switch')).toBeTruthy();
  });

  it('toggles privacy setting', () => {
    render(React.createElement(CreateEvent));
    
    const privacySwitch = screen.getByTestId('privacy-switch');
    fireEvent(privacySwitch, 'valueChange', false);
    
    expect(privacySwitch.props.value).toBe(false);
  });

  it('shows create button initially', () => {
    render(React.createElement(CreateEvent));
    expect(screen.getByTestId('create-button')).toBeTruthy();
  });

  it('shows create button when title is empty', () => {
    render(React.createElement(CreateEvent));
    expect(screen.getByTestId('create-button')).toBeTruthy();
  });

  it('shows create button when title is filled', () => {
    render(React.createElement(CreateEvent));
    
    const titleInput = screen.getByTestId('title-input');
    fireEvent.changeText(titleInput, 'Study Group');
    
    expect(screen.getByTestId('create-button')).toBeTruthy();
  });

  it('handles create button press', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(React.createElement(CreateEvent));
    
    const titleInput = screen.getByTestId('title-input');
    fireEvent.changeText(titleInput, 'Study Group');
    
    const createButton = screen.getByTestId('create-button');
    fireEvent.press(createButton);
    
    expect(screen.getByText('Creating...')).toBeTruthy();
    
    await new Promise(resolve => setTimeout(resolve, 150));
    
    expect(consoleSpy).toHaveBeenCalledWith('Event created:', {
      title: 'Study Group',
      description: '',
      location: '',
      date: '',
      capacity: '',
      isPublic: true
    });
    consoleSpy.mockRestore();
  });

  it('handles cancel button press', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(React.createElement(CreateEvent));
    
    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.press(cancelButton);
    
    expect(consoleSpy).toHaveBeenCalledWith('Cancel pressed');
    consoleSpy.mockRestore();
  });
});
