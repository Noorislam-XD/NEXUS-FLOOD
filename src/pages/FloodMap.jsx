import { useState, useEffect, useRef } from 'react'
import { MapPin, Filter, Layers, Search, AlertTriangle, CheckCircle, Clock, ZoomIn, Info } from 'lucide-react'
import L from 'leaflet'
import { api } from '../services/api'

// Fix default marker icons for Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function FloodMap() {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const [incidents, setIncidents] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    showIncidents: true,
    showResources: true,
    showAlerts: true,
    priority: 'all',
  })
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    loadMapData()
  }, [])

  const loadMapData = async () => {
    try {
      const [incidentRes, resourceRes] = await Promise.allSettled([
        api.get('/incidents'),
        api.get('/resources'),
      ])
      if (incidentRes.status === 'fulfilled') setIncidents(incidentRes.value.data || incidentRes.value || [])
      if (resourceRes.status === 'fulfilled') setResources(resourceRes.value.data || resourceRes.value || [])
    } catch (err) {
      console.error('Map data load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current).setView([29.7604, -95.3698], 11) // Houston TX demo area
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapInstance.current = map
    updateMarkers(map)

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!mapInstance.current) return
    updateMarkers(mapInstance.current)
  }, [incidents, resources, filters])

  const updateMarkers = (map) => {
    if (!map) return
    // Clear existing markers
    map.eachLayer(layer => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
        map.removeLayer(layer)
      }
    })

    // Add incident markers
    if (filters.showIncidents) {
      incidents
        .filter(inc => inc.latitude && inc.longitude)
        .filter(inc => filters.priority === 'all' || inc.priority === filters.priority)
        .forEach(inc => {
          const color = inc.verification_status === 'verified' ? '#10b981'
            : inc.verification_status === 'conflicting' ? '#ef4444'
            : '#f59e0b'
          
          const size = inc.priority === 'critical' ? 12 : inc.priority === 'high' ? 10 : 8

          const marker = L.circleMarker([inc.latitude, inc.longitude], {
            radius: size,
            fillColor: color,
            color: color,
            weight: 2,
            opacity: 0.9,
            fillOpacity: 0.4,
          }).addTo(map)

          marker.bindPopup(`
            <div style="min-width:200px; font-family: Inter, sans-serif;">
              <div style="font-weight:600; font-size:13px; margin-bottom:6px; color:#1a1a2e;">
                ${inc.incident_type?.replace('_', ' ').toUpperCase() || 'INCIDENT'}
                ${inc.is_demo ? '<span style="font-size:9px; background:#9333ea20; color:#c084fc; padding:1px 5px; border-radius:3px; margin-left:6px;">DEMO</span>' : ''}
              </div>
              <p style="font-size:12px; color:#444; margin-bottom:6px;">${inc.description?.substring(0, 100) || 'No description'}</p>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <span style="font-size:10px; padding:2px 6px; background:${color}20; color:${color}; border-radius:4px; font-weight:500;">${inc.priority || 'unassessed'}</span>
                <span style="font-size:10px; padding:2px 6px; background:${color}20; color:${color}; border-radius:4px; font-weight:500;">${inc.verification_status || 'unknown'}</span>
              </div>
              <p style="font-size:10px; color:#888; margin-top:6px;">📍 ${inc.location || 'Location pending'}</p>
            </div>
          `)
        })
    }

    // Add resource markers
    if (filters.showResources) {
      resources
        .filter(r => r.latitude && r.longitude)
        .forEach(r => {
          const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="background:#3b82f6; width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; font-size:12px; box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏥</div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })

          const marker = L.marker([r.latitude, r.longitude], { icon }).addTo(map)
          marker.bindPopup(`
            <div style="min-width:180px; font-family: Inter, sans-serif;">
              <div style="font-weight:600; font-size:13px; margin-bottom:4px; color:#1a1a2e;">${r.name}</div>
              <span style="font-size:10px; padding:2px 6px; background:#3b82f620; color:#60a5fa; border-radius:4px;">${r.category}</span>
              ${r.is_demo ? '<span style="font-size:9px; background:#9333ea20; color:#c084fc; padding:1px 5px; border-radius:3px; margin-left:4px;">DEMO</span>' : ''}
              <p style="font-size:11px; color:#666; margin-top:6px;">📍 ${r.address || ''}</p>
              ${r.phone ? `<p style="font-size:11px; color:#666;">📞 ${r.phone}</p>` : ''}
            </div>
          `)
        })
    }
  }

  return (
    <div className="space-y-4 animate-fade-in h-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Live Flood Map</h1>
          <p className="text-sm text-gray-400 mt-1">Interactive map of incidents, alerts, and resources</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pl-9 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'showIncidents', label: 'Incidents', color: 'cyan' },
            { key: 'showResources', label: 'Resources', color: 'blue' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilters(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                filters[f.key]
                  ? `bg-${f.color}-500/10 border-${f.color}-500/30 text-${f.color}-300`
                  : 'bg-navy-900 border-navy-700 text-gray-500'
              }`}
            >
              {f.label}
            </button>
          ))}
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="input-field text-xs py-1.5"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Map */}
      <div className="glass-card overflow-hidden" style={{ height: 'calc(100vh - 240px)' }}>
        {loading && (
          <div className="absolute inset-0 z-10 bg-navy-950/80 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500/60 border border-emerald-500" />
          Verified
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500/60 border border-amber-500" />
          Unconfirmed
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60 border border-red-500" />
          Conflicting
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500/60 border border-blue-500" />
          Resource
        </div>
        <div className="flex items-center gap-1.5 ml-auto text-amber-300/60">
          <Info className="w-3 h-3" />
          Demo data shown — not real incidents
        </div>
      </div>
    </div>
  )
}
