
export const MOCK_BRANDS = [
  {
    id: "ochre-clay",
    name: "Ochre Clay Studio",
    logo: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=120&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&auto=format&fit=crop&q=80",
    category: "Ceramics",
    location: "Kyoto & Portland",
    rating: 4.9,
    reviewsCount: 42,
    trustScore: 98,
    website: "https://ochreclay.example.com",
    about: "Raw stoneware, tactile glazes, and wood-fired ceramics designed for the slow dinner table. Every piece is shaped by hand and cured for weeks in custom wood-fired kilns, creating unique organic variations.",
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
  },
  {
    id: "gaea-weaves",
    name: "Gaea Weaves",
    logo: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=120&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
    category: "Textiles",
    location: "Seattle, WA",
    rating: 4.7,
    reviewsCount: 29,
    trustScore: 94,
    website: "https://gaeaveaves.example.com",
    about: "Centuries-old weaving techniques translated into contemporary floor tapestry and home linen. We source organic flax directly from Belgian family fields and spin it on heritage handlooms.",
  },
  {
    id: "soren-objects",
    name: "Soren Objects",
    logo: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=120&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80",
    category: "Woodwork",
    location: "Austin, TX",
    rating: 4.8,
    reviewsCount: 36,
    trustScore: 96,
    website: "https://sorenobjects.example.com",
    about: "Solid walnut carvings, hand-planed benches, and oak kitchen tools made from local, sustainably harvested trees. We honor the natural grains of wood to design modern minimalist heirlooms.",
  },
  {
    id: "aether-scents",
    name: "Aether Scents",
    logo: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=120&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&auto=format&fit=crop&q=80",
    category: "Apothecary",
    location: "Denver, CO",
    rating: 4.6,
    reviewsCount: 18,
    trustScore: 92,
    website: "https://aetherscents.example.com",
    about: "Pure wild beeswax and organic soy wax candles hand-poured in small batches, blended with locally wild-harvested forest pine and botanical essences. Free from synthetic additives.",
  },
  {
    id: "sienna-botanicals",
    name: "Sienna Botanicals",
    logo: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=120&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=800&auto=format&fit=crop&q=80",
    category: "Apothecary",
    location: "San Francisco, CA",
    rating: 4.9,
    reviewsCount: 51,
    trustScore: 99,
    website: "https://siennabotanicals.example.com",
    about: "Cold-pressed forest oils and botanical skin nutrition sourced from organic family woodlands. We craft small-batch skincare formulas that work in harmony with your skin's natural balance.",
  },
  {
    id: "zephyr-glass",
    name: "Zephyr Glass",
    logo: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=120&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800&auto=format&fit=crop&q=80",
    category: "Lighting",
    location: "Portland, OR",
    rating: 4.8,
    reviewsCount: 22,
    trustScore: 95,
    website: "https://zephyrglass.example.com",
    about: "Stained glass lighting, handblown by local glass artisans. Our lamps and pendants cast beautiful colored sunset refraction shadows, changing the mood of any room.",
  }
];

export const MOCK_PRODUCTS = [
  {
    id: "p1",
    brandId: "ochre-clay",
    name: "Organic Speckled Clay Vase",
    price: 120,
    image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=500&auto=format&fit=crop&q=80",
    inStock: true
  },
  {
    id: "p2",
    brandId: "ochre-clay",
    name: "Minimalist Stoneware Soup Bowl",
    price: 45,
    image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&auto=format&fit=crop&q=80",
    inStock: true
  },
  {
    id: "p3",
    brandId: "ochre-clay",
    name: "Wood-Fired Ceramic Mug",
    price: 38,
    image: "https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&auto=format&fit=crop&q=80",
    inStock: false
  },
  {
    id: "p4",
    brandId: "gaea-weaves",
    name: "Belgian Flax Handloomed Throw",
    price: 145,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80",
    inStock: true
  },
  {
    id: "p5",
    brandId: "gaea-weaves",
    name: "Handloomed Indigo Table Runner",
    price: 78,
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=500&auto=format&fit=crop&q=80",
    inStock: true
  },
  {
    id: "p6",
    brandId: "soren-objects",
    name: "Hand-Planed Walnut Cutting Board",
    price: 95,
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80",
    inStock: true
  },
  {
    id: "p7",
    brandId: "soren-objects",
    name: "Minimalist Elm Three-Legged Stool",
    price: 320,
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=500&auto=format&fit=crop&q=80",
    inStock: true
  },
  {
    id: "p8",
    brandId: "aether-scents",
    name: "Cedar & Lavender Forest Candle",
    price: 36,
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&auto=format&fit=crop&q=80",
    inStock: true
  },
  {
    id: "p9",
    brandId: "aether-scents",
    name: "Wild Beeswax Honeycomb Block",
    price: 24,
    image: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=500&auto=format&fit=crop&q=80",
    inStock: true
  },
  {
    id: "p10",
    brandId: "sienna-botanicals",
    name: "Organic Cold-Pressed Jojoba Elixir",
    price: 52,
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&auto=format&fit=crop&q=80",
    inStock: true
  },
  {
    id: "p11",
    brandId: "sienna-botanicals",
    name: "Forest Balsam Wild Perfume Oil",
    price: 68,
    image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&auto=format&fit=crop&q=80",
    inStock: true
  },
  {
    id: "p12",
    brandId: "zephyr-glass",
    name: "Blown Stained Glass Pendant Lamp",
    price: 420,
    image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=500&auto=format&fit=crop&q=80",
    inStock: true
  }
];

