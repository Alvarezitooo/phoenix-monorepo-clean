/**
 * 🔐 Sessions Management Component
 * Enterprise Multi-Device Session Control for Luna Authentication
 */

import React, { useState, useEffect } from 'react'
import { api } from '../lib/api'

interface Session {
  id: string
  device_label: string
  ip: string
  user_agent: string
  created_at: string
  last_seen: string
  geo_location?: {
    city?: string
    country?: string
  }
}

interface SessionsManagementProps {
  isOpen: boolean
  onClose: () => void
}

export const SessionsManagement: React.FC<SessionsManagementProps> = ({ isOpen, onClose }) => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSessions = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get('/auth/sessions')
      setSessions(response.data.sessions)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  const revokeSession = async (sessionId: string) => {
    try {
      await api.delete(`/auth/sessions/${sessionId}`)
      setSessions(sessions.filter(s => s.id !== sessionId))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to revoke session')
    }
  }

  const logoutAllSessions = async () => {
    try {
      const response = await api.post('/auth/logout-all')
      await loadSessions() // Refresh sessions list
      alert(`Successfully logged out from ${response.data.sessions_revoked} sessions`)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to logout from all sessions')
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadSessions()
    }
  }, [isOpen])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getLocationString = (session: Session) => {
    if (session.geo_location?.city && session.geo_location?.country) {
      return `${session.geo_location.city}, ${session.geo_location.country}`
    }
    return session.ip
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">🔐 Sessions Management</h2>
              <p className="text-purple-100">Manage your active devices and sessions</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading sessions...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="text-red-400">⚠️</div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && sessions.length > 0 && (
            <div className="space-y-4">
              {/* Action Buttons */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Active Sessions ({sessions.length})
                </h3>
                <button
                  onClick={logoutAllSessions}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  🚪 Logout All Other Sessions
                </button>
              </div>

              {/* Sessions List */}
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{session.device_label}</span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Active
                          </span>
                        </div>
                        
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <span>📍</span>
                            <span>{getLocationString(session)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>🕐</span>
                            <span>Last seen: {formatDate(session.last_seen)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>📅</span>
                            <span>Created: {formatDate(session.created_at)}</span>
                          </div>
                          {session.user_agent && (
                            <div className="flex items-center space-x-2">
                              <span>🌐</span>
                              <span className="truncate max-w-md">
                                {session.user_agent}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => revokeSession(session.id)}
                        className="ml-4 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm"
                      >
                        🚫 Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!loading && sessions.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔐</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h3>
              <p className="text-gray-600">You don't have any active sessions at the moment.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>🛡️ Enterprise Security</span>
              <span>🔄 Auto-refresh every 30s</span>
            </div>
            <button
              onClick={loadSessions}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}