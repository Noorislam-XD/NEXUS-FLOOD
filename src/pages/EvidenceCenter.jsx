import { useState, useEffect } from 'react'
import {
  Shield, CheckCircle, AlertTriangle, HelpCircle, XCircle,
  ExternalLink, Clock, Eye, Search, Filter
} from 'lucide-react'
import { api } from '../services/api'

const statusConfig = {
  verified: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Verified' },
  unconfirmed: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'Unconfirmed' },
  conflicting: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', label: 'Conflicting' },
  unknown: { icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-500/10', border: 'border-gray-500/30', label: 'Unknown' },
}

export default function EvidenceCenter() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadIncidents()
  }, [])

  const loadIncidents = async () => {
    try {
      const res = await api.get('/incidents')
      setIncidents(res.data || res || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = filter === 'all'
    ? incidents
    : incidents.filter(i => i.verification_status === filter)

  const counts = {
    all: incidents.length,
    verified: incidents.filter(i => i.verification_status === 'verified').length,
    unconfirmed: incidents.filter(i => i.verification_status === 'unconfirmed').length,
    conflicting: incidents.filter(i => i.verification_status === 'conflicting').length,
    unknown: incidents.filter(i => i.verification_status === 'unknown').length,
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Evidence Center</h1>
        <p className="text-sm text-gray-400 mt-1">Track verification status and evidence for all incident claims</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries({ all: { label: 'All', icon: Eye, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' }, ...statusConfig }).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`glass-card p-3 text-left transition-all ${filter === key ? `${config.border} border` : ''}`}
          >
            <config.icon className={`w-4 h-4 ${config.color} mb-1`} />
            <p className="text-lg font-bold text-gray-200">{counts[key] || 0}</p>
            <p className="text-xs text-gray-500">{config.label}</p>
          </button>
        ))}
      </div>

      {/* Evidence List */}
      <div className="glass-card">
        <div className="px-5 py-4 border-b border-navy-700/50">
          <h2 className="text-sm font-semibold text-gray-200">Evidence Registry</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading evidence...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No evidence items found</div>
        ) : (
          <div className="divide-y divide-navy-800/30">
            {filtered.map(inc => {
              const status = statusConfig[inc.verification_status] || statusConfig.unknown
              const StatusIcon = status.icon
              return (
                <div key={inc.id} className="px-5 py-4 hover:bg-navy-800/20 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={`w-4 h-4 ${status.color}`} />
                        <p className="text-sm font-medium text-gray-200 truncate">
                          {inc.description?.substring(0, 80) || 'Untitled'}
                        </p>
                        {inc.is_demo && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono">DEMO</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Location: {inc.location || 'Unknown'} · Reported: {new Date(inc.created_at).toLocaleString()}
                      </p>
                      {inc.ai_analysis?.confidence_notes && (
                        <p className="text-xs text-gray-400 mt-2 bg-navy-900/50 rounded px-3 py-2">
                          {inc.ai_analysis.confidence_notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span className={`badge ${status.bg} ${status.color} border ${status.border}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  {/* Evidence Details */}
                  <div className="mt-3 grid md:grid-cols-3 gap-3">
                    <EvidenceItem
                      label="Source Type"
                      value={inc.source_type || 'User Report'}
                      status={inc.verification_status}
                    />
                    <EvidenceItem
                      label="AI Assessment"
                      value={inc.ai_analysis?.severity ? `Severity: ${inc.ai_analysis.severity}` : 'Not analyzed'}
                      status={inc.ai_analysis ? 'unconfirmed' : 'unknown'}
                    />
                    <EvidenceItem
                      label="Official Confirmation"
                      value={inc.verification_status === 'verified' ? 'Confirmed' : 'Pending verification'}
                      status={inc.verification_status}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="bg-navy-900/50 border border-navy-700/30 rounded-lg px-4 py-3">
        <p className="text-xs text-gray-400">
          <strong>Verification Policy:</strong> Evidence status is determined by cross-referencing official sources.
          AI confidence scores are not used as proof of factual accuracy.
          "Verified" means confirmed by an authoritative source.
          "Unconfirmed" means reported but not independently confirmed.
        </p>
      </div>
    </div>
  )
}

function EvidenceItem({ label, value, status }) {
  const config = statusConfig[status] || statusConfig.unknown
  return (
    <div className={`${config.bg} border ${config.border} rounded-lg px-3 py-2`}>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className={`text-xs ${config.color} mt-0.5 font-medium`}>{value}</p>
    </div>
  )
}
