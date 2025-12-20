import { Request, Response } from 'express';
import pool from '../config/db';

export async function getDriverBus(req: Request, res: Response) {
  try {
    const driverId = (req as any).user?.id;
    if (!driverId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(`
      SELECT 
        b.*,
        c.name as company_name,
        r.route_name,
        r.start_location,
        r.end_location,
        bl.latitude,
        bl.longitude,
        bl.speed,
        bl.heading,
        bl.created_at as last_location_update
      FROM buses b
      LEFT JOIN companies c ON b.company_id = c.id
      LEFT JOIN routes r ON b.id = r.bus_id
      LEFT JOIN bus_locations bl ON b.id = bl.bus_id AND bl.id = (
        SELECT id FROM bus_locations WHERE bus_id = b.id ORDER BY created_at DESC LIMIT 1
      )
      WHERE b.driver_id = $1
    `, [driverId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No bus assigned to this driver' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error getting driver bus:', err);
    res.status(500).json({ error: 'Failed to get driver bus', details: (err as Error).message });
  }
}

export async function startTrip(req: Request, res: Response) {
  try {
    const driverId = (req as any).user?.id;
    const { busId, routeId } = req.body;

    if (!driverId || !busId) {
      return res.status(400).json({ error: 'Driver ID and Bus ID are required' });
    }

    // Update bus status and assign route
    await pool.query(`
      UPDATE buses 
      SET status = 'active', updated_at = NOW() 
      WHERE id = $1 AND driver_id = $2
    `, [busId, driverId]);

    if (routeId) {
      await pool.query(`
        UPDATE routes 
        SET bus_id = $1, updated_at = NOW() 
        WHERE id = $2
      `, [busId, routeId]);
    }

    // Emit trip started event
    const io = req.app.get('io');
    if (io) {
      io.emit('trip-started', { driverId, busId, routeId, timestamp: new Date().toISOString() });
    }

    res.json({ success: true, message: 'Trip started successfully' });
  } catch (err) {
    console.error('Error starting trip:', err);
    res.status(500).json({ error: 'Failed to start trip', details: (err as Error).message });
  }
}

export async function endTrip(req: Request, res: Response) {
  try {
    const driverId = (req as any).user?.id;
    const { busId } = req.body;

    if (!driverId || !busId) {
      return res.status(400).json({ error: 'Driver ID and Bus ID are required' });
    }

    // Update bus status
    await pool.query(`
      UPDATE buses 
      SET status = 'maintenance', updated_at = NOW() 
      WHERE id = $1 AND driver_id = $2
    `, [busId, driverId]);

    // Clear route assignment
    await pool.query(`
      UPDATE routes 
      SET bus_id = NULL, updated_at = NOW() 
      WHERE bus_id = $1
    `, [busId]);

    // Emit trip ended event
    const io = req.app.get('io');
    if (io) {
      io.emit('trip-ended', { driverId, busId, timestamp: new Date().toISOString() });
    }

    res.json({ success: true, message: 'Trip ended successfully' });
  } catch (err) {
    console.error('Error ending trip:', err);
    res.status(500).json({ error: 'Failed to end trip', details: (err as Error).message });
  }
}

export async function updateLocation(req: Request, res: Response) {
  try {
    const driverId = (req as any).user?.id;
    const { busId, latitude, longitude, speed, heading } = req.body;

    if (!driverId || !busId || !latitude || !longitude) {
      return res.status(400).json({ error: 'Driver ID, Bus ID, latitude, and longitude are required' });
    }

    // Verify driver owns this bus
    const busCheck = await pool.query('SELECT id FROM buses WHERE id = $1 AND driver_id = $2', [busId, driverId]);
    if (busCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Driver not authorized for this bus' });
    }

    // Add location to database
    const location = await pool.query(`
      INSERT INTO bus_locations (bus_id, latitude, longitude, speed, heading, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
      RETURNING *
    `, [busId, latitude, longitude, speed || 0, heading || 0]);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('bus-location-update', {
        busId,
        driverId,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: location.rows[0].created_at
      });
    }

    res.json(location.rows[0]);
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).json({ error: 'Failed to update location', details: (err as Error).message });
  }
}

export async function getPassengerWaitlist(req: Request, res: Response) {
  try {
    const driverId = (req as any).user?.id;
    
    // Get bus assigned to this driver
    const busResult = await pool.query('SELECT id FROM buses WHERE driver_id = $1', [driverId]);
    if (busResult.rows.length === 0) {
      return res.status(404).json({ error: 'No bus assigned to this driver' });
    }

    const busId = busResult.rows[0].id;

    // Get waitlist for routes served by this bus
    const waitlist = await pool.query(`
      SELECT 
        w.*,
        u.username,
        u.phone,
        r.route_name,
        r.start_location,
        r.end_location
      FROM waitlists w
      JOIN users u ON w.user_id = u.id
      JOIN routes r ON w.route_id = r.id
      WHERE r.bus_id = $1 AND w.status = 'waiting'
      ORDER BY w.position ASC
    `, [busId]);

    res.json(waitlist.rows);
  } catch (err) {
    console.error('Error getting passenger waitlist:', err);
    res.status(500).json({ error: 'Failed to get passenger waitlist', details: (err as Error).message });
  }
}

export async function sendEmergencyAlert(req: Request, res: Response) {
  try {
    const driverId = (req as any).user?.id;
    const { busId, message, type = 'emergency' } = req.body;

    if (!driverId || !busId || !message) {
      return res.status(400).json({ error: 'Driver ID, Bus ID, and message are required' });
    }

    // Get company ID for this bus
    const busResult = await pool.query('SELECT company_id FROM buses WHERE id = $1 AND driver_id = $2', [busId, driverId]);
    if (busResult.rows.length === 0) {
      return res.status(403).json({ error: 'Driver not authorized for this bus' });
    }

    const companyId = busResult.rows[0].company_id;

    // Create alert in database
    await pool.query(`
      INSERT INTO user_alerts (user_id, bus_id, type, message, created_at) 
      VALUES ($1, $2, $3, $4, NOW())
    `, [driverId, busId, type, message]);

    // Emit emergency alert
    const io = req.app.get('io');
    if (io) {
      io.emit('emergency-alert', {
        driverId,
        busId,
        companyId,
        type,
        message,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true, message: 'Emergency alert sent successfully' });
  } catch (err) {
    console.error('Error sending emergency alert:', err);
    res.status(500).json({ error: 'Failed to send emergency alert', details: (err as Error).message });
  }
}
