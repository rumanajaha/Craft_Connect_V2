import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export async function POST(request) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'BRANDOWNER') {
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
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('brand-logos')
      .upload(filePath, buffer, {
        contentType: file.type || 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: 'Failed to upload image to storage' }, { status: 500 });
    }

    // Retrieve public URL
    const { data: urlData } = supabase.storage
      .from('brand-logos')
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      return NextResponse.json({ error: 'Failed to retrieve public URL' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      logoUrl: urlData.publicUrl
    });

  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const config = {
  api: {
    bodyParser: false, // Disabling bodyParser since we parse formData manually
  },
};
