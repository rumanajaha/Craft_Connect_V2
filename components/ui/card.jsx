import React from "react";

export function Card({ children, className = "", ...props }) {
  return (
    <div className={`glass rounded-3xl shadow-xl p-6 md:p-8 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "", ...props }) {
  return (
    <div className={`flex flex-col space-y-1.5 pb-6 border-b border-brand-border/40 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "", ...props }) {
  return (
    <h3 className={`font-serif text-2xl font-bold tracking-tight text-brand-dark ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "", ...props }) {
  return (
    <p className={`text-xs md:text-sm text-brand-muted mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = "", ...props }) {
  return (
    <div className={`py-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "", ...props }) {
  return (
    <div className={`flex items-center pt-2 ${className}`} {...props}>
      {children}
    </div>
  );
}