export const MOCK_REQUESTS = [
  {
    id: "req-1",
    brandId: "ochre-clay",
    type: "Custom Product",
    subject: "Custom Tall Ceramic Pitcher",
    message: "Hello! I am looking to commission a customized 1.5L tall ceramic water pitcher matching the Ochre Speckled style for my dinner table. Do you think we could do this with a slightly thinner handle? Thanks!",
    budget: "$150 - $200",
    deadline: "August 20, 2026",
    status: "pending",
    createdAt: "2026-06-28T10:30:00Z"
  },
  {
    id: "req-2",
    brandId: "soren-objects",
    type: "Custom Product",
    subject: "Walnut Display Box with Slide Lid",
    message: "Hi Soren Objects team, I love your walnut cutting boards. I would like a small display box (approx 10x8x4 inches) with a sliding lid to store heirloom watches. I would love for it to have a smooth hand-planed oil finish.",
    budget: "$200 - $300",
    deadline: "August 12, 2026",
    status: "responded",
    createdAt: "2026-06-25T14:45:00Z"
  },
  {
    id: "req-3",
    brandId: "aether-scents",
    type: "General Inquiry",
    subject: "Bulk Orders for Studio Event",
    message: "Hello, do you offer bulk pricing or customizable jar labels for your Cedar & Lavender candles? We have a local event on July 15 and would love to buy 20 units. Thanks!",
    budget: "$400 - $500",
    deadline: "July 12, 2026",
    status: "closed",
    createdAt: "2026-06-20T09:15:00Z"
  }
];

export const MOCK_COLLABS = [
  {
    id: "c1",
    brandId: "ochre-clay",
    creatorName: "Elena Rostova",
    creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    label: "Aesthetic Clay Stories Reel"
  },
  {
    id: "c2",
    brandId: "soren-objects",
    creatorName: "Liam Woodcraft",
    creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    label: "Walnut Carving Documentary"
  },
  {
    id: "c3",
    brandId: "gaea-weaves",
    creatorName: "Sarah Indigo",
    creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    label: "Linen Looming Campaign"
  }
];

