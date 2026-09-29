import React, { useState } from "react";
import { Shield, KeyRound, Unlock, Lock, Building, CheckCircle2, AlertCircle, ArrowRight, Zap, Sparkles, Code2 } from "lucide-react";
import { Modal } from "./ui/Modal";
import { formatRawINR, MST_TO_INR_RATE } from "../utils/formatters";

interface WorkplaceCommunityDecryptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessJoin: (decryptedCircleAddress: string, bufferDepositMST: string) => void;
  isTechnicalMode: boolean;
}

export const WorkplaceCommunityDecryptModal: React.FC<WorkplaceCommunityDecryptModalProps> = ({
  isOpen,
  onClose,
  onSuccessJoin,
  isTechnicalMode,
}) => {
  const [encryptedCode, setEncryptedCode] = useState("0x7f88a91c5e4b2d1098a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5");
  const [workplaceDomain, setWorkplaceDomain] = useState("microsoft.com");
  const [userEmail, setUserEmail] = useState("rahul.n@microsoft.com");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptionStep, setDecryptionStep] = useState<"idle" | "verifying_keys" | "initiating_rpc" | "decrypted" | "failed">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Decrypted parameters
  const [decryptedCircle, setDecryptedCircle] = useState<{
    name: string;
    address: string;
    memberCount: number;
    installmentINR: number;
    termMonths: number;
    adminAddress: string;
    isPrivate: boolean;
  } | null>(null);

  const sampleWorkplaces = [
    { name: "Microsoft Redmond & India", domain: "microsoft.com", sampleEmail: "rahul.n@microsoft.com" },
    { name: "Google Bangalore Campus", domain: "google.com", sampleEmail: "ananya.rao@google.com" },
    { name: "Infosys Tech Park", domain: "infosys.com", sampleEmail: "vikram.patel@infosys.com" },
    { name: "Koramangala Community Pool", domain: "koramangala.community", sampleEmail: "sneha.iyer@koramangala.community" },
  ];

  const handleSelectWorkplace = (w: { name: string; domain: string; sampleEmail: string }) => {
    setWorkplaceDomain(w.domain);
    setUserEmail(w.sampleEmail);
    setErrorMsg(null);
    setDecryptionStep("idle");
    setDecryptedCircle(null);
  };

  const handleDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsDecrypting(true);
    setDecryptionStep("verifying_keys");

    // Step 1: Verify workplace credential
    setTimeout(() => {
      const emailDomain = userEmail.split("@")[1]?.toLowerCase();
      if (emailDomain !== workplaceDomain.toLowerCase()) {
        setErrorMsg(`Access Denied: Your email (${userEmail}) does not match the Admin's workplace/community domain (${workplaceDomain}). Code cannot be decrypted.`);
        setDecryptionStep("failed");
        setIsDecrypting(false);
        return;
      }

      setDecryptionStep("initiating_rpc");

      // Step 2: Bridgekey Wallet initiates RPC Node and activates MST Blockchain
      setTimeout(() => {
        setDecryptedCircle({
          name: workplaceDomain === "google.com" ? "Google Bangalore Chit Fund" : "Microsoft Techies Savings Circle",
          address: "0xAf378D33B037A6668fOd128c4BBA28bb65974D9b",
          memberCount: 5,
          installmentINR: 5000,
          termMonths: 5,
          adminAddress: "0x71C8F21c83B386f786f4a3E0b90494F3c419392B",
          isPrivate: true,
        });
        setDecryptionStep("decrypted");
        setIsDecrypting(false);
      }, 700);
    }, 600);
  };

  const handleConfirmJoin = () => {
    if (!decryptedCircle) return;
    const bufferMST = (decryptedCircle.installmentINR / MST_TO_INR_RATE).toFixed(4);
    onSuccessJoin(decryptedCircle.address, bufferMST);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Community & Workplace Decryption"
      description="Decrypt the Admin's Group Code using your verified workplace key"
      icon={<Lock className="w-5 h-5 text-[#946800]" />}
      maxWidth="max-w-lg"
    >
      <div className="space-y-4 text-xs">
        {/* Quick Sample Selector */}
        <div className="space-y-1.5">
          <label className="block font-semibold text-[#5F6368]">Select Target Workplace / Community:</label>
          <div className="grid grid-cols-2 gap-2">
            {sampleWorkplaces.map((w, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectWorkplace(w)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  workplaceDomain === w.domain
                    ? "bg-[#121316] text-white border-[#121316] font-medium shadow-xs"
                    : "bg-[#FAF9F5] text-[#121316] border-black/[0.06] hover:bg-black/[0.04]"
                }`}
              >
                <p className="font-semibold truncate">{w.name}</p>
                <p className={`text-[10px] font-mono truncate ${workplaceDomain === w.domain ? "text-white/70" : "text-[#8F959E]"}`}>
                  @{w.domain}
                </p>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleDecrypt} className="space-y-3">
          {/* Encrypted Group Code */}
          <div>
            <label className="block font-semibold text-[#5F6368] mb-1">Admin's Encrypted Group Code</label>
            <input
              type="text"
              value={encryptedCode}
              onChange={(e) => setEncryptedCode(e.target.value)}
              className="v-input font-mono text-[11px]"
              required
            />
          </div>

          {/* User Workplace Email Verification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block font-semibold text-[#5F6368] mb-1">Your Workplace Email</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="you@company.com"
                className="v-input text-xs"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-[#5F6368] mb-1">Admin Community Domain</label>
              <input
                type="text"
                value={workplaceDomain}
                onChange={(e) => setWorkplaceDomain(e.target.value)}
                placeholder="company.com"
                className="v-input text-xs font-mono"
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {decryptionStep !== "decrypted" && (
            <div className="pt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-pill-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDecrypting}
                className="btn-pill-primary text-xs px-5 py-2.5 flex items-center gap-1.5"
              >
                {isDecrypting ? (
                  <>
                    <KeyRound className="w-3.5 h-3.5 animate-spin text-[#E9B949]" />
                    <span>
                      {decryptionStep === "verifying_keys" ? "Verifying Domain Keys..." : "Initiating RPC Node..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-[#E9B949]" />
                    <span>Decrypt with Workplace Key</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>

        {/* Successfully Decrypted Section */}
        {decryptedCircle && decryptionStep === "decrypted" && (
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-300 space-y-3 anim-fade-in">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Decryption Successful · Public Key Verified
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                MST RPC: Active (91562037)
              </span>
            </div>

            {/* Decrypted Private Block Details */}
            <div className="p-3 rounded-xl bg-white border border-emerald-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#5F6368]">Circle Name</span>
                <span className="font-bold text-[#121316] font-display">{decryptedCircle.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5F6368]">Total Members Allowed [Private]</span>
                <span className="font-semibold text-[#121316] font-mono">{decryptedCircle.memberCount} Participants</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5F6368]">Term of Transaction [Private]</span>
                <span className="font-semibold text-[#121316] font-mono">{decryptedCircle.termMonths} Months</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#5F6368]">Monthly Deposit [Private]</span>
                <span className="font-bold text-emerald-700 font-display tabular-nums">
                  {formatRawINR(decryptedCircle.installmentINR)} / month
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-black/[0.05] text-[11px]">
                <span className="text-[#8F959E]">Admin Ledger Control</span>
                <span className="text-[#5F6368] font-mono">{decryptedCircle.adminAddress.substring(0, 10)}... (Can step down)</span>
              </div>
            </div>

            {/* Bridgekey Wallet Initiation Note */}
            <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-black/[0.06] text-[11px] text-[#5F6368] flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-[#E9B949] flex-shrink-0" />
              <span>Bridgekey Wallet initialized public/private key & RPC connection to MST Blockchain.</span>
            </div>

            <div className="pt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-pill-secondary text-xs px-4 py-2"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirmJoin}
                className="btn-pill-primary text-xs px-5 py-2.5 flex items-center gap-1.5"
              >
                <span>Join Decrypted Community Circle</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
