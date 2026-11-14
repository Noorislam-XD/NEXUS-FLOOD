import {
  LayoutDashboard, FileText, Map, Brain, Shield, Radio,
  Users, History, Settings, ChevronLeft, Droplets, X
} from 'lucide-react'

const navItems = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'incidents', label: 'Incident Reports', icon: FileText },
  { id: 'map', label: 'Live Flood Map', icon: Map },
  { id: 'intelligence', label: 'AI Intelligence', icon: Brain },
  { id: 'evidence', label: 'Evidence Center', icon: Shield },
  { id: 'response', label: 'Response Center', icon: Radio },
  { id: 'resources', label: 'Community Resources', icon: Users },
  { id: 'history', label: 'Case History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ currentPage, onNavigate, isOpen, onToggle }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-navy-950 border-r border-navy-800/60
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-navy-800/60">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('dashboard')}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-electric-600 flex items-center justify-center">
              <Droplets className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold bg-gradient-to-r from-cyan-400 to-electric-400 bg-clip-text text-transparent">
                NEXUS FLOOD
              </h1>
              <p className="text-[10px] text-gray-500 -mt-0.5 tracking-wider uppercase">Intelligence Platform</p>
            </div>
          </div>
          <button 
            onClick={onToggle}
            className="lg:hidden p-1 text-gray-500 hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id)
                  if (window.innerWidth < 1024) onToggle()
                }}
                className={`sidebar-link w-full ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-navy-800/60">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow"></div>
            <span>System Operational</span>
          </div>
          <p className="text-[10px] text-gray-600 mt-1">v1.0.0 — Hackathon Build</p>
        </div>
      </aside>
    </>
  )
}
