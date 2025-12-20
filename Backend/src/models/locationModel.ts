import pool from '../config/db';

export async function addLocation(busId: number, latitude: number, longitude: number, speed?: number, heading?: number) {
  const result = await pool.query(
    'INSERT INTO bus_locations (bus_id, latitude, longitude, speed, heading, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
    [busId, latitude, longitude, speed || 0, heading || 0]
  );
  return result.rows[0];
}

export async function getLatestLocation(busId: number) {
  const result = await pool.query(
    'SELECT * FROM bus_locations WHERE bus_id = $1 ORDER BY created_at DESC LIMIT 1',
    [busId]
  );
  return result.rows[0];
}

export async function getBusLocations(busId: number, limit = 50) {
  const result = await pool.query(
    'SELECT * FROM bus_locations WHERE bus_id = $1 ORDER BY created_at DESC LIMIT $2',
    [busId, limit]
  );
  return result.rows;
}

export async function getAllActiveBusLocations() {
  const result = await pool.query(`
    SELECT 
      bl.*, 
      b.plate_number, 
      b.model, 
      b.capacity,
      r.route_name,
      r.start_location,
      r.end_location,
      c.name as company_name,
      u.username as driver_name
    FROM bus_locations bl
    JOIN buses b ON bl.bus_id = b.id
    LEFT JOIN routes r ON b.id = r.bus_id
    LEFT JOIN companies c ON b.company_id = c.id
    LEFT JOIN users u ON b.driver_id = u.id
    WHERE bl.created_at > NOW() - INTERVAL '10 minutes'
    ORDER BY bl.created_at DESC
  `);
  return result.rows;
}

export async function getCompanyBusLocations(companyId: number) {
  const result = await pool.query(`
    SELECT 
      bl.*, 
      b.plate_number, 
      b.model,
      r.route_name,
      u.username as driver_name
    FROM bus_locations bl
    JOIN buses b ON bl.bus_id = b.id
    LEFT JOIN routes r ON b.id = r.bus_id
    LEFT JOIN users u ON b.driver_id = u.id
    WHERE b.company_id = $1 AND bl.created_at > NOW() - INTERVAL '10 minutes'
    ORDER BY bl.created_at DESC
  `, [companyId]);
  return result.rows;
}
