import React from 'react';
import { useClerk } from '@clerk/clerk-react';

const UserNotRegisteredError = () => {
  const { signOut } = useClerk();

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0c0f", color: "#f1f5f9", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "480px", width: "100%", padding: "2.5rem", background: "#111318", borderRadius: "16px", border: "1px solid #1e2530", textAlign: "center" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#f59e0b20", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <svg width="32" height="32" fill="none" stroke="#f59e0b" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "1rem" }}>Access Restricted</h1>
        <p style={{ color: "#94a3b8", marginBottom: "1.5rem", lineHeight: 1.7 }}>
          Your Discord account is not linked to a member record in the ATAK Platform. You must be an approved member to access this site.
        </p>
        <div style={{ background: "#0a0c0f", borderRadius: "10px", padding: "1.25rem", marginBottom: "1.5rem", textAlign: "left" }}>
          <p style={{ color: "#94a3b8", fontSize: "0.875rem", marginBottom: "0.75rem" }}>If you believe this is an error:</p>
          <ul style={{ color: "#94a3b8", fontSize: "0.875rem", paddingLeft: "1.25rem", lineHeight: 2 }}>
            <li>Make sure you logged in with the correct Discord account</li>
            <li>Contact an admin to link your Discord ID to your member record</li>
            <li>Submit a recruitment application if you are not yet a member</li>
          </ul>
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button
            onClick={() => window.location.href = '/Recruitment?apply=true'}
            style={{ background: "#4ade80", color: "#000", border: "none", borderRadius: "8px", padding: "10px 20px", cursor: "pointer", fontWeight: 600, fontSize: "0.875rem" }}>
            Apply to Join
          </button>
          <button
            onClick={() => signOut()}
            style={{ background: "transparent", color: "#94a3b8", border: "1px solid #1e2530", borderRadius: "8px", padding: "10px 20px", cursor: "pointer", fontSize: "0.875rem" }}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserNotRegisteredError;