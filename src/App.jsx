import { useState } from 'react'
import Sidebar from './components/layout/Sidebar'
import TopNav from './components/layout/TopNav'
import Dashboard from './pages/Dashboard'
import IncidentReports from './pages/IncidentReports'
import FloodMap from './pages/FloodMap'
import AIIntelligence from './pages/AIIntelligence'
import EvidenceCenter from './pages/EvidenceCenter'
import ResponseCenter from './pages/ResponseCenter'
import CommunityResources from './pages/CommunityResources'
import CaseHistory from './pages/CaseHistory'
import Settings from './pages/Settings'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New flood report submitted in downtown area', time: '2 min ago', read: false },
    { id: 2, message: 'Weather alert: Flash flood warning issued', time: '15 min ago', read: false },
    { id: 3, message: 'Incident #FL-1024 verified by official source', time: '1 hr ago', read: true },
  ])

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard onNavigate={setCurrentPage} />
      case 'incidents': return <IncidentReports />
      case 'map': return <FloodMap />
      case 'intelligence': return <AIIntelligence />
      case 'evidence': return <EvidenceCenter />
      case 'response': return <ResponseCenter />
      case 'resources': return <CommunityResources />
      case 'history': return <CaseHistory />
      case 'settings': return <Settings />
      default: return <Dashboard onNavigate={setCurrentPage} />
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          notifications={notifications}
          onNotificationRead={(id) => {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
          }}
        />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default App
