import { useState, useEffect } from 'react'
import { History, Clock, MapPin, Eye, ChevronRight, Loader2, AlertTriangle, CheckCircle, Filter } from 'lucide-react'
import { api } from '../services/api'

export default function CaseHistory() {
  const [incidents, setIncidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')

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

  const filtered = statusFilter === 'all'
    ? incidents
    : incidents.filter(i => i.incident_status === statusFilter)

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Case History</h1>
        <p className="text-sm text-gray-400 mt-1">Track submitted incidents and review their analysis and response progress</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'reported', 'investigating', 'responding', 'resolved'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              statusFilter === status
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'bg-navy-900 border-navy-700 text-gray-500'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* List */}
        <div className={`${selectedIncident ? 'lg:col-span-2' : 'lg:col-span-5'} glass-card`}>
          <div className="px-5 py-4 border-b border-navy-700/50">
            <h2 className="text-sm font-semibold text-gray-200">Incidents ({filtered.length})</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No cases found</div>
          ) : (
            <div className="divide-y divide-navy-800/30 max-h-[600px] overflow-y-auto">
              {filtered.map(inc => (
                <div
                  key={inc.id}
                  onClick={() => setSelectedIncident(inc)}
                  className={`px-5 py-3 cursor-pointer transition-colors flex items-center justify-between ${
                    selectedIncident?.id === inc.id ? 'bg-cyan-500/5 border-l-2 border-cyan-400' : 'hover:bg-navy-800/20'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">
                      {inc.description?.substring(0, 50) || 'Untitled'}
                      {inc.is_demo && <span className="ml-2 text-[9px] px-1 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono">DEMO</span>}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />{inc.location || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-600">{new Date(inc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedIncident && (
          <div className="lg:col-span-3 glass-card animate-slide-up">
            <div className="px-5 py-4 border-b border-navy-700/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-200">Case Detail</h2>
              <button onClick={() => setSelectedIncident(null)} className="text-xs text-gray-500 hover:text-gray-300">Close</button>
            </div>
            <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
              <div className="flex items-center gap-2">
                <span className={`badge ${selectedIncident.priority === 'critical' ? 'priority-critical' : selectedIncident.priority === 'high' ? 'priority-high' : 'priority-medium'}`}>
                  {selectedIncident.priority}
                </span>
                <span className={`badge ${selectedIncident.verification_status === 'verified' ? 'badge-verified' : 'badge-unconfirmed'}`}>
                  {selectedIncident.verification_status}
                </span>
                <span className="badge bg-navy-800 text-gray-300 border border-navy-600">
                  {selectedIncident.incident_status || 'reported'}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-sm text-gray-300 leading-relaxed">{selectedIncident.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-navy-900/50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Location</p>
                  <p className="text-xs text-gray-300 mt-1">{selectedIncident.location || 'Not specified'}</p>
                </div>
                <div className="bg-navy-900/50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Type</p>
                  <p className="text-xs text-gray-300 mt-1">{selectedIncident.incident_type?.replace(/_/g, ' ') || 'Unknown'}</p>
                </div>
                <div className="bg-navy-900/50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Reported</p>
                  <p className="text-xs text-gray-300 mt-1">{new Date(selectedIncident.created_at).toLocaleString()}</p>
                </div>
                <div className="bg-navy-900/50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Coordinates</p>
                  <p className="text-xs text-gray-300 mt-1">
                    {selectedIncident.latitude && selectedIncident.longitude
                      ? `${selectedIncident.latitude.toFixed(4)}, ${selectedIncident.longitude.toFixed(4)}`
                      : 'Not available'}
                  </p>
                </div>
              </div>

              {selectedIncident.ai_analysis && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">AI Analysis</p>
                  <div className="bg-navy-900/50 rounded-lg p-4 space-y-3">
                    {selectedIncident.ai_analysis.description && (
                      <p className="text-xs text-gray-300">{selectedIncident.ai_analysis.description}</p>
                    )}
                    {selectedIncident.ai_analysis.recommended_actions?.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase mb-1">Recommended Actions</p>
                        <ul className="space-y-1">
                          {selectedIncident.ai_analysis.recommended_actions.map((a, i) => (
                            <li key={i} className="text-xs text-cyan-300 flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />{a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedIncident.ai_analysis.confidence_notes && (
                      <p className="text-[10px] text-amber-300/70 bg-amber-500/5 rounded p-2">{selectedIncident.ai_analysis.confidence_notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
