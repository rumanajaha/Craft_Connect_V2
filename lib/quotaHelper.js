import { supabaseAdmin } from './supabaseServer';
import { createNotification } from './notify';

const LIMITS = {
  'banner-video': 3,
  'brand-story': 3,
  'brand_story': 3,
  'recommendation-tags': 5,
  'brand_tags': 5,
  'seo-description': 5,
  'creator-match': 5,
  'trending-feed': 5,
  'brand-match': 5,
  'content-ideas': 5,
  'chat-analyzer': 5,
};

const TOOL_ALIASES = {
  'brand-story': ['brand-story', 'brand_story'],
  'brand_story': ['brand-story', 'brand_story'],
  'recommendation-tags': ['recommendation-tags', 'brand_tags'],
  'brand_tags': ['recommendation-tags', 'brand_tags'],
};

export function getLimitForTool(toolName) {
  return LIMITS[toolName] || 5;
}

export async function checkQuota(brandId, toolName) {
  // Get first day of the current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const toolNames = TOOL_ALIASES[toolName] || [toolName];

  const { count, error } = await supabaseAdmin
    .from('AIGeneration')
    .select('*', { count: 'exact', head: true })
    .eq('brand_id', brandId)
    .in('tool_name', toolNames)
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
          .eq('type', 'ai_limit')
          .ilike('body', `%${toolName}%`)
          .gte('created_at', today.toISOString())
          .limit(1);
          
        if (!existingNotif || existingNotif.length === 0) {
          const toolLabels = {
            'banner-video': 'Banner Video Generator',
            'brand-story': 'Brand Story Generator',
            'brand_story': 'Brand Story Generator',
            'recommendation-tags': 'Recommendation Tags',
            'brand_tags': 'Recommendation Tags',
            'seo-description': 'SEO Description Generator',
            'creator-match': 'AI Creator Match',
            'trending-feed': 'Trending Feed Insights',
            'brand-match': 'Brand Matcher',
            'content-ideas': 'Content Ideas Generator',
            'chat-analyzer': 'AI Chat Analyzer',
          };
          const toolLabel = toolLabels[toolName] || toolName;
          
          await createNotification({
            userId: brand.owner_user_id,
            type: 'ai_limit',
            title: 'AI Generation Limit Reached',
            body: `You've used all ${limit} free generations for ${toolLabel}. Upgrade for unlimited access.`,
            relatedEntityId: brandId,
            link: `/brand/ai-studio/upgrade?tool=${encodeURIComponent(toolName)}&brand=${brandId}`,
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

export async function checkCreatorQuota(creatorId, toolName) {
  // Get first day of the current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count, error } = await supabaseAdmin
    .from('AIGeneration')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creatorId)
    .eq('tool_name', toolName)
    .gte('created_at', startOfMonth);

  if (error) {
    console.error("Creator quota check database error:", error);
    // If creator_id column hasn't been migrated in Supabase yet (42703), fail open with warning
    if (error.code === '42703' || (error.message && error.message.includes('creator_id'))) {
      console.warn('AIGeneration.creator_id column missing — run scripts/aigeneration-creator-migration.sql in Supabase SQL Editor.');
      return { count: 0, limit: getLimitForTool(toolName), exceeded: false };
    }
    throw new Error('Failed to query Creator AI generation quota');
  }

  const limit = getLimitForTool(toolName);
  const currentCount = count || 0;
  const exceeded = currentCount >= limit;

  if (exceeded) {
    try {
      const { data: creator } = await supabaseAdmin
        .from('CreatorProfile')
        .select('owner_user_id, display_name')
        .eq('id', creatorId)
        .single();
      
      if (creator && creator.owner_user_id) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: existingNotif } = await supabaseAdmin
          .from('Notification')
          .select('id')
          .eq('user_id', creator.owner_user_id)
          .eq('type', 'ai_limit')
          .ilike('body', `%${toolName}%`)
          .gte('created_at', today.toISOString())
          .limit(1);
          
        if (!existingNotif || existingNotif.length === 0) {
          const toolLabels = {
            'trending-feed': 'Trending & Inspiration',
            'brand-match': 'Brand Match Suggestions',
            'content-ideas': 'Content Idea Generation',
            'chat-analyzer': 'AI Chat Analyzer',
          };
          const toolLabel = toolLabels[toolName] || toolName;
          
          await createNotification({
            userId: creator.owner_user_id,
            type: 'ai_limit',
            title: 'AI Generation Limit Reached',
            body: `You've used all ${limit} free generations for ${toolLabel}. Upgrade for unlimited access.`,
            relatedEntityId: creatorId,
            link: `/creator/ai-studio/${encodeURIComponent(toolName)}?creator=${creatorId}`,
          });
        }
      }
    } catch (err) {
      console.error("Failed to insert creator AI usage notification:", err);
    }
  }

  return {
    count: currentCount,
    limit,
    exceeded
  };
}
