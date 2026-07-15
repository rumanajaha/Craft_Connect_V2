/**
 * Searches for brand owners and creators.
 * Supporting name search, category/niche search, and hashtag/topic search in ai_tags.
 * Excludes the logged-in user's own profile.
 * Resolves creator avatar URLs from CustomerProfile.
 * 
 * @param {object} supabase - Supabase client instance
 * @param {object} options
 * @param {string} options.q - Search text query
 * @param {string} options.type - "brand" | "creator" | "all"
 * @param {string} options.currentUserId - Authenticated user's ID to exclude
 * @returns {Promise<Array>} List of merged profile objects
 */
export async function searchUsers(supabase, { q = '', type = 'all', currentUserId = null }) {
  const cleanQ = q ? q.trim().toLowerCase().replace(/^#/, '') : '';
  const searchType = type ? type.toLowerCase().trim() : 'all';

  let brandsFiltered = [];
  let creatorsFiltered = [];

  // 1. Fetch and filter BrandProfiles
  if (searchType === 'brand' || searchType === 'all' || searchType === 'brands') {
    const { data: brands, error: brandsError } = await supabase
      .from('BrandProfile')
      .select('id, owner_user_id, brand_name, category, location, logo_url, ai_tags, created_at, description');

    if (brandsError) {
      console.error("Error fetching BrandProfiles:", brandsError);
      throw brandsError;
    }

    if (brands) {
      brandsFiltered = brands.filter(brand => {
        if (currentUserId && brand.owner_user_id === currentUserId) {
          return false;
        }

        if (!cleanQ) return true;

        const nameMatch = (brand.brand_name || '').toLowerCase().includes(cleanQ);
        const categoryMatch = (brand.category || '').toLowerCase().includes(cleanQ);
        const tagMatch = (brand.ai_tags || []).some(tag => tag.toLowerCase().includes(cleanQ));

        return nameMatch || categoryMatch || tagMatch;
      });
    }
  }

  if (searchType === 'creator' || searchType === 'all' || searchType === 'creators') {
    const { data: creators, error: creatorsError } = await supabase
      .from('CreatorProfile')
      .select('id, owner_user_id, display_name, niches, ai_tags, created_at, bio');

    if (creatorsError) {
      console.error("Error fetching CreatorProfiles:", creatorsError);
      throw creatorsError;
    }

    if (creators) {
      creatorsFiltered = creators.filter(creator => {
        if (currentUserId && creator.owner_user_id === currentUserId) {
          return false;
        }

        if (!cleanQ) return true;

        const nameMatch = (creator.display_name || '').toLowerCase().includes(cleanQ);
        const nicheMatch = (creator.niches || []).some(niche => niche.toLowerCase().includes(cleanQ));
        const tagMatch = (creator.ai_tags || []).some(tag => tag.toLowerCase().includes(cleanQ));

        return nameMatch || nicheMatch || tagMatch;
      });
    }
  }

  const creatorUserIds = creatorsFiltered.map(c => c.owner_user_id).filter(Boolean);
  const avatarMap = {};
  if (creatorUserIds.length > 0) {
    const { data: customerProfiles, error: customerError } = await supabase
      .from('CustomerProfile')
      .select('owner_user_id, avatar_url')
      .in('owner_user_id', creatorUserIds);

    if (customerError) {
      console.error("Error fetching CustomerProfiles for creator avatars:", customerError);
    } else if (customerProfiles) {
      customerProfiles.forEach(profile => {
        avatarMap[profile.owner_user_id] = profile.avatar_url;
      });
    }
  }

  const fallbackAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';

  const formattedBrands = brandsFiltered.map(brand => ({
    id: brand.id,
    owner_user_id: brand.owner_user_id,
    profileType: 'brand',
    name: brand.brand_name || '',
    category: brand.category || '',
    niche: null,
    location: brand.location || '',
    logo_url: brand.logo_url || '',
    avatar_url: brand.logo_url || '',
    ai_tags: brand.ai_tags || [],
    description: brand.description || '',
    bio: brand.description || '',
    created_at: brand.created_at
  }));

  const formattedCreators = creatorsFiltered.map(creator => {
    const avatarUrl = avatarMap[creator.owner_user_id] || fallbackAvatar;
    return {
      id: creator.id,
      owner_user_id: creator.owner_user_id,
      profileType: 'creator',
      name: creator.display_name || '',
      category: creator.niches?.[0] || '',
      niche: creator.niches?.[0] || '',
      niches: creator.niches || [],
      location: null,
      logo_url: avatarUrl,
      avatar_url: avatarUrl,
      ai_tags: creator.ai_tags || [],
      bio: creator.bio || '',
      description: creator.bio || '',
      created_at: creator.created_at
    };
  });

  const merged = [...formattedBrands, ...formattedCreators];

  merged.sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (dateB !== dateA) {
      return dateB - dateA;
    }
    const tagsA = a.ai_tags?.length || 0;
    const tagsB = b.ai_tags?.length || 0;
    return tagsB - tagsA;
  });

  if (!cleanQ) {
    return merged.slice(0, 20);
  }

  return merged;
}
