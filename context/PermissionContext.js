// PermissionsContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../screens/config';

const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  // WATCH AUTH TOKEN CHANGES
  useEffect(() => {
    const loadToken = async () => {
      const t = await AsyncStorage.getItem('authToken');
      setToken(t);
    };
    loadToken();
  }, []);

  // FETCH PERMISSIONS API CALL
  const fetchPermissions = async () => {
    try {
      const t = await AsyncStorage.getItem('authToken');
      if (!t) {
        setPermissions([]);
        return;
      }

      const response = await axios.get(`${config.BASE_URL}/api/allen`, {
        headers: { Authorization: `Bearer ${t}` },
      });

      const perms = response.data.permissions || [];
     // console.log('Fetched permissions:', perms);
      setPermissions(perms.map(p => p.name));
    } catch (err) {
      console.log('Failed to fetch permissions:', err.message);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // REFETCH WHEN TOKEN CHANGES (LOGIN / LOGOUT)
  useEffect(() => {
    if (token) fetchPermissions();
    else setPermissions([]);
  }, [token]);

  return (
    <PermissionsContext.Provider value={{ permissions, loading, fetchPermissions }}>
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);
