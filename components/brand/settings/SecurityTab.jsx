import React from "react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export default function SecurityTab() {
  return (
    <div className="bg-white rounded-2xl border border-brand-border/50 p-6 animate-in fade-in duration-300">
      <h3 className="font-serif text-lg font-bold text-brand-dark mb-1">Password & Security</h3>
      <p className="text-xs text-brand-muted mb-6">Update your password to keep your brand account secure.</p>
      
      <div className="space-y-4 max-w-md">
        <Input type="password" label="Current Password" placeholder="••••••••" />
        <Input type="password" label="New Password" placeholder="••••••••" />
        <Input type="password" label="Confirm New Password" placeholder="••••••••" />
        <Button variant="outline" className="mt-2 text-brand-dark">Update Password</Button>
      </div>
    </div>
  );
}
