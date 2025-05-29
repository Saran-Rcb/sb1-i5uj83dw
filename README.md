Build a full-stack real-time location tracking system like Rapido or Dunzo for a multivendor delivery platform. Use the following technologies:

Frontend: Next.js (with TypeScript)

Backend: Express.js with TypeScript (NO raw Node.js DB handling, use Mongoose only)

Database: MongoDB using this URI:

ruby
Copy
Edit
mongodb+srv://sarandha95:szoVIUV134RIdsrv@cluster12.6af4xm6.mongodb.net/?retryWrites=true&w=majority&appName=Cluster12
Project Features:
Vendor Dashboard
Login/Signup

View all their orders

Assign a delivery partner to each order

Delivery Partner Dashboard
Login/Signup

View assigned orders

"Start Delivery" button to begin real-time location tracking

Simulate live location updates using geolocation API or coordinate simulation

Customer Tracking Page
Input Order ID to track

See live location of the assigned delivery partner on a Leaflet.js map (or Google Maps)

Location should auto-update every 2–3 seconds

Backend Requirements:
Built with Express.js + TypeScript

Use Socket.IO for real-time location updates

Use JWT authentication for all user types (vendor, delivery partner, customer)

Create REST APIs for:

Signup/Login for vendors and delivery partners

Assign delivery partner to an order

Start tracking and update current location

Customer API to get real-time location

Key Constraints:
Use Mongoose for all MongoDB interactions (no raw Node.js MongoDB driver)

Implement multi-tenancy (each vendor sees only their orders)

Real-time updates should be pushed using WebSockets (Socket.IO)

