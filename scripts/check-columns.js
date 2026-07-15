const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from('MessageThread')
    .select('id, status, initiated_by')
    .limit(1);

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Success! Data:", data);
  }
}

check();
