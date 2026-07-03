import React from "react";
import { Clock, MessageCircle, CheckCheck } from "lucide-react";

const STATUS_CONFIG = {
  pending:   { label: "Pending",   bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   Icon: Clock },
  responded: { label: "Responded", bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200", Icon: MessageCircle },
  closed:    { label: "Closed",    bg: "bg-gray-100",   text: "text-gray-500",    border: "border-gray-200",    Icon: CheckCheck },
};

export default function RequestStatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const { label, bg, text, border, Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${bg} ${text} ${border}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}
