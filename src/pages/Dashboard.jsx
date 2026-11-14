import { useState, useEffect } from 'react'
import {
  AlertTriangle, CheckCircle, Clock, FileText, Shield, TrendingUp,
  MapPin, ArrowRight, ExternalLink, Radio, Eye, ChevronRight
} from 'lucide-react'
import { api } from '../services/api'

const StatCard = ({ icon: Icon, label, value, trend, color, onClick }) => (
  <button
    onClick={onClick}
    className="glass-card-hover p-4 text-left w-full group"
  >
    <div className="flex items-start justify-between">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`w-5 h-5 ${color.replace('bg-', 'text-').replace('/10', '')}`} />
      </div>
      {trend && (
        <span className="text-xs text-emerald-400 flex items-center gap-0.5">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-100 mt-3">{value}</p>
    <p className="text-xs text-gray-400 mt-1">{label}</p>
  </button>
)

const priorityStyles = {
  critical: 'priority-critical',
  high: 'priority-high',
  medium: 'priority-medium',
  low: 'priority-low',
}

const statusStyles = {
  verified: 'badge-verified',
  unconfirmed: 'badge-unconfirmed',
  conflicting: 'badge-conflicting',
  unknown: 'badge-unknown',
}

export default function Dashboard({ onNavigate }) {
  const [incidents, setIncidents] = useState([])
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [alertsLoading, setAlertsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [incidentData, alertData] = await Promise.allSettled([
        api.get('/incidents?limit=10'),
        api.get('/alerts'),
      ])
      if (incidentData.status === 'fulfilled') {
        setIncidents(incidentData.value.data || incidentData.value || [])
      }
      if (alertData.status === 'fulfilled') {
        setAlerts(alertData.value.data || alertData.value || [])
      }
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
      setAlertsLoading(false)
    }
  }

  const stats = {
    total: incidents.length,
    critical: incidents.filter(i => i.priority === 'critical' || i.priority === 'high').length,
    verified: incidents.filter(i => i.verification_status === 'verified').length,
    unconfirmed: incidents.filter(i => i.verification_status === 'unconfirmed').length,
    needsHelp: incidents.filter(i => i.incident_type === 'rescue_needed').length,
    resolved: incidents.filter(i => i.incident_status === 'resolved').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Flood Intelligence Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Real-time overview of flood incidents and response operations</p>
        </div>
        <button onClick={() => onNavigate('incidents')} className="btn-primary flex items-center gap-2 text-sm">
          <FileText className="w-4 h-4" />
          New Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard icon={FileText} label="Total Incidents" value={stats.total} color="bg-cyan-500/10" />
        <StatCard icon={AlertTriangle} label="High Priority" value={stats.critical} color="bg-red-500/10" />
        <StatCard icon={CheckCircle} label="Verified" value={stats.verified} color="bg-emerald-500/10" />
        <StatCard icon={Clock} label="Unconfirmed" value={stats.unconfirmed} color="bg-amber-500/10" />
        <StatCard icon={Radio} label="Needs Assistance" value={stats.needsHelp} color="bg-purple-500/10" />
        <StatCard icon={Shield} label="Resolved" value={stats.resolved} color="bg-blue-500/10" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Incidents - Takes 2 columns */}
        <div className="lg:col-span-2 glass-card">
          <div className="px-5 py-4 border-b border-navy-700/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-200">Recent Incident Reports</h2>
            <button onClick={() => onNavigate('incidents')} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
              Loading incidents...
            </div>
          ) : incidents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p>No incidents reported yet</p>
              <button onClick={() => onNavigate('incidents')} className="mt-3 text-xs text-cyan-400 hover:text-cyan-300">
                Submit the first report →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-navy-800/30">
              {incidents.slice(0, 5).map((incident) => (
                <div key={incident.id} className="px-5 py-3 hover:bg-navy-800/20 transition-colors cursor-pointer flex items-center justify-between group">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex-shrink-0">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        incident.priority === 'critical' ? 'bg-red-500 animate-pulse' :
                        incident.priority === 'high' ? 'bg-orange-500' :
                        incident.priority === 'medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-200 truncate">
                          {incident.description?.substring(0, 60) || 'Untitled Incident'}
                          {incident.description?.length > 60 ? '...' : ''}
                        </p>
                        {incident.is_demo ? (
                          <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded border border-purple-500/30 font-mono">DEMO</span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 font-mono">LIVE RECORD</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {incident.location || 'Location pending'}
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(incident.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={priorityStyles[incident.priority] || 'badge bg-gray-500/20 text-gray-400'}>
                      {incident.priority || 'unassessed'}
                    </span>
                    <span className={statusStyles[incident.verification_status] || 'badge-unknown'}>
                      {incident.verification_status || 'unknown'}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts Panel */}
        <div className="glass-card">
          <div className="px-5 py-4 border-b border-navy-700/50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-200">Active Alerts</h2>
            <div className="flex items-center gap-1.5 text-xs text-amber-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{alerts.length} active</span>
            </div>
          </div>
          {alertsLoading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-3" />
              Checking alerts...
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <Shield className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No active alerts</p>
            </div>
          ) : (
            <div className="divide-y divide-navy-800/30 max-h-80 overflow-y-auto">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="px-4 py-3 hover:bg-navy-800/20 transition-colors">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      alert.severity === 'extreme' || alert.severity === 'severe' ? 'text-red-400' :
                      alert.severity === 'moderate' ? 'text-amber-400' : 'text-blue-400'
                    }`} />
                    <div>
                      <p className="text-xs font-medium text-gray-200">{alert.title}</p>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2">{alert.description?.substring(0, 120)}...</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] text-gray-400 truncate max-w-[180px]">{alert.source || 'NOAA NWS'}</span>
                        {alert.is_demo ? (
                          <span className="text-[9px] px-1 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono">DEMO</span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 font-medium">LIVE NOAA</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-3">
        {[
          { label: 'Submit Report', icon: FileText, page: 'incidents', desc: 'Report a flood incident' },
          { label: 'View Map', icon: MapPin, page: 'map', desc: 'Interactive flood map' },
          { label: 'AI Analysis', icon: Eye, page: 'intelligence', desc: 'Analyze with Gemini AI' },
          { label: 'Find Resources', icon: Radio, page: 'resources', desc: 'Emergency resources' },
        ].map(action => (
          <button
            key={action.page}
            onClick={() => onNavigate(action.page)}
            className="glass-card-hover p-4 text-left group"
          >
            <action.icon className="w-5 h-5 text-cyan-400 mb-2" />
            <p className="text-sm font-medium text-gray-200 group-hover:text-cyan-300 transition-colors">{action.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{action.desc}</p>
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3">
        <p className="text-xs text-amber-300/80">
          <strong>⚠ Important:</strong> This platform provides AI-assisted analysis only. 
          In a real emergency, always follow instructions from official emergency services. 
          Call your local emergency number for immediate assistance. 
          AI-generated information requires human verification before action.
        </p>
      </div>
    </div>
  )
}
