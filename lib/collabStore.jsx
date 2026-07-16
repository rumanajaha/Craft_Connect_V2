"use client";



import React, { createContext, useContext, useState } from "react";
import { MOCK_CREATOR_PITCHES, MOCK_CREATOR_OUTGOING_PITCHES } from "@/lib/mockData";

export const CollabContext = createContext(null);

export function CollabProvider({ children }) {
  
  const [incomingPitches, setIncomingPitches] = useState(MOCK_CREATOR_PITCHES);
  
  const [outgoingPitches, setOutgoingPitches] = useState(MOCK_CREATOR_OUTGOING_PITCHES);

  const addPitch = async (pitch) => {
    setOutgoingPitches(prev => [pitch, ...prev]);

    const incomingVersion = {
      id: pitch.id,
      brandId: pitch.brandId,
      creatorId: "creator-1", 
      creatorName: "Sarah Indigo",
      creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      compensation: pitch.compensation,
      snippet: pitch.snippet,
      date: new Date().toISOString().split("T")[0],
      status: "pending",
    };
    setIncomingPitches(prev => [incomingVersion, ...prev]);

    try {
      const res = await fetch("/api/creator/pitches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: pitch.brandId,
          compensation: pitch.compensation,
          message: pitch.snippet,
        }),
      });
      if (!res.ok) {
        console.error("Failed to persist pitch in DB:", await res.text());
      }
    } catch (err) {
      console.error("Error persisting pitch:", err);
    }
  };

  return (
    <CollabContext.Provider value={{ incomingPitches, outgoingPitches, addPitch }}>
      {children}
    </CollabContext.Provider>
  );
}

export function useCollab() {
  const context = useContext(CollabContext);
  if (!context) {
    throw new Error("useCollab must be used within a CollabProvider");
  }
  return context;
}
