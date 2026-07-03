"use client";

import React, { useState } from "react";
import Image from "next/image";
import Button from "@/components/ui/button";
import { Check, X, Gift, DollarSign, RefreshCw, MessageSquare } from "lucide-react";

export default function CollabRequestRow({ pitch, onAccept, onReject }) {
  const [status, setStatus] = useState(pitch.status || "pending");

  const getCompensationIcon = (type) => {
    switch (type) {
      case "gifting": return <Gift className="w-3.5 h-3.5" />;
      case "paid": return <DollarSign className="w-3.5 h-3.5" />;
      case "barter": return <RefreshCw className="w-3.5 h-3.5" />;
      case "discuss": return <MessageSquare className="w-3.5 h-3.5" />;
      default: return <MessageSquare className="w-3.5 h-3.5" />;
    }
  };

  const getCompensationColor = (type) => {
    switch (type) {
      case "gifting": return "bg-purple-50 text-purple-700 border-purple-200";
      case "paid": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "barter": return "bg-blue-50 text-blue-700 border-blue-200";
      case "discuss": return "bg-amber-50 text-amber-700 border-amber-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const handleAction = (action) => {
    setStatus(action);
    if (action === "accepted" && onAccept) onAccept(pitch.id);
    if (action === "rejected" && onReject) onReject(pitch.id);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 items-start sm:items-center bg-white border border-brand-border/50 rounded-2xl hover:shadow-sm transition-shadow">
      {/* Creator Info */}
      <div className="flex items-center gap-3 w-full sm:w-1/4 shrink-0">
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-brand-border/40 shrink-0">
          <Image src={pitch.creatorAvatar} alt={pitch.creatorName} fill className="object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-brand-dark truncate">{pitch.creatorName}</p>
          <p className="text-[11px] text-brand-muted">{pitch.date}</p>
        </div>
      </div>

      {/* Compensation Badge */}
      <div className="w-full sm:w-auto shrink-0">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${getCompensationColor(pitch.compensation)}`}>
          {getCompensationIcon(pitch.compensation)}
          {pitch.compensation}
        </div>
      </div>

      {/* Snippet */}
      <div className="flex-1 w-full min-w-0">
        <p className="text-sm text-brand-dark/80 line-clamp-2 leading-relaxed">
          "{pitch.snippet}"
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
        {status === "pending" ? (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAction("rejected")}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <X className="w-4 h-4 mr-1" /> Reject
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleAction("accepted")}
            >
              <Check className="w-4 h-4 mr-1" /> Accept
            </Button>
          </>
        ) : (
          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
            status === "accepted" ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
          }`}>
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
