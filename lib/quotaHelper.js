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
  'chat-analyzer': 5,
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
  const exceeded = currentCount >= limit;

  if (exceeded) {
    try {
      const { data: brand } = await supabaseAdmin
        .from('BrandProfile')
        .select('owner_user_id, brand_name')
        .eq('id', brandId)
        .single();
      
      if (brand && brand.owner_user_id) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: existingNotif } = await supabaseAdmin
          .from('Notification')
          .select('id')
          .eq('user_id', brand.owner_user_id)
          .eq('type', 'ai_usage')
          .ilike('body', `%${toolName}%`)
          .gte('created_at', today.toISOString())
          .limit(1);
          
        if (!existingNotif || existingNotif.length === 0) {
          const toolLabels = {
            'banner-video': 'Banner Video Generator',
            'brand-story': 'Brand Story Generator',
            'recommendation-tags': 'Recommendation Tags',
            'seo-description': 'SEO Description Generator',
            'creator-match': 'AI Creator Match',
            'campaign-planner': 'Campaign Planner',
            'request-analyzer': 'Request Analyzer',
            'content-inspiration': 'Content Inspiration',
            'trending-feed': 'Trending Feed Insights',
            'brand-match': 'Brand Matcher',
            'content-ideas': 'Content Ideas Generator',
            'chat-analyzer': 'AI Chat Analyzer',
          };
          const toolLabel = toolLabels[toolName] || toolName;
          
          await supabaseAdmin
            .from('Notification')
            .insert({
              user_id: brand.owner_user_id,
              type: 'ai_usage',
              title: 'AI Generation Limit Reached',
              body: `You've used all ${limit} free generations for ${toolLabel}. Upgrade for unlimited access.`,
              is_read: false,
              related_entity_id: null
            });
        }
      }
    } catch (err) {
      console.error("Failed to insert AI usage notification:", err);
    }
  }

  return {
    count: currentCount,
    limit,
    exceeded
  };
}
