// Incident CRUD routes for NEXUS FLOOD
// ES module syntax

import { Router } from 'express';
import crypto from 'crypto';
import { validateIncident } from '../middleware/validate.js';

const router = Router();

// ---------------------------------------------------------------------------
// Demo data — 5 realistic flood incidents in Houston, TX area
// ---------------------------------------------------------------------------
const demoIncidents = [
  {
    id: 'demo-inc-001',
    incident_type: 'flood',
    description: 'Major street flooding reported along Buffalo Bayou near Allen Parkway. Water levels rising rapidly, multiple vehicles stranded. Residents in nearby townhomes reporting water entering ground-floor units.',
    location: '1800 Allen Parkway, Houston, TX 77019',
    latitude: 29.7604,
    longitude: -95.3930,
    location_details: {
      address: '1800 Allen Parkway, Houston, TX 77019',
      latitude: 29.7604,
      longitude: -95.3930,
      area: 'Buffalo Bayou / Montrose',
    },
    status: 'active',
    incident_status: 'investigating',
    priority: 'critical',
    severity: 'critical',
    source: 'community_report',
    reported_by: 'Community Member',
    verification_status: 'verified',
    created_at: '2026-11-14T02:15:00Z',
    updated_at: '2026-11-14T06:30:00Z',
    is_demo: true,
  },
  {
    id: 'demo-inc-002',
    incident_type: 'rescue_needed',
    description: 'Family of four trapped on second floor of residence due to rapidly rising floodwaters. Ground floor completely submerged. Elderly person with mobility issues present. Requesting boat rescue.',
    location: '4520 Griggs Rd, Houston, TX 77021',
    latitude: 29.7100,
    longitude: -95.3400,
    location_details: {
      address: '4520 Griggs Rd, Houston, TX 77021',
      latitude: 29.7100,
      longitude: -95.3400,
      area: 'Third Ward / Riverside Terrace',
    },
    status: 'active',
    incident_status: 'responding',
    priority: 'critical',
    severity: 'critical',
    source: 'emergency_call',
    reported_by: 'Resident (anonymous)',
    verification_status: 'verified',
    created_at: '2026-11-14T03:45:00Z',
    updated_at: '2026-11-14T05:00:00Z',
    is_demo: true,
  },
  {
    id: 'demo-inc-003',
    incident_type: 'road_closure',
    description: 'Interstate 45 southbound at the Gulf Freeway near Telephone Road is completely impassable. Approximately 3 feet of standing water across all lanes. Multiple 18-wheelers and passenger vehicles abandoned.',
    location: 'I-45 Southbound at Telephone Rd, Houston, TX 77023',
    latitude: 29.7180,
    longitude: -95.3120,
    location_details: {
      address: 'I-45 Southbound at Telephone Rd, Houston, TX 77023',
      latitude: 29.7180,
      longitude: -95.3120,
      area: 'Gulf Freeway / Greater East End',
    },
    status: 'active',
    incident_status: 'investigating',
    priority: 'high',
    severity: 'high',
    source: 'field_report',
    reported_by: 'TxDOT Field Crew',
    verification_status: 'verified',
    created_at: '2026-11-14T01:30:00Z',
    updated_at: '2026-11-14T04:15:00Z',
    is_demo: true,
  },
  {
    id: 'demo-inc-004',
    incident_type: 'infrastructure_damage',
    description: 'Storm drain overflow causing sinkhole formation at intersection of Westheimer and Montrose. Estimated 6-foot diameter hole expanding. Gas line exposure suspected. Area cordoned off by HPD.',
    location: 'Westheimer Rd & Montrose Blvd, Houston, TX 77006',
    latitude: 29.7420,
    longitude: -95.3910,
    location_details: {
      address: 'Westheimer Rd & Montrose Blvd, Houston, TX 77006',
      latitude: 29.7420,
      longitude: -95.3910,
      area: 'Montrose / Neartown',
    },
    status: 'monitoring',
    incident_status: 'investigating',
    priority: 'high',
    severity: 'high',
    source: 'official_report',
    reported_by: 'Houston Public Works',
    verification_status: 'verified',
    created_at: '2026-11-14T04:00:00Z',
    updated_at: '2026-11-14T06:00:00Z',
    is_demo: true,
  },
  {
    id: 'demo-inc-005',
    incident_type: 'flood',
    description: 'Severe thunderstorm with 60mph wind gusts moving through Katy/West Houston corridor. Street water rising across residential blocks.',
    location: 'Mason Rd & Westheimer Pkwy, Katy, TX 77450',
    latitude: 29.7350,
    longitude: -95.7570,
    location_details: {
      address: 'Mason Rd & Westheimer Pkwy, Katy, TX 77450',
      latitude: 29.7350,
      longitude: -95.7570,
      area: 'Katy / West Houston',
    },
    status: 'active',
    incident_status: 'reported',
    priority: 'medium',
    severity: 'medium',
    source: 'weather_service',
    reported_by: 'NWS Houston',
    verification_status: 'unconfirmed',
    created_at: '2026-11-14T00:45:00Z',
    updated_at: '2026-11-14T03:30:00Z',
    is_demo: true,
  },
];

// In-memory store (seeded with demo data)
const incidentStore = [...demoIncidents];

