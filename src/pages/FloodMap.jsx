import { useState, useEffect, useRef, useCallback } from 'react'
import {
  MapPin, Filter, Layers, Search, AlertTriangle, CheckCircle,
  Clock, ZoomIn, Info, Navigation, X, Loader2, Compass, Globe
} from 'lucide-react'
import L from 'leaflet'
import { api } from '../services/api'

// Fix default marker icons for Vite/Webpack
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Global preset emergency demonstration hubs
const PRESET_LOCATIONS = [
  { name: 'Houston, TX', area: 'Harris County (Demo Focus)', lat: 29.7604, lng: -95.3698, zoom: 12 },
  { name: 'New Orleans, LA', area: 'Gulf Coast Lowland', lat: 29.9511, lng: -90.0715, zoom: 12 },
  { name: 'Miami, FL', area: 'Biscayne Bay Coastal', lat: 25.7617, lng: -80.1918, zoom: 12 },
  { name: 'Valencia, Spain', area: 'Turia River Basin', lat: 39.4699, lng: -0.3763, zoom: 12 },
  { name: 'Sylhet, Bangladesh', area: 'Surma River Basin', lat: 24.8949, lng: 91.8687, zoom: 12 },
  { name: 'London, UK', area: 'Thames Barrier Basin', lat: 51.5074, lng: -0.1278, zoom: 12 },
]

