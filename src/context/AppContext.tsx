import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Property, Notification } from '../types';

interface AppContextType {
  // Property-related state
  selectedProperty: Property | null;
  setSelectedProperty: (property: Property | null) => void;

  // Notification-related state
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const value: AppContextType = {
    selectedProperty,
    setSelectedProperty,
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
    isLoading,
    setIsLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

