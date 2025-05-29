"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Package, 
  CheckCircle2, 
  Clock, 
  Truck, 
  AlertCircle, 
  User, 
  ChevronRight, 
  MoreHorizontal 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { VendorLayout } from '@/components/layouts/vendor-layout';

interface OrderType {
  _id: string;
  customerId: string;
  items: { name: string; quantity: number; price: number }[];
  totalAmount: number;
  deliveryAddress: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  deliveryPartnerId?: string;
}

interface DeliveryPartnerType {
  _id: string;
  name: string;
  email: string;
}

export default function VendorDashboard() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartnerType[]>([]);
  const [selectedDeliveryPartner, setSelectedDeliveryPartner] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
    fetchDeliveryPartners();
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

  async function fetchDeliveryPartners() {
    try {
      const response = await axios.get('/api/users?role=delivery');
      setDeliveryPartners(response.data.users);
    } catch (error) {
      toast.error('Failed to fetch delivery partners');
    }
  }

  async function assignDeliveryPartner() {
    if (!selectedOrder || !selectedDeliveryPartner) return;
    
    try {
      await axios.patch(`/api/orders/${selectedOrder._id}`, {
        deliveryPartnerId: selectedDeliveryPartner,
      });
      
      toast.success('Delivery partner assigned successfully');
      setIsAssignDialogOpen(false);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to assign delivery partner');
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'assigned':
        return <User className="h-5 w-5 text-blue-500" />;
      case 'in-progress':
        return <Truck className="h-5 w-5 text-indigo-500" />;
      case 'delivered':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  return (
    <VendorLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Vendor Dashboard</h1>
        <Button onClick={() => router.push('/vendor/orders/create')}>
          Create Order
        </Button>
      </div>

      <div className="mb-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">All Orders</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="assigned">Assigned</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
            <TabsTrigger value="delivered">Delivered</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            {renderOrdersList(orders)}
          </TabsContent>
          
          <TabsContent value="pending" className="mt-6">
            {renderOrdersList(orders.filter(order => order.status === 'pending'))}
          </TabsContent>
          
          <TabsContent value="assigned" className="mt-6">
            {renderOrdersList(orders.filter(order => order.status === 'assigned'))}
          </TabsContent>
          
          <TabsContent value="in-progress" className="mt-6">
            {renderOrdersList(orders.filter(order => order.status === 'in-progress'))}
          </TabsContent>
          
          <TabsContent value="delivered" className="mt-6">
            {renderOrdersList(orders.filter(order => order.status === 'delivered'))}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Delivery Partner</DialogTitle>
            <DialogDescription>
              Select a delivery partner to assign to this order.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select 
              value={selectedDeliveryPartner} 
              onValueChange={setSelectedDeliveryPartner}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a delivery partner" />
              </SelectTrigger>
              <SelectContent>
                {deliveryPartners.map((partner) => (
                  <SelectItem key={partner._id} value={partner._id}>
                    {partner.name} ({partner.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={assignDeliveryPartner} 
              disabled={!selectedDeliveryPartner}
            >
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </VendorLayout>
  );

  function renderOrdersList(ordersToRender: OrderType[]) {
    if (isLoading) {
      return (
        <div className="flex justify-center p-8">
          <p>Loading orders...</p>
        </div>
      );
    }

    if (ordersToRender.length === 0) {
      return (
        <div className="text-center p-8 bg-muted rounded-lg">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="font-medium">No orders found</h3>
          <p className="text-muted-foreground">Orders will appear here once they are created.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {ordersToRender.map((order) => (
          <Card key={order._id} className="overflow-hidden">
            <CardHeader className="bg-muted pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Order #{order._id.slice(-6)}
                  </CardTitle>
                  <CardDescription>{formatDate(order.createdAt)}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-3 py-1 bg-background rounded-full text-sm">
                    {getStatusIcon(order.status)}
                    <span className="capitalize">{order.status}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/vendor/orders/${order._id}`)}>
                        View Details
                      </DropdownMenuItem>
                      {order.status === 'pending' && (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsAssignDialogOpen(true);
                          }}
                        >
                          Assign Delivery Partner
                        </DropdownMenuItem>
                      )}
                      {(order.status === 'assigned' || order.status === 'in-progress') && (
                        <DropdownMenuItem onClick={() => router.push(`/vendor/tracking/${order._id}`)}>
                          Track Delivery
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Delivery Address</p>
                  <p className="text-sm text-muted-foreground">{order.deliveryAddress}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Amount</p>
                  <p className="text-lg font-bold">${order.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 flex justify-between">
              <div className="text-sm text-muted-foreground">
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => router.push(`/vendor/orders/${order._id}`)}
              >
                Details <ChevronRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
}