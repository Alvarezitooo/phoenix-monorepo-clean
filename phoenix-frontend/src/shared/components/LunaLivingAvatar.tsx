import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import lunaImage from '../../assets/luna-avatar.png';

// Types
export type LunaState = 'idle' | 'listening' | 'thinking' | 'insight' | 'nudge' | 'confirm';

interface LunaLivingAvatarProps {
  state?: LunaState;
  energy?: number;
  size?: number;
  className?: string;
}

// Animation configurations for LIVING PORTRAIT - DRAMATIC VERSION
const LIVING_ANIMATIONS = {
  idle: {
    blink: { interval: [2500, 4500], duration: 180 },
    breathe: { scale: [1, 1.03, 1], duration: 4 },
    sway: { x: [-3, 3, -3], y: [-2, 2, -2], duration: 8 },
    brightness: 1,
    contrast: 1
  },
  listening: {
    blink: { interval: [1800, 3200], duration: 150 },
    breathe: { scale: [1, 1.05, 1], duration: 3 },
    tilt: { rotate: 8, x: 6 },
    brightness: 1.1,
    contrast: 1.05,
    hue: 200, // Blueish tint
    glow: '#3B82F6'
  },
  thinking: {
    blink: { interval: [3500, 6000], duration: 250 },
    breathe: { scale: [1, 1.02, 1], duration: 5 },
    tilt: { rotate: -10, x: -8 },
    brightness: 0.95,
    contrast: 1.1,
    hue: 280, // Purple tint
    particles: true,
    glow: '#8B5CF6'
  },
  insight: {
    blink: { interval: [1000, 2000], duration: 120 },
    breathe: { scale: [1, 1.08, 1], duration: 2 },
    excitement: { scale: [1, 1.12, 1], duration: 0.5 },
    brightness: 1.3,
    contrast: 1.15,
    saturate: 1.3,
    hue: 45, // Golden tint
    sparkle: true,
    flash: true,
    glow: '#FFD700'
  },
  nudge: {
    blink: { interval: [1200, 2500], duration: 140 },
    breathe: { scale: [1, 1.06, 1], duration: 2.5 },
    bounce: { y: [-10, 0], duration: 0.8 },
    wiggle: { x: [-5, 5, -5, 5, 0], duration: 1.2 },
    brightness: 1.08,
    contrast: 1.08,
    hue: 120, // Green tint
    glow: '#10B981'
  },
  confirm: {
    blink: { interval: [2000, 3500], duration: 160 },
    breathe: { scale: [1, 1.04, 1], duration: 3.5 },
    nod: { y: [-6, 0, -3, 0], duration: 1.5 },
    brightness: 1.12,
    contrast: 1.06,
    saturate: 1.1,
    hue: 160, // Teal tint
    glow: '#059669'
  }
};

// Custom hooks for living animations
function useBlink(state: LunaState) {
  const [isBlinking, setIsBlinking] = useState(false);
  
  useEffect(() => {
    const config = LIVING_ANIMATIONS[state].blink;
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

function useEyeMovement(state: LunaState) {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const config = LIVING_ANIMATIONS[state].eyeMovement;
    let animationId: number;
    let startTime = Date.now();
    
    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progress = (elapsed % config.duration) / config.duration;
      
      const x = Math.sin(progress * Math.PI * 2) * (config.x[1] - config.x[0]) / 2 + (config.x[1] + config.x[0]) / 2;
      const y = Math.sin(progress * Math.PI * 1.5) * (config.y[1] - config.y[0]) / 2 + (config.y[1] + config.y[0]) / 2;
      
      setEyePosition({ x, y });
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [state]);
  
  return eyePosition;
}

// Living Portrait Components
function EyeLayer({ isBlinking, eyePosition, config, size }: { 
  isBlinking: boolean; 
  eyePosition: { x: number; y: number }; 
  config: any; 
  size: number;
}) {
  const eyeWidenScale = config.eyeWiden ? 1 + config.eyeWiden * 0.1 : 1;
  
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        clipPath: isBlinking 
          ? 'ellipse(8% 1% at 42% 42%), ellipse(8% 1% at 58% 42%)' // Eyes closed
          : `ellipse(8% ${4 * eyeWidenScale}% at 42% 42%), ellipse(8% ${4 * eyeWidenScale}% at 58% 42%)`, // Eyes open with potential widening
        transition: `clip-path ${isBlinking ? 0.1 : 0.15}s ease-out`
      }}
      animate={{
        x: eyePosition.x,
        y: eyePosition.y,
        filter: config.eyebrightness ? `brightness(${config.eyebrightness})` : 'none'
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <img
        src={lunaImage}
        alt="Luna Eyes"
        className="w-full h-full object-cover"
        style={{ filter: 'contrast(1.1) saturation(1.2)' }}
      />
    </motion.div>
  );
}

function SmileLayer({ config, size }: { config: any; size: number }) {
  if (!config.microSmile) return null;
  
  const smileIntensity = Math.abs(config.microSmile);
  const isSmile = config.microSmile > 0;
  
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        clipPath: 'ellipse(12% 8% at 50% 75%)', // Mouth area
        transformOrigin: '50% 75%'
      }}
      animate={{
        scaleX: isSmile ? 1 + smileIntensity * 0.08 : 1 - smileIntensity * 0.05,
        scaleY: isSmile ? 1 + smileIntensity * 0.04 : 1 - smileIntensity * 0.02,
        y: isSmile ? -smileIntensity * 1.5 : smileIntensity * 1,
        filter: `brightness(${isSmile ? 1.05 : 0.98}) contrast(${isSmile ? 1.1 : 1.02})`
      }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      <img
        src={lunaImage}
        alt="Luna Smile"
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}

