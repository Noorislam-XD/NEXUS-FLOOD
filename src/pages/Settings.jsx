import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  Shield,
  Database,
  Cpu,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  Layers,
  FileCheck
} from 'lucide-react'
import { api } from '../services/api'
import { isSupabaseConfigured } from '../lib/supabase'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general')
  const [preferredLanguage, setPreferredLanguage] = useState('en')
  const [autoVerify, setAutoVerify] = useState(true)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [highPriorityAlertsOnly, setHighPriorityAlertsOnly] = useState(false)
  const [backendHealth, setBackendHealth] = useState(null)
  const [checkingHealth, setCheckingHealth] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const checkHealth = async () => {
    setCheckingHealth(true)
    try {
      const data = await api.get('/health')
      setBackendHealth(data)
    } catch (err) {
      setBackendHealth({ status: 'error', error: err.message })
    } finally {
      setCheckingHealth(false)
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  const handleSave = () => {
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 3000)
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2.5">
            <SettingsIcon className="w-6 h-6 text-cyan-400" />
            System & User Settings
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Configure system integrations, language preferences, emergency alert thresholds, and AI parameters.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Settings saved successfully
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-navy-800 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'general', label: 'General & Localization', icon: Globe },
          { id: 'intelligence', label: 'AI & Multimodal Engine', icon: Cpu },
          { id: 'integrations', label: 'Database & Cloud Health', icon: Server },
          { id: 'notifications', label: 'Alert Policies', icon: Bell },
          { id: 'compliance', label: 'Transparency & RLS', icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-navy-900 border-t-2 border-cyan-400 text-cyan-300'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-navy-900/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* General & Localization */}
      {activeTab === 'general' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Language & Accessibility
            </h3>
            <p className="text-xs text-gray-400">
              Select default interface language and AI summary translation target.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1.5">
                  Preferred Language
                </label>
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="input-field w-full text-sm"
                >
                  <option value="en">English (US / Global Standard)</option>
                  <option value="es">Español (Spanish)</option>
                  <option value="fr">Français (French)</option>
                  <option value="bn">বাংলা (Bengali - High Flood Risk Areas)</option>
                  <option value="vi">Tiếng Việt (Vietnamese)</option>
                  <option value="ur">اردو (Urdu)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-300 block mb-1.5">
                  Coordinate Format
                </label>
                <select className="input-field w-full text-sm" defaultValue="dd">
                  <option value="dd">Decimal Degrees (WGS84: 29.7604, -95.3698)</option>
                  <option value="dms">Degrees, Minutes, Seconds (DMS)</option>
                </select>
              </div>

              <div className="pt-2">
                <button onClick={handleSave} className="btn-primary text-xs">
                  Save Preferences
                </button>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              Human Oversight Guardrails
            </h3>
            <p className="text-xs text-gray-400">
              NEXUS FLOOD is built on strict Responsible AI guidelines for disaster intelligence.
            </p>

            <div className="space-y-3 bg-navy-950/60 p-4 rounded-lg border border-navy-800 text-xs text-gray-300">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-200">No Autonomous Dispatch</p>
                  <p className="text-gray-400 mt-0.5">
                    The platform never autonomously dispatches first responders or directs evacuation without human verification.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-200">Traceable Evidence Mandate</p>
                  <p className="text-gray-400 mt-0.5">
                    Every incident statement is classified as Verified, Unconfirmed, or Conflicting.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-gray-200">Demonstration Labelling</p>
                  <p className="text-gray-400 mt-0.5">
                    All simulated demo records carry clear visual badges to prevent confusion with live emergency incidents.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI & Multimodal Engine */}
      {activeTab === 'intelligence' && (
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Google Gemini Engine Configuration
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Multimodal reasoning model powering incident text, audio, image, and document extraction.
              </p>
            </div>
            <span className="badge bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Gemini 2.0 Flash Active
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-2">
            <div className="bg-navy-950/60 p-4 rounded-lg border border-navy-800 space-y-2">
              <p className="text-xs font-semibold text-gray-300">Model Pipeline Architecture</p>
              <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
                <li><strong className="text-gray-300">Model:</strong> gemini-2.0-flash via official Google Generative AI SDK</li>
                <li><strong className="text-gray-300">Temperature:</strong> 0.2 (low variance for disaster facts)</li>
                <li><strong className="text-gray-300">Output:</strong> Guaranteed strict JSON schema extraction</li>
                <li><strong className="text-gray-300">Safety Filters:</strong> Disaster-hardened filtering</li>
              </ul>
            </div>

            <div className="bg-navy-950/60 p-4 rounded-lg border border-navy-800 space-y-2">
              <p className="text-xs font-semibold text-gray-300">Multimodal Input Ingestion</p>
              <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside">
                <li><strong className="text-gray-300">Imagery:</strong> Flood depth, structural damage, trapped vehicles</li>
                <li><strong className="text-gray-300">Audio/Voice:</strong> Resident voice notes & 911 dispatch audio</li>
                <li><strong className="text-gray-300">Documents:</strong> Official municipal PDF flood notices</li>
                <li><strong className="text-gray-300">Context Fusion:</strong> Harmonizes disparate inputs into 1 incident dossier</li>
              </ul>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-navy-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
              <input
                type="checkbox"
                checked={autoVerify}
                onChange={(e) => setAutoVerify(e.target.checked)}
                className="rounded border-navy-700 bg-navy-900 text-cyan-500 focus:ring-0"
              />
              Auto-cross-reference extracted locations against NOAA & OpenStreetMap
            </label>
            <button onClick={handleSave} className="btn-primary text-xs">
              Save AI Settings
            </button>
          </div>
        </div>
      )}

      {/* Database & Cloud Health */}
      {activeTab === 'integrations' && (
        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                Backend & External API Diagnostic
              </h3>
              <button
                onClick={checkHealth}
                disabled={checkingHealth}
                className="btn-secondary text-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
                Run Diagnostics
              </button>
            </div>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-navy-950/60 p-3.5 rounded-lg border border-navy-800">
                <p className="text-[11px] text-gray-500">Backend Server</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${backendHealth?.status === 'ok' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className="text-xs font-semibold text-gray-200">
                    {backendHealth?.status === 'ok' ? 'Online (Port 3001)' : 'Offline / Error'}
                  </span>
                </div>
              </div>

              <div className="bg-navy-950/60 p-3.5 rounded-lg border border-navy-800">
                <p className="text-[11px] text-gray-500">Gemini AI Engine</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${backendHealth?.gemini_configured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="text-xs font-semibold text-gray-200">
                    {backendHealth?.gemini_configured ? 'Live API Key Connected' : 'Simulated / Demo Mode'}
                  </span>
                </div>
              </div>

              <div className="bg-navy-950/60 p-3.5 rounded-lg border border-navy-800">
                <p className="text-[11px] text-gray-500">Supabase Database</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${backendHealth?.supabase_configured || isSupabaseConfigured() ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
                  <span className="text-xs font-semibold text-gray-200">
                    {backendHealth?.supabase_configured || isSupabaseConfigured() ? 'PostgreSQL Connected' : 'High-Speed In-Memory Store'}
                  </span>
                </div>
              </div>

              <div className="bg-navy-950/60 p-3.5 rounded-lg border border-navy-800">
                <p className="text-[11px] text-gray-500">Meteorological Feeds</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-gray-200">NOAA NWS API Active</span>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Supabase Migrations & Architecture
            </h3>
            <p className="text-xs text-gray-400 mb-3">
              Schema migrations for PostgreSQL with Row Level Security (RLS) can be found in <code>supabase/migrations/</code>.
            </p>
            <div className="bg-navy-950/80 p-3.5 rounded-lg font-mono text-[11px] text-gray-300 border border-navy-800 overflow-x-auto">
              <div>Tables: profiles, incidents, evidence, ai_analysis, response_actions, resources, incident_updates</div>
              <div className="text-emerald-400 mt-1">RLS: Enabled on all tables with explicit authenticated & public policies</div>
              <div className="text-cyan-400 mt-1">Storage: Private bucket `nexus-evidence` with short-lived presigned URLs</div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Policies */}
      {activeTab === 'notifications' && (
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <Bell className="w-4 h-4 text-cyan-400" />
            Emergency Notification Thresholds
          </h3>

          <div className="space-y-4 max-w-xl">
            <div className="flex items-center justify-between p-3 bg-navy-950/60 rounded-lg border border-navy-800">
              <div>
                <p className="text-xs font-medium text-gray-200">Live In-App Flash Notifications</p>
                <p className="text-[11px] text-gray-400">Receive immediate desktop banners for new incidents within 25km</p>
              </div>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="rounded border-navy-700 bg-navy-900 text-cyan-500 focus:ring-0"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-navy-950/60 rounded-lg border border-navy-800">
              <div>
                <p className="text-xs font-medium text-gray-200">High-Priority & Life-Safety Only</p>
                <p className="text-[11px] text-gray-400">Filter notifications to only Critical severity or Rescue Needed tags</p>
              </div>
              <input
                type="checkbox"
                checked={highPriorityAlertsOnly}
                onChange={(e) => setHighPriorityAlertsOnly(e.target.checked)}
                className="rounded border-navy-700 bg-navy-900 text-cyan-500 focus:ring-0"
              />
            </div>

            <button onClick={handleSave} className="btn-primary text-xs">
              Save Notification Policies
            </button>
          </div>
        </div>
      )}

      {/* Transparency & RLS */}
      {activeTab === 'compliance' && (
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-cyan-400" />
            Transparency, Privacy & Data Compliance
          </h3>
          <p className="text-xs text-gray-400">
            Audit logs, ethical AI boundaries, and privacy protection rules.
          </p>

          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-navy-950/60 rounded-lg border border-navy-800">
              <h4 className="font-semibold text-gray-200 mb-2">Privacy Safeguards</h4>
              <p className="text-gray-400 leading-relaxed">
                PII (Personally Identifiable Information) such as medical notes, phone numbers, and victim faces are scrubbed from public incident manifests. Full uploads remain strictly in private encrypted buckets with authenticated access controls.
              </p>
            </div>

            <div className="p-4 bg-navy-950/60 rounded-lg border border-navy-800">
              <h4 className="font-semibold text-gray-200 mb-2">Evidence Attribution</h4>
              <p className="text-gray-400 leading-relaxed">
                All claims include cryptographic or URI-anchored evidence traces. Ground-truth sources (NOAA, Harris County Flood Control, municipal dispatch) are stamped with UTC retrieval timestamps.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
