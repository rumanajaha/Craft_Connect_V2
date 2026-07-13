import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function PATCH(request, { params }) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const { data: brand, error: brandError } = await supabaseAdmin
      .from('BrandProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    // Scoped ownership validation: fetch target product first
    const { data: existingProduct, error: fetchError } = await supabaseAdmin
      .from('Product')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (existingProduct.brand_id !== brand.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this product' }, { status: 403 });
    }

    const body = await request.json();
    const updateData = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.buyLink !== undefined) updateData.buy_link = body.buyLink;
    if (body.imageUrl !== undefined) updateData.image_url = body.imageUrl;
    if (body.image !== undefined) updateData.image_url = body.image;

    if (body.price !== undefined) {
      const parsedPrice = Number(body.price);
      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        return NextResponse.json({ error: 'Price must be a positive number' }, { status: 400 });
      }
      updateData.price = parsedPrice;
    }

    if (body.status !== undefined) {
      const validStatuses = ['in_stock', 'out_of_stock', 'sold_out'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid product status' }, { status: 400 });
      }
      updateData.status = body.status;
    }

    // Support flat inStock boolean parameter from the frontend form modal
    if (body.inStock !== undefined) {
      updateData.status = body.inStock ? 'in_stock' : 'out_of_stock';
    }

    const { data: updatedProd, error: updateError } = await supabaseAdmin
      .from('Product')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error("Product update error:", updateError);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }

    // Notification trigger: if status changed to 'out_of_stock' or 'sold_out'
    const oldStatus = existingProduct.status;
    const newStatus = updatedProd.status;
    if (newStatus !== oldStatus && (newStatus === 'out_of_stock' || newStatus === 'sold_out')) {
      const { error: notifError } = await supabaseAdmin
        .from('Notification')
        .insert({
          user_id: user.id,
          type: 'product',
          title: 'Product Marked Sold Out',
          body: `"${updatedProd.name}" automatically flagged as sold out.`,
          is_read: false,
          related_entity_id: updatedProd.id
        });

      if (notifError) {
        console.error("Failed to insert sold-out notification:", notifError);
      }
    }

    const formattedProduct = {
      id: updatedProd.id,
      brandId: updatedProd.brand_id,
      name: updatedProd.name,
      description: updatedProd.description,
      price: Number(updatedProd.price),
      category: updatedProd.category,
      status: updatedProd.status,
      inStock: updatedProd.status === 'in_stock',
      buyLink: updatedProd.buy_link,
      image: updatedProd.image_url
    };

    return NextResponse.json({ product: formattedProduct });

  } catch (error) {
    console.error("Product PATCH error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await authenticate(request);

    if (!user || user.role !== 'BRANDOWNER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const { data: brand, error: brandError } = await supabaseAdmin
      .from('BrandProfile')
      .select('id')
      .eq('owner_user_id', user.id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
    }

    // Scoped ownership check: fetch target product first
    const { data: existingProduct, error: fetchError } = await supabaseAdmin
      .from('Product')
      .select('brand_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (existingProduct.brand_id !== brand.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this product' }, { status: 403 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('Product')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error("Product deletion error:", deleteError);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Product DELETE error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
