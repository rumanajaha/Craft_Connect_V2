import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';
import { getCustomerProfile } from '@/lib/getCustomerProfile';

const MAX_BYTES = 2 * 1024 * 1024; // 2MB

export async function POST(request) {
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

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File exceeds 2MB size limit' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = (file.name || 'avatar.jpg').replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${user.id}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('customer-avatars')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('Customer avatar upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload image to storage' }, { status: 500 });
    }

    const { data: urlData } = supabase.storage
      .from('customer-avatars')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return NextResponse.json({ error: 'Failed to retrieve public URL' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      avatarUrl: urlData.publicUrl,
    });
  } catch (error) {
    console.error('POST /api/customer/profile/upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

