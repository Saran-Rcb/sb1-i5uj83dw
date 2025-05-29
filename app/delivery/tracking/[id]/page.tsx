"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { MapPin, Clock, Package, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { DeliveryLayout } from '@/components/layouts/delivery-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  customerId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
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
  status: 'pending' | 'assigned' | 'in-progress' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export default function DeliveryTracking() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [locationWatchId, setLocationWatchId] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    fetchOrderDetails();
    
    // Initialize socket connection
    const socket = io({
      path: '/api/socket',
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('Socket connected');
      
      // Join order room
      socket.emit('joinOrderRoom', orderId);
    });

    return () => {
      if (locationWatchId !== null) {
        navigator.geolocation.clearWatch(locationWatchId);
      }
      
      if (socket) {
        socket.off('connect');
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

  function startLocationTracking() {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsUpdatingLocation(true);
    
    // Request permission and start tracking
    const watchId = navigator.geolocation.watchPosition(
      position => {
        const { latitude, longitude } = position.coords;
        
        // Update local state
        setCurrentLocation({ latitude, longitude });
        
        // Emit to socket for real-time updates
        if (socketRef.current) {
          socketRef.current.emit('updateLocation', {
            orderId,
            latitude,
            longitude
          });
        }
        
        // Also update in database for persistence
        updateLocationInDb(latitude, longitude);
      },
      error => {
        console.error('Error getting location:', error);
        toast.error('Failed to get your location');
        setIsUpdatingLocation(false);
      },
      { 
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      }
    );
    
    setLocationWatchId(watchId);
  }

  async function updateLocationInDb(latitude: number, longitude: number) {
    try {
      await axios.post('/api/location', {
        orderId,
        latitude,
        longitude
      });
    } catch (error) {
      console.error('Failed to update location in database:', error);
    }
  }

  function stopLocationTracking() {
    if (locationWatchId !== null) {
      navigator.geolocation.clearWatch(locationWatchId);
      setLocationWatchId(null);
      setIsUpdatingLocation(false);
      toast.info('Location tracking stopped');
    }
  }

  async function completeDelivery() {
    try {
      await axios.patch(`/api/orders/${orderId}`, {
        status: 'delivered',
      });
      
      stopLocationTracking();
      toast.success('Delivery completed successfully');
      router.push('/delivery/dashboard');
    } catch (error) {
      toast.error('Failed to complete delivery');
    }
  }

  if (isLoading) {
    return (
      <DeliveryLayout>
        <div className="flex justify-center p-12">
          <p>Loading order details...</p>
        </div>
      </DeliveryLayout>
    );
  }

  if (!order) {
    return (
      <DeliveryLayout>
        <div className="text-center p-12">
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <p className="mb-4">The order you are looking for does not exist or you don't have permission to view it.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </DeliveryLayout>
    );
  }

  return (
    <DeliveryLayout>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Delivery #{orderId.slice(-6)}
            </h1>
            <p className="text-muted-foreground">
              Customer: {order.customerId?.name || 'Unknown'}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Live Location</CardTitle>
                <CardDescription>
                  {isUpdatingLocation
                    ? 'Your location is being tracked and shared with the customer'
                    : 'Start location tracking to begin delivery'}
                </CardDescription>
              </div>
              {order.status === 'in-progress' ? (
                <Button 
                  variant={isUpdatingLocation ? "destructive" : "default"}
                  onClick={isUpdatingLocation ? stopLocationTracking : startLocationTracking}
                >
                  {isUpdatingLocation ? 'Stop Tracking' : 'Start Tracking'}
                </Button>
              ) : null}
            </CardHeader>
            <CardContent>
              <div className="h-[400px] overflow-hidden rounded-md border">
                <MapWithNoSSR 
                  location={currentLocation} 
                  deliveryAddress={order.deliveryAddress}
                  isDeliveryPartner={true}
                />
              </div>
            </CardContent>
            <CardFooter>
              {order.status === 'in-progress' && (
                <Button 
                  className="w-full" 
                  onClick={completeDelivery}
                  variant="default"
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Mark as Delivered
                </Button>
              )}
              {order.status === 'assigned' && !isUpdatingLocation && (
                <Button 
                  className="w-full" 
                  onClick={() => startLocationTracking()}
                >
                  <Truck className="h-5 w-5 mr-2" />
                  Start Delivery
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Delivery Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Customer</h3>
                <p>{order.customerId?.name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">
                  {order.customerId?.email}
                  {order.customerId?.phone ? ` • ${order.customerId.phone}` : ''}
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium">Vendor</h3>
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
    </DeliveryLayout>
  );
}