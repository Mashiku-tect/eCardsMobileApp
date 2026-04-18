import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../screens/config';

const PermissionsContext = createContext();

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPermissions = async () => {
    try {
      //console.log('Fetching permissions...');

      const token = await AsyncStorage.getItem('authToken');

      if (!token) {
        setPermissions([]);
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${config.BASE_URL}/api/allen`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const perms = response.data.permissions || [];
      setPermissions(perms.map(p => p.name));
    } catch (err) {
      //console.log('Permissions error:', err.message);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Run ONCE on app start
  useEffect(() => {
    fetchPermissions();
  }, []);

  return (
    <PermissionsContext.Provider
      value={{
        permissions,
        loading,
        refreshPermissions: fetchPermissions,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);
