import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface UIPreferences {
  colorScheme: 'default' | 'professional' | 'vibrant';
  fontSize: 'small' | 'medium' | 'large';
  spacing: 'compact' | 'comfortable' | 'spacious';
  messageLayout: 'modern' | 'classic';
  sidebarVisible: boolean;
}

interface PersonalizationContextType {
  preferences: UIPreferences;
  updatePreferences: (newPrefs: Partial<UIPreferences>) => void;
  isLoading: boolean;
}

const defaultPreferences: UIPreferences = {
  colorScheme: 'default',
  fontSize: 'medium',
  spacing: 'comfortable',
  messageLayout: 'modern',
  sidebarVisible: true,
};

const PersonalizationContext = createContext<PersonalizationContextType | null>(null);

export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UIPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only load preferences if user is logged in
    if (user) {
      loadUserPreferences();
    } else {
      // Reset to defaults if no user
      setPreferences(defaultPreferences);
      setIsLoading(false);
    }
  }, [user]);

  const loadUserPreferences = async () => {
    try {
      const response = await apiRequest('GET', '/api/preferences');
      if (!response.ok) throw new Error('Failed to load preferences');
      const data = await response.json();
      setPreferences(data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast({
        title: "Couldn't load preferences",
        description: "Using default settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (newPrefs: Partial<UIPreferences>) => {
    try {
      const updatedPrefs = { ...preferences, ...newPrefs };
      setPreferences(updatedPrefs);

      if (user) {
        const response = await apiRequest('POST', '/api/preferences', updatedPrefs);
        if (!response.ok) throw new Error('Failed to update preferences');

        toast({
          title: "Preferences updated",
          description: "Your changes have been saved",
        });
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
      toast({
        title: "Couldn't save preferences",
        description: "Your changes will be temporary",
        variant: "destructive",
      });
    }
  };

  return (
    <PersonalizationContext.Provider value={{ preferences, updatePreferences, isLoading }}>
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  const context = useContext(PersonalizationContext);
  if (!context) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider');
  }
  return context;
}