import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

//might replace this with the Singleton object I built
interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  following?: number;
  followers?: number;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUserData: (updates: Partial<User>) => void;
  isLoggedIn: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  logout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load user data and theme on app startup
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const [savedUser, savedMode] = await Promise.all([
          AsyncStorage.getItem('user'),
          AsyncStorage.getItem('isDarkMode')
        ]);
        
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          console.log('UserContext: Loading user from AsyncStorage:', parsedUser);
          setUser(parsedUser);
        }
        
        if (savedMode != null) {
          setIsDarkMode(JSON.parse(savedMode));
        }
      } catch (error) {
        console.error('Error loading user data from AsyncStorage:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Persist user data when it changes
  useEffect(() => {
    const saveUserData = async () => {
      if (user) {
        try {
          // console.log('UserContext: Saving user to AsyncStorage:', user);
          await AsyncStorage.setItem('user', JSON.stringify(user));
        } catch (error) {
          // console.error('Error saving user data to AsyncStorage:', error);
        }
      } else {
        try {
          await AsyncStorage.removeItem('user');
        } catch (error) {
          // console.error('Error removing user data from AsyncStorage:', error);
        }
      }
    };
    
    saveUserData();
  }, [user]);



  const toggleDarkMode = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem('isDarkMode', JSON.stringify(newMode))
    }
    catch(error) {
      console.error('Error saving theme to AsyncStorage', error);
    }
  };

  const updateUserData = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };



  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value = {
    user,
    setUser,
    updateUserData,
    isLoggedIn: user !== null,
    isDarkMode,
    toggleDarkMode,
    logout
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}; 