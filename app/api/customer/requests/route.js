import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { getCustomerProfile } from '@/lib/getCustomerProfile';
import { findOrCreateThread } from '@/lib/messages';
import { createNotification, resolveSenderName } from '@/lib/notify';

export async function GET(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();
    const customer = await getCustomerProfile(user.id, supabase);
    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    const { data: rows, error } = await supabase
      .from('CustomRequest')
      .select(
        'id, brand_id, title, request_type, message, budget, deadline, status, created_at, BrandProfile(id, owner_user_id, brand_name)'
      )
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('GET /api/customer/requests error:', error);
      return NextResponse.json({ error: 'Failed to load requests' }, { status: 500 });
    }

    // Resolve thread IDs between customer and each brand owner for direct message linking
    const brandOwnerIds = [
      ...new Set((rows || []).map((r) => r.BrandProfile?.owner_user_id).filter(Boolean)),
    ];

    const threadByOtherUser = new Map();
    if (brandOwnerIds.length > 0) {
      const { data: threads } = await supabase
        .from('MessageThread')
        .select('id, participant_a_id, participant_b_id')
        .or(`participant_a_id.eq.${user.id},participant_b_id.eq.${user.id}`);

      (threads || []).forEach((t) => {
        const otherId = t.participant_a_id === user.id ? t.participant_b_id : t.participant_a_id;
        threadByOtherUser.set(otherId, t.id);
      });
    }

    const requests = (rows || []).map((row) => ({
      id: row.id,
      brandId: row.brand_id,
      brandName: row.BrandProfile?.brand_name || 'Brand',
      title: row.title || row.request_type || 'Custom Request',
      requestType: row.request_type || 'Custom Product',
      status: row.status || 'pending',
      budget: row.budget || null,
      deadline: row.deadline || null,
      createdAt: row.created_at,
      threadId: row.BrandProfile?.owner_user_id
        ? threadByOtherUser.get(row.BrandProfile.owner_user_id) || null
        : null,
    }));

    return NextResponse.json({ requests });
  } catch (err) {
    console.error('GET /api/customer/requests error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await authenticate(request);
    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { brandId, title, message, requestType, budget, deadline } = body || {};

    if (!brandId || !message?.trim()) {
      return NextResponse.json(
        { error: 'brandId and message are required' },
        { status: 400 }
      );
    }

    const cleanType = (requestType || 'Custom Product').trim();
    const cleanTitle = (title?.trim() || `${cleanType} Request`).slice(0, 140);
    const cleanMessage = message.trim();

    const supabase = getSupabaseRouteClient();
    const customer = await getCustomerProfile(user.id, supabase);
    if (!customer) {
      return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
    }

    // Look up BrandProfile via session client
    const { data: brand, error: brandError } = await supabase
      .from('BrandProfile')
      .select('id, owner_user_id, brand_name')
      .eq('id', brandId)
      .maybeSingle();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // 1. Insert CustomRequest (status 'pending') with the session client (RLS)
    const { data: createdRequest, error: insertError } = await supabase
      .from('CustomRequest')
      .insert({
        customer_id: customer.id,
        brand_id: brand.id,
        title: cleanTitle,
        request_type: cleanType,
        message: cleanMessage,
        budget: budget?.trim() || null,
        deadline: deadline?.trim() || null,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError || !createdRequest) {
      console.error('CustomRequest insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create custom request' }, { status: 500 });
    }

    // 2. Find-or-create MessageThread between customer and brand.owner_user_id (cross-user admin helper)
    const threadId = await findOrCreateThread(user.id, brand.owner_user_id);

    // 3. Insert Message containing marker "[CUSTOM_REQUEST] title" and request details
    const msgLines = [
      `[CUSTOM_REQUEST] ${cleanTitle}`,
      `Type: ${cleanType}`,
      budget?.trim() ? `Budget: ${budget.trim()}` : null,
      deadline?.trim() ? `Deadline: ${deadline.trim()}` : null,
      '',
      cleanMessage,
    ].filter((line) => line !== null);

    const { error: msgError } = await supabaseAdmin.from('Message').insert({
      thread_id: threadId,
      sender_id: user.id,
      body: msgLines.join('\n'),
    });

    if (msgError) {
      console.error('Failed to insert custom request message:', msgError.message);
    }

    // 4. Update thread last_message_at
    await supabaseAdmin
      .from('MessageThread')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', threadId);

    // 5. Notify the brand owner via lib/notify.js
    const customerName = customer.display_name || (await resolveSenderName(user.id, user.email));
    await createNotification({
      userId: brand.owner_user_id,
      type: 'custom_request',
      title: 'New Custom Request',
      body: `${customerName} sent a request: ${cleanTitle}`,
      relatedEntityId: createdRequest.id,
      link: `/brand/messages?thread=${threadId}`,
    });

    return NextResponse.json(
      {
        requestId: createdRequest.id,
        threadId,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('POST /api/customer/requests error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

