"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, ShieldCheck, Video } from "lucide-react";

export default function RoleSelector({ selectedRole, onSelectRole }) {
  const roles = [
    {
      id: "customer",
      title: "Customer",
      description: "Discover and follow brands",
      icon: User,
      color: "from-orange-500/10 to-brand-primary/10",
      borderSelected: "border-brand-primary ring-2 ring-brand-primary/20",
      iconColor: "text-brand-primary",
    },
    {
      id: "brand",
      title: "Brand Owner",
      description: "Build your brand's presence",
      icon: ShieldCheck,
      color: "from-amber-500/10 to-brand-secondary/10",
      borderSelected: "border-brand-secondary ring-2 ring-brand-secondary/20",
      iconColor: "text-brand-secondary",
    },
    {
      id: "creator",
      title: "Creator",
      description: "Find brand collaborations",
      icon: Video,
      color: "from-red-500/10 to-brand-light/10",
      borderSelected: "border-brand-light ring-2 ring-brand-light/20",
      iconColor: "text-brand-light",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
      {roles.map((role) => {
        const Icon = role.icon;
        const isSelected = selectedRole === role.id;

        return (
          <motion.button
            key={role.id}
            type="button"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectRole(role.id)}
            className={`flex flex-row sm:flex-col items-start sm:items-center gap-2.5 sm:gap-2 p-3 rounded-2xl text-left sm:text-center transition-all duration-300 sm:justify-between sm:h-full min-h-[70px] sm:min-h-[110px] ${
              isSelected
                ? `bg-white shadow-md border-2 ${role.borderSelected}`
                : "bg-white/50 border border-brand-border/60 hover:bg-white/80 hover:shadow-sm"
            }`}
          >
            {/* Left/Top: Icon container */}
            <div className={`p-2 rounded-xl bg-gradient-to-br shrink-0 ${role.color} ${role.iconColor}`}>
              <Icon className="w-4 h-4" />
            </div>

            {/* Middle: Text content */}
            <div className="flex-1 min-w-0 sm:w-full">
              <h4 className="font-serif font-bold text-brand-dark text-xs sm:text-sm leading-snug">
                {role.title}
              </h4>
              <p className="text-[10px] text-brand-muted mt-0.5 leading-normal sm:line-clamp-2">
                {role.description}
              </p>
            </div>

            {/* Right/Bottom: Selection circle */}
            <div className="flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${
                isSelected ? "border-brand-primary" : "border-brand-border"
              }`}>
                {isSelected && (
                  <motion.div
                    layoutId="selectedIndicator"
                    className="w-1.5 h-1.5 rounded-full bg-brand-primary"
                  />
                )}
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
