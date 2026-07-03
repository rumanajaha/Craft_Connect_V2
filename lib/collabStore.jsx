"use client";

/**
 * CollabStore — shared context for collaboration pitches.
 * Pitches submitted by creators appear immediately on Brand Owner's dashboard
 * and vice versa, without a refresh.
 *
 * TODO: persist to backend (Supabase collab_requests table)
 */

import React, { createContext, useContext, useState } from "react";
import { MOCK_CREATOR_PITCHES, MOCK_CREATOR_OUTGOING_PITCHES } from "@/lib/mockData";

const CollabContext = createContext(null);

export function CollabProvider({ children }) {
  // Brand-incoming pitches (what brand owners see)
  const [incomingPitches, setIncomingPitches] = useState(MOCK_CREATOR_PITCHES);
  // Creator-outgoing pitches (what creators see)
  const [outgoingPitches, setOutgoingPitches] = useState(MOCK_CREATOR_OUTGOING_PITCHES);

  const addPitch = (pitch) => {
    // Add to creator's outgoing list
    setOutgoingPitches(prev => [pitch, ...prev]);

    // Also add to brand's incoming list (mirror)
    const incomingVersion = {
      id: pitch.id,
      brandId: pitch.brandId,
      creatorId: "creator-1", // Active creator
      creatorName: "Sarah Indigo",
      creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      compensation: pitch.compensation,
      snippet: pitch.snippet,
      date: new Date().toISOString().split("T")[0],
      status: "pending",
    };
    setIncomingPitches(prev => [incomingVersion, ...prev]);
    // TODO: persist to backend
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
