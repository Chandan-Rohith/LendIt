import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Request fresh geolocation every time the site is opened.
  // Use the Permissions API to detect whether the browser will prompt,
  // and set a denied flag so the UI can inform the user when permission
  // was permanently blocked. Browsers won't let us force a re-prompt if
  // the user previously selected "Block" — they must change site
  // settings manually.
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    const request = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setLocationPermissionDenied(false);
        },
        (err) => {
          console.error('Location error:', err.message);
          if (err.code === 1) setLocationPermissionDenied(true);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
      );
    };

    // If Permissions API is supported, check state first
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((res) => {
        if (res.state === 'granted' || res.state === 'prompt') {
          request();
        } else if (res.state === 'denied') {
          setLocationPermissionDenied(true);
        }

        // Listen for changes (user may change site permission in browser UI)
        res.onchange = () => {
          if (res.state === 'granted' || res.state === 'prompt') {
            request();
          } else if (res.state === 'denied') {
            setLocationPermissionDenied(true);
          }
        };
      }).catch(() => {
        // Fallback: try requesting directly
        request();
      });
    } else {
      // No Permissions API — just request and let browser handle prompting
      request();
    }
  }, []);

  useEffect(() => {
    // Do NOT auto-sync browser geolocation to the server here.
    // Auto-updating the user's stored latitude/longitude will change
    // the owner's location for tools and break distance calculations.
    // Keep location in context for client-side features (nearby search,
    // distance calc) and only update the server via explicit user actions
    // (e.g., profile edit or when creating a tool).
    return;
  }, [token, location]);

  const login = (tokenVal, userData) => {
    localStorage.setItem('token', tokenVal);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenVal);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading, location, locationPermissionDenied }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
