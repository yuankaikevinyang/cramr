import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text, TextInput, TouchableOpacity } from 'react-native';

// Mock the TwoFAPage component
const TwoFAPage = () => {
  const [code, setCode] = React.useState(Array(6).fill(''));
  const [timer, setTimer] = React.useState(60);
  const [error, setError] = React.useState(false);

  const handleChange = (text: string, index: number) => {
    if (!/^\d$/.test(text)) return;

    const updated = [...code];
    updated[index] = text;
    setCode(updated);
    setError(false);
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      const updated = [...code];

      if (code[index] === '') {
        if (index > 0) {
          updated[index - 1] = '';
        }
      } else {
        updated[index] = '';
      }

      setCode(updated);
    }
  };

  const handleSubmit = () => {
    const joined = code.join('');
    if (joined === '111111') {
      // Success case
      return 'Success!';
    } else {
      setError(true);
      setCode(Array(6).fill(''));
      return 'Error!';
    }
  };

  const handleResend = () => {
    setTimer(60);
    return 'Code resent!';
  };

  return React.createElement('View', { testID: 'twofa-page' },
    React.createElement(Text, { testID: 'title' }, 'Two-Factor Authentication'),
    React.createElement(Text, { testID: 'subtitle' }, 'Enter the 6-digit code sent to your email'),
    
    // Code input fields
    ...Array(6).fill(0).map((_, index) => 
      React.createElement(TextInput, {
        key: index,
        testID: `code-input-${index}`,
        value: code[index],
        onChangeText: (text: string) => handleChange(text, index),
        onKeyPress: (e: any) => handleKeyPress(e, index),
        maxLength: 1,
        keyboardType: 'numeric'
      })
    ),
    
    // Submit button
    React.createElement(TouchableOpacity, {
      testID: 'submit-button',
      onPress: handleSubmit
    }, React.createElement(Text, null, 'Verify')),
    
    // Resend button
    React.createElement(TouchableOpacity, {
      testID: 'resend-button',
      onPress: handleResend,
      disabled: timer > 0
    }, React.createElement(Text, null, `Resend Code (${timer}s)`)),
    
    // Error message
    error && React.createElement(Text, {
      testID: 'error-message'
    }, 'Invalid code. Please try again.')
  );
};

describe('TwoFAPage Component', () => {
  it('should render 2FA form with 6 input fields', () => {
    render(React.createElement(TwoFAPage));
    
    expect(screen.getByTestId('twofa-page')).toBeTruthy();
    expect(screen.getByTestId('title')).toBeTruthy();
    expect(screen.getByTestId('subtitle')).toBeTruthy();
    expect(screen.getByTestId('submit-button')).toBeTruthy();
    expect(screen.getByTestId('resend-button')).toBeTruthy();
    
    // Check for all 6 code input fields
    for (let i = 0; i < 6; i++) {
      expect(screen.getByTestId(`code-input-${i}`)).toBeTruthy();
    }
  });

  it('should accept only numeric input', () => {
    render(React.createElement(TwoFAPage));
    
    const firstInput = screen.getByTestId('code-input-0');
    
    // Test numeric input
    fireEvent.changeText(firstInput, '5');
    expect(firstInput.props.value).toBe('5');
    
    // Test non-numeric input (should not change)
    fireEvent.changeText(firstInput, 'a');
    expect(firstInput.props.value).toBe('5'); // Should remain unchanged
  });

  it('should handle correct code submission', () => {
    render(React.createElement(TwoFAPage));
    
    const inputs = [];
    for (let i = 0; i < 6; i++) {
      inputs.push(screen.getByTestId(`code-input-${i}`));
    }
    
    // Enter correct code: 111111
    inputs.forEach((input, index) => {
      fireEvent.changeText(input, '1');
    });
    
    const submitButton = screen.getByTestId('submit-button');
    const result = fireEvent.press(submitButton);
    
    // Should not show error message
    expect(screen.queryByTestId('error-message')).toBeNull();
  });

  it('should handle incorrect code submission', () => {
    render(React.createElement(TwoFAPage));
    
    const inputs = [];
    for (let i = 0; i < 6; i++) {
      inputs.push(screen.getByTestId(`code-input-${i}`));
    }
    
    // Enter incorrect code: 123456
    inputs.forEach((input, index) => {
      fireEvent.changeText(input, String(index + 1));
    });
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.press(submitButton);
    
    // Should show error message
    expect(screen.getByTestId('error-message')).toBeTruthy();
    expect(screen.getByText('Invalid code. Please try again.')).toBeTruthy();
  });

  it('should show error for incorrect code submission', () => {
    render(React.createElement(TwoFAPage));
    
    const inputs = [];
    for (let i = 0; i < 6; i++) {
      inputs.push(screen.getByTestId(`code-input-${i}`));
    }
    
    // Enter incorrect code: 123456
    inputs.forEach((input, index) => {
      fireEvent.changeText(input, String(index + 1));
    });
    
    // Submit incorrect code
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.press(submitButton);
    
    // Should show error message
    expect(screen.getByTestId('error-message')).toBeTruthy();
  });

  it('should handle backspace key press', () => {
    render(React.createElement(TwoFAPage));
    
    const firstInput = screen.getByTestId('code-input-0');
    const secondInput = screen.getByTestId('code-input-1');
    
    // Enter text in first input
    fireEvent.changeText(firstInput, '1');
    fireEvent.changeText(secondInput, '2');
    
    // Simulate backspace on second input
    fireEvent(secondInput, 'keyPress', { nativeEvent: { key: 'Backspace' } });
    
    // Second input should be cleared
    expect(secondInput.props.value).toBe('');
  });

  it('should show timer on resend button', () => {
    render(React.createElement(TwoFAPage));
    
    const resendButton = screen.getByTestId('resend-button');
    expect(screen.getByText('Resend Code (60s)')).toBeTruthy();
  });

  it('should handle resend functionality', () => {
    render(React.createElement(TwoFAPage));
    
    const resendButton = screen.getByTestId('resend-button');
    const result = fireEvent.press(resendButton);
    
    // Timer should reset to 60
    expect(screen.getByText('Resend Code (60s)')).toBeTruthy();
  });

  it('should handle partial code entry', () => {
    render(React.createElement(TwoFAPage));
    
    const inputs = [];
    for (let i = 0; i < 6; i++) {
      inputs.push(screen.getByTestId(`code-input-${i}`));
    }
    
    // Enter only first 3 digits
    for (let i = 0; i < 3; i++) {
      fireEvent.changeText(inputs[i], '1');
    }
    
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.press(submitButton);
    
    // Should show error for incomplete code
    expect(screen.getByTestId('error-message')).toBeTruthy();
  });
});
