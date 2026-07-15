"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

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
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="text-xs font-sans font-semibold uppercase tracking-wider text-brand-dark/80 select-none">
          {label} {required && <span className="text-brand-primary">*</span>}
        </label>
      )}
      <div className="relative w-full">
        <input
          id={id}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          className={`w-full px-4 py-3 pr-10 rounded-2xl bg-white/70 border ${
            error 
              ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" 
              : "border-brand-border/80 focus:border-brand-primary focus:ring-brand-primary/20"
          } text-brand-dark placeholder-brand-muted/70 text-sm transition-all duration-300 outline-none focus:ring-4`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-dark transition-colors focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <span className="text-xs text-red-500 font-medium mt-0.5 pl-1">
          {error}
        </span>
      )}
    </div>
  );
}