export const MOCK_MESSAGES = [
  {
    id: "thread-ochre-clay",
    brandId: "ochre-clay",
    lastMessageText: "We can certainly make that handler thinner for you! Let us draft a sketch.",
    lastMessageTime: "2 hours ago",
    unread: true,
    messages: [
      {
        id: "m-1",
        sender: "customer",
        text: "Hello! I am looking to commission a customized 1.5L tall ceramic water pitcher matching the Ochre Speckled style for my dinner table. Do you think we could do this with a slightly thinner handle? Thanks!",
        timestamp: "2026-06-28T10:30:00Z"
      },
      {
        id: "m-2",
        sender: "brand",
        text: "Hi there! Yes, we love doing custom water pitchers. A 1.5L capacity is perfect. We can certainly make that handle thinner for you! Let us draft a sketch.",
        timestamp: "2026-06-28T12:45:00Z"
      }
    ]
  },
  {
    id: "thread-soren-objects",
    brandId: "soren-objects",
    lastMessageText: "The custom sliding walnut box proposal looks great. We have started processing.",
    lastMessageTime: "1 day ago",
    unread: false,
    messages: [
      {
        id: "m-3",
        sender: "customer",
        text: "Hi Soren Objects team, I love your walnut cutting boards. I would like a small display box (approx 10x8x4 inches) with a sliding lid to store heirloom watches. I would love for it to have a smooth hand-planed oil finish.",
        timestamp: "2026-06-25T14:45:00Z"
      },
      {
        id: "m-4",
        sender: "brand",
        text: "Hello! That sounds like an amazing piece. We can craft that using reclaimed black walnut and apply our organic tung-oil finish. Here is a picture of the wood grain we have in stock right now.",
        timestamp: "2026-06-25T17:12:00Z",
        image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80"
      },
      {
        id: "m-5",
        sender: "customer",
        text: "That grain is gorgeous! Please go ahead with it.",
        timestamp: "2026-06-25T18:30:00Z"
      },
      {
        id: "m-6",
        sender: "brand",
        text: "Excellent! The custom sliding walnut box proposal looks great. We have started processing.",
        timestamp: "2026-06-26T10:00:00Z"
      }
    ]
  },
  {
    id: "thread-aether-scents",
    brandId: "aether-scents",
    lastMessageText: "Your inquiry is closed. Let us know if you need anything else.",
    lastMessageTime: "1 week ago",
    unread: false,
    messages: [
      {
        id: "m-7",
        sender: "customer",
        text: "Hello, do you offer bulk pricing or customizable jar labels for your Cedar & Lavender candles? We have a local event on July 15 and would love to buy 20 units. Thanks!",
        timestamp: "2026-06-20T09:15:00Z"
      },
      {
        id: "m-8",
        sender: "brand",
        text: "Hello! Yes, we do offer custom labelling for orders above 15 units. We have sent you a detail invoice to your email address.",
        timestamp: "2026-06-20T11:30:00Z"
      },
      {
        id: "m-9",
        sender: "customer",
        text: "Perfect! Received and paid. Thank you!",
        timestamp: "2026-06-20T12:00:00Z"
      },
      {
        id: "m-10",
        sender: "brand",
        text: "Your inquiry is closed. Let us know if you need anything else.",
        timestamp: "2026-06-20T14:00:00Z"
      }
    ]
  },
  {
    id: "thread-creator-1",
    brandId: "ochre-clay",
    lastMessageText: "I'd love to feature your mugs in my next morning routine vlog!",
    lastMessageTime: "2 hours ago",
    unread: true,
    isCreatorThread: true, 
    creatorName: "Sarah Indigo",
    creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    messages: [
      {
        id: "m-c-1",
        sender: "customer", 
        text: "Hi Ochre Clay! I absolutely love your minimalist style. I'd love to feature your mugs in my next morning routine vlog!",
        timestamp: "2026-07-02T10:30:00Z"
      }
    ]
  }
];

export const MOCK_CREATORS = [
  {
    id: "creator-1",
    name: "Sarah Indigo",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    niches: ["Home Decor", "Slow Living"],
    followers: "45K",
    engagementRate: "4.8%",
    compatibility: 94
  },
  {
    id: "creator-2",
    name: "Liam Woodcraft",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
    niches: ["Woodworking", "Design"],
    followers: "112K",
    engagementRate: "5.2%",
    compatibility: 88
  },
  {
    id: "creator-3",
    name: "Elena Rostova",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    niches: ["Lifestyle", "Aesthetic"],
    followers: "89K",
    engagementRate: "3.9%",
    compatibility: 81
  }
];

export const MOCK_CREATOR_PITCHES = [
  {
    id: "pitch-1",
    brandId: "ochre-clay",
    creatorId: "creator-1",
    creatorName: "Sarah Indigo",
    creatorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
    compensation: "gifting",
    snippet: "I'd love to showcase your speckled mugs in my upcoming 'Slow Sunday' reel series.",
    date: "2026-07-01",
    status: "pending"
  },
  {
    id: "pitch-2",
    brandId: "ochre-clay",
    creatorId: "creator-2",
    creatorName: "Liam Woodcraft",
    creatorAvatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80",
    compensation: "paid",
    snippet: "Looking for unique ceramic props for a coffee table build video sponsor segment.",
    date: "2026-06-29",
    status: "pending"
  }
];

export const MOCK_AI_USAGE = {
  quotaUsed: 42,
  quotaTotal: 100,
  itemsGenerated: 28,
  matchesFound: 15,
  campaignsPlanned: 3,
  trendingCategories: ["Sustainable Living", "Wabi-Sabi", "Hand-poured"],
  fastestGrowing: ["Lumina Glass", "Sienna Botanicals"]
};



export const MOCK_ACTIVE_CREATOR = {
  id: "creator-1",
  name: "Sarah Indigo",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  niches: ["Home Decor", "Slow Living", "Ceramics"],
  bio: "Lifestyle content creator and slow-living advocate. I share stories about handmade goods, intentional living, and the artisans behind the craft.",
  followers: 45000,
  engagementRate: 4.8,
  tags: "slow living, home decor, ceramics, handmade, minimalist",
  instagram: "sarahindigo",
  tiktok: "sarah.indigo",
  youtube: "SarahIndigoChannel",
};

