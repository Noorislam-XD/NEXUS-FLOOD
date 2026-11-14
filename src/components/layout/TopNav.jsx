import { useState, useRef, useEffect } from 'react'
import {
  Search, MapPin, Bell, User, Menu, Activity, 
  ChevronDown, X, Check, Globe, CheckCircle2
} from 'lucide-react'

const REGIONS = [
  { id: 'houston', name: 'Houston, TX', detail: 'Harris County (Active Demonstration Area)' },
  { id: 'neworleans', name: 'New Orleans, LA', detail: 'Louisiana Gulf Coast' },
  { id: 'miami', name: 'Miami, FL', detail: 'South Florida Coastal' },
  { id: 'valencia', name: 'Valencia, Spain', detail: 'Turia River Basin' },
  { id: 'sylhet', name: 'Sylhet, Bangladesh', detail: 'Surma-Kushiyara Basin' },
  { id: 'london', name: 'London, UK', detail: 'Thames Estuary' },
]

export default function TopNav({ onMenuToggle, notifications, onNotificationRead, onSelectRegion, currentRegion = 'Houston, TX' }) {
  const [showNotifs, setShowNotifs] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showLocations, setShowLocations] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeRegion, setActiveRegion] = useState(currentRegion)

  const notifRef = useRef(null)
  const profileRef = useRef(null)
  const locationRef = useRef(null)
  
  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false)
      if (locationRef.current && !locationRef.current.contains(e.target)) setShowLocations(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleRegionPick = (region) => {
    setActiveRegion(region.name)
    setShowLocations(false)
    if (onSelectRegion) onSelectRegion(region)
  }

  return (
    <header className="h-14 bg-navy-950/80 backdrop-blur-md border-b border-navy-800/60 flex items-center justify-between px-4 flex-shrink-0 z-30">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle} className="lg:hidden p-1.5 text-gray-400 hover:text-gray-200">
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search incidents, coordinates, resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64 lg:w-80 bg-navy-900/60 border border-navy-700/50 rounded-lg pl-9 pr-4 py-1.5 text-xs text-gray-300 placeholder-gray-500 focus:outline-none focus:border-cyan-500/40"
          />
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Interactive Location Selector Dropdown */}
        <div ref={locationRef} className="relative">
          <button
            onClick={() => setShowLocations(!showLocations)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-300 hover:text-gray-100 bg-navy-900/70 hover:bg-navy-800 rounded-lg border border-navy-700/60 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span className="max-w-[120px] truncate">{activeRegion}</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {showLocations && (
            <div className="absolute right-0 top-full mt-2 w-72 glass-card shadow-2xl border border-cyan-500/30 z-50 animate-fade-in py-1">
              <div className="px-3.5 py-2 border-b border-navy-700/60">
                <p className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Select Active Operational Region
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  Choose a location to monitor or coordinate flood response.
                </p>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-navy-800/40">
                {REGIONS.map((region) => {
                  const isSelected = activeRegion.includes(region.name)
                  return (
                    <button
                      key={region.id}
                      onClick={() => handleRegionPick(region)}
                      className={`w-full px-3.5 py-2.5 text-left flex items-start justify-between hover:bg-navy-800/50 transition-colors ${
                        isSelected ? 'bg-cyan-500/10 text-cyan-300' : 'text-gray-300'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-medium">{region.name}</p>
                        <p className="text-[10px] text-gray-500">{region.detail}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* System status */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs text-emerald-400 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <Activity className="w-3.5 h-3.5" />
          <span>Live NOAA Feed</span>
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 text-gray-400 hover:text-gray-200 hover:bg-navy-800/60 rounded-lg transition-colors"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 glass-card shadow-xl shadow-black/30 z-50 animate-fade-in">
              <div className="px-4 py-3 border-b border-navy-700/50">
                <h3 className="text-sm font-semibold text-gray-200">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-navy-800/30 hover:bg-navy-800/30 cursor-pointer flex items-start gap-3 ${!n.read ? 'bg-cyan-500/5' : ''}`}
                    onClick={() => onNotificationRead(n.id)}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.read ? 'bg-cyan-400' : 'bg-gray-600'}`} />
                    <div>
                      <p className="text-xs text-gray-300">{n.message}</p>
                      <p className="text-[10px] text-gray-500 mt-1">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 p-1.5 hover:bg-navy-800/60 rounded-lg transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-electric-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </button>
          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-48 glass-card shadow-xl shadow-black/30 z-50 animate-fade-in py-1">
              <div className="px-4 py-2 border-b border-navy-700/50">
                <p className="text-sm font-medium text-gray-200">Emergency Operator</p>
                <p className="text-xs text-gray-500">First Responder View</p>
              </div>
              <button className="w-full px-4 py-2 text-left text-xs text-gray-400 hover:text-gray-200 hover:bg-navy-800/40">
                Profile Settings
              </button>
              <button className="w-full px-4 py-2 text-left text-xs text-red-400 hover:text-red-300 hover:bg-navy-800/40">
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
