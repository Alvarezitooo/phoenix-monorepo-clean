import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Phoenix‑Luna · Aube
 * Luna Avatar 2.5D — semi‑realistic SVG with micro‑animations + morphs
 *
 * ✔️ Frontend = présentation (aucune logique métier).
 * ✔️ États pilotés par le produit (depuis le Hub): idle/listening/thinking/insight/nudge/confirm
 * ✔️ Accessibilité: prefers‑reduced‑motion (prop reducedMotion)
 * ✔️ Perf: animations via transform/opacity, budget SVG léger
 */

// ===== Design Tokens (exportés) =====
export const LUNA_TOKENS = {
  palette: {
    skin: {
      light: { top: "#FFDCC7", bottom: "#F6BFA4", lid: "#F3C8B5" },
      medium: { top: "#F2C1A0", bottom: "#D7A07E", lid: "#E6B392" },
      deep: { top: "#C58C6A", bottom: "#8E5D44", lid: "#A87259" },
    },
    hair: { base: "#1A1A1A", sheen: "#2A2A2A" },
    blazer: {
      navyTop: "#2D3B52",
      navyBottom: "#1F2A3D",
      lightTop: "#5E6B7A",
      lightBottom: "#4B5563",
    },
    shirt: "#EEF3FF",
    iris: "#3B4C6A",
    lipLine: "#A45C5C",
    bgHalo: "#EAF2FF",
    rim: "#8FB6FF",
  },
  anim: {
    blink: { minDelay: 4, maxDelay: 7, duration: 0.15, doubleChance: 0.125 },
    breathe: { amplitudePx: 1.2, period: 5.2 },
    hairSway: { deg: 1.6, period: 6.4 },
    keyLight: { min: 0.10, max: 0.14, period: 6.8 },
    rimLight: { base: 0.12, pop: 0.22, popDuration: 0.42 },
    headTilt: { deg: 1.4, duration: 0.22 },
  },
} as const;

export const LUNA_TOKENS_JSON = JSON.stringify(LUNA_TOKENS, null, 2);

// ===== Helpers =====
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function useBlink(reduced: boolean) {
  const [phase, setPhase] = useState<"open" | "blink">("open");
  useEffect(() => {
    if (reduced) return;
    let alive = true;
    let t: any;
    const schedule = () => {
      const { minDelay, maxDelay, doubleChance } = LUNA_TOKENS.anim.blink;
      const wait = (minDelay + Math.random() * (maxDelay - minDelay)) * 1000;
      t = setTimeout(() => {
        if (!alive) return;
        setPhase("blink");
        setTimeout(() => {
          setPhase("open");
          if (Math.random() < doubleChance) {
            setTimeout(() => setPhase("blink"), 120);
            setTimeout(() => setPhase("open"), 240);
          }
          schedule();
        }, LUNA_TOKENS.anim.blink.duration * 1000);
      }, wait);
    };
    schedule();
    return () => {
      alive = false;
      if (t) clearTimeout(t);
    };
  }, [reduced]);
  return phase === "blink";
}

function useRimFlash(state: State, reduced: boolean) {
  const [pop, setPop] = useState(false);
  useEffect(() => {
    if (reduced) return;
    if (state === "insight") {
      setPop(true);
      const t = setTimeout(() => setPop(false), LUNA_TOKENS.anim.rimLight.popDuration * 1000);
      return () => clearTimeout(t);
    }
  }, [state, reduced]);
  return pop;
}

type State = "idle" | "listening" | "thinking" | "insight" | "nudge" | "confirm";
type SkinTone = "light" | "medium" | "deep";
type Variant = "bust" | "full";
type Outfit = "navy" | "lightGrey";

function eyeGlintOffset(state: State) {
  switch (state) {
    case "nudge":
    case "confirm":
      return { x: 1.5, y: -0.5 };
    case "listening":
      return { x: -1.2, y: 0.2 };
    case "thinking":
      return { x: 0.6, y: 0.4 };
    default:
      return { x: 0, y: 0 };
  }
}

