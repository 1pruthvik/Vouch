import React, { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  UserCheck,
  Smartphone,
  CreditCard,
  Building2,
  Lock,
  Zap,
  Fingerprint
} from "lucide-react";

export interface UserKYCProfile {
  fullName: string;
  phone: string;
  upiId: string;
  idNumber: string;
  communityLocation: string;
  verifiedAt: string;
  trustScore: number;
}

interface KYCOnboardingProps {
  onVerificationComplete: (profile: UserKYCProfile) => void;
}

export const KYCOnboarding: React.FC<KYCOnboardingProps> = ({ onVerificationComplete }) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [upiId, setUpiId] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [communityLocation, setCommunityLocation] = useState("");

  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);

  const verificationStages = [
    "Connecting to Decentralized Trust Attestation...",
    "Validating Indian Resident & Digilocker Record...",
    "Establishing Bounded Guarantee Identity...",
    "Generating Verified Member Trust Passport ✓"
  ];

  const handleStartVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone || !upiId) return;

    setIsVerifying(true);
    setVerifyStep(0);

    const interval = setInterval(() => {
      setVerifyStep((prev) => {
        if (prev >= verificationStages.length - 1) {
          clearInterval(interval);
          setTimeout(() => {
            onVerificationComplete({
              fullName,
              phone,
              upiId,
              idNumber: idNumber || "AADHAAR-****-4912",
              communityLocation: communityLocation || "Bangalore Central",
              verifiedAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
              trustScore: 98,
            });
          }, 800);
          return prev;
        }
        return prev + 1;
      });
    }, 700);
  };

  const handleQuickDemoFill = () => {
    setFullName("Pranav Bhat");
    setPhone("+91 98450 12345");
    setUpiId("pranav@okhdfcbank");
    setIdNumber("XXXX-XXXX-4912");
    setCommunityLocation("Palm Meadows Community, Whitefield");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 relative">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-[#00F5A0]/10 via-[#7928CA]/10 to-transparent blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-xl w-full relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] mb-2 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse" />
            <span className="text-xs font-semibold text-[#00F5A0] tracking-wider uppercase">
              Vouch · Protocol Onboarding
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-display tracking-tight">
            Member Identity & Verification
          </h1>
          <p className="text-sm text-[#94A3B8] max-w-md mx-auto">
            Vouch is a permissioned community chit protocol. Verify your identity once to access or launch trusted local savings pools.
          </p>
        </div>

        {/* KYC Card */}
        <div className="v-glass-card p-6 sm:p-8 space-y-6">
          {!isVerifying ? (
            <form onSubmit={handleStartVerification} className="space-y-4 text-xs">
              {/* Demo Auto-fill Helper */}
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <span className="text-[#64748B] font-medium">Step 1 of 2: Member Details</span>
                <button
                  type="button"
                  onClick={handleQuickDemoFill}
                  className="text-[#00F5A0] hover:underline font-semibold flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-fill Demo Details
                </button>
              </div>

              {/* Full Legal Name */}
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#00F5A0]" />
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Pranav Bhat"
                  className="v-input"
                  required
                />
              </div>

              {/* Mobile Number & Linked UPI ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#00D9F5]" />
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98450 00000"
                    className="v-input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#FFB800]" />
                    Linked UPI ID (For AutoPay)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="name@okhdfcbank"
                    className="v-input"
                    required
                  />
                </div>
              </div>

              {/* Government ID / Community ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-[#A78BFA]" />
                    Aadhaar / PAN Last 4 Digits
                  </label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. 4912"
                    className="v-input"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#00F5A0]" />
                    Apartment / Community Tag
                  </label>
                  <input
                    type="text"
                    value={communityLocation}
                    onChange={(e) => setCommunityLocation(e.target.value)}
                    placeholder="e.g. Whitefield Residents Club"
                    className="v-input"
                  />
                </div>
              </div>

              {/* Security Callout */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-start gap-3">
                <Lock className="w-4 h-4 text-[#00F5A0] mt-0.5 flex-shrink-0" />
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Your identity is cryptographically bonded to your member profile on MST Testnet.
                  Zero credentials or passwords are ever exposed to organizers.
                </p>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="v-btn-primary w-full py-3.5 text-sm mt-2"
              >
                Verify & Continue to Community Hub
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Verification In-Progress State */
            <div className="py-10 text-center space-y-6 anim-fade-up">
              <div className="relative w-20 h-20 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-[#00F5A0]/20 animate-ping" />
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#00F5A0]/20 to-[#7928CA]/20 border border-[#00F5A0]/40 flex items-center justify-center text-[#00F5A0] mx-auto shadow-[0_0_30px_rgba(0,245,160,0.3)]">
                  <Fingerprint className="w-10 h-10 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white font-display">
                  {verificationStages[verifyStep]}
                </h3>
                <p className="text-xs text-[#94A3B8]">
                  Establishing verified community standing for <strong className="text-white">{fullName}</strong>
                </p>
              </div>

              {/* Stage Progress Pills */}
              <div className="flex justify-center items-center gap-1.5">
                {verificationStages.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i <= verifyStep ? "w-8 bg-[#00F5A0]" : "w-3 bg-white/10"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
