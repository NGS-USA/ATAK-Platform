import { db } from "@/api/apiClient";

export async function logAction({ action, target = '', details = '', section = 'Other' }, userEmail = '', userName = '') {
  try {
    await db.create('AuditLog', {
      actor_name: userName || userEmail || 'Unknown',
      actor_email: userEmail || '',
      action,
      target,
      details,
      section,
    });
  } catch {
    // silently fail — audit logging should never break the app
  }
}