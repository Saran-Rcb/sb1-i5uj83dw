"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { Package, MapPin, Clock, ArrowLeft, Truck } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CustomerLayout } from '@/components/layouts/customer-layout';
import dynamic from 'next/dynamic';

// Import map component dynamically to avoid SSR issues
const MapWithNoSSR = dynamic(() => import('@/components/map'), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] bg-muted rounded-md flex items-center justify-center">
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  ),
});

interface OrderDetails {
  _id: string;
  vendorId: {
    _id: string;
    name: string;
  };
  deliveryPartnerId?: {
    _id: string;
    name: string;
    phone?: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  deliveryAddress: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

interface LocationData {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
}

export default function CustomerOrderTracking() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchOrderDetails();
    fetchLastLocation();

    // Initialize socket connection
    const socket = io({
      path: '/api/socket',
    });
    
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket connected');
      
      // Join room for this specific order
      socket.emit('joinOrderRoom', orderId);
    });

    socket.on('locationUpdate', (data) => {
      if (data.orderId === orderId) {
        setLocation({
          coordinates: data.coordinates,
          timestamp: new Date(data.timestamp),
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      if (socket) {
        socket.off('locationUpdate');
        socket.emit('leaveOrderRoom', orderId);
        socket.disconnect();
      }
    };
  }, [orderId]);

  async function fetchOrderDetails() {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/orders/${orderId}`);
      setOrder(response.data.order);
    } catch (error) {
      toast.error('Failed to fetch order details');
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchLastLocation() {
    try {
      const response = await axios.get(`/api/location?orderId=${orderId}`);
      setLocation(response.data.location);
    } catch (error) {
      // It's okay if there's no location yet
      console.log('No location data available yet');
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  function getEstimatedDeliveryTime() {
    // This would be calculated based on distance/location in a real app
    return '25-35 minutes';
  }

  if (isLoading) {
    return (
      <CustomerLayout>
        <div className="flex justify-center p-12">
          <p>Loading order details...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (!order) {
    return (
      <CustomerLayout>
        <div className="text-center p-12">
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <p className="mb-4">The order you are looking for does not exist or you don't have permission to view it.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Tracking Order #{orderId.slice(-6)}
            </h1>
            <p className="text-muted-foreground">
              Placed: {formatDate(order.createdAt)}
            </p>
          </div>
          <Badge
            className="w-fit text-sm py-1 px-3"
            variant={
              order.status === 'delivered' ? 'default' :
              order.status === 'in-progress' ? 'secondary' :
              order.status === 'assigned' ? 'outline' : 'destructive'
            }
          >
            {order.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Show different cards based on order status */}
      {order.status === 'pending' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Waiting for Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your order is being processed. A delivery partner will be assigned soon.</p>
          </CardContent>
        </Card>
      )}

      {(order.status === 'assigned' || order.status === 'in-progress' || order.status === 'delivered') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg">
                      {order.status === 'in-progress' 
                        ? 'Live Tracking' 
                        : order.status === 'delivered'
                        ? 'Delivery Complete'
                        : 'Delivery Assigned'}
                    </CardTitle>
                    <CardDescription>
                      {order.status === 'in-progress'
                        ? location
                          ? `Updating live • Last update: ${new Date(location.timestamp).toLocaleTimeString()}`
                          : 'Waiting for delivery partner to start tracking'
                        : order.status === 'delivered'
                        ? `Delivered on ${formatDate(order.updatedAt)}`
                        : 'Delivery partner has been assigned to your order'}
                    </CardDescription>
                  </div>
                  
                  {order.status === 'in-progress' && (
                    <div className="text-lg font-medium">
                      ETA: {getEstimatedDeliveryTime()}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] overflow-hidden rounded-md border">
                  <MapWithNoSSR 
                    location={location?.coordinates}
                    deliveryAddress={order.deliveryAddress} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.deliveryPartnerId && (
                  <div>
                    <h3 className="text-sm font-medium">Delivery Partner</h3>
                    <p className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      {order.deliveryPartnerId.name}
                    </p>
                    {order.deliveryPartnerId.phone && (
                      <p className="text-sm text-muted-foreground">
                        {order.deliveryPartnerId.phone}
                      </p>
                    )}
                  </div>
                )}

                {order.deliveryPartnerId && <Separator />}

                <div>
                  <h3 className="text-sm font-medium">From</h3>
                  <p>{order.vendorId?.name || 'Unknown Vendor'}</p>
                </div>

                <Separator />

                <div>
                  <h3 className="text-sm font-medium">Delivery Address</h3>
                  <p className="flex items-start gap-1">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span>{order.deliveryAddress}</span>
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-sm font-medium">Status Timeline</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckIcon className="h-3 w-3 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Order Placed</p>
                        <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                    
                    {order.status !== 'pending' && (
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckIcon className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">Delivery Partner Assigned</p>
                          <p className="text-xs text-muted-foreground">{formatDate(order.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                    
                    {order.status === 'in-progress' && (
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckIcon className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">Out for Delivery</p>
                          <p className="text-xs text-muted-foreground">{formatDate(order.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                    
                    {order.status !== 'in-progress' && order.status !== 'delivered' && (
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Out for Delivery</p>
                          <p className="text-xs text-muted-foreground">Waiting</p>
                        </div>
                      </div>
                    )}
                    
                    {order.status !== 'delivered' ? (
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-muted-foreground">Delivered</p>
                          <p className="text-xs text-muted-foreground">Waiting</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckIcon className="h-3 w-3 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">Delivered</p>
                          <p className="text-xs text-muted-foreground">{formatDate(order.updatedAt)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {order.items.map((item, index) => (
                    <li key={index} className="flex justify-between items-center py-1">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          x{item.quantity}
                        </span>
                      </div>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <Separator className="my-4" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${order.totalAmount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}

// Simple check icon component
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="4" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}