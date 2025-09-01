/**
 * 🌙 Luna Session Zero - Complete Authentication System
 * Conversational UX with Modern HTTPOnly Security
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { Coffee, ChevronRight, Sparkles, Eye, EyeOff } from "lucide-react"
import { api, AuthResponse, LoginRequest, RegisterRequest } from '../lib/api'
import { SessionsManagement } from './SessionsManagement'

interface LunaSessionZeroProps {
  isOpen: boolean
  onClose: () => void
  onAuthenticated: (user: any) => void
  initialMode?: AuthMode // Permet de démarrer directement en login ou register
}

type AuthMode = 'welcome' | 'login' | 'register' | 'sessions'
type Step = "intro" | "email" | "password" | "motivation" | "gift" | "mission" | "login_intro" | "login_form"
type Status = "idle" | "sending" | "success" | "error"

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
  const [step, setStep] = useState<Step>("intro")
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")
  const [form, setForm] = useState<AuthForm>({ email: '', password: '', name: '' })
  const [motivation, setMotivation] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [energyLevel, setEnergyLevel] = useState(0)
  
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      // Check if user is already authenticated
      checkAuthentication()
      // Reset to initial mode when modal opens
      setMode(initialMode)
      setStep("intro")
      setStatus("idle")
      setMessage("")
      setForm({ email: '', password: '', name: '' })
      setMotivation("")
      setEnergyLevel(0)
    }
  }, [isOpen, initialMode])

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen && dialogRef.current && mode !== 'sessions') {
      const focusableElement = dialogRef.current.querySelector(
        'button, input, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      focusableElement?.focus()
    }
  }, [isOpen, step, mode])

  const checkAuthentication = async () => {
    const isAuth = await api.isAuthenticated();
    if (!isAuth) {
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

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setStatus("error")
      setMessage("Email et mot de passe requis")
      return
    }

    setStatus("sending")
    setError(null)

    try {
      const loginRequest: LoginRequest = {
        email: form.email,
        password: form.password
      }

      const userData = await api.login(loginRequest)
      
      setCurrentUser(userData)
      onAuthenticated(userData)
      setStatus("success")
      setMessage("Connexion réussie ! Bienvenue de retour.")
      setTimeout(() => setStep("mission"), 1000)
    } catch (err: any) {
      console.error('Luna Login Error:', err)
      setStatus("error")
      
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setMessage('Unable to connect to Luna Hub. Please check your connection or try again later.')
      } else if (err.message) {
        setMessage(err.message)
      } else {
        setMessage('Erreur de connexion')
      }
    }
  }

  const handleRegister = async () => {
    if (!form.email || !form.password) {
      setStatus("error")
      setMessage("Email et mot de passe requis")
      return
    }

    setStatus("sending")
    setError(null)

    try {
      const registerRequest: RegisterRequest = {
        email: form.email,
        password: form.password,
        name: form.name
      }

      const userData = await api.register(registerRequest)
      
      setCurrentUser(userData)
      onAuthenticated(userData)
      setStatus("idle")
      setStep("motivation")
    } catch (err: any) {
      console.error('Luna Registration Error:', err)
      setStatus("error")
      
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setMessage('Unable to connect to Luna Hub. Please check your connection or try again later.')
      } else if (err.message) {
        setMessage(err.message)
      } else {
        setMessage('Erreur d\'inscription')
      }
    }
  }

  const handleLogout = async () => {
    await api.logout()
    setCurrentUser(null)
    setMode('welcome')
    onClose()
  }

  const handleMotivationSubmit = async () => {
    if (!motivation.trim()) {
      setStatus("error")
      setMessage("Partagez votre motivation pour continuer")
      return
    }

    setStatus("sending")

    try {
      // Simulate narrative start - could call Luna Hub API here
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStep("gift")
      setStatus("idle")
      // Start energy animation
      animateEnergyGift()
    } catch (error) {
      setStatus("error")
      setMessage("Erreur lors de l'enregistrement")
    }
  }

  const animateEnergyGift = () => {
    const duration = 2000
    const targetEnergy = 100
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 3)
      
      setEnergyLevel(Math.floor(easeOut * targetEnergy))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setTimeout(() => setStep("mission"), 500)
      }
    }

    requestAnimationFrame(animate)
  }

  const redirectToCV = () => {
    const cvAppUrl = "https://phoenix-cv-production.up.railway.app"
    // Use URL params to trigger welcome banner
    const redirectUrl = `${cvAppUrl}?welcome=true`
    // Mark user as just registered for Phoenix CV
    localStorage.setItem('phoenix_just_registered', 'true')
    window.location.href = redirectUrl
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