function mouthPath(state: State) {
  // three base poses, with subtle variance
  if (state === "thinking") return "M160,182 q20,0 40,0"; // flat
  if (state === "insight" || state === "nudge" || state === "confirm") return "M160,179 q20,11 40,0"; // soft smile
  return "M160,180 q20,6 40,0"; // neutral
}

function browPath(x: number, y: number, lift: number) {
  // Quadratic curve with adjustable lift (negative lifts downward)
  const ctrlY = y - (10 + lift);
  return `M${x},${y} q15,${ctrlY - y} 30,0`;
}

function eyelidOpen(state: State) {
  // percentage [0..1] where 1 = fully open
  switch (state) {
    case "listening":
      return 1.05; // a touch more open
    case "thinking":
      return 0.95; // slightly relaxed
    default:
      return 1.0;
  }
}

// ===== COMPOSANT PRINCIPAL AVATAR 2.5D =====
function LunaAvatar({
  state = "idle",
  energy = 68,
  reducedMotion = false,
  size = 360,
  variant = "bust",
  skinTone = "light",
  outfit = "navy",
}: {
  state?: State;
  energy?: number;
  reducedMotion?: boolean;
  size?: number;
  variant?: Variant;
  skinTone?: SkinTone;
  outfit?: Outfit;
}) {
  const blink = useBlink(reducedMotion);
  const rimPop = useRimFlash(state, reducedMotion);
  const glint = eyeGlintOffset(state);
  const energyPct = clamp(energy, 0, 100);

  const pal = LUNA_TOKENS.palette;
  const skin = pal.skin[skinTone];
  const blazerTop = outfit === "navy" ? pal.blazer.navyTop : pal.blazer.lightTop;
  const blazerBot = outfit === "navy" ? pal.blazer.navyBottom : pal.blazer.lightBottom;

  const breatheAnim = reducedMotion
    ? {}
    : {
        y: [0, -LUNA_TOKENS.anim.breathe.amplitudePx, 0],
        transition: { duration: LUNA_TOKENS.anim.breathe.period, repeat: Infinity, ease: "easeInOut" },
      };

  const hairSwayAnim = reducedMotion
    ? {}
    : {
        rotate: [-LUNA_TOKENS.anim.hairSway.deg, LUNA_TOKENS.anim.hairSway.deg, -LUNA_TOKENS.anim.hairSway.deg],
        transition: { duration: LUNA_TOKENS.anim.hairSway.period, repeat: Infinity, ease: "easeInOut" },
      };

  const keyLightAnim = reducedMotion
    ? { opacity: LUNA_TOKENS.anim.keyLight.min }
    : {
        opacity: [LUNA_TOKENS.anim.keyLight.min, LUNA_TOKENS.anim.keyLight.max, LUNA_TOKENS.anim.keyLight.min],
        transition: { duration: LUNA_TOKENS.anim.keyLight.period, repeat: Infinity, ease: "easeInOut" },
      };

  const headTilt = reducedMotion
    ? 0
    : state === "insight" || state === "nudge"
    ? LUNA_TOKENS.anim.headTilt.deg
    : 0;

  const lidScale = eyelidOpen(state);
  const rimOpacity = rimPop ? LUNA_TOKENS.anim.rimLight.pop : LUNA_TOKENS.anim.rimLight.base;
  const w = size;
  const vbH = variant === "full" ? 540 : 360;

  // Eyebrow lift tuning per state
  const lift = state === "insight" || state === "confirm" ? 1.2 : state === "nudge" ? 0.8 : 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: w, height: (vbH / 360) * w }}>
        <svg viewBox={`0 0 360 ${vbH}`} width={w} height={(vbH / 360) * w} className="overflow-visible">
          <defs>
            <radialGradient id="bgHalo" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor={pal.bgHalo} stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.0" />
            </radialGradient>
            <linearGradient id="skinG" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={skin.top} />
              <stop offset="100%" stopColor={skin.bottom} />
            </linearGradient>
            <linearGradient id="hairG" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={pal.hair.sheen} />
              <stop offset="100%" stopColor={pal.hair.base} />
            </linearGradient>
            <linearGradient id="blazerG" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={blazerTop} />
              <stop offset="100%" stopColor={blazerBot} />
            </linearGradient>
            <radialGradient id="keyLight" cx="48%" cy="40%" r="35%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="rimLight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={pal.rim} stopOpacity="0" />
              <stop offset="100%" stopColor={pal.rim} stopOpacity="1" />
            </linearGradient>
          </defs>

          <circle cx="180" cy="170" r="160" fill="url(#bgHalo)" />

          {/* Énergie */}
          <g transform="translate(180 170)">
            <circle r="148" fill="none" stroke="#edf2ff" strokeWidth="14" />
            <motion.circle
              r="148"
              fill="none"
              stroke="#5B8CFF"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 148}
              strokeDashoffset={2 * Math.PI * 148 * (1 - energyPct / 100)}
              initial={false}
              animate={{ strokeDashoffset: 2 * Math.PI * 148 * (1 - energyPct / 100) }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              transform="rotate(-90)"
            />
            <text x="0" y="10" textAnchor="middle" className="fill-slate-600" style={{ font: "600 18px Inter, ui-sans-serif" }}>{energyPct.toFixed(0)}%</text>
          </g>

          {/* Avatar */}
          <motion.g style={{ rotate: headTilt }} transformOrigin="180px 210px" {...breatheAnim}>
            {/* Cheveux arrière */}
            <motion.g {...hairSwayAnim} transformOrigin="180px 135px">
              <path d="M80,160 C80,80 150,60 180,60 C210,60 280,80 280,160 C280,240 230,260 180,260 C130,260 80,240 80,160 Z" fill="url(#hairG)"/>
            </motion.g>

            {/* Cou */}
            <rect x="165" y="180" width="30" height="40" rx="10" fill="url(#skinG)" />

            {/* Visage */}
            <ellipse cx="180" cy="140" rx="60" ry="76" fill="url(#skinG)" />

            {/* Ombres douces */}
            <ellipse cx="150" cy="162" rx="14" ry="10" fill="#000" opacity="0.06" />
            <ellipse cx="210" cy="162" rx="14" ry="10" fill="#000" opacity="0.06" />
            <ellipse cx="180" cy="208" rx="24" ry="10" fill="#000" opacity="0.10" />

            {/* Oreilles */}
            <ellipse cx="123" cy="142" rx="10" ry="14" fill={skin.bottom} />
            <ellipse cx="237" cy="142" rx="10" ry="14" fill={skin.bottom} />

            {/* Cheveux avant */}
            <motion.g {...hairSwayAnim} transformOrigin="180px 120px">
              <path d="M120,95 C135,70 160,58 180,58 C200,58 225,70 240,95 C225,105 207,112 180,112 C153,112 135,105 120,95 Z" fill="url(#hairG)" />
              {/* Mèche brillante (highlight qui glisse légèrement) */}
              <motion.path d="M138,88 C148,78 160,74 172,78" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="2" fill="none" animate={reducedMotion ? {} : { x: [0, 1.5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
            </motion.g>

            {/* Sourcils (morph lift) */}
            <path d={browPath(145, 125, lift)} stroke="#3A2E2E" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d={browPath(205, 125, lift)} stroke="#3A2E2E" strokeWidth="3" fill="none" strokeLinecap="round" />

            {/* Yeux */}
            <g>
              {/* Globes */}
              <rect x="140" y="135" width="35" height="16" rx="8" fill="#fff" />
              <rect x="205" y="135" width="35" height="16" rx="8" fill="#fff" />
              {/* Iris + pupilles */}
              <circle cx={157 + glint.x} cy={143 + glint.y} r="6.4" fill={pal.iris} />
              <circle cx={222 + glint.x} cy={143 + glint.y} r="6.4" fill={pal.iris} />
              <circle cx={157 + glint.x} cy={143 + glint.y} r="3.1" fill="#111" />
              <circle cx={222 + glint.x} cy={143 + glint.y} r="3.1" fill="#111" />
              {/* Glints (spéculaire) */}
              <motion.circle cx={154.8 + glint.x} cy={141.4 + glint.y} r="1.4" fill="#fff" animate={{ x: glint.x, y: glint.y }} transition={{ duration: 0.4 }} />
              <motion.circle cx={219.8 + glint.x} cy={141.4 + glint.y} r="1.4" fill="#fff" animate={{ x: glint.x, y: glint.y }} transition={{ duration: 0.4 }} />

              {/* Paupières supérieures (ouverture variable) */}
              <AnimatePresence>
                {(!reducedMotion || blink) && (
                  <motion.rect key="lidL" x="140" y="135" width="35" height="16" rx="8" initial={false} animate={{ scaleY: blink ? 1 : 1 / lidScale }} style={{ transformOrigin: "157.5px 143px" }} fill={skin.lid} transition={{ duration: blink ? 0.12 : 0.18 }} />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {(!reducedMotion || blink) && (
                  <motion.rect key="lidR" x="205" y="135" width="35" height="16" rx="8" initial={false} animate={{ scaleY: blink ? 1 : 1 / lidScale }} style={{ transformOrigin: "222.5px 143px" }} fill={skin.lid} transition={{ duration: blink ? 0.12 : 0.18 }} />
                )}
              </AnimatePresence>
            </g>

            {/* Nez */}
            <path d="M178,150 q2,10 0,20" stroke="#B17D6A" strokeWidth="2" fill="none" strokeLinecap="round" />

            {/* Bouche (morph) */}
            <path d={mouthPath(state)} stroke={pal.lipLine} strokeWidth="2.2" fill="none" strokeLinecap="round" />

            {/* Épaules / blazer */}
            <g>
              <path d="M115,230 C130,200 150,190 180,190 C210,190 230,200 245,230 L240,280 L120,280 Z" fill="url(#blazerG)" />
              <path d="M160,200 L200,200 L205,280 L155,280 Z" fill={pal.shirt} />
            </g>

            {/* Key light (breathing) */}
            <motion.ellipse cx="175" cy="132" rx="58" ry="70" fill="url(#keyLight)" {...keyLightAnim} />
            {/* Rim light (pop insight) */}
            <motion.rect x="230" y="70" width="30" height="190" fill="url(#rimLight)" initial={{ opacity: LUNA_TOKENS.anim.rimLight.base }} animate={{ opacity: rimOpacity }} transition={{ duration: rimPop ? LUNA_TOKENS.anim.rimLight.popDuration : 0.6 }} />
          </motion.g>

          {/* Full body extension */}
          {variant === "full" && (
            <g>
              <path d="M120,280 C135,300 225,300 240,280 L250,360 L110,360 Z" fill="url(#blazerG)" />
              <rect x="122" y="358" width="116" height="10" rx="3" fill="#1B2433" />
              <path d="M122,368 L170,540 L135,540 L100,368 Z" fill={blazerBot} />
              <path d="M178,368 L238,540 L205,540 L160,368 Z" fill={blazerBot} />
              <ellipse cx="110" cy="365" rx="10" ry="8" fill="url(#skinG)" />
              <ellipse cx="250" cy="365" rx="10" ry="8" fill="url(#skinG)" />
              <rect x="128" y="540" width="30" height="8" rx="2" fill="#111827" />
              <rect x="203" y="540" width="30" height="8" rx="2" fill="#111827" />
            </g>
          )}
        </svg>
      </div>

      {/* Légende de contrôle (display only) */}
      <Legend state={state} variant={variant} skinTone={skinTone} outfit={outfit} energy={energyPct} />
    </div>
  );
}

function Legend({ state, variant, skinTone, outfit, energy }: { state: State; variant: Variant; skinTone: SkinTone; outfit: Outfit; energy: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
      <span className="inline-block h-2 w-2 rounded-full bg-sky-500" />
      <span>Énergie {energy.toFixed(0)}%</span>
      <span className="mx-2">·</span>
      <span>État: <strong className="font-medium">{state}</strong></span>
      <span className="mx-2">·</span>
      <span>Variante: <strong className="font-medium">{variant}</strong></span>
      <span className="mx-2">·</span>
      <span>Teint: <strong className="font-medium">{skinTone}</strong></span>
      <span className="mx-2">·</span>
      <span>Tenue: <strong className="font-medium">{outfit}</strong></span>
    </div>
  );
}

// ===== Exports =====
export type LunaExpression = State;
export { LunaAvatar as LunaAvatar2_5D };
export default LunaAvatar;