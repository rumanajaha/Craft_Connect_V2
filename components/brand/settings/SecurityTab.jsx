import React, { useState } from "react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function SecurityTab() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" }); // type: success | error

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
      const response = await fetch("/api/brand/security/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: "Password updated successfully!", type: "success" });
        setNewPassword("");
        setConfirmPassword("");
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

  return (
    <div className="bg-white rounded-2xl border border-brand-border/50 p-6 animate-in fade-in duration-300">
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
  );
}
