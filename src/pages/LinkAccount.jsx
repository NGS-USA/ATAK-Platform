import { useState, useEffect } from "react";
import { useUser, SignInButton, SignedIn, SignedOut } from "@clerk/clerk-react";

export default function LinkAccount() {
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState("idle");
  const [memberName, setMemberName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  useEffect(() => {
    if (!isLoaded || !user || !token) return;
    confirmLink();
  }, [isLoaded, user, token]);

  const confirmLink = async () => {
    setStatus("loading");
    try {
      const discordAccount = user.externalAccounts?.find(a => a.provider === "discord");
      const discordUsername = discordAccount?.username;

      if (!discordUsername) {
        setStatus("error");
        setErrorMessage("No Discord account found on your Clerk login. Make sure you signed in with Discord.");
        return;
      }

      const res = await fetch(
        `/.netlify/functions/linkToken?token=${token}&discord_username=${encodeURIComponent(discordUsername)}`
      );
      const data = await res.json();

      if (res.status === 200) {
        setMemberName(data.member_name);
        setStatus("success");
      } else if (res.status === 410) {
        setStatus("expired");
      } else if (res.status === 404) {
        setStatus("used");
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong");
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(err.message);
    }
  };

  if (!token) {
    return <Message title="Invalid Link" text="This link is missing a token. Please ask your admin to generate a new one." color="#ef4444" />;
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#0a0c0f", color: "#f1f5f9", fontFamily: "'Inter', sans-serif", padding: "1rem" }}>
      <div style={{ maxWidth: "480px", width: "100%", background: "#111318", border: "1px solid #1e2530", borderRadius: "16px", padding: "2.5rem", textAlign: "center" }}>

        <SignedOut>
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#4ade8020", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <svg width="32" height="32" fill="none" stroke="#4ade80" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>Link Your Discord Account</h1>
            <p style={{ color: "#94a3b8", marginBottom: "2rem", lineHeight: 1.7 }}>
              Sign in with Discord to link your account to your member profile. Make sure you use the same Discord account registered with the unit.
            </p>
            <SignInButton mode="redirect" redirectUrl={window.location.href}>
              <button style={{ background: "#5865F2", color: "#fff", border: "none", borderRadius: "8px", padding: "12px 28px", cursor: "pointer", fontWeight: 600, fontSize: "1rem", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.04.033.05a19.83 19.83 0 005.993 3.03.077.077 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.07 13.07 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z"/>
                </svg>
                Sign in with Discord
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {status === "loading" && (
            <div>
              <div style={{ width: "48px", height: "48px", border: "4px solid #1e2530", borderTop: "4px solid #4ade80", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }} />
              <p style={{ color: "#94a3b8" }}>Linking your account...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}
          {status === "success" && (
            <Message
              title="Account Linked!"
              text={`Your Discord account has been successfully linked to the member profile for ${memberName}. You now have full access to the ATAK Platform.`}
              color="#4ade80"
              buttonText="Go to Dashboard"
              buttonHref="/"
            />
          )}
          {status === "expired" && (
            <Message
              title="Link Expired"
              text="This link has expired. Links are only valid for 24 hours. Please ask your admin to generate a new one."
              color="#f59e0b"
            />
          )}
          {status === "used" && (
            <Message
              title="Link Already Used"
              text="This link has already been used. Each link can only be used once. If you are having issues, contact your admin."
              color="#f59e0b"
            />
          )}
          {status === "error" && (
            <Message
              title="Something Went Wrong"
              text={errorMessage || "An unexpected error occurred. Please try again or contact your admin."}
              color="#ef4444"
            />
          )}
        </SignedIn>

      </div>
    </div>
  );
}

function Message({ title, text, color, buttonText, buttonHref }) {
  return (
    <div>
      <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
        <svg width="32" height="32" fill="none" stroke={color} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>{title}</h1>
      <p style={{ color: "#94a3b8", lineHeight: 1.7, marginBottom: buttonText ? "2rem" : 0 }}>{text}</p>
      {buttonText && (
        <a href={buttonHref} style={{ display: "inline-block", background: "#4ade80", color: "#000", borderRadius: "8px", padding: "10px 24px", fontWeight: 600, textDecoration: "none" }}>
          {buttonText}
        </a>
      )}
    </div>
  );
}