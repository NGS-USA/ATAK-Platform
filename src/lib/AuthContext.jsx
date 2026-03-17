import React, { createContext, useContext } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut, redirectToSignIn } = useClerk();

  const logout = () => signOut();
  const navigateToLogin = () => redirectToSignIn();

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: isSignedIn,
      isLoadingAuth: !isLoaded,
      isLoadingPublicSettings: false,
      authError: null,
      logout,
      navigateToLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};