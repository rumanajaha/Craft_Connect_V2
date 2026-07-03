# FRONTEND DATA CONTRACT — CraftConnect
> **Audience**: Backend teammate wiring Supabase + Gemini API to the existing frontend.  
> **Purpose**: One-stop reference for mock→real data mapping, TODO punch list, and component ownership.

---

## 1. Mock Data Files in Use

| File | Type | What it holds |
|------|------|---------------|
| `lib/mockData.js` | Static export | MOCK_BRANDS, MOCK_PRODUCTS, MOCK_REQUESTS, MOCK_COLLABS, MOCK_MESSAGES, MOCK_CREATORS, MOCK_CREATOR_PITCHES, MOCK_AI_USAGE, MOCK_ACTIVE_CREATOR, MOCK_CREATOR_OUTGOING_PITCHES, MOCK_CREATOR_PORTFOLIO, MOCK_CREATOR_MESSAGES, MOCK_BRAND_MATCHES |
| `lib/brandDataStore.jsx` | React Context | Active brand's profile (brandInfo) and products array, persisted to localStorage. Written by AI Studio tools, read by Customer brand profile view. |
| `lib/aiUsageStore.jsx` | React Context | Per-tool usage counts and `isPro` flag, persisted to localStorage. Drives the free-trial gate (3 uses/tool). |
| `lib/collabStore.jsx` | React Context | Incoming pitches (brand view) and outgoing pitches (creator view). In-memory; resets on refresh. |
| `lib/feedRanking.js` | Pure function | Client-side feed ranking logic + mock initial feed items. Approximates server-side FeedCache query. |
| `lib/gemini.js` | Stub | `export default null` — no real Gemini client yet |
| `lib/supabase.js` | Stub | `export default null` — no real Supabase client yet |
| `lib/prisma.js` | Stub | `export default null` — no Prisma client yet |

---

## 2. Entity Shape Mapping (Mock → Real Schema)

### `Brand`
| Mock field | Type | Real DB column | Notes |
|---|---|---|---|
| `id` | string (slug) | `brands.id` (uuid) | **MISMATCH**: mock uses slugs like `"ochre-clay"`, real should use UUID. Frontend reads `brand.id` for URL params. |
| `name` | string | `brands.name` | OK |
| `logo` | Unsplash URL | `brands.logo_url` | **Rename**: `logo` -> `logo_url` |
| `banner` | Unsplash URL | `brands.banner_url` | **Rename**: `banner` -> `banner_url` |
| `category` | string | `brands.category` | OK |
| `location` | string | `brands.location` | OK |
| `rating` | float | Derived from reviews | Not stored directly |
| `reviewsCount` | int | `brands.reviews_count` | **Rename**: camelCase vs snake_case |
| `trustScore` | int | `brands.trust_score` | **Rename** |
| `website` | URL string | `brands.website_url` | **Rename** |
| `about` | string | `brands.about` | OK |
| `videoUrl` | URL string | `brands.video_url` | **Rename**: `videoUrl` -> `video_url` |

### `Product`
| Mock field | Type | Real DB column | Notes |
|---|---|---|---|
| `id` | string ("p1") | `products.id` (uuid) | **MISMATCH**: mock uses "p1" style IDs |
| `brandId` | string (slug) | `products.brand_id` (uuid FK) | **Rename** + ID type mismatch |
| `name` | string | `products.name` | OK |
| `price` | number | `products.price` (decimal) | OK |
| `image` | Unsplash URL | `products.image_url` | **Rename** |
| `inStock` | boolean | `products.in_stock` | **Rename** |
| `description` | string (optional) | `products.description` | Added by AI Studio SEO tool |

### `CollabRequest` (pitch from creator to brand)
| Mock field | Type | Real DB column | Notes |
|---|---|---|---|
| `id` | string | `collab_requests.id` (uuid) | Type mismatch |
| `brandId` | string slug | `collab_requests.brand_id` (uuid FK) | **Rename** + type |
| `creatorId` | string | `collab_requests.creator_id` (uuid FK) | **Rename** |
| `creatorName` | string | Join from `users.display_name` | Remove from stored row — should be a join |
| `creatorAvatar` | URL | Join from `users.avatar_url` | Remove from stored row — should be a join |
| `compensation` | "gifting" | "paid" | "barter" | `collab_requests.compensation_type` | **Rename** |
| `snippet` | string | `collab_requests.message` | **Rename** |
| `date` | date string | `collab_requests.created_at` | **Rename** |
| `status` | "pending" | "accepted" | "declined" | `collab_requests.status` | OK |

