import { useState, useEffect } from 'react'
import {
  Radio, CheckCircle, Clock, AlertTriangle, ArrowRight,
  ThumbsUp, ThumbsDown, Loader2, Shield, Play, Pause, XCircle
} from 'lucide-react'
import { api } from '../services/api'

const statusFlow = ['suggested', 'awaiting_approval', 'approved', 'in_progress', 'completed', 'rejected']

const statusConfig = {
  suggested: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  awaiting_approval: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  approved: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  in_progress: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
  completed: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/30' },
  rejected: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
}

export default function ResponseCenter() {
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    loadActions()
  }, [])

  const loadActions = async () => {
    try {
      const res = await api.get('/actions')
      setActions(res.data || res || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (actionId, newStatus) => {
    setUpdating(actionId)
    try {
      await api.patch(`/actions/${actionId}`, { status: newStatus })
      setActions(prev => prev.map(a => a.id === actionId ? { ...a, status: newStatus } : a))
    } catch (err) {
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  const getNextStatuses = (current) => {
    const idx = statusFlow.indexOf(current)
    if (idx === -1) return ['approved', 'rejected']
    const next = []
    if (idx < 4) next.push(statusFlow[idx + 1])
    if (current !== 'rejected' && current !== 'completed') next.push('rejected')
    return next
  }

  const grouped = {
    pending: actions.filter(a => ['suggested', 'awaiting_approval'].includes(a.status)),
    active: actions.filter(a => ['approved', 'in_progress'].includes(a.status)),
    done: actions.filter(a => ['completed', 'rejected'].includes(a.status)),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Response Center</h1>
        <p className="text-sm text-gray-400 mt-1">Review, approve, and track AI-recommended response actions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-amber-400">{grouped.pending.length}</p>
          <p className="text-xs text-gray-500">Pending Review</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-cyan-400">{grouped.active.length}</p>
          <p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-2xl font-bold text-emerald-400">{grouped.done.length}</p>
          <p className="text-xs text-gray-500">Completed</p>
        </div>
      </div>

      {loading ? (
        <div className="glass-card p-8 text-center text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
          Loading response actions...
        </div>
      ) : actions.length === 0 ? (
        <div className="glass-card p-8 text-center text-gray-500">
          <Radio className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p>No response actions yet</p>
          <p className="text-xs mt-1">Actions are generated when incidents are analyzed</p>
        </div>
      ) : (
        <>
          {/* Pending Actions */}
          {grouped.pending.length > 0 && (
            <ActionGroup title="Pending Review" icon={Clock} actions={grouped.pending} updating={updating} onUpdateStatus={updateStatus} getNextStatuses={getNextStatuses} />
          )}
          {grouped.active.length > 0 && (
            <ActionGroup title="Active Actions" icon={Play} actions={grouped.active} updating={updating} onUpdateStatus={updateStatus} getNextStatuses={getNextStatuses} />
          )}
          {grouped.done.length > 0 && (
            <ActionGroup title="Completed" icon={CheckCircle} actions={grouped.done} updating={updating} onUpdateStatus={updateStatus} getNextStatuses={getNextStatuses} />
          )}
        </>
      )}

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3">
        <p className="text-xs text-amber-300/80">
          <strong>⚠ Human Oversight Required:</strong> All response actions require human approval before execution.
          This platform does not automatically dispatch emergency services or execute emergency operations.
          Always coordinate with official emergency management authorities.
        </p>
      </div>
    </div>
  )
}

function ActionGroup({ title, icon: Icon, actions, updating, onUpdateStatus, getNextStatuses }) {
  return (
    <div className="glass-card">
      <div className="px-5 py-4 border-b border-navy-700/50 flex items-center gap-2">
        <Icon className="w-4 h-4 text-cyan-400" />
        <h2 className="text-sm font-semibold text-gray-200">{title}</h2>
        <span className="text-xs text-gray-500">({actions.length})</span>
      </div>
      <div className="divide-y divide-navy-800/30">
        {actions.map(action => {
          const config = statusConfig[action.status] || statusConfig.suggested
          const nextStatuses = getNextStatuses(action.status)
          return (
            <div key={action.id} className="px-5 py-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-200">{action.title}</p>
                    {action.is_demo ? (
                      <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono">DEMO</span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 font-mono">ACTION PROTOCOL</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{action.description}</p>
                  {action.requires_approval && (
                    <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Requires human approval
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${config.bg} ${config.color} border ${config.border}`}>
                    {action.status?.replace('_', ' ')}
                  </span>
                  <span className={`badge ${action.priority === 'high' || action.priority === 'critical' ? 'priority-high' : action.priority === 'medium' ? 'priority-medium' : 'priority-low'}`}>
                    {action.priority}
                  </span>
                </div>
              </div>
              {nextStatuses.length > 0 && action.status !== 'completed' && action.status !== 'rejected' && (
                <div className="flex gap-2 mt-3">
                  {nextStatuses.map(next => (
                    <button
                      key={next}
                      onClick={() => onUpdateStatus(action.id, next)}
                      disabled={updating === action.id}
                      className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                        next === 'rejected' ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                        : 'border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
                      } disabled:opacity-50`}
                    >
                      {updating === action.id ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      {next === 'rejected' ? 'Reject' : next.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
