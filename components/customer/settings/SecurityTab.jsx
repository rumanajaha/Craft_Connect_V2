import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, X, Loader2 } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function Card({ className, children }) {
  return <div className={className}>{children}</div>;
}

export default function SecurityTab() {
  const router = useRouter();
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  const [loggingOutOthers, setLoggingOutOthers] = useState(false);
  const [logoutStatus, setLogoutStatus] = useState("");
  const [logoutError, setLogoutError] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleUpdatePassword = async (e) => {
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
    try {
      const res = await fetch("/api/auth/security/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update password.");
      }
      setPwdSuccess("Password updated successfully!");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err) {
      setPwdError(err.message || "Failed to update password.");
    } finally {
      setPwdSaving(false);
    }
  };

  const handleLogoutOthers = async () => {
    setLoggingOutOthers(true);
    setLogoutStatus("");
    setLogoutError("");
    try {
      const res = await fetch("/api/auth/logout-others", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sign out other devices.");
      }
      setLogoutStatus("All other active sessions have been signed out.");
    } catch (err) {
      setLogoutError(err.message || "Failed to sign out other devices.");
    } finally {
      setLoggingOutOthers(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE" || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const res = await fetch("/api/customer/account", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account.");
      }
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch (_) {}
      router.push("/login");
      router.refresh();
    } catch (err) {
      setDeleteError(err.message || "Failed to delete account.");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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
            onChange={(e) => setCurrentPwd(e.target.value)}
            placeholder="••••••••"
          />
          <Input
            id="newPwd"
            type="password"
            label="New Password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            placeholder="•••••••• (Min 8 characters)"
          />
          <Input
            id="confirmPwd"
            type="password"
            label="Confirm New Password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
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

      <Card className="p-6 bg-white border border-brand-border/50 shadow-sm rounded-2xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark/70 pb-3 border-b border-brand-border/30 mb-4">
          Session Management
        </h3>
        <p className="text-sm text-brand-muted mb-4">
          If you suspect unauthorized access, you can terminate all other active web sessions immediately.
        </p>
        {logoutStatus && (
          <div className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium mb-4">
            ✓ {logoutStatus}
          </div>
        )}
        {logoutError && (
          <div className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium mb-4">
            {logoutError}
          </div>
        )}
        <Button
          variant="outline"
          disabled={loggingOutOthers}
          onClick={handleLogoutOthers}
          className="text-brand-dark"
        >
          {loggingOutOthers ? "Signing out other devices..." : "Log out of all other devices"}
        </Button>
      </Card>

      <Card className="p-6 bg-red-50/20 border border-red-200/60 shadow-sm rounded-2xl">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide">
              Danger Zone
            </h3>
            <p className="text-xs text-red-700/80 mt-1">
              Delete your account permanently. All custom requests, ratings, notifications, and bookmarks will be wiped.
            </p>
            <Button
              variant="outline"
              className="mt-4 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              onClick={() => {
                setDeleteConfirmText("");
                setDeleteError("");
                setShowDeleteModal(true);
              }}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Card>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 relative border border-red-200/60">
            <button
              onClick={() => !deleting && setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-brand-muted hover:text-brand-dark"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-red-600">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h3 className="font-serif text-xl font-bold text-brand-dark">Delete Account</h3>
            </div>

            <p className="text-xs text-brand-muted leading-relaxed">
              This action is permanent and cannot be undone. Type{" "}
              <span className="font-mono font-bold text-red-600">DELETE</span> below to confirm.
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              disabled={deleting}
              className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
            />

            {deleteError && (
              <p className="text-xs text-red-600 font-medium">{deleteError}</p>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 justify-center text-brand-dark"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 justify-center bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                disabled={deleteConfirmText !== "DELETE" || deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                  </span>
                ) : (
                  "Permanently Delete"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