### `Creator`
| Mock field | Type | Real DB column | Notes |
|---|---|---|---|
| `id` | string | `users.id` (uuid) | Type mismatch |
| `name` | string | `users.display_name` | **Rename** |
| `avatar` | URL | `users.avatar_url` | **Rename** |
| `niches` | string[] | `creator_profiles.niches` (array) | OK shape |
| `followers` | string ("45K") | `creator_profiles.followers_count` (int) | **MISMATCH**: mock stores human-readable string; real should be int |
| `engagementRate` | string ("4.8%") | `creator_profiles.engagement_rate` (float) | **MISMATCH**: mock stores string with %; real should be float |
| `compatibility` | int 0-100 | Computed server-side | Not stored — computed by matching algorithm |
| `bio` | string | `creator_profiles.bio` | OK |
| `tags` | string (comma-sep) | `creator_profiles.tags` | OK |
| `instagram/tiktok/youtube` | flat string keys | `creator_profiles.social_handles` (jsonb) | **Shape change**: mock uses flat keys, real should use JSONB object |

### `Message / Thread`
| Mock field | Type | Real DB column | Notes |
|---|---|---|---|
| `id` | string ("thread-ochre-clay") | `message_threads.id` (uuid) | **MISMATCH** |
| `brandId` | slug | `message_threads.brand_id` (uuid FK) | **Rename** + type |
| `messages[]` | nested array | `messages` table (FK to thread_id) | **Structure change**: real DB uses separate messages table, not nested array |
| `sender` | "customer" | "brand" | "creator" | `messages.sender_id` (uuid FK) | **MISMATCH**: mock uses role string, real uses user ID |
| `lastMessageText` | string | Derived (latest message) | Not stored separately |
| `unread` | boolean | read_receipts table | Needs explicit read-receipt design |

### `AIGeneration`
Not stored as a persistent entity in the mock — all AI outputs live in `brandDataStore` (React Context + localStorage).
When backend is live, persist to an `ai_generations` table:
- `id`, `brand_id`, `tool_key`, `input_params (jsonb)`, `output_text`, `created_at`

---

## 3. Backend Punch List — All TODOs by File

### `lib/brandDataStore.jsx`
- [ ] `setBrandAbout()` — **PATCH `/api/brand/about`** — currently writes to localStorage
- [ ] `updateProductDescription()` — **PATCH `/api/products/:id`** with { description } — currently writes to localStorage
- [ ] `setBrandInfo()` — **PATCH `/api/brand/profile`** with full brand info object

### `lib/collabStore.jsx`
- [ ] `addPitch()` — **POST `/api/collab-requests`** — currently in-memory only, resets on refresh

### `components/creator/ProposeCollabModal.jsx`
- [ ] Line 27: pitch submit handler — **POST `/api/collab-requests`**

### `app/(dashboard)/brand/ai-studio/[tool]/page.jsx`
- [ ] Line 162: generate button — **POST `/api/ai/generate`** with { tool, inputs } — replace setTimeout mock
- [ ] Line 464: generation handler — **wire to Gemini API** (real streaming call)
- [ ] Line 225: brand story publish — **PATCH `/api/brand/:id`** with { about: result }
- [ ] Line 244: product desc publish — **PATCH `/api/products/:id`** with { description: result }
- [ ] Line 476: setBrandAbout call — see brandDataStore above
- [ ] Line 484: updateProductDescription call — see brandDataStore above

### `components/brand/AIToolCard.jsx`
- [ ] Line 18: tool trigger — **POST `/api/ai/generate`** (replace mock)

### `components/brand/ProductFormModal.jsx`
- [ ] Line 145: generation — **POST `/api/ai/generate`** (replace mock setTimeout)

### `app/(dashboard)/brand/messages/page.jsx`
- [ ] Line 245: "Smart reply" button — **POST `/api/ai/smart-reply`** with thread context

### `app/(dashboard)/brand/ai-studio/upgrade/page.jsx`
- [ ] Line 16: upgrade button handler — **POST `/api/payments/checkout`** — wire to Stripe

### `app/(dashboard)/brand/profile/page.jsx`
- [ ] Line 61: "Message" button — **POST `/api/message-threads`** to create thread in DB

### `app/(dashboard)/customer/settings/page.jsx`
- [ ] Line 206: password change — **`supabase.auth.updateUser({ password: newPwd })`**
- [ ] Line 217: account deletion — **`supabase.auth.admin.deleteUser(userId)` + cascade delete**

### `app/(dashboard)/customer/brand/[id]/page.jsx`
- [ ] Line 64: "Message" button — **POST `/api/message-threads`**
- [ ] Line 251: "Save" button — **POST `/api/saved-brands`** with { brand_id }

