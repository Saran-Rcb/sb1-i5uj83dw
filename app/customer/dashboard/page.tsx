"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Package, ShoppingBag, Truck, Clock, MapPin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerLayout } from '@/components/layouts/customer-layout';

interface OrderType {
  _id: string;
  vendorId: {
    _id: string;
    name: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  deliveryAddress: string;
  status: string;
  createdAt: string;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/orders');
      setOrders(response.data.orders);
    } catch (error) {
      toast.error('Failed to fetch orders');
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  const activeOrders = orders.filter(
    order => ['pending', 'assigned', 'in-progress'].includes(order.status)
  );
  
  const deliveredOrders = orders.filter(
    order => order.status === 'delivered'
  );

  return (
    <CustomerLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Welcome Back</h1>
        <p className="text-muted-foreground">Track your orders and make new purchases</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeOrders.length}</div>
            <p className="text-muted-foreground text-sm">Orders in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{deliveredOrders.length}</div>
            <p className="text-muted-foreground text-sm">Orders completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Shop</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm mb-3">Browse vendors and place new orders</p>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => router.push('/customer/shop')}
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Go to Shop
            </Button>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mb-4">Active Orders</h2>
      {isLoading ? (
        <div className="flex justify-center p-8">
          <p>Loading orders...</p>
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="font-medium">No active orders</h3>
          <p className="text-muted-foreground mb-4">You don't have any active orders at the moment.</p>
          <Button onClick={() => router.push('/customer/shop')}>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Shop Now
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {activeOrders.map(order => (
            <Card key={order._id} className="overflow-hidden">
              <div className="bg-muted p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      Order #{order._id.slice(-6)}
                    </h3>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    {order.status === 'pending' && (
                      <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs">Pending</span>
                    )}
                    {order.status === 'assigned' && (
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">Assigned</span>
                    )}
                    {order.status === 'in-progress' && (
                      <span className="px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 text-xs">In Progress</span>
                    )}
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">From</p>
                    <p className="text-sm">{order.vendorId?.name || 'Unknown Vendor'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Items</p>
                    <p className="text-sm">{order.items.length} items · ${order.totalAmount.toFixed(2)}</p>
                  </div>
                  <div className="mt-2">
                    <Button 
                      variant={order.status === 'in-progress' ? 'default' : 'outline'}
                      className="w-full"
                      onClick={() => router.push(`/customer/tracking/${order._id}`)}
                    >
                      {order.status === 'pending' ? (
                        <>
                          <Clock className="h-4 w-4 mr-2" />
                          View Order
                        </>
                      ) : (
                        <>
                          <Truck className="h-4 w-4 mr-2" />
                          Track Order
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <h2 className="text-xl font-bold mb-4">Recent Deliveries</h2>
      {deliveredOrders.length === 0 ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="font-medium">No recent deliveries</h3>
          <p className="text-muted-foreground">Your completed orders will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliveredOrders.slice(0, 3).map(order => (
            <Card key={order._id} className="overflow-hidden">
              <div className="bg-muted p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium flex items-center gap-1">
                      <Package className="h-4 w-4" />
                      Order #{order._id.slice(-6)}
                    </h3>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">Delivered</span>
                  </div>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">From</p>
                    <p className="text-sm">{order.vendorId?.name || 'Unknown Vendor'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Delivered To</p>
                    <p className="text-sm flex items-start gap-1">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{order.deliveryAddress}</span>
                    </p>
                  </div>
                  <div className="mt-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push(`/customer/orders/${order._id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {deliveredOrders.length > 3 && (
        <div className="mt-4 text-center">
          <Button variant="ghost" onClick={() => router.push('/customer/orders')}>
            View All Orders
          </Button>
        </div>
      )}
    </CustomerLayout>
  );
}