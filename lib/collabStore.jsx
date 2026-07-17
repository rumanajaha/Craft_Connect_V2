"use client";



import React, { createContext, useContext, useState } from "react";
import { MOCK_CREATOR_PITCHES, MOCK_CREATOR_OUTGOING_PITCHES } from "@/lib/mockData";

export const CollabContext = createContext(null);

export function CollabProvider({ children }) {
  
  const [incomingPitches, setIncomingPitches] = useState(MOCK_CREATOR_PITCHES);
  
  const [outgoingPitches, setOutgoingPitches] = useState(MOCK_CREATOR_OUTGOING_PITCHES);

  const addPitch = async (pitch) => {
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
      const errorText = await res.text();
      console.error("Failed to persist pitch in DB:", errorText);
      throw new Error("Failed to send pitch — please try again");
    }

    const data = await res.json();
    if (data.pitch) {
      const newPitch = {
        id: data.pitch.id,
        brandId: data.pitch.brand_id,
        brandName: pitch.brandName,
        brandLogo: pitch.brandLogo,
        compensation: data.pitch.compensation_type,
        snippet: data.pitch.pitch_message,
        date: new Date(data.pitch.created_at || Date.now()).toISOString().split("T")[0],
        status: data.pitch.status,
      };
      setOutgoingPitches(prev => [newPitch, ...prev]);
    }
    return data;
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
