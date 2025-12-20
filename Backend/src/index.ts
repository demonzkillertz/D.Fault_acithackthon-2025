
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { initDb } from './config/initDb';

dotenv.config();

console.log('Environment check:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);


const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active connections
const activeDrivers = new Map();
const activeUsers = new Map();

// Swagger setup
const swaggerDocument = YAML.load(__dirname + '/swagger/swagger.yaml');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Driver joins room
  socket.on('driver-join', (data) => {
    const { driverId, busId } = data;
    socket.join(`driver-${driverId}`);
    socket.join(`bus-${busId}`);
    activeDrivers.set(driverId, { socketId: socket.id, busId, online: true });
    console.log(`Driver ${driverId} joined with bus ${busId}`);
  });

  // User joins room
  socket.on('user-join', (data) => {
    const { userId } = data;
    socket.join(`user-${userId}`);
    activeUsers.set(userId, { socketId: socket.id, online: true });
    console.log(`User ${userId} joined`);
  });

  // Driver shares location
  socket.on('driver-location', async (data) => {
    const { driverId, busId, latitude, longitude, speed, heading } = data;
    
    try {
      // Save location to database
      const { default: pool } = await import('./config/db');
      await pool.query(
        'INSERT INTO bus_locations (bus_id, latitude, longitude, speed, heading) VALUES ($1, $2, $3, $4, $5)',
        [busId, latitude, longitude, speed || 0, heading || 0]
      );

      // Broadcast to all users tracking this bus
      io.emit('bus-location-update', {
        busId,
        latitude,
        longitude,
        speed,
        heading,
        timestamp: new Date().toISOString()
      });

      console.log(`Location updated for bus ${busId}: ${latitude}, ${longitude}`);
    } catch (error) {
      console.error('Error saving location:', error);
    }
  });

  // User requests bus tracking
  socket.on('track-bus', (data) => {
    const { userId, busId } = data;
    socket.join(`track-bus-${busId}`);
    console.log(`User ${userId} tracking bus ${busId}`);
  });

  // Emergency alert
  socket.on('emergency-alert', (data) => {
    const { userId, busId, type, message } = data;
    io.emit('emergency-alert', {
      userId,
      busId,
      type,
      message,
      timestamp: new Date().toISOString()
    });
    console.log('Emergency alert sent:', data);
  });

  socket.on('disconnect', () => {
    // Remove from active lists
    for (const [driverId, driverData] of activeDrivers.entries()) {
      if (driverData.socketId === socket.id) {
        activeDrivers.delete(driverId);
        break;
      }
    }
    for (const [userId, userData] of activeUsers.entries()) {
      if (userData.socketId === socket.id) {
        activeUsers.delete(userId);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// Make io available to routes
app.set('io', io);




import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import driverRoutes from './routes/driverRoutes';
import companyRoutes from './routes/companyRoutes';
import routeRoutes from './routes/routeRoutes';
import locationRoutes from './routes/locationRoutes';
import reviewRoutes from './routes/reviewRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import alertRoutes from './routes/alertRoutes';
import waitlistRoutes from './routes/waitlistRoutes';
import testRoutes from './routes/testRoutes';


app.use('/api/test', testRoutes);
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/company', companyRoutes);

app.use('/api/routes', routeRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/waitlists', waitlistRoutes);

app.get('/', (req, res) => {
  res.send('Bus Tracking & Passenger Safety Backend is running.');
});

const PORT = process.env.PORT || 5000;
initDb().then(async () => {
  // Test database connection
  try {
    const { default: pool } = await import('./config/db');
    const result = await pool.query('SELECT NOW()');
    console.log('Database connected successfully:', result.rows[0].now);
  } catch (err) {
    console.error('Database connection failed:', err);
  }
  
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.IO server ready for real-time tracking`);
  });
}).catch(err => {
  console.error('Database initialization failed:', err);
});
