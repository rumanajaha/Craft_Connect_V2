import React, { useState } from "react";
import { ShieldAlert } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

function Card({ className, children }) {
  return <div className={className}>{children}</div>;
}

export default function SecurityTab() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!currentPwd || !newPwd || !confirmPwd) {
      setPwdError("Please fill in all password fields.");
      return;
    }
    if (newPwd.length < 8) {
      setPwdError("New password must be at least 8 characters long.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("Passwords do not match.");
      return;
    }

    setPwdSaving(true);
    setTimeout(() => {
      setPwdSaving(false);
      setPwdSuccess("Password updated successfully!");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Change Password Form */}
      <Card className="p-6 bg-white border border-brand-border/50 shadow-sm rounded-2xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 pb-3 border-b border-brand-border/30 mb-5">
          Change Password
        </h3>

        {pwdError && (
          <div className="px-4 py-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium mb-4">
            {pwdError}
          </div>
        )}
        {pwdSuccess && (
          <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium mb-4">
            ✓ {pwdSuccess}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-lg">
          <Input
            id="currentPwd"
            type="password"
            label="Current Password"
            value={currentPwd}
            onChange={e => setCurrentPwd(e.target.value)}
            placeholder="••••••••"
          />
          <Input
            id="newPwd"
            type="password"
            label="New Password"
            value={newPwd}
            onChange={e => setNewPwd(e.target.value)}
            placeholder="•••••••• (Min 8 characters)"
          />
          <Input
            id="confirmPwd"
            type="password"
            label="Confirm New Password"
            value={confirmPwd}
            onChange={e => setConfirmPwd(e.target.value)}
            placeholder="••••••••"
          />

          <Button
            type="submit"
            variant="outline"
            size="md"
            disabled={pwdSaving}
            className="mt-2 text-brand-dark"
          >
            {pwdSaving ? "Updating..." : "Update password"}
          </Button>
        </form>
      </Card>

      {/* Session Management */}
      <Card className="p-6 bg-white border border-brand-border/50 shadow-sm rounded-2xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 pb-3 border-b border-brand-border/30 mb-4">
          Session Management
        </h3>
        <p className="text-sm text-brand-muted mb-4">
          If you suspect unauthorized access, you can terminate all other active web sessions immediately.
        </p>
        <Button
          variant="outline"
          onClick={() => alert("All other active sessions terminated successfully!")}
          className="text-brand-dark"
        >
          Log out of all other devices
        </Button>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 bg-red-50/20 border border-red-200/60 shadow-sm rounded-2xl">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">
              Danger Zone
            </h3>
            <p className="text-xs text-red-700/80 mt-1">
              Delete your account permanently. All custom requests, message history, and bookmarks will be wiped.
            </p>
            <Button
              variant="outline"
              className="mt-4 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              onClick={() => alert("Account deletion requested. This is a frontend demo placeholder.")}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Card>

    </div>
  );
}
