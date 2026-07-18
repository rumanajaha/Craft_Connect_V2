import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export async function POST(request) {
  try {
    let user;
    try {
      user = await authenticate(request);
    } catch (authError) {
      console.error("Upload Customer Avatar auth error:", authError.message || authError);
      return NextResponse.json({ error: 'Authentication failed', details: authError.message || String(authError) }, { status: 401 });
    }

    if (!user || user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Secure the upload path using the user's auth ID as required by Supabase storage policies
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = `${user.id}/${fileName}`;

    const supabase = getSupabaseRouteClient();

    // Upload file to 'customer-avatars' bucket
    const { error: uploadError } = await supabase.storage
      .from('customer-avatars')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: 'Failed to upload image to storage', details: uploadError.message }, { status: 500 });
    }

    // Retrieve public URL
    const { data: urlData } = supabase.storage
      .from('customer-avatars')
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      return NextResponse.json({ error: 'Failed to retrieve public URL' }, { status: 500 });
    }

    // Update the CustomerProfile table with the new avatarUrl
    const { error: updateError } = await supabase
      .from('CustomerProfile')
      .update({ avatar_url: urlData.publicUrl })
      .eq('owner_user_id', user.id);

    if (updateError) {
      console.error("Failed to update avatar_url in DB:", updateError.message);
      return NextResponse.json({ error: 'Failed to update profile avatar URL in database', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      avatarUrl: urlData.publicUrl
    });

  } catch (error) {
    console.error("Customer Avatar Upload error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
