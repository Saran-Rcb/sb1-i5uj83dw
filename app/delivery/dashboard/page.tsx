"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Package, CheckCircle2, Clock, MapPin, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DeliveryLayout } from '@/components/layouts/delivery-layout';

interface OrderType {
  _id: string;
  customerId: {
    _id: string;
    name: string;
  };
  vendorId: {
    _id: string;
    name: string;
  };
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  deliveryAddress: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'delivered' | 'cancelled';
  createdAt: string;
}

export default function DeliveryDashboard() {
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

  async function startDelivery(orderId: string) {
    try {
      await axios.patch(`/api/orders/${orderId}`, {
        status: 'in-progress',
      });
      toast.success('Delivery started');
      fetchOrders();
      router.push(`/delivery/tracking/${orderId}`);
    } catch (error) {
      toast.error('Failed to start delivery');
    }
  }

  async function markAsDelivered(orderId: string) {
    try {
      await axios.patch(`/api/orders/${orderId}`, {
        status: 'delivered',
      });
      toast.success('Order marked as delivered');
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update order status');
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'assigned':
        return <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">Assigned</span>;
      case 'in-progress':
        return <span className="px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-xs">In Progress</span>;
      case 'delivered':
        return <span className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">Delivered</span>;
      default:
        return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800 text-xs">{status}</span>;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  if (isLoading) {
    return (
      <DeliveryLayout>
        <div className="flex justify-center p-12">
          <p>Loading orders...</p>
        </div>
      </DeliveryLayout>
    );
  }

  return (
    <DeliveryLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Delivery Dashboard</h1>
        <p className="text-muted-foreground">Manage your assigned deliveries</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {orders.filter(order => order.status === 'assigned').length}
            </div>
            <p className="text-muted-foreground text-sm">Orders waiting for pickup</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {orders.filter(order => order.status === 'in-progress').length}
            </div>
            <p className="text-muted-foreground text-sm">Orders being delivered</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Delivered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {orders.filter(order => order.status === 'delivered').length}
            </div>
            <p className="text-muted-foreground text-sm">Completed deliveries</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mb-4">Assigned Orders</h2>
      {orders.filter(order => order.status === 'assigned').length === 0 ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="font-medium">No assigned orders</h3>
          <p className="text-muted-foreground">Assigned orders will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {orders
            .filter(order => order.status === 'assigned')
            .map(order => (
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
                    <div className="flex items-center">
                      {getStatusBadge(order.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/delivery/orders/${order._id}`)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => startDelivery(order._id)}>
                            Start Delivery
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                      <p className="text-xs font-medium text-muted-foreground">Delivery Address</p>
                      <p className="text-sm flex items-start gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{order.deliveryAddress}</span>
                      </p>
                    </div>
                    <div className="mt-2">
                      <Button 
                        className="w-full" 
                        onClick={() => startDelivery(order._id)}
                      >
                        Start Delivery
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <h2 className="text-xl font-bold mb-4">In Progress</h2>
      {orders.filter(order => order.status === 'in-progress').length === 0 ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="font-medium">No ongoing deliveries</h3>
          <p className="text-muted-foreground">Orders in progress will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {orders
            .filter(order => order.status === 'in-progress')
            .map(order => (
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
                    <div className="flex items-center">
                      {getStatusBadge(order.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/delivery/tracking/${order._id}`)}>
                            Continue Delivery
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => markAsDelivered(order._id)}>
                            Mark as Delivered
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Customer</p>
                      <p className="text-sm">{order.customerId?.name || 'Unknown Customer'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Delivery Address</p>
                      <p className="text-sm flex items-start gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{order.deliveryAddress}</span>
                      </p>
                    </div>
                    <div className="mt-2">
                      <Button 
                        className="w-full" 
                        onClick={() => router.push(`/delivery/tracking/${order._id}`)}
                      >
                        Continue Delivery
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <h2 className="text-xl font-bold mb-4">Recently Delivered</h2>
      {orders.filter(order => order.status === 'delivered').length === 0 ? (
        <div className="text-center p-8 bg-muted rounded-lg">
          <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="font-medium">No delivered orders</h3>
          <p className="text-muted-foreground">Completed deliveries will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders
            .filter(order => order.status === 'delivered')
            .slice(0, 6) // Show only recent 6
            .map(order => (
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
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Customer</p>
                      <p className="text-sm">{order.customerId?.name || 'Unknown Customer'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Delivery Address</p>
                      <p className="text-sm line-clamp-2">{order.deliveryAddress}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </DeliveryLayout>
  );
}