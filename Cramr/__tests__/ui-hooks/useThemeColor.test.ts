import { renderHook } from '@testing-library/react-native';
import { useThemeColor } from '../../hooks/useThemeColor';

// Mock the useColorScheme hook
jest.mock('../../hooks/useColorScheme', () => ({
  useColorScheme: jest.fn()
}));

// Mock the Colors constant
jest.mock('../../constants/Colors', () => ({
  Colors: {
    light: {
      text: '#000000',
      placeholderText: '#6e6e6e',
      background: '#f5f5f5',
      textInput: '#ffffff',
      dropdown: '#e5e5e5',
      slider: '#ffffff',
      sliderBackground: '#e5e5e5',
      cancelButton: '#e5e5e5',
    },
    dark: {
      text: '#ffffff',
      placeholderText: '#e5e5e5',
      background: '#393939',
      textInput: '#272727',
      dropdown: '#6e6e6e',
      searchInput: '#6e6e6e',
      slider: '#272727',
      sliderBackground: '#6e6e6e',
      cancelButton: '#6e6e6e',
    },
    button: '#5CAEF1'
  }
}));

describe('useThemeColor Hook', () => {
  const mockUseColorScheme = require('../../hooks/useColorScheme').useColorScheme;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return light theme color when theme is light', () => {
    mockUseColorScheme.mockReturnValue('light');
    
    const { result } = renderHook(() => 
      useThemeColor({}, 'text')
    );
    
    expect(result.current).toBe('#000000');
  });

  it('should return dark theme color when theme is dark', () => {
    mockUseColorScheme.mockReturnValue('dark');
    
    const { result } = renderHook(() => 
      useThemeColor({}, 'text')
    );
    
    expect(result.current).toBe('#ffffff');
  });

  it('should return custom light color when provided', () => {
    mockUseColorScheme.mockReturnValue('light');
    
    const { result } = renderHook(() => 
      useThemeColor({ light: '#ff0000' }, 'text')
    );
    
    expect(result.current).toBe('#ff0000');
  });

  it('should return custom dark color when provided', () => {
    mockUseColorScheme.mockReturnValue('dark');
    
    const { result } = renderHook(() => 
      useThemeColor({ dark: '#00ff00' }, 'text')
    );
    
    expect(result.current).toBe('#00ff00');
  });

  it('should return custom light color when theme is light and both colors provided', () => {
    mockUseColorScheme.mockReturnValue('light');
    
    const { result } = renderHook(() => 
      useThemeColor({ light: '#ff0000', dark: '#00ff00' }, 'text')
    );
    
    expect(result.current).toBe('#ff0000');
  });

  it('should return custom dark color when theme is dark and both colors provided', () => {
    mockUseColorScheme.mockReturnValue('dark');
    
    const { result } = renderHook(() => 
      useThemeColor({ light: '#ff0000', dark: '#00ff00' }, 'text')
    );
    
    expect(result.current).toBe('#00ff00');
  });

  it('should return default light color when no custom colors provided', () => {
    mockUseColorScheme.mockReturnValue('light');
    
    const { result } = renderHook(() => 
      useThemeColor({}, 'background')
    );
    
    expect(result.current).toBe('#f5f5f5');
  });

  it('should return default dark color when no custom colors provided', () => {
    mockUseColorScheme.mockReturnValue('dark');
    
    const { result } = renderHook(() => 
      useThemeColor({}, 'background')
    );
    
    expect(result.current).toBe('#393939');
  });

  it('should handle undefined theme gracefully', () => {
    mockUseColorScheme.mockReturnValue(undefined);
    
    const { result } = renderHook(() => 
      useThemeColor({}, 'text')
    );
    
    expect(result.current).toBe('#000000'); // Should default to light theme
  });

  it('should work with different color names', () => {
    mockUseColorScheme.mockReturnValue('light');
    
    const { result } = renderHook(() => 
      useThemeColor({}, 'background')
    );
    
    expect(result.current).toBe('#f5f5f5');
  });
});
