/**
 * 🌙 Luna Session Zero - Complete Authentication System
 * Conversational Authentication with Enterprise Security
 */

import React, { useState, useEffect } from 'react'
import { api, AuthResponse, LoginRequest, RegisterRequest } from '../lib/api'
import { SessionsManagement } from './SessionsManagement'

interface LunaSessionZeroProps {
  isOpen: boolean
  onClose: () => void
  onAuthenticated: (user: any) => void
  initialMode?: AuthMode // Permet de démarrer directement en login ou register
}

type AuthMode = 'welcome' | 'login' | 'register' | 'sessions'

interface AuthForm {
  email: string
  password: string
  name?: string
}

export const LunaSessionZero: React.FC<LunaSessionZeroProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  initialMode = 'welcome'
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [form, setForm] = useState<AuthForm>({ email: '', password: '', name: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    if (isOpen) {
      // Check if user is already authenticated
      checkAuthentication()
      // Reset to initial mode when modal opens
      setMode(initialMode)
    }
  }, [isOpen, initialMode])

  const checkAuthentication = async () => {
    if (!api.isAuthenticated()) {
      // Garde le mode initial si non connecté
      setMode(initialMode)
      return
    }

    try {
      const user = await api.getCurrentUser()
      setCurrentUser(user)
      setMode('sessions')
    } catch (error) {
      setMode('welcome')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const loginRequest: LoginRequest = {
        email: form.email,
        password: form.password
      }

      const response: AuthResponse = await api.login(loginRequest)
      const user = await api.getCurrentUser()
      
      setCurrentUser(user)
      onAuthenticated(user)
      setMode('sessions')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const registerRequest: RegisterRequest = {
        email: form.email,
        password: form.password,
        name: form.name
      }

      const response: AuthResponse = await api.register(registerRequest)
      const user = await api.getCurrentUser()
      
      setCurrentUser(user)
      onAuthenticated(user)
      setMode('sessions')
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    api.logout()
    setCurrentUser(null)
    setMode('welcome')
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {mode === 'sessions' ? (
        <SessionsManagement
          isOpen={isOpen}
          onClose={() => {
            onClose()
            setMode('welcome')
          }}
        />
      ) : (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white text-center">
              <div className="text-4xl mb-2">🌙</div>
              <h2 className="text-2xl font-bold">Luna Session Zero</h2>
              <p className="text-purple-100">Your Phoenix Authentication</p>
            </div>

            {/* Content */}
            <div className="p-6">
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

              {mode === 'welcome' && (
                <div className="text-center space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Welcome to Phoenix
                    </h3>
                    <p className="text-gray-600">
                      Choose your path to access the Luna energy ecosystem
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => setMode('login')}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all"
                    >
                      🔑 Rituel de Retour (Login)
                    </button>
                    
                    <button
                      onClick={() => setMode('register')}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all"
                    >
                      ✨ Session Zero (Register)
                    </button>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 text-center">
                      🛡️ Enterprise security with multi-device management
                    </p>
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      🔑 Rituel de Retour
                    </h3>
                    <p className="text-gray-600">
                      Welcome back to your Phoenix journey
                    </p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50"
                    >
                      {loading ? '🔄 Connecting...' : '🔑 Enter Phoenix'}
                    </button>
                  </form>

                  <div className="text-center">
                    <button
                      onClick={() => setMode('welcome')}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      ← Back to options
                    </button>
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      ✨ Session Zero
                    </h3>
                    <p className="text-gray-600">
                      Begin your Phoenix journey with 100 Luna energy
                    </p>
                  </div>

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name (Optional)
                      </label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="How should we call you?"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        required
                        minLength={6}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum 6 characters
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-lg font-medium hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50"
                    >
                      {loading ? '✨ Creating...' : '✨ Start Journey'}
                    </button>
                  </form>

                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="flex">
                      <div className="text-emerald-400">🎁</div>
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-emerald-800">
                          Welcome Gift
                        </h4>
                        <p className="text-sm text-emerald-700 mt-1">
                          Start with 100 Luna energy to explore Phoenix features
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => setMode('welcome')}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      ← Back to options
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t text-center">
              {currentUser ? (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Welcome, {currentUser.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={onClose}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}