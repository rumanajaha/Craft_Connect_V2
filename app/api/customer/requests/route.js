import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { createNotification } from '@/lib/notify';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { findOrCreateThread } from '@/lib/messages';

function parseRequestMessage(msgText) {
  const result = {
    subject: 'Custom Request',
    type: 'Custom Request',
    budget: '',
    deadline: '',
    description: msgText || ''
  };

  if (!msgText) return result;

  const subjectMatch = msgText.match(/^Subject:\s*(.*)$/m);
  if (subjectMatch) result.subject = subjectMatch[1].trim();

  const typeMatch = msgText.match(/^Type:\s*(.*)$/m);
  if (typeMatch) result.type = typeMatch[1].trim();

  const budgetMatch = msgText.match(/^Budget:\s*(.*)$/m);
  if (budgetMatch) result.budget = budgetMatch[1].trim();

  const deadlineMatch = msgText.match(/^Deadline:\s*(.*)$/m);
  if (deadlineMatch) result.deadline = deadlineMatch[1].trim();

  const descIndex = msgText.indexOf("Description:\n");
  if (descIndex !== -1) {
    result.description = msgText.substring(descIndex + "Description:\n".length).trim();
  }

  return result;
}

export async function GET(request) {
  try {
    let user;
    try {
      user = await authenticate(request);
    } catch (authError) {
      console.error("GET customer requests auth error:", authError.message || authError);
      return NextResponse.json({ error: 'Authentication failed', details: authError.message || String(authError) }, { status: 401 });
    }

    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();

    // 1. Get customer's CustomerProfile.id
    const { data: customerProfile, error: profileError } = await supabase
      .from('CustomerProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (profileError || !customerProfile) {
      console.error("Failed to retrieve CustomerProfile ID in GET requests:", profileError?.message);
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    // Query CustomRequests
    const { data: requests, error } = await supabase
      .from('CustomRequest')
      .select(`
        id,
        created_at,
        message,
        status,
        brand_id,
        BrandProfile:brand_id (
          brand_name,
          owner_user_id
        )
      `)
      .eq('customer_id', customerProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("GET customer requests error:", error.message);
      return NextResponse.json({ error: 'Failed to retrieve recent requests', details: error.message }, { status: 500 });
    }

    // Query MessageThreads to map the correct links
    const { data: threads } = await supabase
      .from('MessageThread')
      .select('id, participant_a_id, participant_b_id')
      .or(`participant_a_id.eq.${user.id},participant_b_id.eq.${user.id}`);

    const formattedRequests = (requests || []).map(req => {
      const parsed = parseRequestMessage(req.message);
      const brandOwnerId = req.BrandProfile?.owner_user_id;
      const thread = (threads || []).find(t => 
        (t.participant_a_id === user.id && t.participant_b_id === brandOwnerId) ||
        (t.participant_b_id === user.id && t.participant_a_id === brandOwnerId)
      );

      return {
        id: req.id,
        createdAt: req.created_at,
        subject: parsed.subject || 'Custom Request',
        type: parsed.type || 'Custom Request',
        status: req.status || 'pending',
        brandId: req.brand_id,
        brandName: req.BrandProfile?.brand_name || 'Unknown Brand',
        threadId: thread?.id || ''
      };
    });

    return NextResponse.json({ requests: formattedRequests });

  } catch (err) {
    console.error("GET customer requests route error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    let user;
    try {
      user = await authenticate(request);
    } catch (authError) {
      console.error("POST customer requests auth error:", authError.message || authError);
      return NextResponse.json({ error: 'Authentication failed', details: authError.message || String(authError) }, { status: 401 });
    }

    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { brandId, title, message, budget, deadline, requestType } = body;

    if (!brandId || !message) {
      return NextResponse.json({ error: 'brandId and message are required' }, { status: 400 });
    }

    const supabase = getSupabaseRouteClient();

    // 1. Get customer's CustomerProfile.id
    const { data: customerProfile, error: profileError } = await supabase
      .from('CustomerProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (profileError || !customerProfile) {
      console.error("Failed to retrieve CustomerProfile ID:", profileError?.message);
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    // 2. Fetch BrandProfile to get owner_user_id for notifications
    const { data: brandProfile, error: brandError } = await supabase
      .from('BrandProfile')
      .select('owner_user_id, brand_name')
      .eq('id', brandId)
      .single();

    if (brandError || !brandProfile) {
      console.error("Failed to retrieve BrandProfile owner ID:", brandError?.message);
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    // Format all custom request details as a structured plain text block stored in the message column
    const formattedMessage = `Subject: ${title || 'Custom Request'}
Type: ${requestType || 'Custom Product'}
Budget: ${budget || 'Not specified'}
Deadline: ${deadline || 'Not specified'}

Description:
${message}`;

    // 3. Insert CustomRequest using supabaseAdmin to bypass RLS policies
    const { data: newRequest, error: insertError } = await supabaseAdmin
      .from('CustomRequest')
      .insert({
        customer_id: customerProfile.id,
        brand_id: brandId,
        message: formattedMessage,
        status: 'pending'
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert CustomRequest:", insertError.message);
      return NextResponse.json({ error: 'Failed to submit request', details: insertError.message }, { status: 500 });
    }

    // 4. Create or find the MessageThread and send the request as the first message
    let threadId = null;
    try {
      threadId = await findOrCreateThread(user.id, brandProfile.owner_user_id);

      // Insert the formatted request as a real Message so both parties see it
      await supabaseAdmin
        .from('Message')
        .insert({
          thread_id: threadId,
          sender_id: user.id,
          body: formattedMessage,
        });

      // Update last_message_at on the thread
      await supabaseAdmin
        .from('MessageThread')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', threadId);
    } catch (threadErr) {
      console.error("Failed to create thread or send message:", threadErr);
      // Non-fatal — request was already saved
    }

    // 5. Send notification to Brand Owner using service-role helper
    try {
      await createNotification({
        userId: brandProfile.owner_user_id,
        type: 'custom_request',
        title: 'New Custom Request',
        body: `You received a new custom request from a customer: "${title || (requestType || 'Custom Product')}".`,
        relatedEntityId: newRequest.id,
        link: '/brand/messages'
      });
    } catch (notifErr) {
      console.error("Failed to trigger brand owner notification:", notifErr);
    }

    return NextResponse.json({
      success: true,
      request: newRequest,
      threadId
    });

  } catch (err) {
    console.error("POST customer requests route error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
