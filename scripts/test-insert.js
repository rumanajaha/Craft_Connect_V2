const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
async function testInsert() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data, error } = await supabase
    .from("MessageThread")
    .insert({
      participant_a_id: "00000000-0000-0000-0000-000000000000",
      participant_b_id: "11111111-1111-1111-1111-111111111111",
      last_message_at: new Date().toISOString(),
      status: 'pending',
      initiated_by: "00000000-0000-0000-0000-000000000000"
    })
    .select()
    .single();

  console.log("Insert Result:", { data, error });
}
testInsert();
