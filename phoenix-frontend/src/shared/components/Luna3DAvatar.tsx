import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import lunaImage from '../../assets/luna-avatar.png';

// Types
export type LunaState = 'idle' | 'listening' | 'thinking' | 'insight' | 'nudge' | 'confirm';

interface Luna3DAvatarProps {
  state?: LunaState;
  energy?: number;
  size?: number;
  className?: string;
}

// Animation configurations - DRAMATICALLY ENHANCED
const ANIMATIONS = {
  idle: {
    blink: { interval: [2000, 4000], duration: 200 },
    breathe: { scale: [1, 1.03, 1], duration: 4 },
    sway: { x: [-2, 2, -2], y: [-1, 1, -1], duration: 6 },
    glow: { intensity: 0.1, color: '#E0E7FF' }
  },
  listening: {
    blink: { interval: [1500, 3000], duration: 150 },
    breathe: { scale: [1, 1.04, 1], duration: 2.5 },
    tilt: { rotate: 8, x: 5 },
    glow: { intensity: 0.4, color: '#3B82F6' },
    pulse: true,
    ears: true // Simulate listening
  },
  thinking: {
    blink: { interval: [3000, 5000], duration: 300 },
    breathe: { scale: [1, 1.02, 1], duration: 4 },
    tilt: { rotate: -12, x: -8 },
    glow: { intensity: 0.5, color: '#8B5CF6' },
    particles: true,
    thoughtBubble: true
  },
  insight: {
    blink: { interval: [800, 1500], duration: 100 },
    breathe: { scale: [1, 1.08, 1], duration: 1.5 },
    glow: { intensity: 0.8, color: '#FFD700' },
    sparkle: true,
    flash: true,
    excitement: { scale: [1, 1.1, 1], duration: 0.3 }
  },
  nudge: {
    blink: { interval: [1000, 2000], duration: 120 },
    breathe: { scale: [1, 1.05, 1], duration: 2 },
    bounce: { y: [-8, 0], duration: 0.6 },
    tilt: { rotate: 5 },
    glow: { intensity: 0.3, color: '#10B981' },
    wiggle: { x: [-3, 3, -3, 3, 0], duration: 1 }
  },
  confirm: {
    blink: { interval: [1800, 3000], duration: 150 },
    breathe: { scale: [1, 1.04, 1], duration: 3 },
    smile: true,
    glow: { intensity: 0.6, color: '#059669' },
    nod: { y: [-4, 0, -2, 0], duration: 1.2 },
    satisfaction: true
  }
};

// Custom hook for blinking animation
function useBlink(state: LunaState) {
  const [isBlinking, setIsBlinking] = useState(false);
  
  useEffect(() => {
    const config = ANIMATIONS[state].blink;
    let timeoutId: NodeJS.Timeout;
    
    const scheduleBlink = () => {
      const delay = Math.random() * (config.interval[1] - config.interval[0]) + config.interval[0];
      timeoutId = setTimeout(() => {
        setIsBlinking(true);
        setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, config.duration);
      }, delay);
    };
    
    scheduleBlink();
    return () => clearTimeout(timeoutId);
  }, [state]);
  
  return isBlinking;
}

// Particle effect component
function ParticleEffect({ active }: { active: boolean }) {
  const particles = Array.from({ length: 6 }, (_, i) => i);
  
  if (!active) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle}
          className="absolute w-1 h-1 bg-yellow-400 rounded-full"
          initial={{
            x: `${50 + Math.random() * 20 - 10}%`,
            y: `${50 + Math.random() * 20 - 10}%`,
            opacity: 0,
            scale: 0
          }}
          animate={{
            x: `${50 + (Math.random() * 60 - 30)}%`,
            y: `${30 + (Math.random() * 40 - 20)}%`,
            opacity: [0, 1, 0],
            scale: [0, 1, 0]
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: particle * 0.3,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
}

// Sparkle effect component - ENHANCED
function SparkleEffect({ active }: { active: boolean }) {
  const sparkles = Array.from({ length: 8 }, (_, i) => i);
  
  if (!active) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle}
          className="absolute text-3xl"
          style={{
            left: `${10 + sparkle * 10}%`,
            top: `${10 + (sparkle % 4) * 20}%`
          }}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            rotate: [0, 360, 720]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: sparkle * 0.2,
            ease: "easeOut"
          }}
        >
          {sparkle % 3 === 0 ? '✨' : sparkle % 3 === 1 ? '💡' : '⭐'}
        </motion.div>
      ))}
    </div>
  );
}

// Flash effect for insights
function FlashEffect({ active }: { active: boolean }) {
  if (!active) return null;
  
  return (
    <motion.div
      className="absolute inset-0 bg-yellow-300 rounded-full pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.3, 0] }}
      transition={{
        duration: 0.5,
        repeat: Infinity,
        repeatDelay: 1.5
      }}
    />
  );
}

