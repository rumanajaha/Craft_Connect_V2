import React, { useState } from "react";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";

export function BrandStoryForm({ onGenerate, isGenerating }) {
  const [inputs, setInputs] = useState({ collection: "", materials: "", inspiration: "" });
  const handleSubmit = (e) => { e.preventDefault(); onGenerate(inputs); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Collection / focus" name="collection" value={inputs.collection} onChange={e => setInputs(p => ({ ...p, collection: e.target.value }))} placeholder="e.g. Spring 2025 dinnerware" required />
      <Input label="Core materials" name="materials" value={inputs.materials} onChange={e => setInputs(p => ({ ...p, materials: e.target.value }))} placeholder="e.g. Stoneware clay, iron-oxide glaze" required />
      <Input label="Inspiration / ethos" name="inspiration" value={inputs.inspiration} onChange={e => setInputs(p => ({ ...p, inspiration: e.target.value }))} placeholder="e.g. Wabi-sabi, slow living" required />
      <Button type="submit" variant="primary" className="w-full" disabled={isGenerating}>
        {isGenerating ? "Generating…" : "Generate Story"}
      </Button>
    </form>
  );
}

export function SEODescriptionForm({ onGenerate, isGenerating, products, selectedProductId, setSelectedProductId }) {
  const [inputs, setInputs] = useState({ features: "" });
  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleSubmit = (e) => { e.preventDefault(); onGenerate(inputs); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Product *</label>
        <select
          value={selectedProductId}
          onChange={e => setSelectedProductId(e.target.value)}
          required
          className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark"
        >
          <option value="">Select a product…</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {selectedProduct?.description && (
          <p className="text-[10px] text-brand-muted italic">
            Current: "{selectedProduct.description.slice(0, 80)}…"
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Key features / selling points</label>
        <textarea
          rows={3}
          value={inputs.features}
          onChange={e => setInputs(p => ({ ...p, features: e.target.value }))}
          placeholder="Hand-thrown, food-safe glaze, ships in recycled packaging…"
          className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark resize-none"
        />
      </div>

      <Button type="submit" variant="primary" className="w-full" disabled={isGenerating || !selectedProductId}>
        {isGenerating ? "Generating…" : "Generate Description"}
      </Button>
    </form>
  );
}

export function CreatorMatchForm({ onGenerate, isGenerating }) {
  const [inputs, setInputs] = useState({ productType: "", audience: "", goal: "" });
  const handleSubmit = (e) => { e.preventDefault(); onGenerate(inputs); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Product type" value={inputs.productType} onChange={e => setInputs(p => ({ ...p, productType: e.target.value }))} placeholder="e.g. Ceramic Mugs" required />
      <Input label="Target audience" value={inputs.audience} onChange={e => setInputs(p => ({ ...p, audience: e.target.value }))} placeholder="e.g. Women 25–35, coffee lovers" required />
      <Input label="Campaign goal" value={inputs.goal} onChange={e => setInputs(p => ({ ...p, goal: e.target.value }))} placeholder="e.g. Brand awareness" required />
      <Button type="submit" variant="primary" className="w-full" disabled={isGenerating}>
        {isGenerating ? "Matching…" : "Find Matches"}
      </Button>
    </form>
  );
}

export function CampaignPlannerForm({ onGenerate, isGenerating }) {
  const [inputs, setInputs] = useState({ goal: "", budget: "", category: "" });
  const handleSubmit = (e) => { e.preventDefault(); onGenerate(inputs); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Campaign goal" value={inputs.goal} onChange={e => setInputs(p => ({ ...p, goal: e.target.value }))} placeholder="e.g. Holiday sales lift" required />
      <Input label="Budget range" value={inputs.budget} onChange={e => setInputs(p => ({ ...p, budget: e.target.value }))} placeholder="e.g. $500–$1,000" required />
      <Input label="Product category" value={inputs.category} onChange={e => setInputs(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Homeware" required />
      <Button type="submit" variant="primary" className="w-full" disabled={isGenerating}>
        {isGenerating ? "Planning…" : "Plan Campaign"}
      </Button>
    </form>
  );
}

export function RequestAnalyzerForm({ onGenerate, isGenerating }) {
  const [text, setText] = useState("");
  const handleSubmit = (e) => { e.preventDefault(); onGenerate({ text }); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Raw inquiry text *</label>
        <textarea
          rows={8}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Paste the customer's email, DM, or form submission here…"
          required
          className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark resize-none"
        />
      </div>
      <Button type="submit" variant="primary" className="w-full" disabled={isGenerating || !text.trim()}>
        {isGenerating ? "Analyzing…" : "Analyze Request"}
      </Button>
    </form>
  );
}

export function ContentInspirationForm({ onGenerate, isGenerating }) {
  const [text, setText] = useState("");
  const handleSubmit = (e) => { e.preventDefault(); onGenerate({ text }); };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Product or topic *</label>
        <textarea
          rows={5}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="e.g. The process of glazing our speckled mugs, or a new product launch…"
          required
          className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark resize-none"
        />
      </div>
      <Button type="submit" variant="primary" className="w-full" disabled={isGenerating || !text.trim()}>
        {isGenerating ? "Brainstorming…" : "Get Ideas"}
      </Button>
    </form>
  );
}
