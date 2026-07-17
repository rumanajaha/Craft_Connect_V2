import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { Loader2, AlertTriangle, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SecurityTab() {
  const router = useRouter();
  const supabase = createClient();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" }); // type: success | error

  // Deletion States
  const [userEmail, setUserEmail] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      setMessage({ text: "Please enter a new password.", type: "error" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: "Password must be at least 6 characters long.", type: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setIsUpdating(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await fetch("/api/auth/security/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: "Password updated successfully! Logging out...", type: "success" });
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(async () => {
          await supabase.auth.signOut();
          router.push("/login?password_updated=true");
        }, 1500);
      } else {
        setMessage({ text: data.error || "Failed to update password.", type: "error" });
      }
    } catch (err) {
      console.error("Password update error:", err);
      setMessage({ text: "An unexpected error occurred.", type: "error" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError("");

    try {
      const response = await fetch("/api/brand/account", {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        // Sign out client-side and redirect
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
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Password & Security Card */}
      <div className="bg-white rounded-2xl border border-brand-border/50 p-6">
        <h3 className="font-serif text-lg font-bold text-brand-dark mb-1">Password & Security</h3>
        <p className="text-xs text-brand-muted mb-6">Update your password to keep your brand account secure.</p>
        
        <div className="space-y-4 max-w-md">
          {message.text && (
            <div className={`p-3.5 rounded-2xl text-xs font-semibold text-center border ${
              message.type === "success" 
                ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                : "bg-red-50 text-red-600 border-red-100"
            }`}>
              {message.text}
            </div>
          )}

          <Input 
            type="password" 
            label="New Password" 
            placeholder="••••••••" 
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
          />
          <Input 
            type="password" 
            label="Confirm New Password" 
            placeholder="••••••••" 
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
          <Button 
            variant="outline" 
            className="mt-2 text-brand-dark"
            onClick={handleUpdatePassword}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
            ) : (
              "Update Password"
            )}
          </Button>
        </div>
      </div>

      {/* Danger Zone Card */}
      <div className="bg-red-50/30 rounded-2xl border border-red-200/60 p-6">
        <div className="flex items-center gap-2 mb-2 text-red-600">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <h3 className="font-serif text-lg font-bold">Danger Zone</h3>
        </div>
        <p className="text-xs text-brand-muted mb-6">
          This permanently deletes your brand profile, products, and collaboration history. This cannot be undone.
        </p>

        <Button
          variant="outline"
          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-bold transition-all duration-200"
          onClick={() => {
            setConfirmText("");
            setDeleteError("");
            setIsModalOpen(true);
          }}
        >
          Delete Account
        </Button>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-brand-border/80 shadow-2xl p-6 animate-in zoom-in-95 duration-200 text-left">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-100 text-red-600 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-xl font-bold text-brand-dark">Delete Account?</h4>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  This action is permanent. All products, messages, brand listings, and logs will be deleted immediately.
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
                To confirm, please type your email <span className="font-semibold text-brand-dark select-all">{userEmail}</span> or <span className="font-bold text-red-600">DELETE</span> below:
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
                onClick={() => setIsModalOpen(false)}
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
