"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";


function Badge({ children, variant = "filled" }) {
  const base =
    "inline-block text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full whitespace-nowrap leading-tight";
  const variants = {
    filled: "bg-brand-primary/15 text-brand-primary",
    outline: "bg-transparent border border-brand-border text-brand-muted",
  };
  return <span className={`${base} ${variants[variant] || variants.filled}`}>{children}</span>;
}


export default function RoadmapCard({ title, description, items = [] }) {
  const itemCount = items.length || 1;

  
  const dotColorClass = (status) =>
    status === "done" || status === "in-progress"
      ? "bg-brand-primary border-brand-primary shadow-[0_0_0_4px_rgba(255,89,0,0.12)]"
      : "bg-brand-border border-brand-border";

  const innerDotClass = (status) =>
    status === "done" || status === "in-progress"
      ? "bg-white"
      : "bg-cream";

  const badgeVariant = (status) =>
    status === "done" || status === "in-progress" ? "filled" : "outline";

  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.5,
        ease: [0.16, 1, 0.3, 1],
      },
    }),
  };

  return (
    <Card className="w-full overflow-visible">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="pt-2 pb-2">
        
        <div className="relative">

          
          
          <div
            className="
              hidden md:block
              absolute top-[18px] left-0 right-0 h-[2px]
              bg-gradient-to-r from-brand-primary via-brand-accent to-brand-border
            "
            aria-hidden="true"
          />

          
          <div
            className="
              block md:hidden
              absolute top-0 bottom-0 left-[17px] w-[2px]
              bg-gradient-to-b from-brand-primary via-brand-accent to-brand-border
            "
            aria-hidden="true"
          />

          
          <div className="flex flex-col md:flex-row">
            {items.map((item, index) => (
              <motion.div
                key={index}
                className="flex-1 relative"
                style={{ minWidth: 0, width: `${100 / itemCount}%` }}
                custom={index}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
              >
                
                <div className="flex md:hidden items-start gap-4 pb-8 last:pb-0">
                  
                  <motion.div
                    className={`relative z-10 w-[36px] h-[36px] shrink-0 rounded-full border-2 flex items-center justify-center cursor-default ${dotColorClass(item.status)}`}
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <span className={`w-2 h-2 rounded-full ${innerDotClass(item.status)}`} />
                  </motion.div>

                  
                  <div className="pt-1">
                    <Badge variant={badgeVariant(item.status)}>{item.label}</Badge>
                    <h4 className="font-serif text-base font-semibold text-brand-dark mt-1.5 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-brand-muted leading-relaxed mt-1">
                      {item.description}
                    </p>
                  </div>
                </div>

                
                <div className="hidden md:flex flex-col items-center text-center px-2">
                  
                  <motion.div
                    className={`relative z-10 w-[36px] h-[36px] rounded-full border-2 flex items-center justify-center cursor-default ${dotColorClass(item.status)}`}
                    whileHover={{ scale: 1.2 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  >
                    <span className={`w-2 h-2 rounded-full ${innerDotClass(item.status)}`} />
                  </motion.div>

                  
                  <div className="mt-5 max-w-[200px]">
                    <Badge variant={badgeVariant(item.status)}>{item.label}</Badge>
                    <h4 className="font-serif text-sm font-semibold text-brand-dark mt-2 leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-brand-muted leading-relaxed mt-1.5">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
