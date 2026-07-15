import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { getSupabaseRouteClient } from '@/lib/supabaseRouteHandler';

export async function GET(request) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();
    const { data: brand, error: brandError } = await supabase
      .from('BrandProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    const { data: products, error: productsError } = await supabase
      .from('Product')
      .select('*')
      .eq('brand_id', brand.id)
      .order('created_at', { ascending: false });

    if (productsError) {
      return NextResponse.json({ error: 'Failed to retrieve products' }, { status: 500 });
    }

    const formattedProducts = (products || []).map(p => ({
      id: p.id,
      brandId: p.brand_id,
      name: p.name || '',
      description: p.description || '',
      price: p.price !== null ? Number(p.price) : 0,
      category: p.category || '',
      status: p.status || 'in_stock',
      inStock: p.status === 'in_stock',
      buyLink: p.buy_link || '',
      image: p.image_url || ''
    }));

    return NextResponse.json({ products: formattedProducts });

  } catch (error) {
    console.error("Products GET error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseRouteClient();
    const { data: brand, error: brandError } = await supabase
      .from('BrandProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name, price, imageUrl, image, buyLink, status, category, description } = body;

    if (!name || price === undefined || !buyLink) {
      return NextResponse.json({ error: 'Missing required product parameters' }, { status: 400 });
    }

    const parsedPrice = Number(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 });
    }

    const validStatuses = ['in_stock', 'out_of_stock', 'sold_out'];
    const finalStatus = status || 'in_stock';
    if (!validStatuses.includes(finalStatus)) {
      return NextResponse.json({ error: 'Invalid product status' }, { status: 400 });
    }

    const { data: newProd, error: insertError } = await supabase
      .from('Product')
      .insert({
        brand_id: brand.id,
        name,
        description: description || '',
        price: parsedPrice,
        category: category || '',
        status: finalStatus,
        buy_link: buyLink,
        image_url: imageUrl || image || ''
      })
      .select()
      .single();

    if (insertError) {
      console.error("Product insert error:", insertError);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }

    if (finalStatus === 'out_of_stock' || finalStatus === 'sold_out') {
      await supabase
        .from('Notification')
        .insert({
          user_id: user.id,
          type: 'product',
          title: 'Product Marked Sold Out',
          body: `"${newProd.name}" automatically flagged as sold out.`,
          is_read: false,
          related_entity_id: newProd.id
        });
    }

    const formattedProduct = {
      id: newProd.id,
      brandId: newProd.brand_id,
      name: newProd.name,
      description: newProd.description,
      price: Number(newProd.price),
      category: newProd.category,
      status: newProd.status,
      inStock: newProd.status === 'in_stock',
      buyLink: newProd.buy_link,
      image: newProd.image_url
    };

    return NextResponse.json({ product: formattedProduct });

  } catch (error) {
    console.error("Products POST error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
