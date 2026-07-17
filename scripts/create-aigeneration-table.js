const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to Neon DB.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS "AIGeneration" (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_id uuid REFERENCES "BrandProfile"(id),
        creator_id uuid REFERENCES "CreatorProfile"(id),
        tool_name varchar(100) NOT NULL,
        input_json jsonb,
        output_text text,
        created_at timestamptz DEFAULT now()
      );
    `);

    console.log("Successfully created 'AIGeneration' table.");
  } catch (err) {
    console.error("Failed to create table:", err);
  } finally {
    await client.end();
  }
}

createTable();
