"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus, HelpCircle } from "lucide-react";

const FAQS = [
  {
    id: 1,
    question: "What makes CraftConnect different from Etsy, Shopify, or Amazon?",
    answer: "CraftConnect is not an ecommerce marketplace. We do not charge sales commissions or manage product checkouts. Instead, we are an editorial discovery and collaboration engine. Handmade brands display collections, creators apply for campaign alignments, and customers browse authentic stories. When customers choose to buy, they are redirected to checkout directly on the brand's own storefront."
  },
  {
    id: 2,
    question: "How do creator collaborations work and how are items shipped?",
    answer: "Once a brand and creator match and lock proposal terms (dates, moodboard, deliverables) in our dashboard, the maker ships items from their studio directly to the creator's styling workspace. The creator shoots the creative media, uploads links, and publishes reels to redirect consumers back to the maker's main storefront."
  },
  {
    id: 3,
    question: "Are there platform subscription or integration fees?",
    answer: "Basic discovery is free for makers. We offer premium subscription tiers that grant full access to our AI suite (Brand Story Writer, Product Description generator, and visual matching analysis). Creators can build portfolios and apply for matches completely free."
  },
  {
    id: 4,
    question: "Which types of crafts does CraftConnect support?",
    answer: "We support high-end physical craft disciplines, specifically focused on ceramics, organic skincare and apothecary, textile weaving, handblown glass, metalwork, woodcraft, and design stationery. We do not accept mass-manufactured goods or digital items."
  },
  {
    id: 5,
    question: "How do customers check out and support makers directly?",
    answer: "Every showcase card and creator story page lists a prominent 'Visit Studio Store' button. Clicking it routes customers instantly to the maker's own Shopify, WooCommerce, or custom storefront where they pay standard retail prices without middleman markups."
  }
];

function AccordionItem({ question, answer, isOpen, onClick }) {
  return (
    <div className="border-b border-brand-border/60 py-5">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between text-left focus:outline-none group py-2"
        aria-expanded={isOpen}
      >
        <span className="font-serif text-lg md:text-xl font-bold text-brand-dark group-hover:text-brand-primary transition-colors">
          {question}
        </span>
        <span className="w-8 h-8 rounded-full bg-white border border-brand-border flex items-center justify-center text-brand-muted group-hover:border-brand-primary group-hover:text-brand-primary transition-all duration-300 shrink-0 ml-4">
          {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <p className="text-sm md:text-base text-brand-muted leading-relaxed pt-3 pb-2 max-w-4xl font-sans">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const [openId, setOpenId] = useState(1); 

  return (
    <section id="faq" className="py-24 px-6 md:px-12 bg-white relative">
      <div className="mx-auto max-w-4xl">
        
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>COMMON ENQUIRIES</span>
          </div>
          <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-brand-dark">
            Frequently Asked Questions
          </h2>
        </div>

        
        <div className="mt-8 border-t border-brand-border/60">
          {FAQS.map((faq) => (
            <AccordionItem
              key={faq.id}
              question={faq.question}
              answer={faq.answer}
              isOpen={openId === faq.id}
              onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
