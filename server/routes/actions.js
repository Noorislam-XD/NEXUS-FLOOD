// Response action routes for NEXUS FLOOD
// ES module syntax

import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// Valid action status transitions
const STATUS_FLOW = ['suggested', 'approved', 'in_progress', 'completed', 'cancelled'];

// ---------------------------------------------------------------------------
// Pre-seeded demo actions linked to demo incidents
// ---------------------------------------------------------------------------
const demoActions = [
  {
    id: 'demo-act-001',
    incident_id: 'demo-inc-001',
    title: 'Deploy sandbags along Allen Parkway residential entrances',
    description: 'Coordinate with HPW to deploy 500+ sandbags to protect ground-floor units along Allen Parkway between Taft and Shepherd.',
    action_type: 'mitigation',
    status: 'in_progress',
    priority: 'critical',
    assigned_to: 'Houston Public Works — Flood Response Unit',
    created_at: '2026-11-14T02:30:00Z',
    updated_at: '2026-11-14T05:00:00Z',
    is_demo: true,
  },
  {
    id: 'demo-act-002',
    incident_id: 'demo-inc-002',
    title: 'Dispatch swift-water rescue team to Griggs Rd residence',
    description: 'Deploy HFD Station 46 swift-water rescue boat to 4520 Griggs Rd. Family of four including elderly individual with mobility issues. Priority extraction.',
    action_type: 'rescue',
    status: 'in_progress',
    priority: 'critical',
    assigned_to: 'HFD Station 46 — Swift Water Rescue',
    created_at: '2026-11-14T03:50:00Z',
    updated_at: '2026-11-14T04:15:00Z',
    is_demo: true,
  },
  {
    id: 'demo-act-003',
    incident_id: 'demo-inc-002',
    title: 'Prepare medical triage at George R. Brown for rescued family',
    description: 'Alert shelter medical staff for incoming elderly patient with mobility issues. Prepare wheelchair access and basic medical assessment station.',
    action_type: 'medical',
    status: 'approved',
    priority: 'high',
    assigned_to: 'Red Cross — GRB Shelter Medical Team',
    created_at: '2026-11-14T04:00:00Z',
    updated_at: '2026-11-14T04:00:00Z',
    is_demo: true,
  },
  {
    id: 'demo-act-004',
    incident_id: 'demo-inc-003',
    title: 'Set up highway detour signage for I-45 closure',
    description: 'Deploy traffic control teams to set up detour via SH-288 and I-610 loop. Install message boards on I-45 northbound at Edgebrook and southbound at I-10.',
    action_type: 'traffic_control',
    status: 'completed',
    priority: 'high',
    assigned_to: 'TxDOT Houston District',
    created_at: '2026-11-14T02:00:00Z',
    updated_at: '2026-11-14T03:30:00Z',
    is_demo: true,
  },
  {
    id: 'demo-act-005',
    incident_id: 'demo-inc-004',
    title: 'Dispatch gas leak inspection team to Westheimer sinkhole',
    description: 'CenterPoint Energy emergency crew to assess potential gas line exposure at Westheimer & Montrose sinkhole. Establish 200-foot safety perimeter.',
    action_type: 'infrastructure',
    status: 'suggested',
    priority: 'high',
    assigned_to: 'CenterPoint Energy — Emergency Response',
    created_at: '2026-11-14T04:15:00Z',
    updated_at: '2026-11-14T04:15:00Z',
    is_demo: true,
  },
  {
    id: 'demo-act-006',
    incident_id: 'demo-inc-005',
    title: 'Activate emergency tree-clearing crews in Katy subdivisions',
    description: 'Deploy city and contract crews to clear downed trees blocking Cinco Ranch and Grand Lakes neighborhood streets. Prioritize routes to hospitals and schools.',
    action_type: 'debris_removal',
    status: 'approved',
    priority: 'medium',
    assigned_to: 'City of Katy — Public Works',
    created_at: '2026-11-14T01:30:00Z',
    updated_at: '2026-11-14T03:00:00Z',
    is_demo: true,
  },
];

// In-memory store
const actionStore = [...demoActions];

// ---------------------------------------------------------------------------
// POST /api/actions — Create a new response action
// ---------------------------------------------------------------------------
router.post('/', (req, res) => {
  try {
    const { incident_id, title, description, action_type, priority, assigned_to } = req.body;

    const errors = [];
    if (!title || typeof title !== 'string') errors.push('title is required');
    if (!description || typeof description !== 'string') errors.push('description is required');
    if (!action_type || typeof action_type !== 'string') errors.push('action_type is required');

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    const now = new Date().toISOString();
    const action = {
      id: crypto.randomUUID(),
      incident_id: incident_id || null,
      title: title.trim(),
      description: description.trim(),
      action_type,
      status: 'suggested',
      priority: priority || 'medium',
      assigned_to: assigned_to || 'Unassigned',
      created_at: now,
      updated_at: now,
      is_demo: false,
    };

    actionStore.push(action);
    return res.status(201).json({ data: action });
  } catch (err) {
    console.error('[actions] POST error:', err.message);
    return res.status(500).json({ error: 'Failed to create action', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// GET /api/actions — List actions (filterable by incident_id, status)
// ---------------------------------------------------------------------------
router.get('/', (req, res) => {
  try {
    const { incident_id, status } = req.query;
    let results = [...actionStore];

    if (incident_id) {
      results = results.filter((a) => a.incident_id === incident_id);
    }
    if (status) {
      if (!STATUS_FLOW.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          valid_statuses: STATUS_FLOW,
        });
      }
      results = results.filter((a) => a.status === status);
    }

    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({
      data: results,
      total: results.length,
    });
  } catch (err) {
    console.error('[actions] GET error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch actions', details: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/actions/:id — Update action status
// ---------------------------------------------------------------------------
router.patch('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { status, assigned_to } = req.body;

    const idx = actionStore.findIndex((a) => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Action not found' });
    }

    const action = actionStore[idx];

    if (status) {
      if (!STATUS_FLOW.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
          valid_statuses: STATUS_FLOW,
        });
      }

      // Validate transition order (allow same status or forward movement, or cancel from any)
      const currentIdx = STATUS_FLOW.indexOf(action.status);
      const targetIdx = STATUS_FLOW.indexOf(status);
      if (status !== 'cancelled' && targetIdx < currentIdx) {
        return res.status(400).json({
          error: `Cannot transition from '${action.status}' to '${status}'. Status can only move forward or be cancelled.`,
        });
      }

      action.status = status;
    }

    if (assigned_to !== undefined) {
      action.assigned_to = assigned_to;
    }

    action.updated_at = new Date().toISOString();
    actionStore[idx] = action;

    return res.json({ data: action });
  } catch (err) {
    console.error('[actions] PATCH error:', err.message);
    return res.status(500).json({ error: 'Failed to update action', details: err.message });
  }
});

export default router;
