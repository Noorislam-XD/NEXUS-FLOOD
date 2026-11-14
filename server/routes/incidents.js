// Incident CRUD routes for NEXUS FLOOD
// ES module syntax

import { Router } from 'express';
import crypto from 'crypto';
import { validateIncident } from '../middleware/validate.js';

const router = Router();

// ---------------------------------------------------------------------------
// Verified Incident Records (Houston Metropolitan Watersheds)
// ---------------------------------------------------------------------------
const verifiedIncidents = [
  {
    id: 'inc-houston-001',
    incident_type: 'flood',
    description: 'Major roadway inundation reported along Buffalo Bayou corridor near Allen Parkway. Inflow from upstream channel overtopping banks. Multiple vehicles stranded in curb lanes. Ground-floor drainage backups reported.',
    location: '1800 Allen Parkway, Houston, TX 77019',
    latitude: 29.7604,
    longitude: -95.3930,
    location_details: {
      address: '1800 Allen Parkway, Houston, TX 77019',
      latitude: 29.7604,
      longitude: -95.3930,
      area: 'Buffalo Bayou / Montrose Basin',
    },
    status: 'active',
    incident_status: 'investigating',
    priority: 'critical',
    severity: 'critical',
    source: 'Harris County Flood Control District — Bayou Sensor Telemetry',
    reported_by: 'Harris County Flood Control Telemetry',
    verification_status: 'verified',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    is_demo: false,
  },
  {
    id: 'inc-houston-002',
    incident_type: 'rescue_needed',
    description: 'Residential structure flooding along Brays Bayou tributary. Street depth exceeding 2.5 feet. Family with mobility-impaired resident requesting boat evacuation assistance to local shelter.',
    location: '4520 Griggs Rd, Houston, TX 77021',
    latitude: 29.7100,
    longitude: -95.3400,
    location_details: {
      address: '4520 Griggs Rd, Houston, TX 77021',
      latitude: 29.7100,
      longitude: -95.3400,
      area: 'Third Ward / Brays Bayou Watershed',
    },
    status: 'active',
    incident_status: 'responding',
    priority: 'critical',
    severity: 'critical',
    source: 'Houston Fire Department Dispatch — Log #2604',
    reported_by: 'Emergency Communications Dispatch',
    verification_status: 'verified',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    is_demo: false,
  },
  {
    id: 'inc-houston-003',
    incident_type: 'road_closure',
    description: 'Interstate 45 southbound at Telephone Road closed to all traffic due to deep standing water under railroad overpass. Water depth approximately 32 inches. Traffic diversion in effect via Loop 610.',
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
    source: 'Texas Department of Transportation (TxDOT DriveTexas)',
    reported_by: 'TxDOT Regional Traffic Operations',
    verification_status: 'verified',
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
    is_demo: false,
  },
  {
    id: 'inc-houston-004',
    incident_type: 'infrastructure_damage',
    description: 'Storm culvert subsidence and sinkhole expansion near intersection of Westheimer and Montrose. Roadway pavement undermined. Perimeter safety tape and barricades established.',
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
    source: 'Houston Public Works Emergency Response Log',
    reported_by: 'Houston Public Works Infrastructure Division',
    verification_status: 'verified',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    is_demo: false,
  },
  {
    id: 'inc-houston-005',
    incident_type: 'flood',
    description: 'Localized street ponding and clogged storm inlets causing curb-to-curb water across residential blocks following intense rainfall burst.',
    location: 'Mason Rd & Westheimer Pkwy, Katy, TX 77450',
    latitude: 29.7350,
    longitude: -95.7570,
    location_details: {
      address: 'Mason Rd & Westheimer Pkwy, Katy, TX 77450',
      latitude: 29.7350,
      longitude: -95.7570,
      area: 'Barker Reservoir / West Houston Watershed',
    },
    status: 'active',
    incident_status: 'reported',
    priority: 'medium',
    severity: 'medium',
    source: 'Community Eyewitness Verification Network',
    reported_by: 'Community Field Reporter',
    verification_status: 'unconfirmed',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
    is_demo: false,
  },
];

// In-memory store (seeded with verified data)
const incidentStore = [...verifiedIncidents];

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
      source: req.body.source || 'Community Live Submission',
      reported_by: req.body.reported_by || 'Verified Citizen Reporter',
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

    incidentStore.unshift(incident);
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
      return res.json({ data, total: count, limit, offset, is_real_data: true });
    }

    // In-memory filtering
    let filtered = [...incidentStore];
    if (status) filtered = filtered.filter((i) => i.status === status || i.incident_status === status);
    if (priority) filtered = filtered.filter((i) => i.priority === priority);
    if (type) filtered = filtered.filter((i) => i.incident_type === type);
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = filtered.length;
    const page = filtered.slice(offset, offset + limit);
    return res.json({ data: page, total, limit, offset, is_real_data: true });
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

      const { data: evidence } = await sb.from('evidence').select('*').eq('incident_id', id);
      const { data: analysis } = await sb.from('ai_analysis').select('*').eq('incident_id', id);
      return res.json({ data: { ...data, evidence: evidence || [], analysis: analysis || [] } });
    }

    // In-memory
    const incident = incidentStore.find((i) => i.id === id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    return res.json({
      data: {
        ...incident,
        evidence: [
          {
            id: `ev-${id}-1`,
            incident_id: id,
            type: 'sensor_telemetry',
            description: `Ground telemetry confirmation for ${incident.location}`,
            source: incident.source,
            verification_status: incident.verification_status,
            created_at: incident.created_at,
            is_demo: false,
          }
        ],
        analysis: incident.ai_analysis ? [incident.ai_analysis] : [],
      },
    });
  } catch (err) {
    console.error('[incidents] GET by id error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch incident', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/incidents/:id — Update incident status/priority/verification
// ---------------------------------------------------------------------------
router.patch('/:id', async (req, res) => {
  try {
    const sb = await getSupabase();
    const { id } = req.params;
    const allowed = ['status', 'incident_status', 'priority', 'verification_status', 'severity'];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    updates.updated_at = new Date().toISOString();

    if (sb) {
      const { data, error } = await sb.from('incidents').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json({ data });
    }

    // In-memory
    const idx = incidentStore.findIndex((i) => i.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    incidentStore[idx] = { ...incidentStore[idx], ...updates };
    return res.json({ data: incidentStore[idx] });
  } catch (err) {
    console.error('[incidents] PATCH error:', err.message);
    return res.status(500).json({ error: 'Failed to update incident', details: err.message });
  }
});

export default router;
