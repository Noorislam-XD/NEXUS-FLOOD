import { useState, useEffect } from 'react'
import {
  Users, MapPin, Phone, ExternalLink, Search, Filter,
  Building2, Heart, Shield, Truck, Info, CheckCircle, Clock
} from 'lucide-react'
import { api } from '../services/api'

const categoryConfig = {
  emergency_services: { icon: Shield, color: 'text-red-400', bg: 'bg-red-500/10' },
  shelter: { icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  medical: { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/10' },
  community_org: { icon: Users, color: 'text-green-400', bg: 'bg-green-500/10' },
  relief_distribution: { icon: Truck, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  information_center: { icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
}

export default function CommunityResources() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')

  useEffect(() => {
    loadResources()
  }, [])

  const loadResources = async () => {
    try {
      const res = await api.get('/resources')
      setResources(res.data || res || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = resources
    .filter(r => category === 'all' || r.category === category)
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()) || 
      r.address?.toLowerCase().includes(search.toLowerCase()))

  const categories = [...new Set(resources.map(r => r.category))]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Community Resources</h1>
        <p className="text-sm text-gray-400 mt-1">Directory of emergency services, shelters, and community assistance</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-full pl-9 text-sm"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategory('all')}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              category === 'all' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-navy-900 border-navy-700 text-gray-500'
            }`}
          >
            All
          </button>
          {categories.map(cat => {
            const config = categoryConfig[cat] || categoryConfig.information_center
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  category === cat ? `${config.bg} border-${cat === 'emergency_services' ? 'red' : cat === 'shelter' ? 'blue' : cat === 'medical' ? 'pink' : 'cyan'}-500/30 ${config.color}` : 'bg-navy-900 border-navy-700 text-gray-500'
                }`}
              >
                {cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </button>
            )
          })}
        </div>
      </div>

      {/* Resources Grid */}
      {loading ? (
        <div className="glass-card p-8 text-center text-gray-500">Loading resources...</div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-gray-500">No resources found</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(resource => {
            const config = categoryConfig[resource.category] || categoryConfig.information_center
            const Icon = config.icon
            return (
              <div key={resource.id} className="glass-card-hover p-5">
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-lg ${config.bg}`}>
                    <Icon className={`w-5 h-5 ${config.color}`} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {resource.verification_status === 'verified' ? (
                      <span className="badge-verified flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    ) : (
                      <span className="badge-unknown flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Unverified
                      </span>
                    )}
                    {resource.is_demo && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono">DEMO</span>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-gray-200 mt-3">{resource.name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{resource.category?.replace(/_/g, ' ')}</p>

                <div className="mt-3 space-y-2">
                  {resource.address && (
                    <p className="text-xs text-gray-400 flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      {resource.address}
                    </p>
                  )}
                  {resource.phone && (
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <a href={`tel:${resource.phone}`} className="text-cyan-400 hover:text-cyan-300">{resource.phone}</a>
                    </p>
                  )}
                  {resource.website && (
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      <a href={resource.website} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 truncate">
                        {resource.website.replace('https://', '')}
                      </a>
                    </p>
                  )}
                </div>

                {resource.last_verified_at && (
                  <p className="text-[10px] text-gray-600 mt-3">
                    Last verified: {new Date(resource.last_verified_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <div className="bg-navy-900/50 border border-navy-700/30 rounded-lg px-4 py-3">
        <p className="text-xs text-gray-400">
          <strong>Verified Directory:</strong> Listings represent official public emergency operations, trauma medical facilities, and approved shelters. During major weather activations, always confirm current intake capacity via the listed official telephone lines.
        </p>
      </div>
    </div>
  )
}
