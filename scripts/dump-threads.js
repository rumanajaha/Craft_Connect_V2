const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function dumpAll() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: threads, error: threadsError } = await supabase
    .from("MessageThread")
    .select("*");
    
  if (threadsError) {
    console.error("Error:", threadsError);
    return;
  }
  
  console.log(`--- Total Threads in DB: ${threads.length} ---`);
  for (const t of threads) {
    console.log(`Thread ${t.id}:`);
    console.log(`  participant_a_id: ${t.participant_a_id}`);
    console.log(`  participant_b_id: ${t.participant_b_id}`);
    console.log(`  initiated_by: ${t.initiated_by}`);
    console.log(`  status: ${t.status}`);
  }
}
dumpAll();
