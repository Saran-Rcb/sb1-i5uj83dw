import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/lib/models/Order';
import { authenticateUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await authenticateUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let orders;
    
    if (user.role === 'vendor') {
      // Vendors see their own orders
      orders = await Order.find({ vendorId: user.userId });
    } else if (user.role === 'delivery') {
      // Delivery partners see orders assigned to them
      orders = await Order.find({ deliveryPartnerId: user.userId });
    } else if (user.role === 'customer') {
      // Customers see their own orders
      orders = await Order.find({ customerId: user.userId });
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await authenticateUser(req);

    if (!user || (user.role !== 'vendor' && user.role !== 'customer')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customerId, items, totalAmount, deliveryAddress } = await req.json();

    // Create new order
    const order = await Order.create({
      vendorId: user.role === 'vendor' ? user.userId : undefined,
      customerId: user.role === 'customer' ? user.userId : customerId,
      items,
      totalAmount,
      deliveryAddress,
      status: 'pending',
    });

    return NextResponse.json({ 
      message: 'Order created successfully',
      order
    }, { status: 201 });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}