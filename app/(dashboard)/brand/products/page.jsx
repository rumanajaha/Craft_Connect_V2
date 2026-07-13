"use client";

import React, { useState, useEffect } from "react";
import Button from "@/components/ui/button";
import { Plus, PackageSearch, Loader2 } from "lucide-react";
import ProductRow from "@/components/brand/ProductRow";
import ProductFormModal from "@/components/brand/ProductFormModal";
import { useBrandData, addFeedUpdate } from "@/lib/brandDataStore";

export default function ManageCampaignsPage() {
  const { products, setProducts } = useBrandData();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/brand/products");
        if (response.ok) {
          const data = await response.json();
          setProducts(data.products);
        }
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, [setProducts]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(`/api/brand/products/${id}`, {
          method: "DELETE"
        });
        if (response.ok) {
          const deletedProduct = products.find(p => p.id === id);
          setProducts(products.filter(p => p.id !== id));
          if (deletedProduct) {
            addFeedUpdate("product_delete", `Ochre Clay Studio removed the product "${deletedProduct.name}".`);
          }
        } else {
          alert("Failed to delete product.");
        }
      } catch (err) {
        console.error(err);
        alert("Error deleting product.");
      }
    }
  };

  const handleSaveProduct = async (productData) => {
    try {
      if (editingProduct) {
        const response = await fetch(`/api/brand/products/${editingProduct.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData)
        });
        if (response.ok) {
          const data = await response.json();
          setProducts(products.map(p => p.id === editingProduct.id ? data.product : p));
          addFeedUpdate("product_update", `Ochre Clay Studio updated details for "${productData.name}".`);
        } else {
          alert("Failed to update product.");
        }
      } else {
        const response = await fetch("/api/brand/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(productData)
        });
        if (response.ok) {
          const data = await response.json();
          setProducts([data.product, ...products]);
          addFeedUpdate("product_add", `Ochre Clay Studio added a new product: "${productData.name}".`);
        } else {
          alert("Failed to add product.");
        }
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Error saving product.");
    }
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

      
      {isLoading ? (
        <div className="bg-white rounded-3xl border border-brand-border/50 p-12 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-4" />
          <p className="text-brand-muted text-sm">Loading your products catalog...</p>
        </div>
      ) : products.length === 0 ? (
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
