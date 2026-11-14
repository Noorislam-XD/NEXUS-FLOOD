// Community resources routes for NEXUS FLOOD
// ES module syntax

import { Router } from 'express';

const router = Router();

// ---------------------------------------------------------------------------
// Pre-seeded demo resources — 8 realistic Houston TX locations
// ---------------------------------------------------------------------------
const demoResources = [
  {
    id: 'demo-res-001',
    name: 'Houston Emergency Operations Center',
    category: 'emergency_services',
    address: '5320 N Shepherd Dr, Houston, TX 77091',
    latitude: 29.8170,
    longitude: -95.4100,
    phone: '(713) 884-3131',
    website: 'https://www.houstonoem.org',
    hours: '24/7 during activations',
    description: 'City of Houston Office of Emergency Management. Coordinates disaster response, issues evacuation orders, and manages resource deployment across the metro area.',
    verification_status: 'verified',
    last_verified_at: '2026-11-13T18:00:00Z',
    is_demo: true,
  },
  {
    id: 'demo-res-002',
    name: 'George R. Brown Convention Center — Emergency Shelter',
    category: 'shelter',
    address: '1001 Avenida de las Americas, Houston, TX 77010',
    latitude: 29.7519,
    longitude: -95.3564,
    phone: '(713) 853-8000',
    website: 'https://www.grbhouston.com',
    hours: 'Open during declared emergencies',
    description: 'Primary mega-shelter for Houston flood evacuees. Capacity for 10,000+ individuals. Red Cross managed with medical triage, food service, and pet-friendly zones.',
    verification_status: 'verified',
    last_verified_at: '2026-11-14T01:00:00Z',
    is_demo: true,
  },
  {
    id: 'demo-res-003',
    name: 'Ben Taub Hospital — Emergency Department',
    category: 'medical',
    address: '1504 Taub Loop, Houston, TX 77030',
    latitude: 29.7069,
    longitude: -95.3985,
    phone: '(713) 873-2000',
    website: 'https://www.harrishealth.org/locations-hh/ben-taub-hospital',
    hours: '24/7',
    description: 'Level 1 Trauma Center and county hospital. Accepts all patients regardless of ability to pay. Full emergency department with flood-related injury treatment capacity.',
    verification_status: 'verified',
    last_verified_at: '2026-11-14T02:00:00Z',
    is_demo: true,
  },
  {
    id: 'demo-res-004',
    name: 'Houston Food Bank — Emergency Distribution',
    category: 'community_org',
    address: '535 Portwall St, Houston, TX 77029',
    latitude: 29.7350,
    longitude: -95.2870,
    phone: '(713) 223-3700',
    website: 'https://www.houstonfoodbank.org',
    hours: '7:00 AM - 7:00 PM during disasters',
    description: 'Largest Feeding America food bank in the country. Distributes emergency food boxes, water, and supplies to flood-affected communities. Volunteer coordination hub.',
    verification_status: 'verified',
    last_verified_at: '2026-11-13T20:00:00Z',
    is_demo: true,
  },
  {
    id: 'demo-res-005',
    name: 'Lakewood Church — Temporary Shelter',
    category: 'shelter',
    address: '3700 Southwest Fwy, Houston, TX 77027',
    latitude: 29.7375,
    longitude: -95.4548,
    phone: '(713) 635-4154',
    website: 'https://www.lakewoodchurch.com',
    hours: 'Open during declared emergencies',
    description: 'Emergency shelter with 16,000-person capacity. Provides cots, meals, clothing donations, and spiritual support services for displaced residents.',
    verification_status: 'verified',
    last_verified_at: '2026-11-13T22:00:00Z',
    is_demo: true,
  },
  {
    id: 'demo-res-006',
    name: 'Harris County Flood Control District',
    category: 'emergency_services',
    address: '9900 Northwest Fwy, Houston, TX 77092',
    latitude: 29.8133,
    longitude: -95.4686,
    phone: '(713) 684-4000',
    website: 'https://www.hcfcd.org',
    hours: '24/7 during flood events',
    description: 'Monitors bayou levels, manages flood infrastructure, and issues real-time flood warnings for Harris County. Operates 150+ stream gauges and 30+ rainfall gauges.',
    verification_status: 'verified',
    last_verified_at: '2026-11-14T03:00:00Z',
    is_demo: true,
  },
  {
    id: 'demo-res-007',
    name: 'BakerRipley Neighborhood Center — Gulfton',
    category: 'community_org',
    address: '6500 Rookin St, Houston, TX 77074',
    latitude: 29.6988,
    longitude: -95.4943,
    phone: '(713) 667-9400',
    website: 'https://www.bakerripley.org',
    hours: '8:00 AM - 6:00 PM',
    description: 'Multilingual disaster relief services for diverse Gulfton community. Provides FEMA application assistance, case management, temporary housing navigation, and immigration-sensitive support.',
    verification_status: 'verified',
    last_verified_at: '2026-11-13T19:00:00Z',
    is_demo: true,
  },
  {
    id: 'demo-res-008',
    name: 'Memorial Hermann — Texas Medical Center Emergency',
    category: 'medical',
    address: '6411 Fannin St, Houston, TX 77030',
    latitude: 29.7095,
    longitude: -95.3963,
    phone: '(713) 704-4000',
    website: 'https://www.memorialhermann.org',
    hours: '24/7',
    description: 'Level 1 Trauma Center in the Texas Medical Center. Full emergency services with helicopter evacuation capability. Disaster surge capacity protocols in effect during major flood events.',
    verification_status: 'verified',
    last_verified_at: '2026-11-14T01:30:00Z',
    is_demo: true,
  },
];

// ---------------------------------------------------------------------------
// GET /api/resources — List community resources (filterable by category)
// ---------------------------------------------------------------------------
router.get('/', (req, res) => {
  try {
    const { category } = req.query;
    let results = [...demoResources];

    if (category) {
      const validCategories = ['emergency_services', 'shelter', 'medical', 'community_org'];
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          error: 'Invalid category',
          valid_categories: validCategories,
        });
      }
      results = results.filter((r) => r.category === category);
    }

    return res.json({
      data: results,
      total: results.length,
    });
  } catch (err) {
    console.error('[resources] GET error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch resources', details: err.message });
  }
});

export default router;
