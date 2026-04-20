import type { ReactNode } from "react";

export type Phrase = "en" | "pt" | "both" | "alternate";

export type EffectId =
  | "glow-zoom"
  | "floating-letters"
  | "neon-flicker"
  | "balloon-letters"
  | "confetti-celebration"
  | "fireworks-reveal"
  | "cake-surprise"
  | "gift-box"
  | "particle-formation"
  | "explosion-rebuild"
  | "ribbon-swipe"
  | "spark-trail"
  | "star-rain"
  | "pulse-celebration"
  | "bounce-text"
  | "rotating-letters"
  | "soft-elegant-fade"
  | "dual-language"
  | "split-merge"
  | "ultimate-finale"
  // New effects
  | "liquid-metal"
  | "galaxy-portal"
  | "typewriter-glitch"
  | "champagne-pop"
  | "holographic-shift"
  | "petal-shower"
  | "kinetic-typography"
  | "aurora-veil"
  | "spotlight-reveal"
  | "cosmic-orbit"
  | "candle-wish"
  | "laser-scan"
  | "photo-flash"
  | "samba-burst";

export interface EffectMeta {
  id: EffectId;
  label: string;
  description: string;
  icon: ReactNode;
}

export const EN = "Happy Birthday";
export const PT = "Feliz Aniversário";

export function buildPhrase(base: string, name?: string) {
  const n = name?.trim();
  return n ? `${base}, ${n}` : base;
}
