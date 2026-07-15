/**
 * seed-brands.js — Create 5 test brand-owner accounts in Supabase.
 *
 * Usage:  node scripts/seed-brands.js
 *
 * This is a standalone CommonJS script. It loads .env.local via dotenv
 * and creates its own Supabase admin client (no Next.js path aliases).
 *
 * Safe to re-run: existing users are detected and skipped.
 */

const { createClient } = require("@supabase/supabase-js");
const dotenv = require("dotenv");
const path = require("path");

// ── Load environment variables from .env.local ──────────────────────────────
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌  Missing environment variables.\n" +
    "    Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY\n" +
    "    are defined in .env.local at the project root."
  );
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Mock brand data ─────────────────────────────────────────────────────────
const BRANDS = [
  {
    email: "testbrand1@example.com",
    brand_name: "Ochre Clay Studio",
    category: "Ceramics",
    location: "Kyoto, Japan",
    description:
      "Handcrafted stoneware and porcelain pieces inspired by wabi-sabi aesthetics. Each item is wheel-thrown, glazed, and wood-fired in small batches.",
    ai_tags: ["ceramics", "handmade pottery", "wabi-sabi", "stoneware"],
  },
  {
    email: "testb@example.com",
    brand_name: "Ember & Wick Co.",
    category: "Candles",
    location: "Portland, OR",
    description:
      "Small-batch soy candles poured by hand using sustainably sourced fragrances. Known for seasonal collections and wooden-wick designs.",
    ai_tags: ["soy candles", "sustainable", "home fragrance", "wooden wick"],
  },
  {
    email: "testbrand3@example.com",
    brand_name: "Tanner & Hide",
    category: "Leatherwork",
    location: "Austin, TX",
    description:
      "Vegetable-tanned leather goods — wallets, belts, and bags — hand-stitched with waxed linen thread. Built to age beautifully.",
    ai_tags: ["leather goods", "vegetable-tanned", "handstitched", "EDC"],
  },
  {
    email: "testbrand4@example.com",
    brand_name: "Loom & Thread",
    category: "Textiles",
    location: "Jaipur, India",
    description:
      "Block-printed and hand-woven textiles using natural dyes. Collaborates directly with artisan cooperatives across Rajasthan.",
    ai_tags: ["block print", "handwoven", "natural dyes", "artisan textiles"],
  },
  {
    email: "testbrand5@example.com",
    brand_name: "Wildroot Apothecary",
    category: "Skincare",
    location: "Asheville, NC",
    description:
      "Plant-based skincare formulated with wild-harvested botanicals. Small-batch serums, balms, and botanical face oils.",
    ai_tags: ["botanical skincare", "plant-based", "small batch", "apothecary"],
  },
];

const PASSWORD = "12341234";

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Check whether a user with the given email already exists.
 * Uses the admin listUsers API with a per-page scan.
 * Returns the existing user object, or null.
 */
async function findExistingUser(email) {
  // Supabase admin API doesn't support email filter directly in listUsers,
  // so we paginate through all users. For small test sets this is fine.
  let page = 1;
  const perPage = 1000;
  while (true) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) throw error;
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (match) return match;
    if (data.users.length < perPage) break; // last page
    page++;
  }
  return null;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱  CraftConnect brand-owner seed script\n");

  let succeeded = 0;
  let skipped = 0;
  let failed = 0;

  for (const brand of BRANDS) {
    try {
      // ── 1. Check for existing user ──────────────────────────────────────
      const existing = await findExistingUser(brand.email);

      let userId;

      if (existing) {
        console.log(
          `⏭️   Skipped (already exists): ${brand.email}  →  id: ${existing.id}`
        );
        userId = existing.id;
        skipped++;

        // Even if the user exists, make sure the profile row exists
        const { data: existingProfile } = await supabaseAdmin
          .from("BrandProfile")
          .select("id")
          .eq("owner_user_id", userId)
          .maybeSingle();

        if (existingProfile) {
          // Profile already exists too — nothing to do
          continue;
        }
        // Otherwise fall through to insert the profile row below
        console.log(
          `   ↳ Auth user exists but BrandProfile row is missing — inserting…`
        );
      } else {
        // ── 2. Create auth user ─────────────────────────────────────────
        const { data: createData, error: createError } =
          await supabaseAdmin.auth.admin.createUser({
            email: brand.email,
            password: PASSWORD,
            email_confirm: true,
            user_metadata: {
              role: "brand",
              display_name: brand.brand_name,
            },
          });

        if (createError) {
          // Handle "already registered" as a skip rather than failure
          const msg = createError.message || "";
          if (
            msg.toLowerCase().includes("already") ||
            msg.toLowerCase().includes("exists") ||
            msg.toLowerCase().includes("registered")
          ) {
            console.log(
              `⏭️   Skipped (already registered): ${brand.email}`
            );
            skipped++;
            continue;
          }
          throw createError;
        }

        userId = createData.user.id;
        console.log(
          `✅  Created auth user: ${brand.email}  →  id: ${userId}`
        );
        succeeded++;
      }

      // ── 3. Insert BrandProfile row ──────────────────────────────────
      const { error: profileError } = await supabaseAdmin
        .from("BrandProfile")
        .insert({
          owner_user_id: userId,
          brand_name: brand.brand_name,
          category: brand.category,
          location: brand.location,
          description: brand.description,
          ai_tags: brand.ai_tags,
        });

      if (profileError) {
        console.error(
          `   ⚠️  BrandProfile insert failed for ${brand.email}: ${profileError.message}`
        );
        // Count as partial failure — auth user was created but profile wasn't
        failed++;
        succeeded = Math.max(0, succeeded - 1); // undo the success count
      } else {
        console.log(
          `   ↳ BrandProfile created: ${brand.brand_name} (${brand.category}, ${brand.location})`
        );
      }
    } catch (err) {
      console.error(`❌  Failed: ${brand.email}  →  ${err.message}`);
      failed++;
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────
  console.log("\n" + "─".repeat(56));
  console.log(
    `🏁  Done.  Created: ${succeeded}  |  Skipped: ${skipped}  |  Failed: ${failed}`
  );
  console.log("─".repeat(56));

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("💥  Unexpected error:", err);
  process.exit(1);
});