// Pulse effect for listening
function PulseEffect({ active, color }: { active: boolean; color: string }) {
  if (!active) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 rounded-full border-2 border-opacity-30"
          style={{ borderColor: color }}
          initial={{ scale: 1, opacity: 0 }}
          animate={{ 
            scale: [1, 1.4, 1.8],
            opacity: [0.5, 0.2, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
}

// Thought bubble effect
function ThoughtBubbleEffect({ active }: { active: boolean }) {
  if (!active) return null;
  
  return (
    <div className="absolute -top-12 -right-8 pointer-events-none">
      <motion.div
        className="bg-white rounded-full p-2 shadow-lg border-2 border-purple-200"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ 
          scale: [0, 1, 0.9, 1],
          opacity: [0, 1, 1, 1]
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "easeOut"
        }}
      >
        <div className="text-xl">🤔</div>
      </motion.div>
      <div className="absolute -bottom-2 left-4 w-3 h-3 bg-white border-r-2 border-b-2 border-purple-200 transform rotate-45" />
    </div>
  );
}

// Energy ring component
function EnergyRing({ energy, size }: { energy: number; size: number }) {
  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDashoffset = circumference - (energy / 100) * circumference;
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r="45"
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="3"
        />
        {/* Energy ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r="45"
          fill="none"
          stroke="url(#energyGradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </svg>
      {/* Energy percentage */}
      <div className="absolute text-sm font-semibold text-white bg-black bg-opacity-50 px-2 py-1 rounded-full">
        {energy}%
      </div>
    </div>
  );
}

// Main Avatar Component
export default function Luna3DAvatar({ 
  state = 'idle', 
  energy = 75, 
  size = 300,
  className = '' 
}: Luna3DAvatarProps) {
  const isBlinking = useBlink(state);
  const config = ANIMATIONS[state];
  
  // State-specific animations - DRAMATICALLY ENHANCED
  const containerVariants = {
    initial: {},
    animate: {
      rotate: config.tilt?.rotate || 0,
      x: config.tilt?.x || (config.wiggle?.x || [0]),
      y: config.bounce?.y || (config.nod?.y || [0]),
      transition: {
        rotate: { duration: 0.8, ease: "easeOut" },
        x: {
          duration: config.wiggle?.duration || 1,
          repeat: config.wiggle ? 2 : 0,
          ease: "easeInOut"
        },
        y: {
          duration: config.bounce?.duration || config.nod?.duration || 1,
          repeat: (config.bounce || config.nod) ? Infinity : 0,
          repeatType: config.nod ? "loop" as const : "reverse" as const,
          ease: "easeInOut"
        }
      }
    }
  };
  
  const imageVariants = {
    initial: {},
    animate: {
      scale: config.excitement?.scale || config.breathe.scale,
      x: config.sway?.x || [0],
      y: config.sway?.y || [0],
      transition: {
        scale: {
          duration: config.excitement?.duration || config.breathe.duration,
          repeat: Infinity,
          ease: config.excitement ? "easeOut" : "easeInOut"
        },
        x: {
          duration: config.sway?.duration || 1,
          repeat: config.sway ? Infinity : 0,
          ease: "easeInOut"
        },
        y: {
          duration: config.sway?.duration || 1,
          repeat: config.sway ? Infinity : 0,
          ease: "easeInOut"
        }
      }
    }
  };
  
  const glowIntensity = config.glow?.intensity || 0;
  const glowColor = config.glow?.color || '#FFFFFF';
  
  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      {/* Energy Ring */}
      <EnergyRing energy={energy} size={size} />
      
      {/* Avatar Container */}
      <motion.div
        className="relative w-full h-full"
        variants={containerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Glow Effect */}
        {glowIntensity > 0 && (
          <motion.div
            className="absolute inset-0 rounded-full blur-xl pointer-events-none"
            style={{
              backgroundColor: glowColor,
              filter: `blur(${glowIntensity * 20}px)`
            }}
            animate={{
              opacity: [glowIntensity * 0.5, glowIntensity, glowIntensity * 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
        
        {/* Main Avatar Image */}
        <motion.div
          className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-2xl"
          variants={imageVariants}
          initial="initial"
          animate="animate"
        >
          <img
            src={lunaImage}
            alt="Luna Avatar"
            className="w-full h-full object-cover"
            style={{
              filter: config.smile ? 'brightness(1.1) contrast(1.05)' : 'none'
            }}
          />
          
          {/* Blink Overlay */}
          <AnimatePresence>
            {isBlinking && (
              <motion.div
                className="absolute inset-0 bg-black"
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 0.15, scaleY: 1 }}
                exit={{ opacity: 0, scaleY: 0 }}
                transition={{ duration: 0.1 }}
                style={{
                  transformOrigin: 'center 45%',
                  clipPath: 'ellipse(35% 8% at 50% 45%)'
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* All Enhanced Effects */}
        <ParticleEffect active={config.particles || false} />
        <SparkleEffect active={config.sparkle || false} />
        <FlashEffect active={config.flash || false} />
        <PulseEffect active={config.pulse || false} color={glowColor} />
        <ThoughtBubbleEffect active={config.thoughtBubble || false} />
      </motion.div>
      
      {/* State Indicator */}
      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
        <div className={`px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg ${
          state === 'idle' ? 'bg-gray-500' :
          state === 'listening' ? 'bg-blue-500' :
          state === 'thinking' ? 'bg-purple-500' :
          state === 'insight' ? 'bg-yellow-500' :
          state === 'nudge' ? 'bg-green-500' :
          'bg-indigo-500'
        }`}>
          {state.toUpperCase()}
        </div>
      </div>
    </div>
  );
}