function CheekLayer({ config, size }: { config: any; size: number }) {
  if (!config.cheekRaise) return null;
  
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        clipPath: 'ellipse(15% 12% at 35% 60%), ellipse(15% 12% at 65% 60%)', // Cheek areas
        transformOrigin: '50% 60%'
      }}
      animate={{
        y: -config.cheekRaise * 2,
        scaleY: 1 + config.cheekRaise * 0.05,
        filter: `brightness(1.08) contrast(1.05)`
      }}
      transition={{ type: "spring", stiffness: 250, damping: 30 }}
    >
      <img
        src={lunaImage}
        alt="Luna Cheeks"
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}

function EyebrowLayer({ config, size }: { config: any; size: number }) {
  const raise = config.eyebrowRaise || 0;
  const furrow = config.eyebrowFurrow || 0;
  const playful = config.eyebrowPlayful || 0;
  
  if (!raise && !furrow && !playful) return null;
  
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        clipPath: 'ellipse(12% 6% at 42% 35%), ellipse(12% 6% at 58% 35%)', // Eyebrow areas
        transformOrigin: '50% 35%'
      }}
      animate={{
        y: raise ? -raise * 3 : furrow ? furrow * 1.5 : 0,
        scaleY: furrow ? 1 + furrow * 0.1 : playful ? 1 + playful * 0.05 : 1,
        rotateZ: playful ? playful * 2 : 0,
        filter: `contrast(${1.1 + furrow * 0.1})`
      }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
    >
      <img
        src={lunaImage}
        alt="Luna Eyebrows"
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}

function BreathingLayer({ config, size }: { config: any; size: number }) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        clipPath: 'ellipse(25% 20% at 50% 85%)', // Chest/shoulder area
        transformOrigin: '50% 85%'
      }}
      animate={{
        scaleY: [1, 1 + config.breathe.chest, 1],
        y: [0, -config.breathe.chest * 20, 0]
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <img
        src={lunaImage}
        alt="Luna Breathing"
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}

function HairLayer({ config, size }: { config: any; size: number }) {
  return (
    <motion.div
      className="absolute inset-0"
      style={{
        clipPath: 'ellipse(40% 35% at 50% 25%)', // Hair area
        transformOrigin: '50% 25%'
      }}
      animate={{
        x: [
          -config.hairSway.amplitude, 
          config.hairSway.amplitude, 
          -config.hairSway.amplitude
        ],
        skewX: [
          -config.hairSway.amplitude * 0.3, 
          config.hairSway.amplitude * 0.3, 
          -config.hairSway.amplitude * 0.3
        ]
      }}
      transition={{
        duration: config.hairSway.period,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <img
        src={lunaImage}
        alt="Luna Hair"
        className="w-full h-full object-cover"
        style={{ filter: 'contrast(1.05)' }}
      />
    </motion.div>
  );
}

// Excitement particles for insight state
function ExcitementParticles({ active }: { active: boolean }) {
  if (!active) return null;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 12 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute text-lg"
          style={{
            left: `${20 + (i % 4) * 20}%`,
            top: `${15 + Math.floor(i / 4) * 25}%`
          }}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.2, 0],
            rotate: [0, 180, 360],
            y: [0, -20, -40]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeOut"
          }}
        >
          {['✨', '💫', '⭐', '🌟'][i % 4]}
        </motion.div>
      ))}
    </div>
  );
}

