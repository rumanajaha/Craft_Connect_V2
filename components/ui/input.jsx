"use client";

import React from "react";

export default function Input({
  label,
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  required = false,
  className = "",
  ...props
}) {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-sans font-semibold uppercase tracking-wider text-brand-dark/80 select-none">
          {label} {required && <span className="text-brand-primary">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-4 py-3 rounded-2xl bg-white/70 border ${
          error 
            ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" 
            : "border-brand-border/80 focus:border-brand-primary focus:ring-brand-primary/20"
        } text-brand-dark placeholder-brand-muted/70 text-sm transition-all duration-300 outline-none focus:ring-4`}
        {...props}
      />
      {error && (
        <span className="text-xs text-red-500 font-medium mt-0.5 pl-1">
          {error}
        </span>
      )}
    </div>
  );
}
