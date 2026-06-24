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

  return (
    <div style={{ 
      display: "flex", flexDirection: "column", alignItems: "center", 
      justifyContent: "center", minHeight: "100vh", padding: 20 
    }}>
      <div style={{ ...glass(T), padding: 40, width: "100%", maxWidth: 360, textAlign: "center", borderRadius: 16 }}>
        <Sparkles size={40} color={accent(T)} style={{ marginBottom: 20 }} />
        
        <h1 style={{ fontSize: 24, marginBottom: 8, color: "#ffffff", fontWeight: 700 }}>
          {isForgotPassword ? "Reset Password" : "Welcome to glimacy"}
        </h1>
        <p style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 14, marginBottom: 30 }}>
          {isForgotPassword ? "Enter your email to receive a recovery link." : (isSignUp ? "Create an account to join your campus." : "Sign in to continue to your campus.")}
        </p>

        {(authConfigError || errorMsg) && (
          <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 15, background: "rgba(239,68,68,0.1)", padding: 8, borderRadius: 8 }}>
            {authConfigError || errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div style={{ color: "#10b981", fontSize: 12, marginBottom: 15, background: "rgba(16,185,129,0.1)", padding: 8, borderRadius: 8 }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 15 }}>
          
          {/* Always show Email Input */}
          <input 
            type="email" placeholder="Email" value={email} required
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 12, borderRadius: 12, background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: "#ffffff", outline: "none" }}
          />
          
          {/* Only show Password input if NOT in forgot password mode */}
          {!isForgotPassword && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <input 
                type="password" placeholder="Password" value={password} required
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: 12, borderRadius: 12, background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: "#ffffff", width: "100%", boxSizing: "border-box", outline: "none" }}
              />
              {!isSignUp && (
                <button 
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setErrorMsg(""); setSuccessMsg(""); }}
                  style={{ background: "none", border: "none", color: accent(T), fontSize: 12, cursor: "pointer", padding: "2px 0", fontWeight: 500 }}
                >
                  Forgot Password?
                </button>
              )}
            </div>
          )}

          {/* Submit Button (Changes text dynamically) */}
          <button 
            type="submit" disabled={loading}
            style={{ padding: 14, borderRadius: 12, border: "none", background: accent(T), color: T.isDark ? "#0B0F12" : "#fff", fontWeight: 700, cursor: loading ? "wait" : "pointer", marginTop: 5, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Loading..." : (isForgotPassword ? "Send Recovery Email" : (isSignUp ? "Sign Up" : "Sign In"))}
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
            style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer", marginTop: "-5px" }}
          >
            {isForgotPassword ? "Back to Sign In" : (isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up")}
          </button>

          {/* Hide Google Auth when resetting password */}
          {!isForgotPassword && (
            <>
              <div style={{ display: "flex", alignItems: "center", margin: "10px 0", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
                <div style={{ flex: 1, height: "1px", background: T.divider }} />
                <span style={{ padding: "0 10px" }}>or</span>
                <div style={{ flex: 1, height: "1px", background: T.divider }} />
              </div>

              <button 
                type="button" onClick={handleGoogleLogin} disabled={loading}
                style={{ 
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  padding: 12, borderRadius: 12, border: `1px solid ${T.inputBorder}`, 
                  background: "rgba(255,255,255,0.04)", color: "#ffffff", fontWeight: 600, cursor: loading ? "wait" : "pointer", transition: "background 0.2s"
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
