import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { userService, initializeDefaultData } from '../services/localStorageService';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Inicializuj výchozí data při prvním spuštění
    initializeDefaultData();
    
    // Zkus načíst přihlášeného uživatele
    const currentUser = userService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const loggedInUser = userService.login(username, password);
      
      if (loggedInUser) {
        setUser(loggedInUser);
        toast.success('Přihlášení bylo úspěšné!');
      } else {
        toast.error('Nesprávné uživatelské jméno nebo heslo');
        throw new Error('Přihlášení se nezdařilo');
      }
    } catch (error: any) {
      throw error;
    }
  };

  const logout = () => {
    userService.logout();
    setUser(null);
    toast.success('Odhlášení bylo úspěšné');
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
} 