import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Location from '@/lib/models/Location';
import Order from '@/lib/models/Order';
import { authenticateUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await authenticateUser(req);

    if (!user || user.role !== 'delivery') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, latitude, longitude } = await req.json();

    // Validate input
    if (!orderId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if order exists and is assigned to this delivery partner
    const order = await Order.findOne({
      _id: orderId,
      deliveryPartnerId: user.userId,
      status: { $in: ['assigned', 'in-progress'] },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found or not assigned to you' },
        { status: 404 }
      );
    }

    // Create new location entry
    const location = await Location.create({
      userId: user.userId,
      orderId,
      coordinates: {
        latitude,
        longitude,
      },
    });

    return NextResponse.json({
      message: 'Location updated successfully',
      location,
    });
  } catch (error) {
    console.error('Update location error:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await authenticateUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Check if user is authorized to access this order's location
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (
      user.role === 'customer' && order.customerId.toString() !== user.userId ||
      user.role === 'vendor' && order.vendorId.toString() !== user.userId ||
      user.role === 'delivery' && order.deliveryPartnerId?.toString() !== user.userId
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get latest location
    const location = await Location.findOne({ orderId })
      .sort({ timestamp: -1 })
      .limit(1);

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ location });
  } catch (error) {
    console.error('Get location error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}