import React, { useState } from "react";
import { Shield, Sparkles, ArrowRight, Lock } from "lucide-react";
import { useGoogleLogin } from "@react-oauth/google";

interface LoginPageProps {
  onLoginSuccess: (user: { name: string; email: string; picture?: string }) => void;
  googleClientIdConfigured: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  googleClientIdConfigured,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hook for Google OAuth token flow
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setIsLoading(true);
        setError(null);
        // Fetch user profile information using access token
        const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        const userInfo = await res.json();
        onLoginSuccess({
          name: userInfo.name || userInfo.email?.split("@")[0] || "User",
          email: userInfo.email,
          picture: userInfo.picture,
        });
      } catch (err: any) {
        console.error("Google userinfo fetch failed:", err);
        setError("Failed to fetch Google profile. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error("Google login failed:", errorResponse);
      setError("Google authentication was cancelled or failed.");
    },
  });

  const handleSignInClick = () => {
    if (!googleClientIdConfigured) {
      setError("Google Client ID is not configured yet. Please provide your Google API Client ID.");
      return;
    }
    setError(null);
    googleLogin();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black px-6 text-neutral-100 relative">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Brand Icon */}
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 text-red-500 flex items-center justify-center">
            <Shield className="w-12 h-12" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
              Vouch
            </h1>
            <p className="text-sm text-neutral-400">
              Autonomous Rotating Savings & Collateral Pool on MST Blockchain
            </p>
          </div>
        </div>

        {/* Authentication Box */}
        <div className="space-y-6 pt-4">
          <button
            onClick={handleSignInClick}
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-200 border-none cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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

          {error && (
            <p className="text-xs text-red-400 max-w-sm mx-auto leading-relaxed">
              {error}
            </p>
          )}
        </div>

        {/* Security / Privacy Footer */}
        <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 pt-6">
          <Lock className="w-3.5 h-3.5 text-red-500" />
          <span>Encrypted On-Chain Authentication</span>
        </div>
      </div>
    </div>
  );
};
