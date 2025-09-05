import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Mock the useThemeColor hook
jest.mock('../../hooks/useThemeColor', () => ({
  useThemeColor: jest.fn(() => '#000000')
}));

describe('Simple Component Tests', () => {
  it('should render a basic Text component', () => {
    const { getByText } = render(React.createElement(Text, null, 'Hello World'));
    
    const textElement = getByText('Hello World');
    expect(textElement).toBeTruthy();
  });

  it('should render a basic View component', () => {
    const { getByTestId } = render(
      React.createElement(View, { testID: 'test-view' })
    );
    
    const viewElement = getByTestId('test-view');
    expect(viewElement).toBeTruthy();
  });

  it('should render nested components', () => {
    const { getByText, getByTestId } = render(
      React.createElement(View, { testID: 'container' },
        React.createElement(Text, null, 'Nested Text')
      )
    );
    
    const container = getByTestId('container');
    const text = getByText('Nested Text');
    
    expect(container).toBeTruthy();
    expect(text).toBeTruthy();
  });

  it('should handle component props', () => {
    const { getByTestId } = render(
      React.createElement(View, { 
        testID: 'props-test',
        style: { backgroundColor: 'red' }
      })
    );
    
    const element = getByTestId('props-test');
    expect(element).toBeTruthy();
  });
});
