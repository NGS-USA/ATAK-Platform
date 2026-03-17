import { db } from "@/api/apiClient";

let cachedMemberName = null;
let cachedEmail = null;

export async function logAction({ action, target = '', details = '', section = 'Other' }) {
  try {
    // Use cached values if available
    if (!cachedMemberName) {
      // Try to get the Clerk user from the global window object
      const clerkUser = window.Clerk?.user;
      if (clerkUser) {
        cachedEmail = clerkUser.primaryEmailAddress?.emailAddress || '';
        const discordAccount = clerkUser.externalAccounts?.find(a => a.provider === 'discord');
        const discordUsername = discordAccount?.username;
        if (discordUsername) {
          const members = await db.filter('Member', { discord_username: discordUsername });
          if (members && members.length > 0) {
            cachedMemberName = members[0].unit_name;
          }
        }
        if (!cachedMemberName) {
          cachedMemberName = clerkUser.fullName || discordAccount?.username || 'Unknown';
        }
      }
    }

    await db.create('AuditLog', {
      actor_name: cachedMemberName || 'Unknown',
      actor_email: cachedEmail || '',
      action,
      target,
      details,
      section,
    });
  } catch {
    // silently fail — audit logging should never break the app
  }
}

export function clearAuditCache() {
  cachedMemberName = null;
  cachedEmail = null;
}