// Demo evidence linked to demo incidents
const demoEvidence = [
  { id: 'demo-ev-001', incident_id: 'demo-inc-001', type: 'photo', url: null, description: 'Street-level photo showing water up to car door handles', submitted_by: 'Community Member', created_at: '2026-11-14T02:20:00Z', is_demo: true },
  { id: 'demo-ev-002', incident_id: 'demo-inc-001', type: 'text', url: null, description: 'Eyewitness account of bayou overtopping banks at 2am', submitted_by: 'Local Resident', created_at: '2026-11-14T02:30:00Z', is_demo: true },
  { id: 'demo-ev-003', incident_id: 'demo-inc-002', type: 'audio', url: null, description: '911 call transcript — family requesting rescue', submitted_by: 'Emergency Dispatch', created_at: '2026-11-14T03:50:00Z', is_demo: true },
  { id: 'demo-ev-004', incident_id: 'demo-inc-003', type: 'photo', url: null, description: 'TxDOT camera screenshot showing submerged vehicles on I-45', submitted_by: 'TxDOT', created_at: '2026-11-14T01:45:00Z', is_demo: true },
];

// ---------------------------------------------------------------------------
// Supabase helper (lazy init)
// ---------------------------------------------------------------------------
let supabase = null;

async function getSupabase() {
  if (supabase !== null) return supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabase = createClient(url, key);
    return supabase;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// POST /api/incidents — Create a new incident
// ---------------------------------------------------------------------------
router.post('/', validateIncident, async (req, res) => {
  try {
    const sb = await getSupabase();
    const now = new Date().toISOString();

    const incident = {
      id: crypto.randomUUID(),
      incident_type: req.body.incident_type || 'flood',
      description: req.body.description,
      location: typeof req.body.location === 'object' ? req.body.location?.address || req.body.location?.reported_address : req.body.location,
      latitude: req.body.latitude || (typeof req.body.location === 'object' ? req.body.location?.latitude : null),
      longitude: req.body.longitude || (typeof req.body.location === 'object' ? req.body.location?.longitude : null),
      status: req.body.incident_status || req.body.status || 'reported',
      incident_status: req.body.incident_status || req.body.status || 'reported',
      priority: req.body.priority || 'medium',
      severity: req.body.severity || req.body.priority || 'medium',
      source: req.body.source || 'community_report',
      reported_by: req.body.reported_by || 'Anonymous',
      verification_status: req.body.verification_status || 'unconfirmed',
      ai_analysis: req.body.ai_analysis || null,
      created_at: now,
      updated_at: now,
      is_demo: false,
    };

    if (sb) {
      const { data, error } = await sb.from('incidents').insert(incident).select().single();
      if (error) throw error;
      return res.status(201).json({ data });
    }

    incidentStore.push(incident);
    return res.status(201).json({ data: incident });
  } catch (err) {
    console.error('[incidents] POST error:', err.message);
    return res.status(500).json({ error: 'Failed to create incident', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/incidents — List incidents (with optional filters + pagination)
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const sb = await getSupabase();
    const { status, priority, type, limit: rawLimit, offset: rawOffset } = req.query;
    const limit = Math.min(Math.max(parseInt(rawLimit, 10) || 50, 1), 200);
    const offset = Math.max(parseInt(rawOffset, 10) || 0, 0);

    if (sb) {
      let query = sb.from('incidents').select('*', { count: 'exact' });
      if (status) query = query.eq('status', status);
      if (priority) query = query.eq('priority', priority);
      if (type) query = query.eq('incident_type', type);
      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      const { data, error, count } = await query;
      if (error) throw error;
      return res.json({ data, total: count, limit, offset });
    }

    // In-memory filtering
    let filtered = [...incidentStore];
    if (status) filtered = filtered.filter((i) => i.status === status);
    if (priority) filtered = filtered.filter((i) => i.priority === priority);
    if (type) filtered = filtered.filter((i) => i.incident_type === type);
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);
    return res.json({ data: page, total, limit, offset });
  } catch (err) {
    console.error('[incidents] GET error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch incidents', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/incidents/:id — Single incident with evidence & analysis
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const sb = await getSupabase();
    const { id } = req.params;

    if (sb) {
      const { data, error } = await sb.from('incidents').select('*').eq('id', id).single();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Incident not found' });

      // Fetch related evidence
      const { data: evidence } = await sb.from('evidence').select('*').eq('incident_id', id);
      // Fetch related analysis
      const { data: analysis } = await sb.from('analyses').select('*').eq('incident_id', id);
      return res.json({ data: { ...data, evidence: evidence || [], analysis: analysis || [] } });
    }

    // In-memory
    const incident = incidentStore.find((i) => i.id === id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    const evidence = demoEvidence.filter((e) => e.incident_id === id);
    return res.json({ data: { ...incident, evidence, analysis: [] } });
  } catch (err) {
    console.error('[incidents] GET/:id error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch incident', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/incidents/:id — Update status / priority / verification
// ---------------------------------------------------------------------------
router.patch('/:id', async (req, res) => {
  try {
    const sb = await getSupabase();
    const { id } = req.params;
    const allowedFields = ['status', 'priority', 'severity', 'verification_status', 'description'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.updated_at = new Date().toISOString();

    if (sb) {
      const { data, error } = await sb.from('incidents').update(updates).eq('id', id).select().single();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Incident not found' });
      return res.json({ data });
    }

    // In-memory
    const idx = incidentStore.findIndex((i) => i.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Incident not found' });
    Object.assign(incidentStore[idx], updates);
    return res.json({ data: incidentStore[idx] });
  } catch (err) {
    console.error('[incidents] PATCH error:', err.message);
    return res.status(500).json({ error: 'Failed to update incident', details: err.message });
  }
});

export default router;
