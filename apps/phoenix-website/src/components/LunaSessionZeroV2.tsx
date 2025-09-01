/**
 * 🌙 Luna Session Zero V2 - Modern Auth with Premium UX
 * Migration de la meilleure UX de LunaModalV2 vers API moderne HTTPOnly
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { Coffee, ChevronRight, Sparkles, Eye, EyeOff } from "lucide-react"
import { api, LoginRequest, RegisterRequest } from '../lib/api'
import { SessionsManagement } from './SessionsManagement'

interface LunaSessionZeroProps {
  isOpen: boolean
  onClose: () => void
  onAuthenticated: (user: any) => void
  initialMode?: AuthMode
}

type AuthMode = 'welcome' | 'login' | 'register' | 'sessions'
type Step = "intro" | "email" | "password" | "motivation" | "gift" | "mission" | "login_form"
type Status = "idle" | "sending" | "success" | "error"

export const LunaSessionZero: React.FC<LunaSessionZeroProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  initialMode = 'register'
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [step, setStep] = useState<Step>("intro")
  const [status, setStatus] = useState<Status>("idle")
  const [message, setMessage] = useState("")
  
  // Form data
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [motivation, setMotivation] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  // Auth state
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [energyLevel, setEnergyLevel] = useState(0)
  
  const dialogRef = useRef<HTMLDivElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      checkAuthentication()
      setStep("intro")
      setStatus("idle")
      setMessage("")
      setEmail("")
      setPassword("")
      setName("")
      setMotivation("")
      setEnergyLevel(0)
      setMode(initialMode)
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

  // Reset form when switching auth modes
  useEffect(() => {
    setEmail("")
    setPassword("")
    setName("")
    setMessage("")
    setStatus("idle")
    setStep("intro")
  }, [mode])

  const checkAuthentication = async () => {
    const isAuth = await api.isAuthenticated()
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

  const handleRegister = async () => {
    if (!email || !password) {
      setStatus("error")
      setMessage("Email et mot de passe requis")
      return
    }

    setStatus("sending")

    try {
      const registerRequest: RegisterRequest = {
        email,
        password,
        name: name || undefined
      }

      const userData = await api.register(registerRequest)
      setCurrentUser(userData)
      onAuthenticated(userData)
      setStep("motivation")
      setStatus("idle")
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Erreur d'inscription")
      console.error("Registration error:", error)
    }
  }

  const handleLogin = async () => {
    if (!email || !password) {
      setStatus("error")
      setMessage("Email et mot de passe requis")
      return
    }

    setStatus("sending")

    try {
      const loginRequest: LoginRequest = {
        email,
        password
      }

      const userData = await api.login(loginRequest)
      setCurrentUser(userData)
      onAuthenticated(userData)
      setStep("mission") // Direct vers mission pour utilisateur existant
      setStatus("idle")
      setMessage("Connexion réussie ! Bienvenue de retour.")
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Erreur de connexion")
      console.error("Login error:", error)
    }
  }

  const handleMotivationSubmit = async () => {
    if (!motivation.trim()) {
      setStatus("error")
      setMessage("Partagez votre motivation pour continuer")
      return
    }

    setStatus("sending")

    try {
      // Simulate narrative start - could integrate with Luna Hub API here
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStep("gift")
      setStatus("idle")
      // Start energy animation
      animateEnergyGift()
    } catch (error) {
      setStatus("error")
      setMessage("Erreur lors de l'enregistrement")
      console.error("Motivation submit error:", error)
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

  const handleLogout = async () => {
    await api.logout()
    setCurrentUser(null)
    setMode('welcome')
    onClose()
  }

  // Render functions for each step
  function StepHeaderBlock() {
    return (
      <div className="mb-4 flex items-center space-x-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-3xl"
        >
          🌙
        </motion.div>
        <div>
          <h2 id="luna-modal-title" className="text-xl font-bold text-gray-900">
            Luna Session Zero
          </h2>
          <p className="text-sm text-gray-600">Votre authentification Phoenix</p>
        </div>
      </div>
    )
  }

  function renderIntro() {
    return (
      <>
        <StepHeaderBlock />
        <div className="prose prose-sm max-w-none text-gray-800">
          {mode === "login" ? (
            <>
              <p className="mb-3">
                Bon retour parmi nous. 🌙
              </p>
              <p className="mb-4">
                Pour continuer là où nous nous étions arrêtés, veuillez vous identifier.
              </p>
            </>
          ) : (
            <>
              <p className="mb-3">
                Bienvenue, partenaire. 🌙
              </p>
              <p className="mb-4">
                Prêt(e) pour ta première mission ? Je vais transformer le chaos de ta reconversion en récit clair et puissant.
              </p>
            </>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button
            onClick={() => setMode(mode === "register" ? "login" : "register")}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            {mode === "register" ? "Déjà un partenaire ? Connectez-vous" : "Nouveau ici ? Commencez votre histoire"}
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-2xl border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Plus tard
            </button>
            <button
              onClick={() => setStep(mode === "register" ? "email" : "login_form")}
              className="flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-white shadow hover:shadow-md"
            >
              {mode === "register" ? "Commencer" : "Se connecter"} <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </>
    )
  }

  function renderEmail() {
    return (
      <>
        <StepHeaderBlock />
        <div className="prose prose-sm max-w-none text-gray-800">
          <p className="mb-4">
            Super ! 🎉 Pour créer ton profil et démarrer ton Capital Narratif, j'ai besoin de ton email.
          </p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setStep("password"); }} className="mt-2">
          <label htmlFor="luna-email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            id="luna-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-black focus:ring-2 focus:ring-black/10 mb-4"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep("intro")}
              className="rounded-2xl border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Retour
            </button>
            <button
              type="submit"
              disabled={!email.trim()}
              className="flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-white shadow hover:shadow-md disabled:opacity-50"
            >
              Continuer <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </>
    )
  }

  function renderPassword() {
    return (
      <>
        <StepHeaderBlock />
        <div className="prose prose-sm max-w-none text-gray-800">
          <p className="mb-4">
            Parfait ! 🔐 Maintenant, choisis un mot de passe pour sécuriser ton compte.
          </p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }} className="mt-2">
          <label htmlFor="luna-password" className="block text-sm font-medium text-gray-700 mb-2">
            Mot de passe
          </label>
          <div className="relative mb-4">
            <input
              id="luna-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              className="w-full rounded-xl border border-gray-300 px-4 py-2 pr-12 outline-none focus:border-black focus:ring-2 focus:ring-black/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {message && status === "error" && (
            <div className="mb-2 text-sm text-red-600">{message}</div>
          )}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setStep("email")}
              className="rounded-2xl border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Retour
            </button>
            <button
              type="submit"
              disabled={!password.trim() || password.length < 6 || status === "sending"}
              className="flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-white shadow hover:shadow-md disabled:opacity-50"
            >
              {status === "sending" ? "Création..." : "Créer mon compte"} 
              {status !== "sending" && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </>
    )
  }

  function renderMotivation() {
    return (
      <>
        <StepHeaderBlock />
        <div className="prose prose-sm max-w-none text-gray-800">
          <p className="mb-3">
            Bienvenue dans l'écosystème Phoenix ! 🎉
          </p>
          <p className="mb-4">
            Pour personnaliser ton expérience, raconte-moi en quelques mots ce qui t'amène ici. Qu'est-ce qui t'inspire dans ta reconversion ?
          </p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleMotivationSubmit(); }} className="mt-2">
          <label htmlFor="luna-motivation" className="block text-sm font-medium text-gray-700 mb-2">
            Ta motivation
          </label>
          <textarea
            id="luna-motivation"
            name="motivation"
            rows={3}
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            placeholder="Ex: Je veux passer du marketing au développement web..."
            className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-black focus:ring-2 focus:ring-black/10 mb-4"
          />
          {message && status === "error" && (
            <div className="mb-2 text-sm text-red-600">{message}</div>
          )}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              Plus tard
            </button>
            <button
              type="submit"
              disabled={!motivation.trim() || status === "sending"}
              className="flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-white shadow hover:shadow-md disabled:opacity-50"
            >
              {status === "sending" ? "Enregistrement..." : "Démarrer mon aventure"} 
              {status !== "sending" && <Sparkles className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </>
    )
  }

  function renderGift() {
    return (
      <>
        <StepHeaderBlock />
        <div className="prose prose-sm max-w-none text-gray-800">
          <p className="mb-3">
            Merci pour ton partage ! 💫
          </p>
          <p className="mb-4">
            Pour bien commencer, je t'offre ton premier café Luna. Regarde ta jauge d'énergie se remplir !
          </p>
        </div>
        
        {/* Energy gauge animation */}
        <div className="my-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Énergie Luna</span>
            <span className="text-sm text-gray-600">{energyLevel}%</span>
          </div>
          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${energyLevel}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-center mt-4 text-2xl">
            <Coffee className="h-8 w-8 text-amber-600" />
            <span className="ml-2 text-lg font-semibold text-amber-700">
              Café Luna offert ! ☕
            </span>
          </div>
        </div>
      </>
    )
  }

  function renderMission() {
    return (
      <>
        <StepHeaderBlock />
        <div className="prose prose-sm max-w-none text-gray-800">
          <p className="mb-2">
            🎯 <strong>Quick win</strong> : Commençons par une première analyse de ton CV.
          </p>
          <p className="mb-3">
            Je t'emmène dans <em>Phoenix CV</em>. Tu arriveras déjà connecté.
          </p>
        </div>
        {message && (
          <div className={`mb-2 text-sm ${status === "error" ? "text-red-600" : "text-green-700"}`}>
            {message}
          </div>
        )}
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-2xl border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Plus tard
          </button>
          <button
            onClick={redirectToCV}
            className="flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-white shadow hover:shadow-md"
          >
            Oui, commençons ! 🚀
          </button>
        </div>
      </>
    )
  }

  function renderLoginForm() {
    return (
      <>
        <StepHeaderBlock />
        <div className="prose prose-sm max-w-none text-gray-800">
          <p className="mb-4">
            Bon retour parmi nous ! 🎯 Entrez vos identifiants pour reprendre là où vous vous étiez arrêté.
          </p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="mt-2">
          <div className="mb-4">
            <label htmlFor="luna-login-email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="luna-login-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="w-full rounded-xl border border-gray-300 px-4 py-2 outline-none focus:border-black focus:ring-2 focus:ring-black/10"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="luna-login-password" className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id="luna-login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Votre mot de passe"
                className="w-full rounded-xl border border-gray-300 px-4 py-2 pr-12 outline-none focus:border-black focus:ring-2 focus:ring-black/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {message && (
            <div className={`mb-2 text-sm ${status === "error" ? "text-red-600" : "text-green-700"}`}>
              {message}
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setMode("register")}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Nouveau ici ? Commencez votre histoire
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep("intro")}
                className="rounded-2xl border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={!email.trim() || !password.trim() || status === "sending"}
                className="flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-white shadow hover:shadow-md disabled:opacity-50"
              >
                {status === "sending" ? "Connexion..." : "Se connecter"} 
                {status !== "sending" && <ChevronRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </form>
      </>
    )
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
        <AnimatePresence>
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="luna-modal-title"
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              ref={dialogRef}
            >
              <motion.div 
                className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {step === "intro" && renderIntro()}
                {step === "email" && renderEmail()}
                {step === "password" && renderPassword()}
                {step === "motivation" && renderMotivation()}
                {step === "gift" && renderGift()}
                {step === "mission" && renderMission()}
                {step === "login_form" && renderLoginForm()}
              </motion.div>
            </motion.div>
          </>
        </AnimatePresence>
      )}
    </>
  )
}

export default LunaSessionZero