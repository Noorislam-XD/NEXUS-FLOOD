import { useState, useRef } from 'react'
import {
  Brain, Upload, Send, Loader2, Sparkles, Image, Mic, FileText,
  AlertTriangle, CheckCircle, ChevronDown, ChevronUp, Zap
} from 'lucide-react'
import { api } from '../services/api'

export default function AIIntelligence() {
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [analyses, setAnalyses] = useState([])
  const [error, setError] = useState(null)
  const fileInput = useRef(null)

  const analyze = async () => {
    if (!text.trim() && files.length === 0) {
      setError('Provide text or upload files for analysis')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      if (text.trim()) formData.append('text', text.trim())
      files.forEach(f => formData.append('files', f))

      const result = await api.post('/analyze', formData, true)
      setAnalyses(prev => [{ id: Date.now(), input: text, result: result.data, timestamp: new Date() }, ...prev])
      setText('')
      setFiles([])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">AI Intelligence Engine</h1>
        <p className="text-sm text-gray-400 mt-1">Powered by Google Gemini — analyze flood incidents with multimodal AI</p>
      </div>

      {/* Input */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-semibold text-gray-200">Multimodal Analysis</h2>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a flood report, news article, social media post, witness account, or describe the situation..."
          className="input-field w-full h-28 resize-none mb-3"
          disabled={loading}
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button onClick={() => fileInput.current?.click()} className="btn-secondary text-xs flex items-center gap-1.5">
              <Image className="w-3.5 h-3.5" />
              Add Files
            </button>
            <input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files)])} />
            {files.length > 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                {files.length} file(s) attached
              </span>
            )}
          </div>
          <button
            onClick={analyze}
            disabled={loading || (!text.trim() && files.length === 0)}
            className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {analyses.map((a) => (
          <AnalysisCard key={a.id} analysis={a} />
        ))}
      </div>

      {analyses.length === 0 && !loading && (
        <div className="glass-card p-12 text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-lg text-gray-400 font-medium">Ready to Analyze</p>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Submit text descriptions, images, audio recordings, or documents. 
            Gemini will extract structured incident intelligence.
          </p>
        </div>
      )}

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg px-4 py-3">
        <p className="text-xs text-amber-300/80">
          <strong>⚠ AI Analysis Disclaimer:</strong> Analysis is AI-generated and requires human verification.
          Do not use AI output as the sole basis for emergency decisions.
          Always cross-reference with official sources.
        </p>
      </div>
    </div>
  )
}

function AnalysisCard({ analysis }) {
  const [expanded, setExpanded] = useState(true)
  const data = analysis.result

  return (
    <div className="glass-card animate-slide-up">
      <div className="px-5 py-4 border-b border-navy-700/50 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-sm font-medium text-gray-200">
              {data?.incident_type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Analysis Result'}
            </p>
            <p className="text-xs text-gray-500">{analysis.timestamp.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data?.severity && (
            <span className={`badge ${data.severity === 'critical' ? 'priority-critical' : data.severity === 'high' ? 'priority-high' : data.severity === 'medium' ? 'priority-medium' : 'priority-low'}`}>
              {data.severity}
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </div>
      {expanded && (
        <div className="p-5 grid md:grid-cols-2 gap-4">
          <Section title="Description" content={data?.description} />
          <Section title="Location" content={
            data?.location ? 
              `${data.location.reported_address || ''} ${data.location.area_description || ''}`.trim() || 'Not specified' 
              : 'Not specified'
          } />
          <ListSection title="Affected Infrastructure" items={data?.affected_infrastructure} />
          <ListSection title="Reported Needs" items={data?.reported_needs} color="red" />
          <ListSection title="Recommended Actions" items={data?.recommended_actions} color="cyan" />
          <ListSection title="Missing Information" items={data?.missing_information} color="amber" />
          {data?.contradictions?.length > 0 && (
            <ListSection title="Contradictions" items={data.contradictions} color="red" />
          )}
          {data?.confidence_notes && (
            <div className="md:col-span-2 bg-navy-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">{data.confidence_notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Section({ title, content }) {
  if (!content) return null
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-sm text-gray-300">{content}</p>
    </div>
  )
}

function ListSection({ title, items, color = 'gray' }) {
  if (!items?.length) return null
  const colors = {
    red: 'bg-red-500/10 text-red-300 border-red-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
    amber: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
    gray: 'bg-navy-800 text-gray-300 border-navy-600',
  }
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span key={i} className={`text-xs px-2 py-1 rounded-md border ${colors[color]}`}>{item}</span>
        ))}
      </div>
    </div>
  )
}
