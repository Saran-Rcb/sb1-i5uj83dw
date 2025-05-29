import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Truck, Package, Store, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <header className="container mx-auto py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">DeliTrack</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="py-20 container mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            Real-Time Delivery Tracking
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Connect vendors, delivery partners, and customers with our powerful platform. Track deliveries in real-time and optimize your logistics.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/signup?role=vendor">
              <Button size="lg" className="gap-2">
                <Store className="h-5 w-5" />
                Join as Vendor
              </Button>
            </Link>
            <Link href="/signup?role=delivery">
              <Button size="lg" variant="outline" className="gap-2">
                <Truck className="h-5 w-5" />
                Join as Delivery Partner
              </Button>
            </Link>
          </div>
        </section>

        <section className="py-16 bg-card">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg shadow-md">
                <div className="rounded-full bg-primary/10 w-14 h-14 flex items-center justify-center mb-4">
                  <Store className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">For Vendors</h3>
                <p className="text-muted-foreground">
                  Manage your orders and assign delivery partners efficiently. Get real-time updates on delivery status.
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg shadow-md">
                <div className="rounded-full bg-primary/10 w-14 h-14 flex items-center justify-center mb-4">
                  <Truck className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">For Delivery Partners</h3>
                <p className="text-muted-foreground">
                  Get assigned to orders, start deliveries, and share your location in real-time with customers.
                </p>
              </div>
              <div className="bg-background p-6 rounded-lg shadow-md">
                <div className="rounded-full bg-primary/10 w-14 h-14 flex items-center justify-center mb-4">
                  <Package className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">For Customers</h3>
                <p className="text-muted-foreground">
                  Track your orders in real-time on a map. Know exactly when your delivery will arrive.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 container mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="md:w-1/2">
              <h2 className="text-3xl font-bold mb-6">Powerful Features for Your Business</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="rounded-full bg-green-100 dark:bg-green-900 w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Real-time Tracking</h3>
                    <p className="text-muted-foreground">Location updates every 2-3 seconds for accurate delivery tracking</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="rounded-full bg-green-100 dark:bg-green-900 w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Multivendor Support</h3>
                    <p className="text-muted-foreground">Manage multiple vendors with separate order management systems</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="rounded-full bg-green-100 dark:bg-green-900 w-8 h-8 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Secure Authentication</h3>
                    <p className="text-muted-foreground">Role-based access control for vendors, delivery partners, and customers</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 rounded-lg overflow-hidden shadow-xl">
              <img 
                src="https://images.pexels.com/photos/7709924/pexels-photo-7709924.jpeg" 
                alt="Delivery tracking illustration" 
                className="w-full h-auto"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-card py-12">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <Truck className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">DeliTrack</span>
            </div>
            <div className="flex flex-col md:flex-row gap-8">
              <div>
                <h3 className="font-medium mb-3">Platform</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>For Vendors</li>
                  <li>For Delivery Partners</li>
                  <li>For Customers</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-3">Company</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>About</li>
                  <li>Careers</li>
                  <li>Contact</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-3">Legal</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>Privacy Policy</li>
                  <li>Terms of Service</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} DeliTrack. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}