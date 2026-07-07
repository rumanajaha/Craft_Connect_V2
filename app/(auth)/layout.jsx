"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuthLayout({ children }) {
  const pathname = usePathname();

  
  const isSignup = pathname?.includes("signup");
  
  const bgImage = isSignup
    ? "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1200&auto=format&fit=crop&q=80" 
    : "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=1200&auto=format&fit=crop&q=80"; 

  const bgAlt = isSignup
    ? "Craft ceramics displayed on a rustic wooden shelf"
    : "Artisan hands shaping raw clay on a spinning pottery wheel";

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-8 lg:p-12 bg-[#FAF7F0] overflow-hidden">
      
      
      <div className="absolute -top-32 -left-32 w-[550px] h-[550px] rounded-full bg-[#81B29A]/5 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-[600px] h-[600px] rounded-full bg-[#E07A5F]/4 blur-[140px] pointer-events-none" />
      <div className="absolute top-[35%] right-[5%] w-[400px] h-[400px] rounded-full bg-[#81B29A]/4 blur-[100px] pointer-events-none" />

      
      <div className="auth-container bg-white w-full max-w-4xl rounded-3xl shadow-[0_16px_40px_rgba(43,43,43,0.06)] overflow-hidden grid grid-cols-1 md:grid-cols-12 border border-brand-border/40 z-10">
        
        
        <div className="col-span-1 md:col-span-7 flex flex-col justify-between p-6 sm:p-8">
          
          
          <div className="mb-4">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <span className="font-serif text-2xl font-bold tracking-tight text-brand-dark transition-colors duration-300 group-hover:text-brand-primary">
                CraftConnect<span className="text-brand-primary">.</span>
              </span>
            </Link>
          </div>

          
          <div className="w-full">
            {children}
          </div>

          
          <div className="mt-5 pt-4 border-t border-brand-border/30 text-center md:text-left">
            <p className="text-[10px] text-brand-muted">
              By continuing, you agree to CraftConnect's{" "}
              <a href="#" className="hover:text-brand-primary underline underline-offset-2 transition-colors">Terms of Service</a>
              {" "}and{" "}
              <a href="#" className="hover:text-brand-primary underline underline-offset-2 transition-colors">Privacy Policy</a>.
            </p>
          </div>
        </div>

        
        <div className="relative h-[220px] md:h-auto w-full col-span-1 md:col-span-5 order-first md:order-last overflow-hidden">
          <Image
            src={bgImage}
            alt={bgAlt}
            fill
            sizes="(max-width: 768px) 100vw, 40vw"
            priority
            unoptimized
            className="object-cover transition-transform duration-700 hover:scale-102"
          />
          
          <div className="absolute top-6 right-6 bg-white/70 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-bold text-brand-dark tracking-widest uppercase shadow-sm select-none">
            EST. 2026
          </div>
        </div>

      </div>
    </main>
  );
}
