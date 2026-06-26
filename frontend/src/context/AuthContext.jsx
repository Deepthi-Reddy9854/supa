import React, { createContext, useContext, useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const AuthContext = createContext();

export const API_URL = import.meta.env.VITE_API_URL || (
  window.location.origin.includes('localhost')
    ? 'http://localhost:5000/api'
    : '/api'
);

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let firebaseAuth = null;
if (firebaseConfig.apiKey) {
  try {
    const app = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(app);
  } catch (err) {
    console.error('Failed to initialize Firebase app:', err);
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Authenticate using stored token on load
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token expired or invalid
          handleLogout();
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
        // Do not logout immediately in case of offline connection, but set loading false
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setAuthError(null);
  };

  const loginWithGoogleSimulated = async (email, name, image, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${API_URL}/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name, image, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    if (!firebaseAuth) {
      throw new Error("Firebase Google Sign-In is not configured. Please verify VITE_FIREBASE_API_KEY and other env variables are set.");
    }
    setLoading(true);
    setAuthError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(firebaseAuth, provider);
      const idToken = await result.user.getIdToken();

      const response = await fetch(`${API_URL}/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithMobile = async (phone, otp, name, role) => {
    setLoading(true);
    setAuthError(null);
    try {
      const response = await fetch(`${API_URL}/auth/mobile-otp-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, otp, name, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Mobile login failed.');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Helper utility for authenticated network requests
  const authenticatedFetch = async (endpoint, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Authentication credentials expired/invalid
      handleLogout();
      throw new Error('Session expired. Please log in again.');
    }

    if (response.status === 403) {
      const data = await response.json().catch(() => ({}));
      if (data.message && data.message.includes('blocked')) {
        handleLogout();
        throw new Error('Your account has been blocked by the administrator.');
      }
    }

    return response;
  };

  const updateWishlist = (wishlistArray) => {
    setUser(prev => prev ? { ...prev, wishlist: wishlistArray } : null);
  };

  const updateUser = (updatedUserData) => {
    setUser(prev => prev ? { ...prev, ...updatedUserData } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        authError,
        login: loginWithGoogleSimulated,
        loginWithGoogle,
        loginWithMobile,
        logout: handleLogout,
        authenticatedFetch,
        updateWishlist,
        updateUser,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isDelivery: user?.role === 'delivery',
        isManager: user?.role === 'manager'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
