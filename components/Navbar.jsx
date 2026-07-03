"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 w-full px-6 py-4 md:px-12"
    >
      <div className="mx-auto max-w-7xl">
        <nav className="glass rounded-full px-6 py-3 flex items-center justify-between shadow-sm transition-all duration-300">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <span className="font-serif text-2xl font-bold tracking-tight text-brand-dark transition-colors duration-300 group-hover:text-brand-primary">
              CraftConnect<span className="text-brand-primary">.</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#discover" className="text-sm font-medium text-brand-muted hover:text-brand-dark transition-colors">
              Discover
            </a>
            <a href="#ai-features" className="text-sm font-medium text-brand-muted hover:text-brand-dark transition-colors">
              AI Tools
            </a>
            <a href="#collaboration" className="text-sm font-medium text-brand-muted hover:text-brand-dark transition-colors">
              Collaborations
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-brand-muted hover:text-brand-dark transition-colors">
              How It Works
            </a>
            <a href="#faq" className="text-sm font-medium text-brand-muted hover:text-brand-dark transition-colors">
              FAQ
            </a>
          </div>

          {/* CTAs */}
          <div className="hidden md:flex items-center gap-4">
            <a
              href="#discover"
              className="text-sm font-medium text-brand-dark hover:text-brand-primary transition-colors px-4 py-2"
            >
              Explore Brands
            </a>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/login"
                className="inline-flex items-center gap-2 bg-brand-dark text-cream hover:bg-brand-primary transition-colors text-sm font-medium px-5 py-2.5 rounded-full shadow-sm"
              >
                Join Platform
                <ArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-brand-dark hover:text-brand-primary transition-colors focus:outline-none"
            aria-label="Toggle Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="absolute left-6 right-6 mt-2 p-6 glass rounded-3xl shadow-xl flex flex-col gap-6 md:hidden"
        >
          <a
            href="#discover"
            onClick={() => setIsOpen(false)}
            className="text-lg font-medium text-brand-dark hover:text-brand-primary transition-colors border-b border-brand-border/40 pb-2"
          >
            Discover
          </a>
          <a
            href="#ai-features"
            onClick={() => setIsOpen(false)}
            className="text-lg font-medium text-brand-dark hover:text-brand-primary transition-colors border-b border-brand-border/40 pb-2"
          >
            AI Tools
          </a>
          <a
            href="#collaboration"
            onClick={() => setIsOpen(false)}
            className="text-lg font-medium text-brand-dark hover:text-brand-primary transition-colors border-b border-brand-border/40 pb-2"
          >
            Collaborations
          </a>
          <a
            href="#how-it-works"
            onClick={() => setIsOpen(false)}
            className="text-lg font-medium text-brand-dark hover:text-brand-primary transition-colors border-b border-brand-border/40 pb-2"
          >
            How It Works
          </a>
          <a
            href="#faq"
            onClick={() => setIsOpen(false)}
            className="text-lg font-medium text-brand-dark hover:text-brand-primary transition-colors border-b border-brand-border/40 pb-2"
          >
            FAQ
          </a>

          <div className="flex flex-col gap-3 mt-4">
            <a
              href="#discover"
              onClick={() => setIsOpen(false)}
              className="text-center font-medium text-brand-dark border border-brand-border hover:bg-white/50 transition-colors py-3 rounded-full"
            >
              Explore Brands
            </a>
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="text-center font-medium bg-brand-primary hover:bg-brand-secondary text-white py-3 rounded-full transition-colors"
            >
              Join Platform
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}
