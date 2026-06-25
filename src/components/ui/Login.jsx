import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { authConfigError, supabase } from "../../services/supabaseClient";

// ─────────────────────────────────────────────────────────────────
// ACCENT & GLASS HELPERS
// ─────────────────────────────────────────────────────────────────
const accent = T => T.isDark ? "#00D2C4" : "#0F766E";

const glass = (T, extra = {}) => ({
  background: T.cardBg,
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: `1px solid ${T.cardBorder}`,
  boxShadow: T.cardShadow,
  ...extra,
});

const withAuthTimeout = (promise, label = "Auth request") => {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out. Check your internet connection.`));
    }, 15000);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

export default function Login({ T, onLogin }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (authConfigError) throw new Error(authConfigError);

      const cleanEmail = email.trim();

      if (!cleanEmail) {
        throw new Error("Please enter your email.");
      }

      if (!isForgotPassword && password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      if (isForgotPassword) {
        // Handle Password Reset
        const { error } = await withAuthTimeout(supabase.auth.resetPasswordForEmail(cleanEmail, {
          redirectTo: window.location.origin,
        }), "Password reset");
        if (error) throw error;
        setSuccessMsg("Password reset email sent! Check your inbox.");
        setTimeout(() => setIsForgotPassword(false), 4000); // Go back to login after 4s
      } else if (isSignUp) {
        // Handle Sign Up
        const { data, error } = await withAuthTimeout(supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              email: cleanEmail,
            },
          },
        }), "Sign up");
        if (error) throw error;
        if (data.session) {
          setSuccessMsg("Account created. Please be patience. Signing you in...");
          if (onLogin) onLogin();
        } else {
          setSuccessMsg("Success! Check your email for a confirmation link.");
        }
      } else {
        // Handle Sign In
        const { data, error } = await withAuthTimeout(supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        }), "Sign in");
        if (error) throw error;
        if (!data.session) throw new Error("Sign in did not return a session. Please try again.");
        if (onLogin) onLogin(); // Failsafe if App.jsx is still using the manual prop
      }
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (authConfigError) throw new Error(authConfigError);

      const { data, error } = await withAuthTimeout(supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      }), "Google sign in");
      if (error) throw error;
      if (!data?.url) throw new Error("Google sign in did not return a redirect URL. Check that Google provider is enabled in Supabase.");
    } catch (error) {
      setErrorMsg(error.message);
      setLoading(false);
    }
  };

  const ac = accent(T);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 20,
        overflow: "hidden",
      }}
    >
      {/* ── Scoped styles: animations, focus glow, hover micro-interactions ── */}
      <style>{`
        @keyframes lg-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lg-pop {
          0%   { opacity: 0; transform: scale(0.6) rotate(-12deg); }
          60%  { transform: scale(1.12) rotate(4deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes lg-glow {
          0%, 100% { box-shadow: 0 0 28px ${ac}55, 0 0 0 1px ${ac}33 inset; }
          50%      { box-shadow: 0 0 46px ${ac}88, 0 0 0 1px ${ac}55 inset; }
        }
        @keyframes lg-aurora {
          0%   { transform: translate(-12%, -8%) scale(1); }
          50%  { transform: translate(10%, 8%) scale(1.18); }
          100% { transform: translate(-12%, -8%) scale(1); }
        }
        @keyframes lg-shimmer {
          0%   { background-position: -180% 0; }
          100% { background-position: 180% 0; }
        }
        .lg-card { animation: lg-fade-up 0.7s cubic-bezier(.22,1,.36,1) both; }
        .lg-stagger > * { animation: lg-fade-up 0.6s cubic-bezier(.22,1,.36,1) both; }
        .lg-stagger > *:nth-child(1) { animation-delay: 0.06s; }
        .lg-stagger > *:nth-child(2) { animation-delay: 0.12s; }
        .lg-stagger > *:nth-child(3) { animation-delay: 0.18s; }
        .lg-stagger > *:nth-child(4) { animation-delay: 0.24s; }
        .lg-stagger > *:nth-child(5) { animation-delay: 0.30s; }
        .lg-stagger > *:nth-child(6) { animation-delay: 0.36s; }
        .lg-input {
          transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease, transform 0.25s ease;
        }
        .lg-input::placeholder { color: rgba(255,255,255,0.4); }
        .lg-input:focus {
          border-color: ${ac} !important;
          box-shadow: 0 0 0 4px ${ac}26;
          background: rgba(255,255,255,0.06) !important;
        }
        .lg-submit {
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.2s ease;
          box-shadow: 0 10px 26px ${ac}40;
        }
        .lg-submit:not(:disabled):hover { transform: translateY(-2px); filter: brightness(1.05); box-shadow: 0 16px 34px ${ac}5c; }
        .lg-submit:not(:disabled):active { transform: translateY(0) scale(0.985); }
        .lg-submit::after {
          content: "";
          position: absolute; inset: 0;
          background: linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.45) 50%, transparent 70%);
          background-size: 200% 100%;
          animation: lg-shimmer 2.6s linear infinite;
          opacity: 0.5;
        }
        .lg-google {
          transition: background 0.25s ease, border-color 0.25s ease, transform 0.18s ease, box-shadow 0.25s ease;
        }
        .lg-google:not(:disabled):hover {
          background: rgba(255,255,255,0.09) !important;
          border-color: ${ac}88 !important;
          transform: translateY(-1px);
          box-shadow: 0 8px 22px rgba(0,0,0,0.25);
        }
        .lg-google:not(:disabled):active { transform: translateY(0) scale(0.99); }
        .lg-link { transition: color 0.2s ease, opacity 0.2s ease; }
        .lg-link:hover { opacity: 1; filter: brightness(1.15); }
      `}</style>

      {/* ── Ambient aurora background (kept subtle, theme-driven) ── */}
      <div
        aria-hidden
        style={{
          position: "absolute", top: "-20%", left: "-10%", width: "70%", height: "70%",
          background: `radial-gradient(circle at center, ${ac}33, transparent 60%)`,
          filter: "blur(60px)", animation: "lg-aurora 16s ease-in-out infinite", pointerEvents: "none",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute", bottom: "-25%", right: "-12%", width: "65%", height: "65%",
          background: `radial-gradient(circle at center, ${ac}22, transparent 60%)`,
          filter: "blur(70px)", animation: "lg-aurora 20s ease-in-out infinite reverse", pointerEvents: "none",
        }}
      />

      <div
        className="lg-card"
        style={{
          ...glass(T, {
            borderRadius: 24,
            boxShadow: "0 30px 80px rgba(0,0,0,0.45), 0 1px 0 rgba(255,255,255,0.06) inset",
          }),
          position: "relative",
          padding: "44px 36px",
          width: "100%",
          maxWidth: 380,
          textAlign: "center",
          zIndex: 1,
        }}
      >
        {/* Brand badge */}
        <div
          style={{
            width: 76, height: 76, margin: "0 auto 22px", borderRadius: 20,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(140deg, ${ac}, ${ac}aa)`,
            animation: "lg-pop 0.8s cubic-bezier(.34,1.56,.64,1) both, lg-glow 3.4s ease-in-out 0.8s infinite",
          }}
        >
          <Sparkles size={34} color={T.isDark ? "#0B0F12" : "#ffffff"} />
        </div>

        <div className="lg-stagger" style={{ display: "flex", flexDirection: "column" }}>
          <h1 style={{ fontSize: 26, marginBottom: 8, color: "#ffffff", fontWeight: 800, letterSpacing: "-0.02em" }}>
            {isForgotPassword ? "Reset Password" : (isSignUp ? "Join glimacy" : "Welcome to glimacy")}
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14, marginBottom: 28, lineHeight: 1.5 }}>
            {isForgotPassword ? "Enter your email to receive a recovery link." : (isSignUp ? "Create an account to join your campus." : "Sign in to continue to your campus.")}
          </p>
        </div>

        {(authConfigError || errorMsg) && (
          <div style={{ color: "#fca5a5", fontSize: 12.5, marginBottom: 16, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", padding: 10, borderRadius: 12, animation: "lg-fade-up 0.35s ease both" }}>
            {authConfigError || errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ color: "#6ee7b7", fontSize: 12.5, marginBottom: 16, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", padding: 10, borderRadius: 12, animation: "lg-fade-up 0.35s ease both" }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="lg-stagger" style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Always show Email Input */}
          <input
            type="email" placeholder="Email" value={email} required
            onChange={(e) => setEmail(e.target.value)}
            className="lg-input"
            style={{ padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.inputBorder}`, color: "#ffffff", outline: "none", fontSize: 14.5 }}
          />

          {/* Only show Password input if NOT in forgot password mode */}
          {!isForgotPassword && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
              <input
                type="password" placeholder="Password" value={password} required
                onChange={(e) => setPassword(e.target.value)}
                className="lg-input"
                style={{ padding: 14, borderRadius: 14, background: "rgba(255,255,255,0.03)", border: `1px solid ${T.inputBorder}`, color: "#ffffff", width: "100%", boxSizing: "border-box", outline: "none", fontSize: 14.5 }}
              />
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setErrorMsg(""); setSuccessMsg(""); }}
                  className="lg-link"
                  style={{ background: "none", border: "none", color: ac, fontSize: 12.5, cursor: "pointer", padding: "2px 0", fontWeight: 600 }}
                >
                  Forgot Password?
                </button>
              )}
            </div>
          )}

          {/* Submit Button (Changes text dynamically) */}
          <button
            type="submit" disabled={loading}
            className="lg-submit"
            style={{ padding: 15, borderRadius: 14, border: "none", background: ac, color: T.isDark ? "#0B0F12" : "#fff", fontWeight: 800, fontSize: 15, cursor: loading ? "wait" : "pointer", marginTop: 4, opacity: loading ? 0.75 : 1, letterSpacing: "0.01em" }}
          >
            <span style={{ position: "relative", zIndex: 1 }}>
              {loading ? "Loading..." : (isForgotPassword ? "Send Recovery Email" : (isSignUp ? "Sign Up" : "Sign In"))}
            </span>
          </button>

          {/* Toggle Links */}
          <button
            type="button"
            onClick={() => {
              if (isForgotPassword) {
                setIsForgotPassword(false);
              } else {
                setIsSignUp(!isSignUp);
              }
              setErrorMsg("");
              setSuccessMsg("");
            }}
            className="lg-link"
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.65)", fontSize: 12.5, cursor: "pointer", marginTop: 2, fontWeight: 500 }}
          >
            {isForgotPassword ? "Back to Sign In" : (isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up")}
          </button>

          {/* Hide Google Auth when resetting password */}
          {!isForgotPassword && (
            <>
              <div style={{ display: "flex", alignItems: "center", margin: "8px 0", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                <div style={{ flex: 1, height: "1px", background: T.divider }} />
                <span style={{ padding: "0 12px", textTransform: "uppercase", letterSpacing: "0.12em", fontSize: 10.5, fontWeight: 600 }}>or</span>
                <div style={{ flex: 1, height: "1px", background: T.divider }} />
              </div>

              <button
                type="button" onClick={handleGoogleLogin} disabled={loading}
                className="lg-google"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  padding: 14, borderRadius: 14, border: `1px solid ${T.inputBorder}`,
                  background: "rgba(255,255,255,0.04)", color: "#ffffff", fontWeight: 600, fontSize: 14, cursor: loading ? "wait" : "pointer",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ display: "block" }}>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
