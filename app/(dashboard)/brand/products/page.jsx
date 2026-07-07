"use client";

import React, { useState } from "react";
import Button from "@/components/ui/button";
import { Plus, PackageSearch } from "lucide-react";
import { MOCK_PRODUCTS } from "@/lib/mockData";
import ProductRow from "@/components/brand/ProductRow";
import ProductFormModal from "@/components/brand/ProductFormModal";
import { useBrandData, addFeedUpdate } from "@/lib/brandDataStore";

export default function ManageCampaignsPage() {
  const { products, setProducts } = useBrandData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      const deletedProduct = products.find(p => p.id === id);
      setProducts(products.filter(p => p.id !== id));
      if (deletedProduct) {
        addFeedUpdate("product_delete", `Ochre Clay Studio removed the product "${deletedProduct.name}".`);
      }
    }
  };

  const handleSaveProduct = (productData) => {
    if (editingProduct) {
      
      setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...productData } : p));
      addFeedUpdate("product_update", `Ochre Clay Studio updated details for "${productData.name}".`);
    } else {
      
      const newId = `p-new-${Date.now()}`;
      setProducts([{
        id: newId,
        brandId: "ochre-clay",
        ...productData,
        image: productData.image || "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=500&auto=format&fit=crop&q=80" 
      }, ...products]);
      addFeedUpdate("product_add", `Ochre Clay Studio added a new product: "${productData.name}".`);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-brand-dark">
            Manage Campaigns
          </h1>
          <p className="text-brand-muted text-sm mt-1.5">
            Add or edit products to generate creator matches and campaigns.
          </p>
        </div>
        
        <Button variant="primary" onClick={handleOpenAdd} className="shadow-sm shadow-brand-primary/20">
          <Plus className="w-4 h-4 mr-1.5" /> Add Product
        </Button>
      </div>

      
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-brand-border/50 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary mb-4">
            <PackageSearch className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-xl font-bold text-brand-dark mb-2">No products yet</h3>
          <p className="text-brand-muted text-sm max-w-sm mb-6">
            Add your first product to start generating AI campaigns and discovering creator matches.
          </p>
          <Button variant="primary" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-1.5" /> Add your first product
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(product => (
            <ProductRow 
              key={product.id} 
              product={product} 
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      
      {isModalOpen && (
        <ProductFormModal
          product={editingProduct}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProduct}
        />
      )}

    </div>
  );
}
