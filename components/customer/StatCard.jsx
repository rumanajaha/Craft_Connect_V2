import React from "react";

export default function StatCard({ label, value, icon: Icon, accent = false }) {
  return (
    <div className={`rounded-2xl p-5 border flex items-center gap-4 ${
      accent
        ? "bg-brand-primary text-white border-brand-primary shadow-md shadow-brand-primary/20"
        : "bg-white text-brand-dark border-brand-border/50 shadow-sm"
    }`}>
      {Icon && (
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          accent ? "bg-white/20" : "bg-brand-primary/10"
        }`}>
          <Icon className={`w-5 h-5 ${accent ? "text-white" : "text-brand-primary"}`} />
        </div>
      )}
      <div>
        <p className={`text-3xl font-serif font-bold leading-none ${accent ? "text-white" : "text-brand-dark"}`}>
          {value}
        </p>
        <p className={`text-xs mt-1 font-medium ${accent ? "text-white/75" : "text-brand-muted"}`}>
          {label}
        </p>
      </div>
    </div>
  );
}
