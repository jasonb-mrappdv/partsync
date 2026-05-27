import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Static public settings — the Cloudflare backend doesn't need a fetched
  // settings doc the way Base44 did.
  const [appPublicSettings] = useState({
    id: 'partsync',
    public_settings: { name: 'PartSync', allow_registration: true, allow_google: false },
  });

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    setIsLoadingAuth(true);
    setAuthError(null);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthChecked(true);
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthChecked(true);
      if (err?.status === 401) {
        // Treat as "needs login" only on protected routes; allow public routes
        // (login/register/forgot/reset) to render without forcing redirect.
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
        if (!publicPaths.includes(path)) {
          setAuthError({ type: 'auth_required', message: 'Authentication required' });
        }
      } else if (err) {
        setAuthError({ type: 'unknown', message: err?.message || 'Failed to load user' });
      }
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async (shouldRedirect = true) => {
    await base44.auth.logout(shouldRedirect ? window.location.href : undefined);
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        navigateToLogin,
        checkUserAuth,
        checkAppState: checkUserAuth,
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
