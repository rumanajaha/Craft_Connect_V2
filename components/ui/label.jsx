import React from "react";

export default function Label({ htmlFor, children, className = "", ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`text-xs font-sans font-semibold uppercase tracking-wider text-brand-dark/80 select-none ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
