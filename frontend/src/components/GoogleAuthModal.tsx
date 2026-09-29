import React, { useState } from "react";
import { X, ShieldCheck, ArrowRight, Lock, Sparkles, CheckCircle2 } from "lucide-react";

export interface GoogleUser {
  name: string;
  email: string;
  avatarUrl: string;
  idToken: string;
  authenticatedAt: string;
}

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: GoogleUser) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const defaultProfiles = [
    {
      name: "Pruthvik Patel",
      email: "pruthvik.patel@gmail.com",
      avatarLetter: "P",
      avatarBg: "bg-emerald-600",
    },
    {
      name: "Pruthvik Work",
      email: "pruthvik@bmse.tech",
      avatarLetter: "B",
      avatarBg: "bg-cyan-600",
    },
  ];

  const handleSelectAccount = async (profile: { name: string; email: string }) => {
    setIsProcessing(true);
    // Simulate Google OAuth 2.0 handshake
    setTimeout(() => {
      setIsProcessing(false);
      const user: GoogleUser = {
        name: profile.name,
        email: profile.email,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(profile.name)}`,
        idToken: `google_oauth2_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
        authenticatedAt: new Date().toISOString(),
      };
      onSuccess(user);
    }, 600);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const name = customName.trim() || customEmail.split("@")[0];
    handleSelectAccount({ name, email: customEmail.trim() });
  };

  return (
    <div className="v-overlay">
      <div className="v-modal p-6 max-w-md w-full space-y-5 animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-3">
            {/* Google G Logo SVG */}
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-md shadow-white/5 p-2">
              <svg viewBox="0 0 24 24" className="w-6 h-6">
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
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">Sign in with Google</h2>
              <p className="text-xs text-[#9ca3b4]">Continue to Vouch Savings Network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#5f6578] hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice on Subsequent DigiLocker KYC */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-500/10 via-slate-900 to-slate-900 border border-blue-500/20 text-xs flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-blue-200">DigiLocker KYC follows next</p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Upon Google authentication, the <strong>DigiLocker Aadhaar KYC Window</strong> will immediately pop up to issue your zero-knowledge on-chain credential.
            </p>
          </div>
        </div>

        {/* Account Pickers */}
        {!isCustomMode ? (
          <div className="space-y-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#5f6578]">
              Choose an account
            </p>
            {defaultProfiles.map((p) => (
              <button
                key={p.email}
                onClick={() => handleSelectAccount(p)}
                disabled={isProcessing}
                className="w-full p-3.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between text-left transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full ${p.avatarBg} text-white font-bold flex items-center justify-center text-sm shadow-sm`}
                  >
                    {p.avatarLetter}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-[#9ca3b4]">{p.email}</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-[#5f6578] group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}

            <button
              onClick={() => setIsCustomMode(true)}
              className="w-full py-2.5 text-xs text-[#2dd4a8] hover:underline font-semibold text-center block pt-1"
            >
              + Use another Google account
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#9ca3b4] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Pruthvik Patel"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="v-input text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#9ca3b4] mb-1.5">
                Google Email Address
              </label>
              <input
                type="email"
                placeholder="user@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                required
                className="v-input text-xs"
              />
            </div>
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setIsCustomMode(false)}
                className="text-xs text-[#5f6578] hover:text-white"
              >
                ← Back to accounts
              </button>
              <button
                type="submit"
                disabled={isProcessing || !customEmail.trim()}
                className="v-btn-primary text-xs"
              >
                {isProcessing ? "Authenticating..." : "Sign In & Proceed"}
              </button>
            </div>
          </form>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-[#5f6578]">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-[#2dd4a8]" />
            OAuth 2.0 Secure Handshake
          </span>
          <span>DPDP Act 2023 Compliant</span>
        </div>
      </div>
    </div>
  );
};