// Main Living Avatar Component - SIMPLIFIED FOR VISIBILITY
export default function LunaLivingAvatar({ 
  state = 'idle', 
  energy = 75, 
  size = 300,
  className = '' 
}: LunaLivingAvatarProps) {
  const isBlinking = useBlink(state);
  const config = LIVING_ANIMATIONS[state];
  
  // Create dynamic filter string
  const filterString = `
    brightness(${config.brightness || 1})
    contrast(${config.contrast || 1})
    saturate(${config.saturate || 1})
    hue-rotate(${config.hue || 0}deg)
  `.trim();
  
  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      {/* Energy Ring */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r="45"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="3"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r="45"
            fill="none"
            stroke="url(#livingEnergyGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45}
            animate={{ 
              strokeDashoffset: 2 * Math.PI * 45 * (1 - energy / 100),
              stroke: state === 'insight' ? '#FFD700' : 
                     state === 'listening' ? '#3B82F6' :
                     state === 'confirm' ? '#059669' : '#8B5CF6'
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="livingEnergyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF6B9D" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute text-sm font-bold text-white bg-black bg-opacity-60 px-2 py-1 rounded-full">
          {energy}%
        </div>
      </div>

      {/* Living Portrait Container - DRAMATICALLY SIMPLIFIED */}
      <motion.div
        className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 shadow-2xl"
        animate={{
          rotate: config.tilt?.rotate || 0,
          x: config.tilt?.x || (config.wiggle?.x || [0]),
          y: config.bounce?.y || (config.nod?.y || [0]),
          scale: config.excitement?.scale || config.breathe?.scale || [1]
        }}
        transition={{
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
          },
          scale: {
            duration: config.excitement?.duration || config.breathe?.duration || 4,
            repeat: Infinity,
            ease: config.excitement ? "easeOut" : "easeInOut"
          }
        }}
      >
        {/* Main Image with DRAMATIC Effects */}
        <motion.div className="absolute inset-0">
          <motion.img
            src={lunaImage}
            alt="Luna Living Portrait"
            className="w-full h-full object-cover"
            animate={{
              filter: filterString,
              x: config.sway?.x || [0],
              y: config.sway?.y || [0]
            }}
            transition={{
              filter: { duration: 0.8, ease: "easeOut" },
              x: { duration: config.sway?.duration || 8, repeat: config.sway ? Infinity : 0, ease: "easeInOut" },
              y: { duration: config.sway?.duration || 8, repeat: config.sway ? Infinity : 0, ease: "easeInOut" }
            }}
          />
          
          {/* Blink Overlay - VISIBLE */}
          <AnimatePresence>
            {isBlinking && (
              <motion.div
                className="absolute inset-0 bg-black"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                style={{
                  clipPath: 'ellipse(15% 4% at 42% 42%), ellipse(15% 4% at 58% 42%)'
                }}
              />
            )}
          </AnimatePresence>
        </motion.div>
        
        {/* Special Effects */}
        <ExcitementParticles active={config.sparkle || false} />
        
        {/* Flash Effect */}
        {config.flash && (
          <motion.div
            className="absolute inset-0 bg-yellow-300 rounded-full pointer-events-none"
            animate={{ opacity: [0, 0.4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              repeatDelay: 1.5
            }}
          />
        )}
        
        {/* Thinking Particles */}
        {config.particles && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {Array.from({ length: 6 }, (_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-purple-400 rounded-full"
                initial={{ x: '50%', y: '50%', opacity: 0 }}
                animate={{
                  x: `${50 + (Math.random() * 60 - 30)}%`,
                  y: `${30 + (Math.random() * 40 - 20)}%`,
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.3,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
        
        {/* Glow Effect */}
        {config.glow && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none"
            animate={{
              boxShadow: `0 0 40px ${config.glow}60`
            }}
            transition={{ duration: 0.6 }}
          />
        )}
      </motion.div>
      
      {/* Living State Indicator */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
        <motion.div 
          className={`px-4 py-2 rounded-full text-sm font-bold text-white shadow-lg ${
            state === 'idle' ? 'bg-gradient-to-r from-gray-500 to-gray-600' :
            state === 'listening' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
            state === 'thinking' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
            state === 'insight' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
            state === 'nudge' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
            'bg-gradient-to-r from-indigo-500 to-purple-600'
          }`}
          animate={{
            scale: config.excitement ? [1, 1.1, 1] : 1,
            y: config.excitement ? [-2, 0, -2] : 0
          }}
          transition={{
            duration: 0.8,
            repeat: config.excitement ? Infinity : 0,
            ease: "easeInOut"
          }}
        >
          🌟 LIVING • {state.toUpperCase()}
        </motion.div>
      </div>
    </div>
  );
}