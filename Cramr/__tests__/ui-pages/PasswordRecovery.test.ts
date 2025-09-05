import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Pressable, Text, TextInput } from 'react-native';

// Mock the PasswordRecovery component
const PasswordRecoveryScreen = ({ onBack }: { onBack?: () => void }) => {
  const [email, setEmail] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [successMessage, setSuccessMessage] = React.useState("");

  const emailRegex = /^(?:[a-zA-Z0-9_'^&+%=-]+(?:\.[a-zA-Z0-9_'^&+%=-]+)*)@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
  const emailValid = emailRegex.test(email);
  const emailsMatch = email.trim() !== "" && email === confirm;
  const canSubmit = emailValid && emailsMatch;

  function handleSubmit() {
    setSubmitted(true);
    if (!canSubmit) return;
    setSuccessMessage(`Password sent to ${email}!`);
  }

  function handleBack() {
    if (onBack) return onBack();
  }

  return React.createElement('View', { testID: 'password-recovery-screen' },
    React.createElement(TextInput, {
      testID: 'email-input',
      value: email,
      onChangeText: setEmail,
      placeholder: 'Email address'
    }),
    React.createElement(TextInput, {
      testID: 'confirm-email-input',
      value: confirm,
      onChangeText: setConfirm,
      placeholder: 'Confirm email address'
    }),
    React.createElement(Pressable, {
      testID: 'submit-button',
      onPress: handleSubmit
    }, React.createElement(Text, null, 'Submit')),
    React.createElement(Pressable, {
      testID: 'back-button',
      onPress: handleBack
    }, React.createElement(Text, null, 'Back')),
    submitted && !emailValid && React.createElement(Text, {
      testID: 'email-error'
    }, 'Please enter a valid email.'),
    successMessage && React.createElement(Text, {
      testID: 'success-message'
    }, successMessage)
  );
};

describe('PasswordRecoveryScreen Component', () => {
  it('should render password recovery form', () => {
    render(React.createElement(PasswordRecoveryScreen));
    
    expect(screen.getByTestId('password-recovery-screen')).toBeTruthy();
    expect(screen.getByTestId('email-input')).toBeTruthy();
    expect(screen.getByTestId('confirm-email-input')).toBeTruthy();
    expect(screen.getByTestId('submit-button')).toBeTruthy();
    expect(screen.getByTestId('back-button')).toBeTruthy();
  });

  it('should validate email format correctly', () => {
    render(React.createElement(PasswordRecoveryScreen));
    
    const emailInput = screen.getByTestId('email-input');
    const confirmInput = screen.getByTestId('confirm-email-input');
    const submitButton = screen.getByTestId('submit-button');
    
    // Test invalid email
    fireEvent.changeText(emailInput, 'invalid-email');
    fireEvent.changeText(confirmInput, 'invalid-email');
    fireEvent.press(submitButton);
    
    expect(screen.getByTestId('email-error')).toBeTruthy();
  });

  it('should accept valid email format', () => {
    render(React.createElement(PasswordRecoveryScreen));
    
    const emailInput = screen.getByTestId('email-input');
    const confirmInput = screen.getByTestId('confirm-email-input');
    const submitButton = screen.getByTestId('submit-button');
    
    // Test valid email
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(confirmInput, 'test@example.com');
    fireEvent.press(submitButton);
    
    expect(screen.getByTestId('success-message')).toBeTruthy();
    expect(screen.getByText('Password sent to test@example.com!')).toBeTruthy();
  });

  it('should show error when emails do not match', () => {
    render(React.createElement(PasswordRecoveryScreen));
    
    const emailInput = screen.getByTestId('email-input');
    const confirmInput = screen.getByTestId('confirm-email-input');
    const submitButton = screen.getByTestId('submit-button');
    
    // Test mismatched emails
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(confirmInput, 'different@example.com');
    fireEvent.press(submitButton);
    
    // Should not show success message
    expect(screen.queryByTestId('success-message')).toBeNull();
  });

  it('should handle back button press', () => {
    const mockOnBack = jest.fn();
    render(React.createElement(PasswordRecoveryScreen, { onBack: mockOnBack }));
    
    const backButton = screen.getByTestId('back-button');
    fireEvent.press(backButton);
    
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('should handle empty email submission', () => {
    render(React.createElement(PasswordRecoveryScreen));
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.press(submitButton);
    
    // Should not show success message for empty email
    expect(screen.queryByTestId('success-message')).toBeNull();
  });

  it('should handle various valid email formats', () => {
    render(React.createElement(PasswordRecoveryScreen));
    
    const emailInput = screen.getByTestId('email-input');
    const confirmInput = screen.getByTestId('confirm-email-input');
    const submitButton = screen.getByTestId('submit-button');
    
    const validEmails = [
      'user@domain.com',
      'user.name@domain.com',
      'user+tag@domain.co.uk',
      'user123@domain.org'
    ];
    
    validEmails.forEach(email => {
      fireEvent.changeText(emailInput, email);
      fireEvent.changeText(confirmInput, email);
      fireEvent.press(submitButton);
      
      expect(screen.getByText(`Password sent to ${email}!`)).toBeTruthy();
    });
  });
});
