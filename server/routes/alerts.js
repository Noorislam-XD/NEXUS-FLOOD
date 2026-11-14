// Weather/flood alert routes for NEXUS FLOOD
// ES module syntax

import { Router } from 'express';

const router = Router();

// ---------------------------------------------------------------------------
// Demo alerts — 3 realistic flood warning examples for Houston TX
// ---------------------------------------------------------------------------
const demoAlerts = [
  {
    id: 'demo-alert-001',
    type: 'Flash Flood Warning',
    severity: 'Extreme',
    title: 'Flash Flood Warning — Harris County until 6:00 AM CST',
    description:
      'The National Weather Service in Houston/Galveston has issued a Flash Flood Warning for Harris County in southeastern Texas. At 2:15 AM CST, Doppler radar and automated rain gauges indicated 6 to 8 inches of rain have fallen over the past 3 hours. Flash flooding is already occurring along Buffalo Bayou, Brays Bayou, and White Oak Bayou. Additional rainfall of 2 to 4 inches is expected. Turn around, don\'t drown! Most flood deaths occur in vehicles.',
    area: 'Harris County, TX',
    effective: '2026-11-14T02:15:00-06:00',
    expires: '2026-11-14T06:00:00-06:00',
    source: 'NWS Houston/Galveston',
    source_url: 'https://alerts.weather.gov',
    is_demo: true,
  },
  {
    id: 'demo-alert-002',
    type: 'Flood Warning',
    severity: 'Severe',
    title: 'Flood Warning — Buffalo Bayou at Shepherd Drive',
    description:
      'The National Weather Service in Houston/Galveston has issued a Flood Warning for Buffalo Bayou at Shepherd Drive. At 3:00 AM CST the stage was 32.5 feet. Flood stage is 28.0 feet. The bayou is expected to crest near 36.0 feet by 8:00 AM CST. At 36 feet, extensive flooding occurs in adjacent neighborhoods including areas along Memorial Drive and Allen Parkway. Multiple residential subdivisions will experience 1-3 feet of water.',
    area: 'Buffalo Bayou at Shepherd Drive, Houston TX',
    effective: '2026-11-14T03:00:00-06:00',
    expires: '2026-11-15T03:00:00-06:00',
    source: 'NWS Houston/Galveston',
    source_url: 'https://water.weather.gov/ahps2/hydrograph.php?wfo=hgx&gage=shdt2',
    is_demo: true,
  },
  {
    id: 'demo-alert-003',
    type: 'Flash Flood Watch',
    severity: 'Moderate',
    title: 'Flash Flood Watch — Greater Houston/Galveston area through Wednesday evening',
    description:
      'The National Weather Service in Houston/Galveston has issued a Flash Flood Watch for the greater Houston/Galveston area. A slow-moving frontal boundary combined with deep tropical moisture will produce training thunderstorms capable of producing 4 to 8 inches of rainfall with locally higher amounts possible. Urban and small stream flooding will be the primary threat. Low water crossings will become dangerous.',
    area: 'Greater Houston/Galveston Area, including Harris, Fort Bend, Galveston, Brazoria, Montgomery, and Liberty Counties',
    effective: '2026-11-14T00:00:00-06:00',
    expires: '2026-11-14T18:00:00-06:00',
    source: 'NWS Houston/Galveston',
    source_url: 'https://forecast.weather.gov/wwamap/wwatxtget.php?cwa=hgx&wession=FlashFloodWatch',
    is_demo: true,
  },
];

/**
 * Transform a raw NOAA NWS alert feature into our standardized format.
 */
function transformNOAAAlert(feature) {
  const p = feature.properties;
  return {
    id: feature.id || p.id || p['@id'],
    type: p.event || 'Unknown',
    severity: p.severity || 'Unknown',
    title: p.headline || p.event || 'Weather Alert',
    description: p.description ? p.description.slice(0, 2000) : '',
    area: p.areaDesc || '',
    effective: p.effective || null,
    expires: p.expires || null,
    source: p.senderName || 'NWS',
    source_url: p['@id'] || p.id || 'https://alerts.weather.gov',
    is_demo: false,
  };
}

// ---------------------------------------------------------------------------
// GET /api/alerts — Fetch weather alerts (live NOAA or demo fallback)
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    // Attempt live NOAA NWS fetch with 5-second timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const noaaUrl = 'https://api.weather.gov/alerts/active?area=TX&event=Flood';
    const response = await fetch(noaaUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NexusFlood/1.0 (nexusflood@example.com)',
        Accept: 'application/geo+json',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`NOAA API returned ${response.status}`);
    }

    const data = await response.json();
    const features = data.features || [];

    if (features.length > 0) {
      const alerts = features.map(transformNOAAAlert);
      return res.json({
        data: alerts,
        total: alerts.length,
        source: 'NOAA NWS',
        fetched_at: new Date().toISOString(),
      });
    }

    // No active alerts — fall through to demo
    return res.json({
      data: demoAlerts,
      total: demoAlerts.length,
      source: 'demo',
      note: 'No active NOAA flood alerts for TX. Showing demo alerts.',
      fetched_at: new Date().toISOString(),
    });
  } catch (err) {
    // NOAA unavailable — return demo alerts
    console.warn('[alerts] NOAA fetch failed, using demo data:', err.message);
    return res.json({
      data: demoAlerts,
      total: demoAlerts.length,
      source: 'demo',
      note: `NOAA API unavailable (${err.message}). Showing demo alerts.`,
      fetched_at: new Date().toISOString(),
    });
  }
});

export default router;
