import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, AlertTriangle, Loader2 } from "lucide-react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function Card({ className, children }) {
  return <div className={className}>{children}</div>;
}

export default function SecurityTab() {
  const router = useRouter();
  const supabase = createClient();

  const [userEmail, setUserEmail] = useState("");
  
  // Password Update States
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);

  // Session States
  const [sessionSaving, setSessionSaving] = useState(false);

  // Deletion States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    async function fetchUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.email) {
          setUserEmail(user.email);
        }
      } catch (err) {
        console.error("Failed to fetch user email:", err);
      }
    }
    fetchUser();
  }, [supabase]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (!newPwd) {
      setPwdError("Please enter a new password.");
      return;
    }
    if (newPwd.length < 6) {
      setPwdError("Password must be at least 6 characters long.");
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdError("Passwords do not match.");
      return;
    }

    setPwdSaving(true);
    try {
      const response = await fetch("/api/auth/security/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPwd }),
      });

      const data = await response.json();

      if (response.ok) {
        setPwdSuccess("Password updated successfully! Logging out...");
        setNewPwd("");
        setConfirmPwd("");
        setTimeout(async () => {
          await supabase.auth.signOut();
          router.push("/login?password_updated=true");
        }, 1500);
      } else {
        setPwdError(data.error || "Failed to update password.");
      }
    } catch (err) {
      console.error("Password update error:", err);
      setPwdError("An unexpected error occurred.");
    } finally {
      setPwdSaving(false);
    }
  };

  const handleLogoutOthers = async () => {
    setSessionSaving(true);
    try {
      const res = await fetch("/api/auth/logout-others", {
        method: "POST",
      });
      if (res.ok) {
        alert("All other active sessions terminated successfully!");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to terminate other sessions.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setSessionSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/customer/account", {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        await supabase.auth.signOut();
        router.push("/?deleted=true");
      } else {
        setDeleteError(data.error || "Failed to delete account.");
        setIsDeleting(false);
      }
    } catch (err) {
      console.error("Account deletion error:", err);
      setDeleteError("An unexpected connection error occurred.");
      setIsDeleting(false);
    }
  };

  const isDeleteConfirmed = confirmText === userEmail || confirmText === "DELETE";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Password & Security Card */}
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
            id="newPwd"
            type="password"
            label="New Password"
            value={newPwd}
            onChange={e => setNewPwd(e.target.value)}
            placeholder="•••••••• (Min 6 characters)"
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
            className="mt-2 text-brand-dark flex items-center justify-center gap-2"
          >
            {pwdSaving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</>
            ) : (
              "Update password"
            )}
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
          onClick={handleLogoutOthers}
          disabled={sessionSaving}
          className="text-brand-dark flex items-center justify-center gap-2"
        >
          {sessionSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Logging out...</>
          ) : (
            "Log out of all other devices"
          )}
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
              className="mt-4 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 font-bold transition-all duration-200"
              onClick={() => {
                setConfirmText("");
                setDeleteError("");
                setShowDeleteModal(true);
              }}
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Card>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-brand-border/80 shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-xl font-bold text-brand-dark">Delete Account?</h4>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  This action is permanent. All requests, messages, bookmarks, and logs will be deleted immediately.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3.5 mb-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs font-semibold text-center">
                {deleteError}
              </div>
            )}

            <div className="space-y-4 my-4">
              <p className="text-xs text-brand-muted font-medium">
                To confirm, please type your email <span className="font-semibold text-brand-dark select-all">{userEmail || "your email"}</span> or <span className="font-bold text-red-600">DELETE</span> below:
              </p>
              <Input
                type="text"
                placeholder="Type confirmation text here"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="outline"
                className="text-brand-dark border-brand-border"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteAccount}
                disabled={!isDeleteConfirmed || isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold flex items-center justify-center gap-2 border-none"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
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
