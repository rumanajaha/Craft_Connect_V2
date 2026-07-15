const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
async function testGet() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Just test the date logic
  const thread = { created_at: '2026-07-15T16:11:05.551668+00:00' };
  const lastMsg = null;

  const dateToFormat = lastMsg ? new Date(lastMsg.created_at) : new Date(thread.created_at);
  const now = new Date();
  const diffMs = now - dateToFormat;
  const diffMin = Math.round(diffMs / 60000);
  const diffHr = Math.round(diffMs / 3600000);

  let lastMessageTime = "";
  if (diffMin < 60) {
    lastMessageTime = diffMin <= 1 ? "Just now" : `${diffMin}m ago`;
  } else if (diffHr < 24) {
    lastMessageTime = `${diffHr}h ago`;
  } else if (diffHr < 48) {
    lastMessageTime = "Yesterday";
  } else {
    lastMessageTime = dateToFormat.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  }
  
  console.log("lastMessageTime:", lastMessageTime);
}
testGet();
