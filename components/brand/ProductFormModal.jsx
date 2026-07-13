"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { X, Sparkles, AlertCircle, ExternalLink, Camera, Loader2 } from "lucide-react";

export default function ProductFormModal({ product, onClose, onSave }) {
  const [formData, setFormData] = useState(
    product || {
      name: "",
      price: "",
      category: "",
      description: "",
      buyLink: "",
      inStock: true,
      image: ""
    }
  );
  
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/api/brand/products/upload", {
        method: "POST",
        body: form
      });
      const data = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, image: data.imageUrl }));
      } else {
        alert(data.error || "Failed to upload image.");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleAISuggest = () => {
    
    
    const productId = product?.id;
    if (productId) {
      
      router.push(`/brand/ai-studio/seo-description?product=${productId}`);
      onClose(); 
    } else {
      
      router.push("/brand/ai-studio/seo-description");
      onClose();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/50">
          <h2 className="font-serif text-xl font-bold text-brand-dark">
            {product ? "Edit Product" : "Add New Product"}
          </h2>
          <button 
            onClick={onClose}
            className="text-brand-muted hover:text-brand-dark transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        
        <div className="p-6 overflow-y-auto">
          <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">Product Photo</label>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                style={{ display: "none" }} 
                accept="image/*" 
              />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-28 h-28 rounded-2xl overflow-hidden border border-brand-border bg-brand-border/10 flex flex-col items-center justify-center text-brand-muted cursor-pointer hover:bg-brand-border/20 group transition-all"
              >
                {isUploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-brand-primary" />
                ) : formData.image ? (
                  <>
                    <img src={formData.image} className="w-full h-full object-cover" alt="Product" />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white mb-1" />
                      <span className="text-[9px] text-white font-bold uppercase tracking-wider font-sans">Change</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Camera className="w-6 h-6 text-brand-muted mb-1 opacity-70 group-hover:text-brand-dark transition-colors" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Upload</span>
                  </>
                )}
              </div>
            </div>

            <Input 
              label="Product Name" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Speckled Ceramic Mug"
              required 
            />

            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Price (USD)" 
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                placeholder="45"
                required 
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                  Status
                </label>
                <select 
                  name="inStock"
                  value={formData.inStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, inStock: e.target.value === "true" }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark"
                >
                  <option value="true">In Stock</option>
                  <option value="false">Out of Stock</option>
                </select>
              </div>
            </div>

            <Input 
              label="Category" 
              name="category"
              value={formData.category}
              onChange={handleChange}
              placeholder="e.g. Ceramics, Homeware"
            />

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                  Description
                </label>
                <button
                  type="button"
                  onClick={handleAISuggest}
                  disabled={!formData.name || isGenerating}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-primary hover:text-brand-secondary transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <span className="animate-pulse">Generating...</span>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      AI Suggest
                    </>
                  )}
                </button>
              </div>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-brand-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-brand-dark placeholder:text-brand-muted resize-none"
                placeholder="Describe your product..."
              />
              
            </div>

            <div className="pt-2 border-t border-brand-border/40">
              <Input 
                label="Buy Link" 
                name="buyLink"
                type="url"
                value={formData.buyLink}
                onChange={handleChange}
                placeholder="https://yourstore.com/product"
                required
              />
              <p className="flex items-center gap-1.5 mt-2 text-xs text-brand-muted">
                <AlertCircle className="w-3.5 h-3.5" />
                Customers will be redirected here to complete their purchase.
              </p>
            </div>
          </form>
        </div>

        
        <div className="px-6 py-4 bg-brand-border/10 border-t border-brand-border/50 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="productForm" variant="primary">
            Save Product
          </Button>
        </div>

      </div>
    </div>
  );
}
