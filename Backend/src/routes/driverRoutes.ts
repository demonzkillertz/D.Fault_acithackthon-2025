import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  getDriverBus,
  startTrip,
  endTrip,
  updateLocation,
  getPassengerWaitlist,
  sendEmergencyAlert
} from '../controllers/driverController';

const router = Router();

// All driver routes require authentication
router.use(authenticateToken);

// Get driver's assigned bus
router.get('/bus', getDriverBus);

// Trip management
router.post('/trip/start', startTrip);
router.post('/trip/end', endTrip);

// Location tracking
router.post('/location', updateLocation);

// Get passengers waiting for this driver's bus
router.get('/passengers', getPassengerWaitlist);

// Emergency alert
router.post('/emergency', sendEmergencyAlert);

export default router;
