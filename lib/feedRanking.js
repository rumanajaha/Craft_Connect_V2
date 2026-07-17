
export function getFeedItems() {
  return [];
}


export function rankFeed(items, role, userTags = []) {
  if (!items || items.length === 0) return [];

  
  const targetTags = userTags.map(t => t.toLowerCase().trim()).filter(Boolean);

  
  const weights = {
    customer: { w1: 0.4, w2: 0.1, w3: 0.1, w4: 0.35, w5: 0.05 }, 
    brand: { w1: 0.4, w2: 0.1, w3: 0.35, w4: 0.1, w5: 0.05 }, 
    creator: { w1: 0.1, w2: 0.4, w3: 0.35, w4: 0.1, w5: 0.05 }, 
  };

  const w = weights[role] || weights.customer;

  
  let maxEngagement = 1;
  items.forEach(item => {
    const eng = (item.views || 0) + (item.saves || 0) * 5;
    if (eng > maxEngagement) maxEngagement = eng;
  });

  const scoredItems = items.map(item => {
    
    let tagAffinity = 0;
    if (targetTags.length > 0 && item.ai_tags && item.ai_tags.length > 0) {
      const matchCount = item.ai_tags.filter(t => targetTags.includes(t.toLowerCase())).length;
      tagAffinity = matchCount / Math.max(1, targetTags.length);
    }

    
    const ageInDays = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const recencyDecay = Math.exp(-0.1 * Math.max(0, ageInDays)); 

    
    const rawEngagement = (item.views || 0) + (item.saves || 0) * 5;
    const engagementNorm = rawEngagement / maxEngagement;

    
    const ratingFactor = (item.rating || 4.5) / 5; 
    const savesFactor = Math.min(1, (item.saves || 0) / 1000);
    const socialProof = ratingFactor * 0.6 + savesFactor * 0.4;

    
    const diversityBonus = item.diversityBonus || 0;

    
    const finalScore =
      (tagAffinity * w.w1) +
      (recencyDecay * w.w2) +
      (engagementNorm * w.w3) +
      (socialProof * w.w4) +
      (diversityBonus * w.w5);

    
    let reason = "Trending Now";
    if (tagAffinity > 0.3) {
      reason = "Matches your style";
    } else if (recencyDecay > 0.8) {
      reason = "New Release";
    } else if (socialProof > 0.8) {
      reason = "Highly Recommended";
    }

    return {
      ...item,
      score: finalScore,
      reason,
      debug: {
        tagAffinity,
        recencyDecay,
        engagementNorm,
        socialProof,
        diversityBonus
      }
    };
  });

  
  return scoredItems.sort((a, b) => b.score - a.score);
}
