import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { db } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut, redirectToSignIn } = useClerk();
  const [member, setMember] = useState(null);
  const [isLoadingMember, setIsLoadingMember] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setIsLoadingMember(false);
      setAuthError(null);
      setMember(null);
      return;
    }

    const checkMember = async () => {
      setIsLoadingMember(true);
      try {
        // Get the Discord username from Clerk's external accounts
        const discordAccount = user.externalAccounts?.find(
          a => a.provider === 'discord'
        );
        const discordUsername = discordAccount?.username;

        if (!discordUsername) {
          setAuthError({ type: 'user_not_registered' });
          setIsLoadingMember(false);
          return;
        }

        // Look up Member record by discord_username
        const members = await db.filter('Member', { discord_username: discordUsername });

        if (!members || members.length === 0) {
          setAuthError({ type: 'user_not_registered' });
          setMember(null);
        } else {
          setMember(members[0]);
          setAuthError(null);
        }
      } catch (err) {
        console.error('Member lookup failed:', err);
        setAuthError({ type: 'unknown', message: err.message });
      }
      setIsLoadingMember(false);
    };

    checkMember();
  }, [isLoaded, isSignedIn, user]);

  const logout = () => signOut();
  const navigateToLogin = () => redirectToSignIn();

  return (
    <AuthContext.Provider value={{
      user,
      member,
      isAuthenticated: isSignedIn,
      isLoadingAuth: !isLoaded || isLoadingMember,
      isLoadingPublicSettings: false,
      authError,
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