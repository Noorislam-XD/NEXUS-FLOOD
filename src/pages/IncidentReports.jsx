import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Upload, FileText, Image, Mic, Video, File, X, Send, CheckCircle,
  AlertTriangle, Loader2, MapPin, Clock, Plus, Trash2, Eye
} from 'lucide-react'
import { api } from '../services/api'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  document: ['application/pdf', 'text/plain'],
}

const allAllowed = Object.values(ALLOWED_TYPES).flat()

function FilePreview({ file, onRemove }) {
  const isImage = file.type.startsWith('image/')
  const isAudio = file.type.startsWith('audio/')
  const isVideo = file.type.startsWith('video/')

  return (
    <div className="relative group glass-card p-3 flex items-center gap-3 animate-slide-up">
      {isImage && (
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="w-14 h-14 rounded-lg object-cover"
        />
      )}
      {isAudio && (
        <div className="w-14 h-14 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <Mic className="w-6 h-6 text-purple-400" />
        </div>
      )}
      {isVideo && (
        <div className="w-14 h-14 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Video className="w-6 h-6 text-blue-400" />
        </div>
      )}
      {!isImage && !isAudio && !isVideo && (
        <div className="w-14 h-14 rounded-lg bg-gray-500/10 flex items-center justify-center">
          <File className="w-6 h-6 text-gray-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 truncate">{file.name}</p>
        <p className="text-xs text-gray-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
      <button onClick={onRemove} className="p-1.5 text-gray-500 hover:text-red-400 transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

function AudioRecorder({ onRecorded }) {
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const mediaRecorder = useRef(null)
  const chunks = useRef([])
  const timer = useRef(null)

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorder.current = recorder
      chunks.current = []

      recorder.ondataavailable = (e) => chunks.current.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: 'audio/webm' })
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' })
        onRecorded(file)
        stream.getTracks().forEach(t => t.stop())
      }

      recorder.start()
      setRecording(true)
      setDuration(0)
      timer.current = setInterval(() => setDuration(d => d + 1), 1000)
    } catch (err) {
      alert('Microphone access required for voice recording')
    }
  }

  const stop = () => {
    mediaRecorder.current?.stop()
    setRecording(false)
    clearInterval(timer.current)
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  return (
    <div className="flex items-center gap-3">
      {recording ? (
        <>
          <div className="flex items-center gap-2 text-red-400">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-sm font-mono">{formatTime(duration)}</span>
          </div>
          <button onClick={stop} className="btn-danger text-sm">Stop Recording</button>
        </>
      ) : (
        <button onClick={start} className="btn-secondary text-sm flex items-center gap-2">
          <Mic className="w-4 h-4" />
          Record Voice
        </button>
      )}
    </div>
  )
}

