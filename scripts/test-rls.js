const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
async function test() {
  const supabaseAuth = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
    email: 'testbrand1@example.com',
    password: '12341234'
  });
  
  if (authError) { console.error(authError); return; }
  
  // 1. Insert thread as Admin
  const { data: insertData } = await supabaseAdmin
    .from("MessageThread")
    .insert({
      participant_a_id: authData.user.id,
      participant_b_id: "22222222-2222-2222-2222-222222222222",
      last_message_at: new Date().toISOString(),
      status: 'pending',
      initiated_by: authData.user.id
    })
    .select()
    .single();
    
  console.log("Admin inserted:", insertData.id);
  
  // 2. Select thread as User
  const { data, error } = await supabaseAuth
    .from("MessageThread")
    .select("*")
    .or(`participant_a_id.eq.${authData.user.id},participant_b_id.eq.${authData.user.id}`);
    
  console.log("User selected:", data.map(d => d.id));
}
test();
