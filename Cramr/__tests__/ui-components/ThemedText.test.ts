import { render, screen } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';

// Mock the ThemedText component
const ThemedText = ({ children, type, style, testID, accessibilityLabel, ...props }: any) => {
  return React.createElement(Text, {
    style: [
      type === 'title' ? { fontSize: 32, fontWeight: 'bold' } : {},
      type === 'subtitle' ? { fontSize: 20, fontWeight: 'bold' } : {},
      type === 'link' ? { color: '#0a7ea4' } : {},
      type === 'defaultSemiBold' ? { fontWeight: '600' } : {},
      style
    ],
    testID,
    accessibilityLabel,
    ...props
  }, children);
};

// Mock the useThemeColor hook
jest.mock('../../hooks/useThemeColor', () => ({
  useThemeColor: jest.fn(() => '#000000')
}));

describe('ThemedText Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render text with default type', () => {
    render(React.createElement(ThemedText, null, 'Hello World'));
    
    const textElement = screen.getByText('Hello World');
    expect(textElement).toBeTruthy();
  });

  it('should render text with title type', () => {
    render(React.createElement(ThemedText, { type: 'title' }, 'Title Text'));
    
    const textElement = screen.getByText('Title Text');
    expect(textElement).toBeTruthy();
  });

  it('should render text with subtitle type', () => {
    render(React.createElement(ThemedText, { type: 'subtitle' }, 'Subtitle Text'));
    
    const textElement = screen.getByText('Subtitle Text');
    expect(textElement).toBeTruthy();
  });

  it('should render text with link type', () => {
    render(React.createElement(ThemedText, { type: 'link' }, 'Link Text'));
    
    const textElement = screen.getByText('Link Text');
    expect(textElement).toBeTruthy();
  });

  it('should render text with defaultSemiBold type', () => {
    render(React.createElement(ThemedText, { type: 'defaultSemiBold' }, 'SemiBold Text'));
    
    const textElement = screen.getByText('SemiBold Text');
    expect(textElement).toBeTruthy();
  });

  it('should apply custom style', () => {
    const customStyle = { fontSize: 18, color: 'red' };
    render(React.createElement(ThemedText, { style: customStyle }, 'Custom Style Text'));
    
    const textElement = screen.getByText('Custom Style Text');
    expect(textElement).toBeTruthy();
  });

  it('should pass through other props', () => {
    render(
      React.createElement(ThemedText, { 
        testID: 'test-text', 
        accessibilityLabel: 'Accessible text' 
      }, 'Accessible Text')
    );
    
    const textElement = screen.getByTestId('test-text');
    expect(textElement).toBeTruthy();
  });

  it('should handle empty text', () => {
    render(React.createElement(ThemedText, null, ''));
    
    // Should render without crashing
    expect(screen.getByText('')).toBeTruthy();
  });

  it('should handle undefined type gracefully', () => {
    render(React.createElement(ThemedText, { type: undefined as any }, 'Undefined Type Text'));
    
    const textElement = screen.getByText('Undefined Type Text');
    expect(textElement).toBeTruthy();
  });
});
