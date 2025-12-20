import { Request, Response } from 'express';
import * as locationModel from '../models/locationModel';

export async function addLocation(req: Request, res: Response) {
  try {
    const { busId, latitude, longitude, speed, heading } = req.body;
    if (!busId || !latitude || !longitude) {
      return res.status(400).json({ error: 'busId, latitude, and longitude are required' });
    }
    const location = await locationModel.addLocation(busId, latitude, longitude, speed, heading);
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('bus-location-update', {
        busId,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: location.created_at
      });
    }
    
    res.status(201).json(location);
  } catch (err) {
    console.error('Error adding location:', err);
    res.status(500).json({ error: 'Failed to add location', details: (err as Error).message });
  }
}

export async function getLatestLocation(req: Request, res: Response) {
  try {
    const busId = parseInt(req.params.busId);
    if (!busId) {
      return res.status(400).json({ error: 'Valid busId is required' });
    }
    const location = await locationModel.getLatestLocation(busId);
    if (!location) return res.status(404).json({ error: 'Location not found' });
    res.json(location);
  } catch (err) {
    console.error('Error getting location:', err);
    res.status(500).json({ error: 'Failed to get location', details: (err as Error).message });
  }
}

export async function getBusLocations(req: Request, res: Response) {
  try {
    const busId = parseInt(req.params.busId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    if (!busId) {
      return res.status(400).json({ error: 'Valid busId is required' });
    }
    const locations = await locationModel.getBusLocations(busId, limit);
    res.json(locations);
  } catch (err) {
    console.error('Error getting locations:', err);
    res.status(500).json({ error: 'Failed to get locations', details: (err as Error).message });
  }
}

export async function getAllActiveBusLocations(req: Request, res: Response) {
  try {
    const locations = await locationModel.getAllActiveBusLocations();
    res.json(locations);
  } catch (err) {
    console.error('Error getting all active locations:', err);
    res.status(500).json({ error: 'Failed to get active locations', details: (err as Error).message });
  }
}

export async function getCompanyBusLocations(req: Request, res: Response) {
  try {
    const companyId = parseInt(req.params.companyId);
    if (!companyId) {
      return res.status(400).json({ error: 'Valid companyId is required' });
    }
    const locations = await locationModel.getCompanyBusLocations(companyId);
    res.json(locations);
  } catch (err) {
    console.error('Error getting company bus locations:', err);
    res.status(500).json({ error: 'Failed to get company bus locations', details: (err as Error).message });
  }
}
