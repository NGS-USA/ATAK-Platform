import { useClerk, useUser } from "@clerk/clerk-react";
import { Shield, Users, Target, ChevronRight } from "lucide-react";

export default function About() {
  const { user } = useUser();
  const { redirectToSignIn } = useClerk();
  const handleJoinClick = () => {
    if (user) {
      window.location.href = '/Recruitment';
    } else {
      redirectToSignIn();
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "3rem 1rem" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: "4rem" }}>
        <div style={{ width: "80px", height: "80px", background: "linear-gradient(135deg, var(--accent), #16a34a)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
          <Shield size={40} color="#000" />
        </div>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 800, marginBottom: "1rem", letterSpacing: "-0.02em" }}>Serpant Tactical Solutions</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto 2rem", lineHeight: 1.7 }}>
          An elite Arma Reforger milsim unit dedicated to tactical excellence, brotherhood, and realistic military simulation. We operate with discipline, structure, and a commitment to immersive gameplay.
        </p>
        <button
          onClick={handleJoinClick}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--accent)", color: "#000", border: "none", borderRadius: "10px", padding: "14px 32px", fontSize: "1rem", fontWeight: 700, cursor: "pointer" }}
        >
          Apply to Join <ChevronRight size={18} />
        </button>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginTop: "10px" }}>Sign in with Discord to submit your application</p>
      </div>

      {/* Features */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.25rem", marginBottom: "3rem" }}>
        {[
          { icon: Shield, title: "Tactical Operations", desc: "Participate in large-scale, organized military operations with realistic rules of engagement." },
          { icon: Users, title: "Community", desc: "Join a welcoming community of dedicated milsim players with structured ranks and departments." },
          { icon: Target, title: "Training Programs", desc: "Earn qualifications through dedicated training programs led by experienced instructors." },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.5rem" }}>
            <div style={{ width: "40px", height: "40px", background: "var(--accent)20", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
              <Icon size={20} style={{ color: "var(--accent)" }} />
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: "8px" }}>{title}</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "2rem", textAlign: "center" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1.5rem", marginBottom: "1rem" }}>Ready to Enlist?</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "1.5rem" }}>Connect your Discord account to apply and gain access to the unit portal.</p>
        <button
          onClick={handleJoinClick}
          style={{ background: "var(--accent)", color: "#000", border: "none", borderRadius: "8px", padding: "12px 28px", fontSize: "0.95rem", fontWeight: 700, cursor: "pointer" }}
        >
          Sign in with Discord
        </button>
      </div>
    </div>
  );
}