export default function IncidentReports() {
  const [files, setFiles] = useState([])
  const [text, setText] = useState('')
  const [location, setLocation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [incidents, setIncidents] = useState([])
  const [loadingIncidents, setLoadingIncidents] = useState(true)
  const [view, setView] = useState('submit') // 'submit' | 'list'
  const fileInput = useRef(null)

  useEffect(() => {
    api.get('/incidents').then(res => {
      setIncidents(res.data || res || [])
      setLoadingIncidents(false)
    }).catch(() => setLoadingIncidents(false))
  }, [])

  const addFiles = useCallback((newFiles) => {
    const valid = Array.from(newFiles).filter(f => {
      if (!allAllowed.includes(f.type)) {
        setError(`File type not supported: ${f.type}`)
        return false
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(`File too large: ${f.name} (max 20MB)`)
        return false
      }
      return true
    })
    if (valid.length + files.length > 5) {
      setError('Maximum 5 files per submission')
      return
    }
    setFiles(prev => [...prev, ...valid])
    setError(null)
  }, [files.length])

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleSubmit = async () => {
    if (!text.trim() && files.length === 0) {
      setError('Please provide a description or upload files')
      return
    }

    setSubmitting(true)
    setError(null)
    setResult(null)

    try {
      // Step 1: Analyze with AI
      const formData = new FormData()
      if (text.trim()) formData.append('text', text.trim())
      if (location.trim()) formData.append('location', location.trim())
      files.forEach(f => formData.append('files', f))

      const analysis = await api.post('/analyze', formData, true)

      // Step 2: Create incident
      const incidentData = {
        incident_type: analysis.data?.incident_type || 'flood',
        description: text.trim() || analysis.data?.description || 'Submitted via multimodal input',
        location: location.trim() || analysis.data?.location?.reported_address || '',
        latitude: analysis.data?.location?.latitude || null,
        longitude: analysis.data?.location?.longitude || null,
        priority: analysis.data?.severity || 'medium',
        verification_status: 'unconfirmed',
        incident_status: 'reported',
        ai_analysis: analysis.data,
      }

      const incident = await api.post('/incidents', incidentData)

      setResult({ analysis: analysis.data, incident: incident.data || incident })
      setText('')
      setFiles([])
      setLocation('')
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Incident Reports</h1>
          <p className="text-sm text-gray-400 mt-1">Submit and manage flood incident reports with AI analysis</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('submit')}
            className={view === 'submit' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
          >
            <Plus className="w-4 h-4 inline mr-1" />
            New Report
          </button>
          <button
            onClick={() => setView('list')}
            className={view === 'list' ? 'btn-primary text-sm' : 'btn-secondary text-sm'}
          >
            <Eye className="w-4 h-4 inline mr-1" />
            View All
          </button>
        </div>
      </div>

      {view === 'submit' ? (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Submission Form - 3 cols */}
          <div className="lg:col-span-3 space-y-4">
            {/* Text Input */}
            <div className="glass-card p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Describe the Incident
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Describe what you see. Where is the flooding? How severe? Any people or vehicles affected? What kind of help is needed?"
                className="input-field w-full h-32 resize-none"
                disabled={submitting}
              />
            </div>

            {/* Location */}
            <div className="glass-card p-5">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Location (optional)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Street address, intersection, or landmark"
                className="input-field w-full"
                disabled={submitting}
              />
            </div>

            {/* File Upload */}
            <div className="glass-card p-5">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Upload Evidence
              </label>

              {/* Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInput.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? 'border-cyan-400 bg-cyan-500/5'
                    : 'border-navy-600 hover:border-navy-500 hover:bg-navy-800/30'
                }`}
              >
                <Upload className={`w-8 h-8 mx-auto mb-3 ${dragOver ? 'text-cyan-400' : 'text-gray-500'}`} />
                <p className="text-sm text-gray-300">Drop files here or click to browse</p>
                <p className="text-xs text-gray-500 mt-2">
                  Photos, audio, video, PDF — max 5 files, 20MB each
                </p>
                <div className="flex justify-center gap-4 mt-3">
                  {[
                    { icon: Image, label: 'Photos', color: 'text-green-400' },
                    { icon: Mic, label: 'Audio', color: 'text-purple-400' },
                    { icon: Video, label: 'Video', color: 'text-blue-400' },
                    { icon: File, label: 'PDF', color: 'text-amber-400' },
                  ].map(t => (
                    <div key={t.label} className="flex items-center gap-1 text-xs text-gray-500">
                      <t.icon className={`w-3.5 h-3.5 ${t.color}`} />
                      {t.label}
                    </div>
                  ))}
                </div>
              </div>

              <input
                ref={fileInput}
                type="file"
                multiple
                accept={allAllowed.join(',')}
                onChange={(e) => addFiles(e.target.files)}
                className="hidden"
              />

              {/* Audio Recorder */}
              <div className="mt-3">
                <AudioRecorder onRecorded={(file) => addFiles([file])} />
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, i) => (
                    <FilePreview key={i} file={file} onRemove={() => removeFile(i)} />
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-red-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={submitting || (!text.trim() && files.length === 0)}
              className="btn-primary w-full py-3 text-base flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing with Gemini AI...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit & Analyze Report
                </>
              )}
            </button>
          </div>

          {/* Analysis Result - 2 cols */}
          <div className="lg:col-span-2">
            {result ? (
              <div className="glass-card animate-slide-up">
                <div className="px-5 py-4 border-b border-navy-700/50 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-gray-200">AI Analysis Complete</h3>
                </div>
                <div className="p-5 space-y-4">
                  {result.analysis && (
                    <>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Incident Type</p>
                        <p className="text-sm text-gray-200">{result.analysis.incident_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Severity</p>
                        <span className={`${priorityStyles[result.analysis.severity] || 'badge bg-gray-500/20 text-gray-400'}`}>
                          {result.analysis.severity}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">AI Summary</p>
                        <p className="text-sm text-gray-300 leading-relaxed">{result.analysis.description}</p>
                      </div>
                      {result.analysis.affected_infrastructure?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Affected Infrastructure</p>
                          <div className="flex flex-wrap gap-1.5">
                            {result.analysis.affected_infrastructure.map((item, i) => (
                              <span key={i} className="text-xs px-2 py-1 bg-navy-800 rounded-md text-gray-300 border border-navy-600">{item}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {result.analysis.reported_needs?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Reported Needs</p>
                          <div className="flex flex-wrap gap-1.5">
                            {result.analysis.reported_needs.map((item, i) => (
                              <span key={i} className="text-xs px-2 py-1 bg-red-500/10 rounded-md text-red-300 border border-red-500/20">{item}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {result.analysis.recommended_actions?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Recommended Actions</p>
                          <ul className="space-y-1.5">
                            {result.analysis.recommended_actions.map((action, i) => (
                              <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                                <CheckCircle className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.analysis.missing_information?.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Missing Information</p>
                          <ul className="space-y-1">
                            {result.analysis.missing_information.map((item, i) => (
                              <li key={i} className="text-xs text-amber-300 flex items-start gap-2">
                                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.analysis.confidence_notes && (
                        <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mt-3">
                          <p className="text-[11px] text-amber-300/80">{result.analysis.confidence_notes}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card p-8 text-center">
                <Brain className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-sm text-gray-400">AI analysis results will appear here</p>
                <p className="text-xs text-gray-500 mt-2">Submit a report to see Gemini's structured analysis</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Incident List View */
        <div className="glass-card">
          <div className="px-5 py-4 border-b border-navy-700/50">
            <h2 className="text-sm font-semibold text-gray-200">All Incidents</h2>
          </div>
          {loadingIncidents ? (
            <div className="p-8 text-center text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-3" />
              Loading...
            </div>
          ) : incidents.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No incidents found
            </div>
          ) : (
            <div className="divide-y divide-navy-800/30">
              {incidents.map(inc => (
                <div key={inc.id} className="px-5 py-4 hover:bg-navy-800/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-200">
                        {inc.description?.substring(0, 80)}
                        {inc.is_demo ? (
                          <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono">DEMO</span>
                        ) : (
                          <span className="ml-2 text-[9px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30 font-mono">LIVE RECORD</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{inc.location || 'Unknown'}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(inc.created_at).toLocaleString()}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={priorityStyles[inc.priority] || 'badge bg-gray-500/20 text-gray-400'}>{inc.priority}</span>
                      <span className={statusStyles[inc.verification_status] || 'badge-unknown'}>{inc.verification_status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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

function Brain(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.5.6 2.9 1.6 3.9"/>
      <path d="M12 2a5 5 0 0 1 5 5c0 .8-.2 1.6-.5 2.3"/>
      <path d="M15.5 9a5.5 5.5 0 0 1 4 9.5"/>
      <path d="M6 12a5 5 0 0 0 3 9"/>
      <path d="M12 22v-5"/>
      <path d="M12 17a3 3 0 1 0 0-6"/>
      <path d="M12 11a3 3 0 1 1 0 6"/>
    </svg>
  )
}
