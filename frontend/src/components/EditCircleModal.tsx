import React, { useState, useEffect } from "react";
import { X, Shield, Plus, Trash2, CheckCircle2, Save, Key } from "lucide-react";
import { VerificationService, CircleRegistryEntry } from "../services/verificationService";
import { extractCircleAddress } from "./JoinCircleView";

interface EditCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  circle: CircleRegistryEntry | null;
  account: string;
  isCircleStarted: boolean;
  onSuccess: (msg: string) => void;
}

export const EditCircleModal: React.FC<EditCircleModalProps> = ({
  isOpen,
  onClose,
  circle,
  account,
  isCircleStarted,
  onSuccess,
}) => {
  const [name, setName] = useState("");
  const [minWalletAmt, setMinWalletAmt] = useState("");
  const [allowedKeys, setAllowedKeys] = useState<string[]>([]);
  const [newKeyInput, setNewKeyInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (circle) {
      setName(circle.name || "");
      setMinWalletAmt(circle.minWalletAmt || "");
      const clean = extractCircleAddress(circle.address);
      VerificationService.fetchAllowedMembers(clean).then((keys) => {
        setAllowedKeys(keys || []);
      });
    }
  }, [circle]);

  if (!isOpen || !circle) return null;

  const handleAddKey = () => {
    const trimmed = newKeyInput.trim();
    if (!trimmed) return;
    const cleanKey = extractCircleAddress(trimmed);
    if (!cleanKey) return;
    if (allowedKeys.some((k) => k.toLowerCase() === cleanKey.toLowerCase())) {
      setNewKeyInput("");
      return;
    }
    setAllowedKeys([...allowedKeys, cleanKey]);
    setNewKeyInput("");
  };

  const handleRemoveKey = (keyToRemove: string) => {
    setAllowedKeys(allowedKeys.filter((k) => k.toLowerCase() !== keyToRemove.toLowerCase()));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCircleStarted) {
      alert("This circle has already started. Circle parameters are locked.");
      return;
    }

    setIsSaving(true);
    const cleanCircle = extractCircleAddress(circle.address);

    try {
      // 1. Update basic circle info
      await VerificationService.updateCircle(cleanCircle, {
        name: name.trim() || circle.name,
        minWalletAmt: minWalletAmt.trim(),
      });

      // 2. Sync allowed keys: add all listed
      for (const key of allowedKeys) {
        await VerificationService.addAllowedMember(cleanCircle, key, account);
      }

      onSuccess("Savings Circle configuration updated successfully!");
      onClose();
    } catch (err: any) {
      console.error("Error updating circle:", err);
      alert("Failed to update circle configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-neutral-950 border border-neutral-900 max-w-lg w-full p-6 sm:p-8 rounded-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-neutral-400 hover:text-white bg-transparent border-none cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-red-500">
            <Shield className="w-4 h-4" />
            <span>Manage & Edit Circle</span>
          </div>
          <h2 className="text-xl font-bold text-white font-display">
            Edit Circle Settings
          </h2>
          <p className="text-xs text-neutral-400">
            {isCircleStarted
              ? "All members have contributed and the circle has started. Settings are locked."
              : "Update circle name, minimum wallet requirement, and allowed member public keys."}
          </p>
        </div>

        {isCircleStarted ? (
          <div className="p-4 bg-red-950/20 rounded-xl space-y-2 text-xs">
            <p className="font-semibold text-red-400">🔒 Parameters are Immutable</p>
            <p className="text-neutral-400">
              The circle has already commenced with active contributions. To protect member funds, all configuration parameters and participant access lists are permanently locked.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* Circle Name */}
            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">Circle Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black rounded-lg px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none"
              />
            </div>

            {/* Min Wallet Requirement */}
            <div>
              <label className="block font-semibold text-neutral-300 mb-1.5">
                Min Wallet Requirement (₹)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={minWalletAmt}
                onChange={(e) => setMinWalletAmt(e.target.value)}
                placeholder="Optional reserve balance requirement"
                className="w-full bg-black rounded-lg px-4 py-3 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none"
              />
            </div>

            {/* Allowed Public Keys Whitelist */}
            <div className="space-y-2.5 pt-2 border-t border-neutral-900">
              <label className="block font-semibold text-neutral-300">
                Allowed Public Keys (Group Link Access)
              </label>
              <p className="text-[11px] text-neutral-500">
                Only users with these public keys can view and join this group on localhost:3000/grouplink.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste BridgeKey or 0x... Public Key"
                  value={newKeyInput}
                  onChange={(e) => setNewKeyInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddKey();
                    }
                  }}
                  className="flex-1 bg-black rounded-lg px-3.5 py-2.5 text-xs font-mono text-white placeholder:text-neutral-600 focus:outline-none focus:ring-1 focus:ring-red-500 border-none"
                />
                <button
                  type="button"
                  onClick={handleAddKey}
                  className="px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs flex items-center gap-1.5 border-none cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-red-500" />
                  <span>Add</span>
                </button>
              </div>

              {/* Tags / List of Keys */}
              {allowedKeys.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1 max-h-40 overflow-y-auto">
                  {allowedKeys.map((key) => {
                    const isInit = circle.initializer && circle.initializer.toLowerCase() === key.toLowerCase();
                    return (
                      <span
                        key={key}
                        className="px-2.5 py-1.5 rounded-lg bg-black text-neutral-300 font-mono text-[11px] flex items-center gap-1.5"
                      >
                        <Key className="w-3 h-3 text-red-500" />
                        <span>{key.substring(0, 6)}...{key.substring(key.length - 4)}</span>
                        {isInit ? (
                          <span className="text-[9px] font-sans text-red-400 font-semibold px-1 rounded bg-red-950/40">
                            Initializer
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveKey(key)}
                            className="text-neutral-500 hover:text-red-400 p-0.5 bg-transparent border-none cursor-pointer ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-900">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg text-neutral-400 hover:text-white text-xs font-semibold bg-transparent border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-primary py-2.5 px-5 text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
