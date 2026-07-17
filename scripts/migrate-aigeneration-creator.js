const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to Neon DB.");

    await client.query(`
      ALTER TABLE "AIGeneration"
      ADD COLUMN IF NOT EXISTS creator_id uuid REFERENCES "CreatorProfile"(id);
    `);

    console.log("Migration successful: added creator_id to AIGeneration.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
