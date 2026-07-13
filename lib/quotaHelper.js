import { supabaseAdmin } from './supabaseServer';

const LIMITS = {
  'banner-video': 3,
  'brand-story': 3,
  'recommendation-tags': 5,
  'seo-description': 5,
  'creator-match': 5,
  'campaign-planner': 5,
  'request-analyzer': 5,
  'content-inspiration': 5,
  'trending-feed': 5,
  'brand-match': 5,
  'content-ideas': 5,
};

export function getLimitForTool(toolName) {
  return LIMITS[toolName] || 5;
}

export async function checkQuota(brandId, toolName) {
  // Get first day of the current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await supabaseAdmin
    .from('AIGeneration')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brandId)
    .eq('tool_name', toolName)
    .gte('created_at', startOfMonth);

  if (error) {
    console.error("Quota check database error:", error);
    throw new Error('Failed to query AI generation quota');
  }

  const limit = getLimitForTool(toolName);
  const currentCount = count || 0;

  return {
    count: currentCount,
    limit,
    exceeded: currentCount >= limit
  };
}
