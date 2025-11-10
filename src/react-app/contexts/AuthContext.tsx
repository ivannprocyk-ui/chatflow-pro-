import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  organizationId: string;
  role: string;
}

interface Organization {
  id: string;
  name: string;
  plan: string;
  aiEnabled: boolean;
}

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, organizationName: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');
    const savedOrg = localStorage.getItem('organization');

    if (token && savedUser && savedOrg) {
      try {
        setUser(JSON.parse(savedUser));
        setOrganization(JSON.parse(savedOrg));
      } catch (error) {
        console.error('Error parsing saved auth data:', error);
        localStorage.clear();
      }
    }

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password });
      const { user, organization, accessToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('organization', JSON.stringify(organization));

      setUser(user);
      setOrganization(organization);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const register = async (email: string, password: string, organizationName: string) => {
    try {
      const response = await authAPI.register({ email, password, organizationName });
      const { user, organization, accessToken } = response.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('organization', JSON.stringify(organization));

      setUser(user);
      setOrganization(organization);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('organization');
    setUser(null);
    setOrganization(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