### `app/(dashboard)/creator/settings/page.jsx`
- [ ] Line 67: profile save handler — **PATCH `/api/creator/profile`**

---

## 4. State Type: Context vs Static Array

| Store | State Type | Resets on Refresh? | Backend Swap Approach |
|---|---|---|---|
| `BrandDataProvider` | React Context + localStorage | No (localStorage persists) | Replace localStorage reads/writes with Supabase queries |
| `AIUsageProvider` | React Context + localStorage | No (localStorage persists) | Replace with `ai_usage` table queries; keep in-memory counter as optimistic update |
| `CollabProvider` | React Context (in-memory only) | YES — resets every refresh | Replace useState initial values with `GET /api/collab-requests`; addPitch with POST |
| `MOCK_BRANDS`, etc. (mockData.js) | Static JS array | N/A | Replace import with fetch in each page component |
| `feedRanking.js` initial items | Static JS array | N/A | Replace with `GET /api/feed`; keep ranking logic client-side or move server-side |

---

## 5. Cross-Role Read Dependencies

These pairs must share real DB endpoints — they currently only work because they share the same browser session via Context or localStorage.

| Writer Role | Action | Write Location | Reader Role | Read Location |
|---|---|---|---|---|
| Brand | Publishes AI brand story | `BrandDataContext.setBrandAbout()` -> localStorage | Customer | `customer/brand/[id]/page.jsx` reads `useBrandData().brandAbout` |
| Brand | Updates product SEO description | `BrandDataContext.updateProductDescription()` -> localStorage | Customer | Discover page product grid reads `useBrandData().products` |
| Brand | Adds/edits products | `BrandDataContext.setProducts()` -> localStorage | Customer | Discover page reads `useBrandData().products` |
| Creator | Submits collab pitch | `CollabProvider.addPitch()` -> in-memory | Brand | Brand dashboard collab-requests table reads `useCollab().incomingPitches` |
| Brand | Accepts/declines pitch | `setIncomingPitches()` local state | Creator | Creator dashboard reads `useCollab().outgoingPitches` |
| Brand | Publishes AI content | `addFeedUpdate()` -> localStorage `cc_brand_updates` | Customer | Feed page reads localStorage via `feedRanking.js` |

---

## 6. Component Map

### Brand Settings
| Component | File | Owns/reads | Needs backend for |
|---|---|---|---|
| `BrandSettingsPage` | `app/(dashboard)/brand/settings/page.jsx` | Tab routing, save trigger, dirty state | Orchestrator only |
| `BrandProfileTab` | `components/brand/settings/ProfileTab.jsx` | `BrandDataContext.brandInfo`, AI modal states | PATCH `/api/brand/profile` |
| `BrandSecurityTab` | `components/brand/settings/SecurityTab.jsx` | Local password form state | `supabase.auth.updateUser({ password })` |
| `BrandNotificationsTab` | `components/brand/settings/NotificationsTab.jsx` | Local notifications state | PATCH `/api/brand/notification-prefs` |

### Customer Settings
| Component | File | Owns/reads | Needs backend for |
|---|---|---|---|
| `CustomerSettingsPage` | `app/(dashboard)/customer/settings/page.jsx` | Tab routing, global save | Orchestrator only |
| `CustomerProfileTab` | `components/customer/settings/ProfileTab.jsx` | Profile form state, avatar | PATCH `/api/customer/profile`, storage upload |
| `CustomerSecurityTab` | `components/customer/settings/SecurityTab.jsx` | Password form state | `supabase.auth.updateUser`, account delete |
| `CustomerNotificationsTab` | `components/customer/settings/NotificationsTab.jsx` | Notifications state | PATCH `/api/customer/notification-prefs` |

### AI Studio (Brand)
| Component | File | Owns/reads | Needs backend for |
|---|---|---|---|
| `BrandAIToolPage` | `app/(dashboard)/brand/ai-studio/[tool]/page.jsx` | Tool config, generation state, output | POST `/api/ai/generate` + Gemini API |
| `generateContent()` | Same file ~line 464 | `aiUsageStore`, `brandDataStore` | Replace `setTimeout` with real Gemini streaming call |

### Collab Requests
| Component | File | Owns/reads | Needs backend for |
|---|---|---|---|
| Brand dashboard | `app/(dashboard)/brand/page.jsx` | `useCollab().incomingPitches` | GET `/api/collab-requests?role=brand`, PATCH `.../accept`, `.../reject` |
| Creator dashboard | `app/(dashboard)/creator/page.jsx` | `useCollab().outgoingPitches` | GET `/api/collab-requests?role=creator` |

---

*Last updated: 2026-07-03 by Antigravity AI after frontend build completion.*
