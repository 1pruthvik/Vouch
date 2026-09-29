import React, { useState, useEffect } from "react";
import { Shield, Key, ArrowRight, Lock, CheckCircle2, AlertCircle } from "lucide-react";

interface LoginPageProps {
  onLoginSuccess: (user: { name: string; email: string; picture?: string }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [clientId, setClientId] = useState<string>(() => {
    return (
      (import.meta.env.VITE_GOOGLE_CLIENT_ID as string) ||
      localStorage.getItem("vouch_google_client_id") ||
      ""
    );
  });
  const [inputClientId, setInputClientId] = useState("");
  const [isEditingClientId, setIsEditingClientId] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gsiLoaded, setGsiLoaded] = useState(false);

  // Load Google Identity Services script
  useEffect(() => {
    if (window.google?.accounts?.id || window.google?.accounts?.oauth2) {
      setGsiLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGsiLoaded(true);
    script.onerror = () => setError("Failed to load Google Sign-In script. Check network connection.");
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputClientId.trim()) return;
    const cleanId = inputClientId.trim();
    setClientId(cleanId);
    localStorage.setItem("vouch_google_client_id", cleanId);
    setIsEditingClientId(false);
    setError(null);
  };

  const handleGoogleSignIn = () => {
    if (!clientId) {
      setIsEditingClientId(true);
      setError("Please provide your Google OAuth Client ID to proceed.");
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      setError("Google Sign-In SDK is still loading. Please wait a moment...");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "email profile openid",
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            setError(tokenResponse.error_description || "Google authorization failed.");
            setIsLoading(false);
            return;
          }

          if (tokenResponse.access_token) {
            try {
              const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: {
                  Authorization: `Bearer ${tokenResponse.access_token}`,
                },
              });
              const userData = await res.json();
              onLoginSuccess({
                name: userData.name || userData.email?.split("@")[0] || "User",
                email: userData.email,
                picture: userData.picture,
              });
            } catch (fetchErr) {
              console.error("Userinfo fetch error:", fetchErr);
              setError("Failed to retrieve user profile from Google.");
            } finally {
              setIsLoading(false);
            }
          }
        },
      });

      tokenClient.requestAccessToken({ prompt: "consent" });
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err.message || "Failed to initiate Google Sign-In. Check your Client ID configuration.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-6 text-neutral-100 relative">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Brand */}
        <div className="flex flex-col items-center space-y-4">
          <div className="p-3 text-red-500 flex items-center justify-center">
            <Shield className="w-12 h-12" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
              Vouch
            </h1>
            <p className="text-sm text-neutral-400">
              Autonomous Rotating Savings & Collateral Pool
            </p>
          </div>
        </div>

        {/* Authentication Form / Button */}
        <div className="space-y-4 pt-2">
          {(!clientId || isEditingClientId) ? (
            <form onSubmit={handleSaveClientId} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-red-500" />
                    Google OAuth Client ID
                  </span>
                  {clientId && (
                    <button
                      type="button"
                      onClick={() => setIsEditingClientId(false)}
                      className="text-[11px] text-neutral-500 hover:text-white"
                    >
                      Cancel
                    </button>
                  )}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123456789-xxxx.apps.googleusercontent.com"
                  value={inputClientId}
                  onChange={(e) => setInputClientId(e.target.value)}
                  className="w-full bg-neutral-950 rounded-lg px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none"
                />
                <p className="text-[11px] text-neutral-500">
                  Obtain this from <strong className="text-neutral-400">Google Cloud Console &gt; Credentials &gt; OAuth 2.0 Client ID</strong>
                </p>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3"
              >
                Save & Continue to Google Sign-In
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading || !gsiLoaded}
                className="w-full py-3.5 px-6 rounded-lg bg-neutral-950 hover:bg-neutral-900 text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-200 border-none cursor-pointer"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLoading ? "Signing in..." : "Sign in with Google"}</span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
                <span className="truncate max-w-[240px]">
                  Client ID: {clientId.substring(0, 16)}...
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setInputClientId(clientId);
                    setIsEditingClientId(true);
                  }}
                  className="text-red-400 hover:underline cursor-pointer"
                >
                  Edit Key
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-950/30 text-red-400 rounded-lg flex items-center justify-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Security / Privacy Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 pt-6">
          <Lock className="w-3.5 h-3.5 text-red-500" />
          <span>OAuth 2.0 Verified Authentication</span>
        </div>
      </div>
    </div>
  );
};
