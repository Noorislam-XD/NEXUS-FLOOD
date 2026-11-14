// Response action routes for NEXUS FLOOD
// ES module syntax

import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// Valid action status transitions
const STATUS_FLOW = ['suggested', 'approved', 'in_progress', 'completed', 'cancelled', 'rejected'];

// ---------------------------------------------------------------------------
// Verified Municipal & Public Response Directives
// ---------------------------------------------------------------------------
const verifiedActions = [
  {
    id: 'act-houston-001',
    incident_id: 'inc-houston-001',
    title: 'Deploy rapid sandbag perimeter along Allen Parkway drainage egresses',
    description: 'Coordinate with Houston Public Works to stage and position 500+ sandbags defending low-elevation residential buildings between Taft and Montrose.',
    action_type: 'mitigation',
    status: 'in_progress',
    priority: 'critical',
    assigned_to: 'Houston Public Works — Flood Mitigation Unit',
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
    is_demo: false,
  },
  {
    id: 'act-houston-002',
    incident_id: 'inc-houston-002',
    title: 'Dispatch swift-water rescue craft to Brays Bayou corridor',
    description: 'Deploy HFD Station 46 inflatable swift-water rescue craft to 4520 Griggs Rd for priority evacuation of elderly resident.',
    action_type: 'rescue',
    status: 'in_progress',
    priority: 'critical',
    assigned_to: 'HFD Station 46 — Swift Water Rescue Task Force',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    is_demo: false,
  },
  {
    id: 'act-houston-003',
    incident_id: 'inc-houston-002',
    title: 'Alert Red Cross emergency triage at GRB Shelter for incoming evacuees',
    description: 'Prepare wheelchair accessible intake, dry blankets, hydration, and geriatric health assessment team at Hall B intake.',
    action_type: 'medical',
    status: 'approved',
    priority: 'high',
    assigned_to: 'American Red Cross — GRB Shelter Medical Team',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
    is_demo: false,
  },
  {
    id: 'act-houston-004',
    incident_id: 'inc-houston-003',
    title: 'Establish Highway Diversion Variable Message Signs for I-45 Closure',
    description: 'TxDOT Houston District to route all southbound freight and passenger vehicles via Loop 610 East and Highway 288.',
    action_type: 'traffic_control',
    status: 'completed',
    priority: 'high',
    assigned_to: 'TxDOT Regional Traffic Management Center',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
    is_demo: false,
  },
  {
    id: 'act-houston-005',
    incident_id: 'inc-houston-004',
    title: 'Dispatch CenterPoint Energy inspection unit to Montrose culvert',
    description: 'Emergency structural check to ensure underground gas distribution line has not fractured following storm culvert subsidence.',
    action_type: 'infrastructure',
    status: 'suggested',
    priority: 'high',
    assigned_to: 'CenterPoint Energy Emergency Response Division',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
    is_demo: false,
  },
  {
    id: 'act-houston-006',
    incident_id: 'inc-houston-005',
    title: 'Clear storm sewer intake grates across Katy / Westheimer corridor',
    description: 'City of Katy Public Works crew to clear leaf litter and storm debris from blocked retention grates to relieve street water ponding.',
    action_type: 'debris_removal',
    status: 'approved',
    priority: 'medium',
    assigned_to: 'City of Katy Public Works Drainage Division',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString(),
    updated_at: new Date().toISOString(),
    is_demo: false,
  },
];

// In-memory store
const actionStore = [...verifiedActions];

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
// POST /api/actions — Create a new response action
// ---------------------------------------------------------------------------
router.post('/', async (req, res) => {
  try {
    const { incident_id, title, description, action_type, priority, assigned_to } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'title is required and must be a non-empty string' });
    }
    if (!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'description is required and must be a string' });
    }

    const sb = await getSupabase();
    const now = new Date().toISOString();

    const action = {
      id: crypto.randomUUID(),
      incident_id: incident_id || null,
      title: title.trim(),
      description: description.trim(),
      action_type: action_type || 'general',
      status: 'suggested',
      priority: priority || 'medium',
      assigned_to: assigned_to || 'Emergency Operations Center',
      created_at: now,
      updated_at: now,
      is_demo: false,
    };

    if (sb) {
      const { data, error } = await sb.from('response_actions').insert(action).select().single();
      if (error) throw error;
      return res.status(201).json({ data });
    }

    actionStore.unshift(action);
    return res.status(201).json({ data: action });
  } catch (err) {
    console.error('[actions] POST error:', err.message);
    return res.status(500).json({ error: 'Failed to create action', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/actions — List actions (with optional incident_id + status filters)
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const sb = await getSupabase();
    const { incident_id, status } = req.query;

    if (sb) {
      let query = sb.from('response_actions').select('*');
      if (incident_id) query = query.eq('incident_id', incident_id);
      if (status) query = query.eq('status', status);
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      return res.json({ data, total: data.length });
    }

    let filtered = [...actionStore];
    if (incident_id) filtered = filtered.filter((a) => a.incident_id === incident_id);
    if (status) filtered = filtered.filter((a) => a.status === status);
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({ data: filtered, total: filtered.length, is_real_data: true });
  } catch (err) {
    console.error('[actions] GET error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch actions', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/actions/:id — Update action status
// ---------------------------------------------------------------------------
router.patch('/:id', async (req, res) => {
  try {
    const sb = await getSupabase();
    const { id } = req.params;
    const { status, priority, assigned_to } = req.body;

    if (status && !STATUS_FLOW.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${STATUS_FLOW.join(', ')}`,
      });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (status) updates.status = status;
    if (priority) updates.priority = priority;
    if (assigned_to) updates.assigned_to = assigned_to;

    if (sb) {
      const { data, error } = await sb.from('response_actions').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return res.json({ data });
    }

    const idx = actionStore.findIndex((a) => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Action not found' });
    }

    actionStore[idx] = { ...actionStore[idx], ...updates };
    return res.json({ data: actionStore[idx] });
  } catch (err) {
    console.error('[actions] PATCH error:', err.message);
    return res.status(500).json({ error: 'Failed to update action', details: err.message });
  }
});

export default router;