export const MOCK_CREATOR_OUTGOING_PITCHES = [
  {
    id: "out-pitch-1",
    brandId: "ochre-clay",
    brandName: "Ochre Clay Studio",
    brandLogo: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=120&auto=format&fit=crop&q=80",
    compensation: "gifting",
    snippet: "I'd love to showcase your speckled mugs in my upcoming 'Slow Sunday' reel series.",
    date: "2026-07-01",
    status: "pending",
  },
  {
    id: "out-pitch-2",
    brandId: "gaea-weaves",
    brandName: "Gaea Weaves",
    brandLogo: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=120&auto=format&fit=crop&q=80",
    compensation: "paid",
    snippet: "I'd like to create a sponsored 'textile tour' video featuring your handloomed throws.",
    date: "2026-06-25",
    status: "accepted",
  },
  {
    id: "out-pitch-3",
    brandId: "aether-scents",
    brandName: "Aether Scents",
    brandLogo: "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=120&auto=format&fit=crop&q=80",
    compensation: "barter",
    snippet: "Let's do a candle-making ASMR collab — I promote your candles, you send me a curated set.",
    date: "2026-06-20",
    status: "declined",
  },
];

export const MOCK_CREATOR_PORTFOLIO = [
  {
    id: "port-1",
    image: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=400&auto=format&fit=crop&q=80",
    brandName: "Ochre Clay Studio",
    description: "Morning routine reel featuring speckled mugs — 48K views, 2.1K saves.",
  },
  {
    id: "port-2",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400&auto=format&fit=crop&q=80",
    brandName: "Gaea Weaves",
    description: "Sponsored textile tour video — handloomed throws & linen, 32K views.",
  },
  {
    id: "port-3",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80",
    brandName: "Soren Objects",
    description: "Flat-lay product photography for walnut kitchen tools launch — 15K impressions.",
  },
];

export const MOCK_CREATOR_MESSAGES = [
  {
    id: "ct-thread-ochre-clay",
    brandId: "ochre-clay",
    brandName: "Ochre Clay Studio",
    brandLogo: "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=120&auto=format&fit=crop&q=80",
    lastMessageText: "We'd love to send you a set of mugs! Can you confirm your shipping address?",
    lastMessageTime: "3 hours ago",
    unread: true,
    messages: [
      { id: "ct-m1", sender: "creator", text: "Hi Ochre Clay! I'd love to showcase your speckled mugs in my upcoming 'Slow Sunday' reel series.", timestamp: "2026-07-01T09:00:00Z" },
      { id: "ct-m2", sender: "brand", text: "Hi Sarah! We love your content. A Slow Sunday feature sounds perfect for our mugs.", timestamp: "2026-07-01T11:30:00Z" },
      { id: "ct-m3", sender: "brand", text: "We'd love to send you a set of mugs! Can you confirm your shipping address?", timestamp: "2026-07-02T10:00:00Z" },
    ],
  },
  {
    id: "ct-thread-gaea-weaves",
    brandId: "gaea-weaves",
    brandName: "Gaea Weaves",
    brandLogo: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=120&auto=format&fit=crop&q=80",
    lastMessageText: "Looking forward to the textile tour video! Here's our product catalog.",
    lastMessageTime: "1 day ago",
    unread: false,
    messages: [
      { id: "ct-m4", sender: "creator", text: "Hi Gaea Weaves! I'd like to create a sponsored 'textile tour' video featuring your handloomed throws.", timestamp: "2026-06-25T14:00:00Z" },
      { id: "ct-m5", sender: "brand", text: "Sarah! We'd be thrilled. Let's discuss the scope and compensation.", timestamp: "2026-06-25T16:30:00Z" },
      { id: "ct-m6", sender: "creator", text: "Great! I was thinking a 5-minute YouTube video + 3 Instagram Reels. My rate is $500 for the package.", timestamp: "2026-06-26T09:00:00Z" },
      { id: "ct-m7", sender: "brand", text: "Looking forward to the textile tour video! Here's our product catalog.", timestamp: "2026-06-27T10:00:00Z" },
    ],
  },
];

export const MOCK_BRAND_MATCHES = [
  { ...MOCK_BRANDS[0], compatibility: 94 }, 
  { ...MOCK_BRANDS[2], compatibility: 88 }, 
  { ...MOCK_BRANDS[4], compatibility: 85 }, 
  { ...MOCK_BRANDS[1], compatibility: 79 }, 
  { ...MOCK_BRANDS[5], compatibility: 72 }, 
];
