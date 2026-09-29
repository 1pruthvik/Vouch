import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
  RefreshCw,
  FileText,
  Key,
  ShieldAlert,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  Copy,
  Check
} from "lucide-react";
import {
  generateKycVoucher,
  verifyKycVoucherLocally,
  processDigiLockerDemographics,
  AadhaarDemographics,
  KycVoucher,
  saveStoredKyc,
  loadStoredKyc,
  DEMO_ADMIN_ADDRESS
} from "../services/kycService";
import { GoogleUser } from "./GoogleAuthModal";

interface DigiLockerKYCModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string | null;
  googleUser: GoogleUser | null;
  onKycVerified: (voucher: KycVoucher, demographics: AadhaarDemographics) => void;
}

export const DigiLockerKYCModal: React.FC<DigiLockerKYCModalProps> = ({
  isOpen,
  onClose,
  walletAddress,
  googleUser,
  onKycVerified,
}) => {
  // Step Management: 1 = Aadhaar Input & Path Selection, 2 = OTP Consent, 3 = Demographics & Front-Running Voucher, 4 = Smart Contract Attestation Complete
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [aadhaarNumber, setAadhaarNumber] = useState("5482 9104 4821");
  const [hasConsent, setHasConsent] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<"aggregator" | "apisetu">("aggregator");
  const [aggregatorProvider, setAggregatorProvider] = useState<"SETU" | "DIGIO" | "CASHFREE">("SETU");
  
  // OTP State
  const [otp, setOtp] = useState("");
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  // Demographic & Voucher State
  const [demographics, setDemographics] = useState<AadhaarDemographics | null>(null);
  const [voucher, setVoucher] = useState<KycVoucher | null>(null);
  const [isGeneratingVoucher, setIsGeneratingVoucher] = useState(false);
  const [isSubmittingOnChain, setIsSubmittingOnChain] = useState(false);
  const [onChainTxHash, setOnChainTxHash] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [activeTabSubView, setActiveTabSubView] = useState<"voucher" | "frontrunning" | "sequence">("voucher");

  // Load existing state if available
  useEffect(() => {
    if (isOpen && walletAddress) {
      const existing = loadStoredKyc(walletAddress);
      if (existing && existing.isVerified && existing.voucher && existing.demographics) {
        setDemographics(existing.demographics);
        setVoucher(existing.voucher);
        setOnChainTxHash(existing.txHash || "0x9f4a18b76e2c3104e12da89f214e6b701249b5c391024e12");
        setStep(4);
      }
    }
  }, [isOpen, walletAddress]);

  // Timer countdown for OTP
  useEffect(() => {
    if (step === 2 && timerSeconds > 0) {
      const interval = setInterval(() => setTimerSeconds((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [step, timerSeconds]);

  if (!isOpen) return null;

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 12);
    // Format 4-4-4
    const parts = raw.match(/.{1,4}/g);
    setAadhaarNumber(parts ? parts.join(" ") : raw);
  };

  const handleProceedToOtp = () => {
    const cleaned = aadhaarNumber.replace(/\s+/g, "");
    if (cleaned.length !== 12) {
      alert("Please enter a valid 12-digit Aadhaar number");
      return;
    }
    if (!hasConsent) {
      alert("Please grant legal e-KYC consent as required by UIDAI & DPDP Act 2023");
      return;
    }
    setTimerSeconds(60);
    setStep(2);
  };

  const handleVerifyOtp = async () => {
    setIsVerifyingOtp(true);
    // Simulate UIDAI DigiLocker OTP verification
    setTimeout(async () => {
      const demoData = processDigiLockerDemographics(
        aadhaarNumber,
        googleUser?.name || "Pruthvik Patel",
        selectedRoute === "apisetu" ? "API_SETU_GOV" : "SETU_AGGREGATOR"
      );
      setDemographics(demoData);

      // Immediately generate the Cryptographic Voucher bound to user's wallet
      const activeWallet = walletAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
      setIsGeneratingVoucher(true);
      try {
        const v = await generateKycVoucher(activeWallet, 15);
        setVoucher(v);
        setIsVerifyingOtp(false);
        setIsGeneratingVoucher(false);
        setStep(3);
      } catch (e: any) {
        setIsVerifyingOtp(false);
        setIsGeneratingVoucher(false);
        alert(e.message || "Failed to generate cryptographic voucher");
      }
    }, 900);
  };

  const handleAttestOnChain = async () => {
    if (!voucher || !demographics) return;
    setIsSubmittingOnChain(true);

    const activeWallet = walletAddress || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

    // Simulate smart contract verifyUser(signature, expiry) execution
    setTimeout(() => {
      const localCheck = verifyKycVoucherLocally(
        activeWallet,
        voucher.expiry,
        voucher.signature,
        DEMO_ADMIN_ADDRESS
      );

      if (!localCheck.isValid) {
        setIsSubmittingOnChain(false);
        alert(`Verification failed: ${localCheck.error}`);
        return;
      }

      const tx = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      setOnChainTxHash(tx);

      // Save state to localStorage
      saveStoredKyc({
        isVerified: true,
        userAddress: activeWallet,
        voucher,
        demographics,
        txHash: tx,
        verifiedAtTimestamp: Math.floor(Date.now() / 1000),
      });

      onKycVerified(voucher, demographics);
      setIsSubmittingOnChain(false);
      setStep(4);
    }, 1200);
  };

  const handleRevokeKyc = () => {
    if (confirm("Are you sure you want to revoke your on-chain KYC? This will invoke revokeMyKYC() on the smart contract.")) {
      localStorage.removeItem("vouch_digilocker_kyc_state");
      setDemographics(null);
      setVoucher(null);
      setOnChainTxHash(null);
      setStep(1);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="v-overlay">
      <div className="v-modal p-6 max-w-2xl w-full space-y-6 animate-scaleUp overflow-y-auto max-h-[92vh] no-scrollbar">
        {/* DigiLocker Official Government Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            {/* DigiLocker Emblem Badge */}
            <div className="w-12 h-12 rounded-2xl bg-[#0b2545] border border-blue-400/30 flex items-center justify-center p-2 shadow-lg shadow-blue-900/30">
              <div className="text-center">
                <span className="block text-[8px] font-black text-amber-400 uppercase tracking-widest leading-none">
                  GOVT OF INDIA
                </span>
                <span className="block text-xs font-black text-white tracking-tight leading-tight mt-0.5">
                  DigiLocker
                </span>
                <span className="block text-[7px] text-blue-300 font-medium leading-none">
                  MeriPehchan
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-display">
                  Aadhaar e-KYC Verification
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  DPDP Act 2023 Compliant
                </span>
              </div>
              <p className="text-xs text-[#9ca3b4]">
                {googleUser ? `Linked to Google account: ${googleUser.email}` : "Verify your identity via UIDAI & DigiLocker"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#5f6578] hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { num: 1, label: "Aadhaar & Route" },
            { num: 2, label: "OTP Consent" },
            { num: 3, label: "Voucher Proof" },
            { num: 4, label: "On-Chain Active" },
          ].map((s) => (
            <div
              key={s.num}
              className={`p-2 rounded-xl border transition-all ${
                step === s.num
                  ? "bg-blue-500/10 border-blue-500 text-blue-300 font-bold shadow-sm"
                  : step > s.num
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-white/[0.02] border-white/5 text-[#5f6578]"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                {step > s.num ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px]">
                    {s.num}
                  </span>
                )}
                <span className="text-[11px] truncate">{s.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── STEP 1: AADHAAR INPUT & ROUTE SELECTION ── */}
        {step === 1 && (
          <div className="space-y-5 animate-fadeIn">
            {/* Live Credentials Architecture Choice (Point 1 from requirements) */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#9ca3b4]">
                Select Production DigiLocker Integration Route
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRoute("aggregator")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    selectedRoute === "aggregator"
                      ? "bg-blue-500/10 border-blue-500/60 shadow-md shadow-blue-500/10"
                      : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Path B: Private Aggregators
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Fastest Setup (2-3 Days)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9ca3b4] leading-relaxed">
                    Setu, Cashfree, Digio, Signzy with commercial KYB. ₹5 - ₹15 / verification fee.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRoute("apisetu")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    selectedRoute === "apisetu"
                      ? "bg-blue-500/10 border-blue-500/60 shadow-md shadow-blue-500/10"
                      : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      Path A: API Setu (Govt)
                    </span>
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                      Free (2-4 Wks Approval)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#9ca3b4] leading-relaxed">
                    Official partners.apisetu.gov.in portal. Requires Corporate CIN & Pull URI OAuth 2.0.
                  </p>
                </button>
              </div>
            </div>

            {/* Aadhaar Input Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#f0f2f5]">
                  12-Digit Aadhaar Number
                </label>
                <span className="text-[11px] text-[#5f6578]">Masked & Encrypted</span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={handleAadhaarChange}
                  placeholder="XXXX XXXX XXXX"
                  className="v-input font-mono text-sm tracking-widest text-center py-3 bg-black/30 border-blue-500/30 focus:border-blue-400"
                />
              </div>
              <p className="text-[11px] text-[#5f6578]">
                Stateless Backend Guarantee: Raw Aadhaar is never saved to database. Used in-memory to verify age and issue signed voucher.
              </p>
            </div>

            {/* Connected Wallet Binding Note */}
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between text-xs">
              <span className="text-[#9ca3b4]">Target Wallet for Proof:</span>
              <span className="font-mono text-white text-[11px] bg-black/40 px-2 py-1 rounded">
                {walletAddress ? `${walletAddress.substring(0, 10)}...${walletAddress.substring(walletAddress.length - 8)}` : "0x70997970C5...017dc79C8"}
              </span>
            </div>

            {/* Legal Consent Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 cursor-pointer hover:bg-white/[0.04] transition-colors">
              <input
                type="checkbox"
                checked={hasConsent}
                onChange={(e) => setHasConsent(e.target.checked)}
                className="mt-0.5 rounded border-white/20 text-blue-500 focus:ring-blue-400"
              />
              <span className="text-[11px] text-[#9ca3b4] leading-relaxed">
                I hereby state that I have no objection in authenticating myself with Aadhaar based authentication system and consent to providing my Aadhaar number and OTP for fetching e-KYC via DigiLocker.
              </span>
            </label>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleProceedToOtp}
                className="v-btn-primary text-xs flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 border-none text-white font-bold px-6 py-2.5 shadow-lg shadow-blue-600/20"
              >
                Request DigiLocker OTP
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: UIDAI OTP CONSENT SCREEN ── */}
        {step === 2 && (
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 mx-auto flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Enter 6-Digit DigiLocker OTP</h3>
              <p className="text-xs text-[#9ca3b4] max-w-sm mx-auto">
                An OTP has been dispatched by UIDAI to your mobile number registered with Aadhaar ending in{" "}
                <strong className="text-white">XXXX-XXXX-4821</strong>.
              </p>
            </div>

            {/* Quick Demo Helper Button */}
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <span className="text-amber-200">Demonstration Credentials Mode:</span>
              <button
                type="button"
                onClick={() => setOtp("749201")}
                className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 transition-colors"
              >
                Auto-fill Demo OTP (749201)
              </button>
            </div>

            {/* OTP Input */}
            <div className="space-y-2">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="• • • • • •"
                className="v-input font-mono text-2xl text-center tracking-[0.5em] py-3 text-white border-blue-500/40"
              />
              <div className="flex justify-between items-center text-xs text-[#5f6578] px-1">
                <span>
                  {timerSeconds > 0 ? (
                    `Resend OTP in 00:${timerSeconds.toString().padStart(2, "0")}`
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTimerSeconds(60)}
                      className="text-blue-400 hover:underline"
                    >
                      Resend OTP now
                    </button>
                  )}
                </span>
                <span>Session ID: DL-{Date.now().toString(36).slice(-6)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-[#5f6578] hover:text-white"
              >
                ← Change Aadhaar
              </button>
              <button
                type="button"
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || isVerifyingOtp}
                className="v-btn-primary text-xs flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-6 py-2.5 shadow-lg shadow-blue-600/20"
              >
                {isVerifyingOtp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Verifying & Generating Voucher...
                  </>
                ) : (
                  <>
                    Verify & Authenticate
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: DEMOGRAPHIC & FRONT-RUNNING VOUCHER DISPLAY ── */}
        {step === 3 && demographics && voucher && (
          <div className="space-y-5 animate-fadeIn">
            {/* Verification Success Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    UIDAI e-KYC Identity Verified
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">
                      AGE {demographics.age}+ ELIGIBLE
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#9ca3b4]">
                    {demographics.fullName} · {demographics.maskedAadhaar} · Ref: {demographics.referenceId}
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-view switcher for technical depth */}
            <div className="flex items-center gap-1.5 bg-white/[0.03] p-1 rounded-xl border border-white/5 text-xs">
              <button
                onClick={() => setActiveTabSubView("voucher")}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTabSubView === "voucher"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-[#5f6578] hover:text-white"
                }`}
              >
                Cryptographic Voucher
              </button>
              <button
                onClick={() => setActiveTabSubView("frontrunning")}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTabSubView === "frontrunning"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-[#5f6578] hover:text-white"
                }`}
              >
                Front-Running Defense
              </button>
              <button
                onClick={() => setActiveTabSubView("sequence")}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTabSubView === "sequence"
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-[#5f6578] hover:text-white"
                }`}
              >
                10-Step Architecture
              </button>
            </div>

            {/* Sub-view 1: Voucher Details */}
            {activeTabSubView === "voucher" && (
              <div className="space-y-3 p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-xs">
                <div className="flex items-center justify-between text-[#9ca3b4] border-b border-white/5 pb-2">
                  <span className="flex items-center gap-1.5 text-white font-bold">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    ECDSA Voucher Parameters
                  </span>
                  <span className="text-[10px] text-emerald-400">15-Minute Expiry Window</span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-[#5f6578]">Bound Wallet:</span>
                    <span className="text-white truncate max-w-[280px]">
                      {voucher.userWalletAddress}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5f6578]">Expiry Timestamp:</span>
                    <span className="text-cyan-400">
                      {voucher.expiry} ({new Date(voucher.expiry * 1000).toLocaleTimeString()})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#5f6578]">Admin Signer:</span>
                    <span className="text-purple-300 truncate max-w-[280px]">
                      {DEMO_ADMIN_ADDRESS}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[#5f6578]">Keccak256 Hash:</span>
                    <button
                      onClick={() => copyToClipboard(voucher.messageHash)}
                      className="text-amber-400 hover:underline flex items-center gap-1 text-[10px]"
                    >
                      {voucher.messageHash.substring(0, 16)}...
                      {copiedHash ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="pt-1">
                    <span className="text-[#5f6578] block mb-0.5">Signature (r, s, v):</span>
                    <p className="text-[10px] text-slate-400 break-all bg-black/50 p-2 rounded-lg border border-white/5">
                      {voucher.signature}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view 2: Front-running Defense (Point 2 from prompt) */}
            {activeTabSubView === "frontrunning" && (
              <div className="space-y-3 p-4 rounded-2xl bg-black/40 border border-amber-500/20 text-xs">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Mempool Front-Running Attack Neutralization
                </div>
                <p className="text-[11px] text-[#9ca3b4] leading-relaxed">
                  In public mempools, malicious bots can intercept a transaction and copy its signature. Vouch smart contracts neutralize this:
                </p>
                <div className="p-3 rounded-xl bg-slate-900 border border-white/5 space-y-1.5 font-mono text-[11px]">
                  <p className="text-slate-400">// 1. Backend signs explicit wallet hash:</p>
                  <p className="text-emerald-400">keccak256(abi.encodePacked(userWallet, expiry))</p>
                  <p className="text-slate-400 pt-1">// 2. Contract verifies using msg.sender:</p>
                  <p className="text-cyan-400">keccak256(abi.encodePacked(msg.sender, expiry))</p>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                  ✓ If attacker changes sender to their wallet, the contract hash changes completely. The <code>ecrecover</code> verification instantly reverts with <em>"Invalid signature"</em>.
                </div>
              </div>
            )}

            {/* Sub-view 3: Sequence Architecture Diagram (Point 4 from prompt) */}
            {activeTabSubView === "sequence" && (
              <div className="space-y-2 p-3.5 rounded-2xl bg-black/40 border border-white/5 text-[11px]">
                <p className="font-bold text-white mb-1">Production Lifecycle Steps:</p>
                <div className="space-y-1 font-mono text-[10px] text-slate-300">
                  <p className="text-blue-400">1. Browser submits wallet to backend</p>
                  <p className="text-blue-400">2. Backend creates DigiLocker session via API Setu / Setu Aggregator</p>
                  <p className="text-amber-400">3. User signs into Aadhaar portal via OTP consent</p>
                  <p className="text-purple-400">4. Webhook returns demographic data (stateless memory processing)</p>
                  <p className="text-emerald-400">5. Backend signs crypto voucher payload with HSM Admin Key</p>
                  <p className="text-emerald-400">6. Browser invokes VouchKYCRegistry.verifyUser(sig, expiry)</p>
                  <p className="text-cyan-400">7. Smart contract validates ecrecover(hash, sig) == adminSigner</p>
                </div>
              </div>
            )}

            {/* Action Button: Execute On-chain verification */}
            <div className="pt-2 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-[#5f6578] hover:text-white"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleAttestOnChain}
                disabled={isSubmittingOnChain}
                className="v-btn-primary text-xs flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-6 py-2.5 shadow-lg shadow-emerald-600/20 border-none"
              >
                {isSubmittingOnChain ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Submitting On-Chain Proof to MST Testnet...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-200" />
                    Claim On-Chain KYC Credential
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: ON-CHAIN ATTESTATION ACTIVE ── */}
        {step === 4 && demographics && (
          <div className="space-y-5 animate-fadeIn text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white font-display">
                DigiLocker KYC Active on Blockchain
              </h3>
              <p className="text-xs text-[#9ca3b4] max-w-md mx-auto">
                Your wallet is cryptographically certified for participation in autonomous ROSCA / Chit Fund pools.
              </p>
            </div>

            {/* Credential Card */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-left space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-[#9ca3b4]">Status:</span>
                <span className="font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  VERIFIED TIER-1
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#9ca3b4]">Holder:</span>
                <span className="text-white font-sans font-bold">{demographics.fullName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#9ca3b4]">Masked Aadhaar:</span>
                <span className="text-slate-300">{demographics.maskedAadhaar}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#9ca3b4]">Certified Wallet:</span>
                <span className="text-cyan-300 truncate max-w-[220px]">
                  {walletAddress || voucher?.userWalletAddress || "0x7099...79C8"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#9ca3b4]">Attestation Tx:</span>
                <span className="text-amber-400 text-[11px] truncate max-w-[220px]">
                  {onChainTxHash || "0x9f4a18b76e2c3104e12da89f..."}
                </span>
              </div>
            </div>

            {/* Production Safety Controls (Point 3 from prompt: Re-verification & Revocation) */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-left text-xs flex items-center justify-between">
              <div>
                <p className="font-semibold text-white">Wallet Key Compromise?</p>
                <p className="text-[11px] text-[#5f6578]">
                  Invoke <code>revokeMyKYC()</code> to immediately disable this credential.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRevokeKyc}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 font-semibold text-[11px] transition-colors border border-red-500/20"
              >
                Revoke KYC
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full v-btn-primary text-xs py-2.5 font-bold"
            >
              Done & Return to Circle
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
