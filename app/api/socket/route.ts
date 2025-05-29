import { Server } from 'socket.io';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const SocketHandler = async (req: NextRequest) => {
  if (!global.io) {
    console.log('New Socket.io instance initialized');
    
    // @ts-ignore - NextApiResponse is not available in App Router
    const io = new Server((res as any).socket.server, {
      path: '/api/socket',
    });
    
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Authenticate socket connection
      socket.on('authenticate', (token) => {
        const user = verifyToken(token);
        if (user) {
          socket.data.user = user;
          socket.join(`user:${user.userId}`);
          socket.join(`role:${user.role}`);
          
          console.log(`User ${user.userId} authenticated as ${user.role}`);
          socket.emit('authenticated', { userId: user.userId, role: user.role });
        } else {
          socket.emit('unauthorized');
        }
      });
      
      // Join order room to receive updates
      socket.on('joinOrderRoom', (orderId) => {
        if (socket.data.user) {
          socket.join(`order:${orderId}`);
          console.log(`User ${socket.data.user.userId} joined order room ${orderId}`);
        }
      });
      
      // Leave order room
      socket.on('leaveOrderRoom', (orderId) => {
        socket.leave(`order:${orderId}`);
        console.log(`User left order room ${orderId}`);
      });
      
      // Handle location updates from delivery partners
      socket.on('updateLocation', (data) => {
        if (
          socket.data.user && 
          socket.data.user.role === 'delivery' &&
          data.orderId &&
          data.latitude !== undefined &&
          data.longitude !== undefined
        ) {
          const locationData = {
            orderId: data.orderId,
            userId: socket.data.user.userId,
            coordinates: {
              latitude: data.latitude,
              longitude: data.longitude,
            },
            timestamp: new Date(),
          };
          
          // Broadcast to all clients tracking this order
          io.to(`order:${data.orderId}`).emit('locationUpdate', locationData);
          console.log(`Location update for order ${data.orderId}:`, locationData.coordinates);
        }
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
    
    global.io = io;
  }
  
  return NextResponse.json({ message: 'Socket server running' });
};

export { SocketHandler as GET, SocketHandler as POST };