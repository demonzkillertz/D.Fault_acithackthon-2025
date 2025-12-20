import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Alert } from 'react-native';
import { realtimeService } from '../services/realtimeService';


// Use Expo's process.env for web and native, fallback to global for Metro
const API_URL =
  typeof process !== 'undefined' && process.env && (process.env.EXPO_PUBLIC_API_URL || process.env.API_URL)
    ? process.env.EXPO_PUBLIC_API_URL || process.env.API_URL
    : (global as any).API_URL || 'http://localhost:5000';
console.log('AuthContext API_URL:', API_URL);

export const AuthContext = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Try to load user/token from storage on mount
    (async () => {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');
      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setToken(storedToken);
        
        // Connect to real-time service if user exists
        realtimeService.connect(userData.id, userData.role);
      }
    })();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, { username, password });
      console.log('Login response:', res.data);
      setUser(res.data.user);
      setToken(res.data.token);
      await AsyncStorage.setItem('user', JSON.stringify(res.data.user));
      await AsyncStorage.setItem('token', res.data.token);
      
      // Connect to real-time service
      realtimeService.connect(res.data.user.id, res.data.user.role);
      
      return { success: true };
    } catch (err: any) {
      console.log('Login error:', err.response?.data || err.message);
      return { success: false, message: err.response?.data?.message || 'Login failed' };
    }
  };

  const register = async (username: string, password: string, role: string) => {
    try {
      await axios.post(`${API_URL}/api/auth/register`, { username, password, role });
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.response?.data?.message || 'Registration failed' };
    }
  };

  const logout = async () => {
    try {
      // Disconnect from real-time service first
      realtimeService.disconnect();
      
      // Call backend logout endpoint
      await axios.post(`${API_URL}/api/auth/logout`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Backend logout successful');
    } catch (err: any) {
      console.log('Backend logout error (continuing anyway):', err.response?.data || err.message);
    } finally {
      // Clear local storage regardless of backend response
      setUser(null);
      setToken(null);
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      console.log('Local logout completed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
