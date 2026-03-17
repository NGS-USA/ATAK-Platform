import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { db } from '@/api/apiClient';

const AuthContext = createContext();

const OWNER_DISCORD_ID = '265961344354877472';

export const AuthProvider = ({ children }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut, redirectToSignIn } = useClerk();
  const [member, setMember] = useState(null);
  const [memberRoles, setMemberRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [isLoadingMember, setIsLoadingMember] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setIsLoadingMember(false);
      setAuthError(null);
      setMember(null);
      setMemberRoles([]);
      return;
    }
    checkMember();
  }, [isLoaded, isSignedIn, user]);

  const fetchDiscordRoles = async (discordId) => {
    try {
      const res = await fetch(`/.netlify/functions/getDiscordRoles?discord_id=${discordId}`);
      const data = await res.json();
      return data.roles || [];
    } catch {
      return [];
    }
  };

  const fetchPermissions = async () => {
    try {
      const perms = await db.list('PermissionConfig');
      setPermissions(perms);
    } catch {
      setPermissions([]);
    }
  };

  const checkMember = async () => {
    setIsLoadingMember(true);
    try {
      const discordAccount = user.externalAccounts?.find(
        a => a.provider === 'discord'
      );
      const discordUsername = discordAccount?.username;
      const discordId = discordAccount?.externalId ||
        discordAccount?.providerUserId ||
        discordAccount?.id;

      // Check if this is the server owner
      const isOwner = discordId === OWNER_DISCORD_ID;

      if (isOwner) {
        const roles = await fetchDiscordRoles(discordId);
        await fetchPermissions();
        setMember({
          unit_name: 'Server Owner',
          rank: 'Owner',
          role: 'admin',
          status: 'Active',
          discord_username: discordUsername,
          discord_id: discordId,
          isOwner: true,
        });
        setMemberRoles(roles);
        setAuthError(null);
        setIsLoadingMember(false);
        return;
      }

      if (!discordUsername) {
        setAuthError({ type: 'user_not_registered' });
        setIsLoadingMember(false);
        return;
      }

      // Look up Member record
      const members = await db.filter('Member', { discord_username: discordUsername });

      if (!members || members.length === 0) {
        setAuthError({ type: 'user_not_registered' });
        setMember(null);
        setMemberRoles([]);
      } else {
        const foundMember = members[0];
        setMember(foundMember);
        setAuthError(null);

        // Fetch Discord roles if we have a discord_id
        if (discordId) {
          const roles = await fetchDiscordRoles(discordId);
          setMemberRoles(roles);
          // Save roles back to member record for reference
          await db.update('Member', foundMember.id, { discord_roles: roles });
        }

        await fetchPermissions();
      }
    } catch (err) {
      console.error('Member lookup failed:', err);
      setAuthError({ type: 'unknown', message: err.message });
    }
    setIsLoadingMember(false);
  };

  // Called by the Refresh Permissions button
  const refreshRoles = async () => {
    if (!isSignedIn || !user) return;
    const discordAccount = user.externalAccounts?.find(a => a.provider === 'discord');
    const discordId = discordAccount?.externalId ||
      discordAccount?.providerUserId ||
      discordAccount?.id;
    if (discordId) {
      const roles = await fetchDiscordRoles(discordId);
      setMemberRoles(roles);
      if (member?.id) {
        await db.update('Member', member.id, { discord_roles: roles });
      }
    }
    await fetchPermissions();
  };

  // Helper — check if current member can perform an action
  const hasPermission = (action) => {
    if (member?.isOwner) return true;
    if (user?.publicMetadata?.role === 'admin') return true;
    const perm = permissions.find(p => p.section === action);
    if (!perm || !perm.allowed_roles || perm.allowed_roles.length === 0) return false;
    return memberRoles.some(role => perm.allowed_roles.includes(role));
  };

  const isOwner = member?.isOwner === true;
  const isAdmin = isOwner || user?.publicMetadata?.role === 'admin';

  const logout = () => signOut();
  const navigateToLogin = () => redirectToSignIn();

  return (
    <AuthContext.Provider value={{
      user,
      member,
      memberRoles,
      permissions,
      isOwner,
      isAdmin,
      isAuthenticated: isSignedIn,
      isLoadingAuth: !isLoaded || isLoadingMember,
      isLoadingPublicSettings: false,
      authError,
      hasPermission,
      refreshRoles,
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