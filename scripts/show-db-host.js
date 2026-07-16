require('dotenv').config({ path: '.env.local', override: true });
const url = require('url');

const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  const parsed = url.parse(dbUrl);
  console.log("Database Host:", parsed.hostname);
} else {
  console.log("DATABASE_URL is not set.");
}
