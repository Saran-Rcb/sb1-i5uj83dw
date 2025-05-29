import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Order from '@/lib/models/Order';
import { authenticateUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const user = await authenticateUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await Order.findById(params.id);

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check authorization based on role
    if (
      (user.role === 'vendor' && order.vendorId.toString() !== user.userId) ||
      (user.role === 'delivery' && order.deliveryPartnerId?.toString() !== user.userId) ||
      (user.role === 'customer' && order.customerId.toString() !== user.userId)
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const user = await authenticateUser(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.id;
    const { deliveryPartnerId, status } = await req.json();

    const order = await Order.findById(orderId);
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Only vendors can assign delivery partners
    if (deliveryPartnerId && user.role === 'vendor') {
      order.deliveryPartnerId = deliveryPartnerId;
      order.status = 'assigned';
    }

    // Update status based on role permissions
    if (status) {
      if (user.role === 'vendor') {
        // Vendors can update to any status
        order.status = status;
      } else if (user.role === 'delivery') {
        // Delivery partners can only update to in-progress or delivered
        if (
          order.deliveryPartnerId?.toString() === user.userId &&
          (status === 'in-progress' || status === 'delivered')
        ) {
          order.status = status;
        } else {
          return NextResponse.json(
            { error: 'Forbidden status update' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    await order.save();
    return NextResponse.json({
      message: 'Order updated successfully',
      order,
    });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}