export default function FloodMap() {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const searchMarkerRef = useRef(null)
  const userMarkerRef = useRef(null)
  const searchDropdownRef = useRef(null)

  const [incidents, setIncidents] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    showIncidents: true,
    showResources: true,
    showAlerts: true,
    priority: 'all',
  })

  // Location search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [locatingUser, setLocatingUser] = useState(false)
  const [activeLocationName, setActiveLocationName] = useState('Houston, TX (Demo Zone)')
  const [locationNotice, setLocationNotice] = useState(null)

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

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    }).setView([29.7604, -95.3698], 11) // Default Houston TX
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors | NEXUS FLOOD',
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

  // Update markers on incident/filter changes
  useEffect(() => {
    if (!mapInstance.current) return
    updateMarkers(mapInstance.current)
  }, [incidents, resources, filters])

  // Close search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const updateMarkers = (map) => {
    if (!map) return

    // Clear existing incident & resource markers (preserve search markers)
    map.eachLayer(layer => {
      if (
        (layer instanceof L.Marker || layer instanceof L.CircleMarker) &&
        layer !== searchMarkerRef.current &&
        layer !== userMarkerRef.current
      ) {
        map.removeLayer(layer)
      }
    })

    // Add incident markers
    if (filters.showIncidents) {
      incidents
        .filter(inc => (inc.latitude || inc.location_details?.latitude) && (inc.longitude || inc.location_details?.longitude))
        .filter(inc => filters.priority === 'all' || inc.priority === filters.priority)
        .forEach(inc => {
          const lat = inc.latitude || inc.location_details?.latitude
          const lng = inc.longitude || inc.location_details?.longitude
          const color = inc.verification_status === 'verified' ? '#10b981'
            : inc.verification_status === 'conflicting' ? '#ef4444'
            : '#f59e0b'
          
          const size = inc.priority === 'critical' ? 12 : inc.priority === 'high' ? 10 : 8

          const marker = L.circleMarker([lat, lng], {
            radius: size,
            fillColor: color,
            color: color,
            weight: 2,
            opacity: 0.9,
            fillOpacity: 0.45,
          }).addTo(map)

          const locText = typeof inc.location === 'object'
            ? inc.location.address || inc.location.reported_address
            : inc.location || 'Location pending'

          marker.bindPopup(`
            <div style="min-width:210px; font-family: Inter, system-ui, sans-serif;">
              <div style="font-weight:700; font-size:13px; margin-bottom:4px; color:#0f172a; display:flex; align-items:center; justify-content:space-between;">
                <span>${inc.incident_type?.replace(/_/g, ' ').toUpperCase() || 'INCIDENT'}</span>
                ${inc.is_demo 
                  ? '<span style="font-size:9px; background:#9333ea20; color:#9333ea; border:1px solid #9333ea40; padding:1px 5px; border-radius:3px; font-weight:600;">DEMO</span>'
                  : '<span style="font-size:9px; background:#06b6d420; color:#0891b2; border:1px solid #06b6d440; padding:1px 5px; border-radius:3px; font-weight:600;">VERIFIED RECORD</span>'}
              </div>
              <p style="font-size:12px; color:#334155; margin-bottom:8px; line-height:1.4;">${inc.description?.substring(0, 110) || 'No description'}...</p>
              <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:6px;">
                <span style="font-size:10px; padding:2px 6px; background:${color}20; color:${color}; border:1px solid ${color}40; border-radius:4px; font-weight:600;">${inc.priority || 'unassessed'}</span>
                <span style="font-size:10px; padding:2px 6px; background:#e2e8f0; color:#475569; border-radius:4px; font-weight:500;">${inc.verification_status || 'unknown'}</span>
              </div>
              <p style="font-size:10px; color:#64748b; margin:0; border-top:1px solid #f1f5f9; padding-top:4px;">📍 ${locText}</p>
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
            className: 'custom-resource-marker',
            html: `<div style="background:#2563eb; width:26px; height:26px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; font-size:13px; box-shadow:0 3px 10px rgba(0,0,0,0.35); cursor:pointer;">🏥</div>`,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          })

          const marker = L.marker([r.latitude, r.longitude], { icon }).addTo(map)
          marker.bindPopup(`
            <div style="min-width:190px; font-family: Inter, system-ui, sans-serif;">
              <div style="font-weight:700; font-size:13px; margin-bottom:4px; color:#0f172a;">${r.name}</div>
              <div style="margin-bottom:6px;">
                <span style="font-size:10px; padding:2px 6px; background:#eff6ff; color:#2563eb; border:1px solid #bfdbfe; border-radius:4px; font-weight:600;">${r.category?.replace(/_/g, ' ')}</span>
                ${r.is_demo 
                  ? '<span style="font-size:9px; background:#9333ea20; color:#9333ea; padding:1px 5px; border-radius:3px; margin-left:4px; font-weight:600;">DEMO</span>' 
                  : '<span style="font-size:9px; background:#10b98120; color:#059669; border:1px solid #10b98140; padding:1px 5px; border-radius:3px; margin-left:4px; font-weight:600;">VERIFIED FACILITY</span>'}
              </div>
              <p style="font-size:11px; color:#475569; margin:3px 0;">📍 ${r.address || ''}</p>
              ${r.phone ? `<p style="font-size:11px; color:#475569; margin:3px 0;">📞 ${r.phone}</p>` : ''}
              ${r.hours ? `<p style="font-size:10px; color:#64748b; margin:3px 0;">⏰ ${r.hours}</p>` : ''}
            </div>
          `)
        })
    }
  }

  // Fly to a specific coordinate and place search marker
  const flyToCoordinates = (lat, lng, zoomLevel = 13, label = 'Searched Location', detail = '') => {
    if (!mapInstance.current) return
    const map = mapInstance.current

    map.flyTo([lat, lng], zoomLevel, { duration: 1.2 })

    // Remove old search marker
    if (searchMarkerRef.current) {
      map.removeLayer(searchMarkerRef.current)
    }

    const pinIcon = L.divIcon({
      className: 'active-search-pin',
      html: `
        <div style="position:relative; display:flex; align-items:center; justify-content:center;">
          <div style="position:absolute; width:40px; height:40px; border-radius:50%; background:rgba(6,182,212,0.3); animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="width:30px; height:30px; border-radius:50%; background:#06b6d4; border:3px solid #ffffff; box-shadow:0 0 14px rgba(6,182,212,0.8); display:flex; align-items:center; justify-content:center; color:white; font-size:14px;">📍</div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    })

    searchMarkerRef.current = L.marker([lat, lng], { icon: pinIcon, zIndexOffset: 1000 }).addTo(map)
    searchMarkerRef.current.bindPopup(`
      <div style="min-width:180px; font-family: Inter, system-ui, sans-serif;">
        <div style="font-weight:700; font-size:13px; color:#0f172a; margin-bottom:2px;">📍 ${label}</div>
        ${detail ? `<p style="font-size:11px; color:#475569; margin-top:3px;">${detail}</p>` : ''}
        <p style="font-size:10px; color:#06b6d4; font-family:monospace; margin-top:4px;">${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
      </div>
    `).openPopup()

    setActiveLocationName(label)
    setShowSuggestions(false)
  }

  // Perform search (matching local incidents + OpenStreetMap Nominatim geocoding)
  const handleSearch = async (queryToSearch = searchQuery) => {
    const q = queryToSearch.trim()
    if (!q) return

    setSearching(true)
    setShowSuggestions(true)
    const results = []

    // 1. Match local preset locations
    PRESET_LOCATIONS.forEach(p => {
      if (p.name.toLowerCase().includes(q.toLowerCase()) || p.area.toLowerCase().includes(q.toLowerCase())) {
        results.push({
          type: 'preset',
          title: p.name,
          subtitle: p.area,
          lat: p.lat,
          lng: p.lng,
          zoom: p.zoom,
        })
      }
    })

    // 2. Match local incidents
    incidents.forEach(inc => {
      const loc = typeof inc.location === 'object' ? inc.location.address : inc.location
      const lat = inc.latitude || inc.location_details?.latitude
      const lng = inc.longitude || inc.location_details?.longitude
      if (lat && lng && (
        (loc && loc.toLowerCase().includes(q.toLowerCase())) ||
        (inc.description && inc.description.toLowerCase().includes(q.toLowerCase())) ||
        (inc.incident_type && inc.incident_type.toLowerCase().includes(q.toLowerCase()))
      )) {
        results.push({
          type: 'incident',
          title: `${inc.incident_type?.replace(/_/g, ' ').toUpperCase() || 'INCIDENT'}: ${loc || 'Houston'}`,
          subtitle: inc.description?.substring(0, 60) + '...',
          lat,
          lng,
          zoom: 14,
        })
      }
    })

    // 3. Match local community resources
    resources.forEach(r => {
      if (r.latitude && r.longitude && (
        r.name.toLowerCase().includes(q.toLowerCase()) ||
        (r.address && r.address.toLowerCase().includes(q.toLowerCase())) ||
        r.category.toLowerCase().includes(q.toLowerCase())
      )) {
        results.push({
          type: 'resource',
          title: `🏥 ${r.name}`,
          subtitle: `${r.category?.replace(/_/g, ' ')} • ${r.address || ''}`,
          lat: r.latitude,
          lng: r.longitude,
          zoom: 14,
        })
      }
    })

    // 4. Query OpenStreetMap Nominatim for global geocoding
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (res.ok) {
        const geoData = await res.json()
        geoData.forEach(item => {
          results.push({
            type: 'global',
            title: item.display_name.split(',')[0],
            subtitle: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            zoom: 13,
          })
        })
      }
    } catch (e) {
      console.warn('Nominatim geocode timed out or unreachable, using local match results.')
    }

    setSearchResults(results)
    setSearching(false)

    // If exact single top result and triggered via Enter, fly immediately
    if (results.length > 0 && results[0]) {
      const top = results[0]
      flyToCoordinates(top.lat, top.lng, top.zoom || 13, top.title, top.subtitle)
    } else {
      setLocationNotice(`No locations found for "${q}". Try another city, address or landmark.`)
      setTimeout(() => setLocationNotice(null), 4000)
    }
  }

  // Handle User Geolocation (GPS with permission)
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      setLocationNotice('Geolocation is not supported by your browser.')
      setTimeout(() => setLocationNotice(null), 3000)
      return
    }

    setLocatingUser(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false)
        const { latitude, longitude } = pos.coords
        
        if (!mapInstance.current) return
        const map = mapInstance.current

        map.flyTo([latitude, longitude], 14, { duration: 1.5 })

        if (userMarkerRef.current) {
          map.removeLayer(userMarkerRef.current)
        }

        const userIcon = L.divIcon({
          className: 'user-gps-marker',
          html: `
            <div style="position:relative; display:flex; align-items:center; justify-content:center;">
              <div style="position:absolute; width:36px; height:36px; border-radius:50%; background:rgba(34,197,94,0.3); animation:ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>
              <div style="width:22px; height:22px; border-radius:50%; background:#22c55e; border:3px solid #ffffff; box-shadow:0 0 12px rgba(34,197,94,0.8);"></div>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        })

        userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon, zIndexOffset: 999 }).addTo(map)
        userMarkerRef.current.bindPopup(`
          <div style="font-family: Inter, system-ui, sans-serif; font-size:12px;">
            <b style="color:#15803d;">📍 Your Detected Location</b>
            <p style="font-size:10px; color:#475569; margin:2px 0;">Current position via device GPS</p>
            <p style="font-size:10px; font-family:monospace; color:#15803d; margin:0;">${latitude.toFixed(4)}, ${longitude.toFixed(4)}</p>
          </div>
        `).openPopup()

        setActiveLocationName(`My Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`)
      },
      (err) => {
        setLocatingUser(false)
        let msg = 'Could not retrieve your location.'
        if (err.code === 1) msg = 'Location access permission was denied.'
        else if (err.code === 2) msg = 'Location position unavailable.'
        else if (err.code === 3) msg = 'Location request timed out.'
        setLocationNotice(msg)
        setTimeout(() => setLocationNotice(null), 4000)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  return (
    <div className="space-y-4 animate-fade-in h-full">
      {/* Title & Active Region Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Compass className="w-6 h-6 text-cyan-400" />
            Live Flood Intelligence Map
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Real-time geospatial tracking of incidents, rescue requests, official alerts, and shelters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-navy-900/80 border border-navy-700/60 rounded-lg text-xs text-cyan-300">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>Region: <strong>{activeLocationName}</strong></span>
          </div>

          <button
            onClick={handleLocateUser}
            disabled={locatingUser}
            className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5"
            title="Center map on your current GPS location"
          >
            {locatingUser ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
            ) : (
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span>{locatingUser ? 'Locating...' : 'Locate Me'}</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search input with suggestions dropdown */}
        <div ref={searchDropdownRef} className="relative flex-1 max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch()
            }}
            className="flex items-center gap-1.5"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search any city, address, or incident (e.g. Miami, Westheimer, Buffalo Bayou)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchResults.length > 0) setShowSuggestions(true)
                }}
                className="input-field w-full pl-9 pr-8 text-xs py-2"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    setSearchResults([])
                    setShowSuggestions(false)
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="btn-primary text-xs px-3.5 py-2 flex items-center gap-1 disabled:opacity-50 whitespace-nowrap"
            >
              {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Find</span>
            </button>
          </form>

          {/* Suggestions Dropdown */}
          {showSuggestions && searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 glass-card shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-navy-800/60 border border-cyan-500/30">
              <div className="px-3 py-1.5 bg-navy-950/90 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>Matching Locations & Incidents</span>
                <span>{searchResults.length} found</span>
              </div>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => flyToCoordinates(item.lat, item.lng, item.zoom || 13, item.title, item.subtitle)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-navy-800/60 transition-colors flex items-start gap-2.5"
                >
                  <MapPin className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-200 truncate">{item.title}</p>
                    <p className="text-[11px] text-gray-400 truncate">{item.subtitle}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Preset Locations Quick-Jump Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-gray-500 text-[11px] font-medium mr-1 whitespace-nowrap">Presets:</span>
          {PRESET_LOCATIONS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setSearchQuery(preset.name)
                flyToCoordinates(preset.lat, preset.lng, preset.zoom, preset.name, preset.area)
              }}
              className={`px-2.5 py-1 rounded-md border text-[11px] font-medium whitespace-nowrap transition-colors ${
                activeLocationName.includes(preset.name)
                  ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300'
                  : 'bg-navy-900/60 border-navy-700/60 text-gray-400 hover:text-gray-200 hover:bg-navy-800/40'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Filter toggles & Priority selector */}
        <div className="flex items-center gap-2">
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

      {/* Notice alert */}
      {locationNotice && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-4 py-2 rounded-lg flex items-center justify-between animate-fade-in">
          <span>{locationNotice}</span>
          <button onClick={() => setLocationNotice(null)} className="text-amber-400 hover:text-amber-200 ml-2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Map Canvas */}
      <div className="glass-card overflow-hidden relative" style={{ height: 'calc(100vh - 250px)', minHeight: '440px' }}>
        {loading && (
          <div className="absolute inset-0 z-10 bg-navy-950/80 backdrop-blur-sm flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Loading geospatial data...</p>
            </div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Map Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 bg-navy-950/60 p-3 rounded-lg border border-navy-800">
        <span className="font-semibold text-gray-300">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500/60 border border-emerald-500" />
          <span>Verified Incident</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-amber-500/60 border border-amber-500" />
          <span>Unconfirmed Report</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/60 border border-red-500" />
          <span>Critical / Conflicting</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500 border border-white" />
          <span>Emergency Resource (Shelter/Hospital)</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto text-cyan-300/80">
          <Info className="w-3.5 h-3.5" />
          <span>Verified regional emergency facilities & live incident tracking; global geocoding via OpenStreetMap</span>
        </div>
      </div>
    </div>
  )
}
