"use client";



import React, { createContext, useContext, useState, useEffect } from "react";
import { MOCK_BRANDS, MOCK_PRODUCTS } from "@/lib/mockData";




const ACTIVE_BRAND_ID = "ochre-clay";
const seedBrand = MOCK_BRANDS.find(b => b.id === ACTIVE_BRAND_ID);
const seedProducts = MOCK_PRODUCTS.filter(p => p.brandId === ACTIVE_BRAND_ID);




const BrandDataContext = createContext(null);

const seedBrandInfo = {
  name: seedBrand?.name ?? "Ochre Clay Studio",
  category: seedBrand?.category ?? "Ceramics",
  location: seedBrand?.location ?? "Kyoto & Portland",
  website: seedBrand?.website ?? "https://ochreclay.example.com",
  videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  description: seedBrand?.about ?? "",
  tags: "minimalist, wabi-sabi, hand-thrown, stoneware",
  instagram: "ochreclay",
  tiktok: "ochre_clay_studio",
};


export const addFeedUpdate = (updateType, details) => {
  if (typeof window === "undefined") return;
  try {
    const existing = localStorage.getItem("cc_brand_updates");
    const updates = existing ? JSON.parse(existing) : [];
    
    
    if (updates.length > 0 && updates[0].updateText === details && Date.now() - new Date(updates[0].created_at).getTime() < 5000) {
      return;
    }

    const newUpdate = {
      id: `update-${Date.now()}`,
      brandId: ACTIVE_BRAND_ID,
      brandName: "Ochre Clay Studio",
      brandLogo: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=120&auto=format&fit=crop&q=80",
      type: "brand_update",
      updateType, 
      updateText: details,
      created_at: new Date().toISOString(),
      views: Math.floor(Math.random() * 500) + 100,
      saves: Math.floor(Math.random() * 50) + 10,
      rating: 4.9,
      ai_tags: ["ceramics", "handmade", "minimalist", "wabi-sabi", "tableware"]
    };
    localStorage.setItem("cc_brand_updates", JSON.stringify([newUpdate, ...updates]));
  } catch (e) {
    console.error("Failed to save brand update to feed storage:", e);
  }
};

export function BrandDataProvider({ children }) {
  
  const [brandInfo, setBrandInfoState] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cc_brand_info");
      if (saved) return JSON.parse(saved);
    }
    return seedBrandInfo;
  });

  const setBrandInfo = (newInfo) => {
    setBrandInfoState(newInfo);
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_brand_info", JSON.stringify(newInfo));
    }
  };

  const brandAbout = brandInfo.description;
  const setBrandAbout = async (aboutText) => {
    const updatedInfo = { ...brandInfo, description: aboutText };
    setBrandInfo(updatedInfo);
    addFeedUpdate("story", `Ochre Clay Studio published a new brand story focusing on ${brandInfo.category.toLowerCase()} craftsmanship.`);
    try {
      await fetch("/api/brand/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: aboutText })
      });
    } catch (err) {
      console.error("Failed to save brand story to DB:", err);
    }
  };

  
  const [products, setProductsState] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cc_brand_products");
      if (saved) return JSON.parse(saved);
    }
    return seedProducts;
  });

  const setProducts = (newProducts) => {
    setProductsState(newProducts);
    if (typeof window !== "undefined") {
      localStorage.setItem("cc_brand_products", JSON.stringify(newProducts));
    }
  };

  useEffect(() => {
    async function loadData() {
      try {
        const profileRes = await fetch("/api/brand/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setBrandInfoState(profileData.profile);
        }
        
        const productsRes = await fetch("/api/brand/products");
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProductsState(productsData.products);
        }
      } catch (err) {
        console.error("Failed to fetch brand provider data:", err);
      }
    }
    loadData();
  }, []);

  
  const updateProductDescription = async (productId, description) => {
    const nextProducts = products.map(p => p.id === productId ? { ...p, description } : p);
    setProducts(nextProducts);
    const prod = products.find(p => p.id === productId);
    const prodName = prod ? prod.name : "a product";
    addFeedUpdate("product_seo", `Ochre Clay Studio updated the SEO description for "${prodName}".`);
    try {
      await fetch(`/api/brand/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description })
      });
    } catch (err) {
      console.error("Failed to save product description to DB:", err);
    }
  };

  return (
    <BrandDataContext.Provider value={{
      brandInfo,
      setBrandInfo,
      brandAbout,
      setBrandAbout,       
      products,
      setProducts,
      updateProductDescription,
      activeBrandId: ACTIVE_BRAND_ID,
    }}>
      {children}
    </BrandDataContext.Provider>
  );
}


export function useBrandData() {
  const ctx = useContext(BrandDataContext);
  if (!ctx) {
    
    let localBrandInfo = seedBrandInfo;
    let localProducts = seedProducts;
    
    if (typeof window !== "undefined") {
      const savedInfo = localStorage.getItem("cc_brand_info");
      if (savedInfo) localBrandInfo = JSON.parse(savedInfo);
      
      const savedProds = localStorage.getItem("cc_brand_products");
      if (savedProds) localProducts = JSON.parse(savedProds);
    }

    return {
      brandInfo: localBrandInfo,
      brandAbout: localBrandInfo.description,
      setBrandAbout: () => {},
      products: localProducts,
      setProducts: () => {},
      updateProductDescription: () => {},
      activeBrandId: ACTIVE_BRAND_ID,
    };
  }
  return ctx;
}
