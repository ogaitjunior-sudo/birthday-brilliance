import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import type { EffectId } from "@/features/birthday-effects/effects";
import { EN, PT, buildPhrase } from "@/features/birthday-effects/effects";

interface Props {
  effect: EffectId | null;
  runId: number;
  speed: number;
  name: string;
  onClear: () => void;
  isExportingVideo?: boolean;
}

// Helpers ---------------------------------------------------------------

const splitLetters = (text: string) =>
  Array.from(text).map((ch, i) => ({ ch, i, key: `${i}-${ch}` }));

function Letters({
  text,
  className = "",
  style,
  letterClass = "",
  variants,
  stagger = 0.05,
  delay = 0,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  letterClass?: string;
  variants: Variants;
  stagger?: number;
  delay?: number;
}) {
  return (
    <motion.span
      className={className}
      style={style}
      initial="hidden"
      animate="visible"
      transition={{ staggerChildren: stagger, delayChildren: delay }}
    >
      {splitLetters(text).map(({ ch, key }) => (
        <motion.span
          key={key}
          variants={variants}
          className={`inline-block ${letterClass}`}
          style={{ whiteSpace: ch === " " ? "pre" : undefined }}
        >
          {ch}
        </motion.span>
      ))}
    </motion.span>
  );
}

// Confetti / fireworks helpers -----------------------------------------
function burstConfetti() {
  const colors = ["#ff6fb5", "#b46cff", "#ffd86b", "#6fb8ff", "#ffffff"];
  confetti({
    particleCount: 160,
    spread: 100,
    origin: { y: 0.6 },
    colors,
    scalar: 1.1,
    shapes: ["circle", "square"],
  });
  setTimeout(() => {
    confetti({ particleCount: 100, angle: 60, spread: 75, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 100, angle: 120, spread: 75, origin: { x: 1, y: 0.7 }, colors });
  }, 250);
}

function fireworks(duration = 2500) {
  const end = Date.now() + duration;
  const colors = ["#ff6fb5", "#b46cff", "#ffd86b", "#6fb8ff"];
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors });
    confetti({
      particleCount: 8,
      startVelocity: 35,
      spread: 360,
      ticks: 70,
      origin: { x: Math.random(), y: Math.random() * 0.4 + 0.1 },
      colors,
      scalar: 1.3,
    });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

function champagneBurst() {
  const colors = ["#ffd86b", "#fff5d1", "#ffffff", "#ffe9a8"];
  confetti({
    particleCount: 200,
    angle: 90,
    spread: 50,
    startVelocity: 65,
    origin: { x: 0.5, y: 0.95 },
    colors,
    scalar: 0.8,
    gravity: 0.6,
    drift: 0.2,
  });
}

// ---------------------------------------------------------------------

const PHRASE_SEQUENCE_DELAY = 3000;

export function EffectStage({
  effect,
  runId,
  speed,
  name,
  onClear,
  isExportingVideo = false,
}: Props) {
  const [sequencePhase, setSequencePhase] = useState(0);
  const phraseEN = buildPhrase(EN, name);
  const phrasePT = buildPhrase(PT, name);
  const phrase = sequencePhase === 0 ? phraseEN : phrasePT;

  useEffect(() => {
    if (!effect) {
      setSequencePhase(0);
      return;
    }

    setSequencePhase(0);
    const timer = setTimeout(() => setSequencePhase(1), PHRASE_SEQUENCE_DELAY / speed);

    return () => clearTimeout(timer);
  }, [runId, effect, speed]);

  useEffect(() => {
    if (!effect) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (callback: () => void, delay: number) => {
      timers.push(setTimeout(callback, delay / speed));
    };

    if (effect === "confetti-celebration" || effect === "ultimate-finale") burstConfetti();
    if (effect === "fireworks-reveal" || effect === "ultimate-finale") fireworks(2600 / speed);
    if (effect === "cake-surprise") schedule(burstConfetti, 900);
    if (effect === "gift-box") schedule(burstConfetti, 700);
    if (effect === "champagne-pop") schedule(champagneBurst, 500);
    if (effect === "candle-wish") schedule(burstConfetti, 1400);
    if (effect === "photo-flash") schedule(burstConfetti, 850);
    if (effect === "samba-burst") schedule(burstConfetti, 350);

    return () => timers.forEach(clearTimeout);
  }, [runId, effect, sequencePhase, speed]);

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${
        isExportingVideo ? "bg-white" : ""
      }`}
    >
      <AnimatePresence mode="wait">
        {effect && (
          <motion.div
            key={`${effect}-${runId}-${sequencePhase}`}
            className="absolute inset-0 flex items-center justify-center px-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.4 } }}
          >
            <EffectRenderer effect={effect} phrase={phrase} speed={speed} />
          </motion.div>
        )}
        {!effect && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <p className="font-script text-4xl text-[var(--gold)]/80 md:text-6xl">
              ✦ Escolha um efeito ✦
            </p>
            <p className="mt-3 text-sm text-muted-foreground">Clique em um card para celebrar</p>
          </motion.div>
        )}
      </AnimatePresence>

      {effect && !isExportingVideo && (
        <button
          onClick={onClear}
          className="glass absolute right-4 top-4 z-50 rounded-full px-3 py-1 text-xs text-foreground/70 hover:text-foreground"
        >
          ✕ limpar
        </button>
      )}
    </div>
  );
}

// =====================================================================
// EFFECT RENDERER
// =====================================================================

function EffectRenderer({
  effect,
  phrase,
  speed,
}: {
  effect: EffectId;
  phrase: string;
  speed: number;
}) {
  const s = (n: number) => n / speed;
  const baseClass =
    "font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-tight";

  switch (effect) {
    case "glow-zoom":
      return <GlowZoom text={phrase} className={baseClass} speed={speed} />;

    case "floating-letters":
      return (
        <div className={`${baseClass} text-gradient-festive`}>
          {splitLetters(phrase).map(({ ch, key }, i) => (
            <motion.span
              key={key}
              initial={{
                x: (Math.random() - 0.5) * 600,
                y: (Math.random() - 0.5) * 400,
                rotate: (Math.random() - 0.5) * 180,
                opacity: 0,
                filter: "blur(10px)",
              }}
              animate={{ x: 0, y: 0, rotate: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: s(1.4), delay: i * s(0.05), ease: [0.16, 1, 0.3, 1] }}
              className="inline-block"
              style={{ whiteSpace: ch === " " ? "pre" : undefined }}
            >
              {ch}
            </motion.span>
          ))}
        </div>
      );

    case "neon-flicker":
      return <NeonSign text={phrase} speed={speed} />;

    case "balloon-letters":
      return <BalloonLetters text={phrase} className={baseClass} speed={speed} />;

    case "confetti-celebration":
      return (
        <motion.div
          initial={{ scale: 0.7, opacity: 0, rotate: -5 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: s(0.6), ease: "backOut" }}
          className={`${baseClass} shimmer-text`}
        >
          {phrase}
        </motion.div>
      );

    case "fireworks-reveal":
      return (
        <Letters
          text={phrase}
          className={`${baseClass} text-gradient-festive glow-pink`}
          stagger={s(0.06)}
          variants={{
            hidden: { opacity: 0, scale: 0.5, y: 20 },
            visible: {
              opacity: 1,
              scale: 1,
              y: 0,
              transition: { duration: s(0.6), ease: "easeOut" },
            },
          }}
        />
      );

    case "cake-surprise":
      return <CakeSurprise text={phrase} className={baseClass} speed={speed} />;

    case "gift-box":
      return <GiftBox text={phrase} className={baseClass} speed={speed} />;

    case "particle-formation":
      return <ParticleFormation text={phrase} speed={speed} />;

    case "explosion-rebuild":
      return <ExplosionRebuild text={phrase} className={baseClass} speed={speed} />;

    case "ribbon-swipe":
      return <RibbonSwipe text={phrase} className={baseClass} speed={speed} />;

    case "spark-trail":
      return <SparkTrail text={phrase} speed={speed} />;

    case "star-rain":
      return <StarRain text={phrase} className={baseClass} speed={speed} />;

    case "pulse-celebration":
      return <PulseHeartbeat text={phrase} className={baseClass} speed={speed} />;

    case "bounce-text":
      return (
        <Letters
          text={phrase}
          className={`${baseClass} text-gradient-festive`}
          stagger={s(0.06)}
          variants={{
            hidden: { y: -300, opacity: 0, rotate: -20 },
            visible: {
              y: 0,
              opacity: 1,
              rotate: 0,
              transition: { type: "spring", stiffness: 400, damping: 10 },
            },
          }}
        />
      );

    case "rotating-letters":
      return (
        <div className={`${baseClass} text-gradient-festive`} style={{ perspective: 1000 }}>
          {splitLetters(phrase).map(({ ch, key }, i) => (
            <motion.span
              key={key}
              initial={{ rotateY: 720, rotateX: 180, opacity: 0, scale: 0.3 }}
              animate={{ rotateY: 0, rotateX: 0, opacity: 1, scale: 1 }}
              transition={{ duration: s(1.2), delay: i * s(0.06), ease: [0.16, 1, 0.3, 1] }}
              className="inline-block"
              style={{ whiteSpace: ch === " " ? "pre" : undefined, transformStyle: "preserve-3d" }}
            >
              {ch}
            </motion.span>
          ))}
        </div>
      );

    case "soft-elegant-fade":
      return (
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(12px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: s(2), ease: "easeOut" }}
            className={`${baseClass} shimmer-text font-script !text-5xl md:!text-8xl`}
          >
            {phrase}
          </motion.div>
          <FloatingSparkles count={20} />
        </div>
      );

    case "dual-language":
      return (
        <DualLanguage primary={phrase} secondary={phrase} className={baseClass} speed={speed} />
      );

    case "split-merge":
      return <SplitMerge text={phrase} className={baseClass} speed={speed} />;

    case "ultimate-finale":
      return (
        <UltimateFinale primary={phrase} secondary={phrase} className={baseClass} speed={speed} />
      );

    // ===== NEW EFFECTS =====
    case "liquid-metal":
      return <LiquidMetal text={phrase} className={baseClass} speed={speed} />;

    case "galaxy-portal":
      return <GalaxyPortal text={phrase} className={baseClass} speed={speed} />;

    case "typewriter-glitch":
      return <TypewriterGlitch text={phrase} className={baseClass} speed={speed} />;

    case "champagne-pop":
      return <ChampagnePop text={phrase} className={baseClass} speed={speed} />;

    case "holographic-shift":
      return <HolographicShift text={phrase} className={baseClass} speed={speed} />;

    case "petal-shower":
      return <PetalShower text={phrase} className={baseClass} speed={speed} />;

    case "kinetic-typography":
      return <KineticTypography text={phrase} speed={speed} />;

    case "aurora-veil":
      return <AuroraVeil text={phrase} className={baseClass} speed={speed} />;

    case "spotlight-reveal":
      return <SpotlightReveal text={phrase} className={baseClass} speed={speed} />;

    case "cosmic-orbit":
      return <CosmicOrbit text={phrase} className={baseClass} speed={speed} />;

    case "candle-wish":
      return <CandleWish text={phrase} className={baseClass} speed={speed} />;

    case "laser-scan":
      return <LaserScan text={phrase} className={baseClass} speed={speed} />;

    case "photo-flash":
      return <PhotoFlash text={phrase} className={baseClass} speed={speed} />;

    case "samba-burst":
      return <SambaBurst text={phrase} className={baseClass} speed={speed} />;
  }
}

// =====================================================================
// IMPROVED + NEW SUB COMPONENTS
// =====================================================================

function GlowZoom({ text, className, speed }: { text: string; className: string; speed: number }) {
  return (
    <div className="relative">
      <motion.div
        className="pointer-events-none absolute inset-0 -z-10"
        initial={{ opacity: 0, scale: 0.2 }}
        animate={{ opacity: [0, 1, 0.6], scale: [0.2, 2, 1.4] }}
        transition={{ duration: 1.4 / speed, ease: "easeOut" }}
        style={{
          background:
            "radial-gradient(circle, oklch(0.85 0.16 90 / 0.6), oklch(0.78 0.18 350 / 0.4) 40%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <motion.div
        initial={{ scale: 0.1, opacity: 0, filter: "blur(40px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 1 / speed, ease: [0.16, 1, 0.3, 1] }}
        className={`${className} text-gradient-festive glow-pink`}
      >
        {text}
      </motion.div>
    </div>
  );
}

function NeonSign({ text, speed }: { text: string; speed: number }) {
  return (
    <div className="relative">
      {/* Neon tube background frame */}
      <motion.div
        className="absolute -inset-6 rounded-2xl border-2 border-[var(--pink)]/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.3, 0.1, 0.3, 0.6] }}
        transition={{ duration: 2 / speed, delay: 0.3 / speed }}
        style={{
          boxShadow:
            "0 0 20px oklch(0.78 0.18 350 / 0.6), inset 0 0 20px oklch(0.78 0.18 350 / 0.3)",
        }}
      />
      <div className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-wider neon-text">
        {splitLetters(text).map(({ ch, key }, i) => (
          <motion.span
            key={key}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 1, 0.1, 1, 0.4, 1, 0.7, 1],
            }}
            transition={{
              duration: 1.2 / speed,
              delay: (i * 0.1) / speed,
              times: [0, 0.1, 0.2, 0.3, 0.5, 0.7, 0.85, 1],
            }}
            className="inline-block"
            style={{ whiteSpace: ch === " " ? "pre" : undefined }}
          >
            {ch}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function BalloonLetters({
  text,
  className,
  speed,
}: {
  text: string;
  className: string;
  speed: number;
}) {
  const colors = ["#ff6fb5", "#b46cff", "#ffd86b", "#6fb8ff", "#ff9ed1"];
  return (
    <div className="relative">
      <div className={`${className} text-gradient-festive opacity-0`} aria-hidden>
        {text}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        {splitLetters(text).map(({ ch, key }, i) => (
          <motion.span
            key={key}
            initial={{ y: 500, opacity: 0, scale: 0.6, rotate: -15 }}
            animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              duration: 1.6 / speed,
              delay: (i * 0.08) / speed,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`relative inline-block ${className} text-gradient-festive`}
            style={{ whiteSpace: ch === " " ? "pre" : undefined }}
          >
            {ch !== " " && (
              <motion.span
                aria-hidden
                className="absolute -top-16 left-1/2 -translate-x-1/2"
                animate={{ y: [-3, 3, -3], rotate: [-2, 2, -2] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              >
                <span
                  className="block h-10 w-7 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 30% 25%, white 5%, ${colors[i % colors.length]} 50%, ${colors[(i + 2) % colors.length]} 100%)`,
                    boxShadow: `0 0 20px ${colors[i % colors.length]}80, inset -3px -5px 8px rgba(0,0,0,0.2)`,
                  }}
                />
                <span
                  className="mx-auto block h-4 w-px"
                  style={{ background: `${colors[i % colors.length]}80` }}
                />
              </motion.span>
            )}
            <span>{ch}</span>
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function CakeSurprise({
  text,
  className,
  speed,
}: {
  text: string;
  className: string;
  speed: number;
}) {
  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div
        initial={{ y: 200, opacity: 0, scale: 0.6 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.9 / speed, ease: "backOut" }}
        className="relative"
      >
        <svg width="200" height="180" viewBox="0 0 200 180">
          <defs>
            <linearGradient id="cake1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffd1e6" />
              <stop offset="100%" stopColor="#ff6fb5" />
            </linearGradient>
            <linearGradient id="cake2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0c4ff" />
              <stop offset="100%" stopColor="#9a5cff" />
            </linearGradient>
            <linearGradient id="cake3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a87edb" />
              <stop offset="100%" stopColor="#5e35a8" />
            </linearGradient>
            <radialGradient id="flame" cx="0.5" cy="0.4" r="0.6">
              <stop offset="0%" stopColor="#fff8dc" />
              <stop offset="40%" stopColor="#ffd86b" />
              <stop offset="100%" stopColor="#ff7a00" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* candles */}
          {[70, 100, 130].map((x, i) => (
            <g key={x}>
              <rect x={x - 3} y={28} width={6} height={32} rx={1} fill="#fff5d1" />
              <rect x={x - 3} y={28} width={6} height={4} fill="#ffd86b" opacity="0.6" />
              <motion.g
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 / speed, delay: (0.7 + i * 0.18) / speed }}
                style={{ transformOrigin: `${x}px 22px` }}
              >
                <ellipse cx={x} cy={22} rx={9} ry={14} fill="url(#flame)" opacity="0.6" />
                <motion.ellipse
                  cx={x}
                  cy={20}
                  rx={4}
                  ry={8}
                  fill="#ffd86b"
                  animate={{ scaleY: [1, 1.15, 0.9, 1.1, 1], scaleX: [1, 0.9, 1.1, 0.95, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "easeInOut" }}
                  style={{ transformOrigin: `${x}px 22px`, filter: "drop-shadow(0 0 6px #ffd86b)" }}
                />
                <ellipse cx={x} cy={24} rx={2} ry={4} fill="#ff7a00" />
              </motion.g>
            </g>
          ))}

          {/* tiers */}
          <rect x={50} y={60} width={100} height={28} rx={6} fill="url(#cake1)" />
          <rect x={50} y={60} width={100} height={6} fill="white" opacity="0.3" />
          <rect x={35} y={88} width={130} height={36} rx={8} fill="url(#cake2)" />
          <rect x={35} y={88} width={130} height={6} fill="white" opacity="0.25" />
          <rect x={25} y={124} width={150} height={30} rx={8} fill="url(#cake3)" />

          {/* drip details */}
          {[60, 75, 95, 115, 135].map((x) => (
            <path key={x} d={`M ${x} 88 Q ${x + 3} 95 ${x + 6} 88`} fill="#ffd1e6" opacity="0.7" />
          ))}
        </svg>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8 / speed, delay: 1.1 / speed, ease: "backOut" }}
        className={`${className} text-gradient-festive glow-pink`}
      >
        {text}
      </motion.div>
    </div>
  );
}

function GiftBox({ text, className, speed }: { text: string; className: string; speed: number }) {
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOpened(true), 800 / speed);
    return () => clearTimeout(t);
  }, [speed]);
  return (
    <div className="relative flex items-center justify-center">
      <AnimatePresence>
        {!opened && (
          <motion.div
            key="box"
            initial={{ scale: 0, rotate: -45, y: 100 }}
            animate={{ scale: 1, rotate: 0, y: 0 }}
            exit={{ scale: 1.6, opacity: 0, y: -40 }}
            transition={{ duration: 0.7 / speed, ease: "backOut" }}
            className="relative"
          >
            <div className="relative h-36 w-36 rounded-md bg-gradient-to-br from-[var(--pink)] via-[var(--purple)] to-[var(--blue)] shadow-[0_20px_60px_-20px_var(--pink)]">
              <div className="absolute inset-x-0 top-1/2 h-4 -translate-y-1/2 bg-gradient-to-b from-[var(--gold)] to-[#c9a83d]" />
              <div className="absolute inset-y-0 left-1/2 w-4 -translate-x-1/2 bg-gradient-to-r from-[var(--gold)] to-[#c9a83d]" />
              <motion.div
                className="absolute -top-6 left-1/2 -translate-x-1/2 text-4xl"
                animate={{ rotate: [-5, 5, -5] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🎀
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {opened && (
        <motion.div
          initial={{ scale: 0.3, opacity: 0, y: 60, filter: "blur(15px)" }}
          animate={{ scale: 1, opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.8 / speed, ease: [0.16, 1, 0.3, 1] }}
          className={`${className} text-gradient-festive glow-pink`}
        >
          {text}
        </motion.div>
      )}
    </div>
  );
}

function ParticleFormation({ text, speed }: { text: string; speed: number }) {
  return (
    <div className="relative font-display text-5xl md:text-7xl lg:text-8xl font-bold">
      {splitLetters(text).map(({ ch, key }, i) => (
        <motion.span
          key={key}
          initial={{
            x: (Math.random() - 0.5) * 1200,
            y: (Math.random() - 0.5) * 800,
            opacity: 0,
            scale: 0.1,
            filter: "blur(12px)",
            rotate: Math.random() * 360,
          }}
          animate={{ x: 0, y: 0, opacity: 1, scale: 1, filter: "blur(0px)", rotate: 0 }}
          transition={{
            duration: 1.8 / speed,
            delay: (i * 0.04) / speed,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline-block text-gradient-festive glow-pink"
          style={{ whiteSpace: ch === " " ? "pre" : undefined }}
        >
          {ch}
        </motion.span>
      ))}
    </div>
  );
}

function ExplosionRebuild({
  text,
  className,
  speed,
}: {
  text: string;
  className: string;
  speed: number;
}) {
  const [phase, setPhase] = useState<"in" | "explode" | "rebuild">("in");
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("explode"), 1000 / speed);
    const t2 = setTimeout(() => setPhase("rebuild"), 1700 / speed);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [speed]);

  return (
    <div className={`${className} text-gradient-festive glow-pink`}>
      {splitLetters(text).map(({ ch, key }, i) => {
        const angle = (i / text.length) * Math.PI * 2;
        const explodeX = Math.cos(angle) * 700;
        const explodeY = Math.sin(angle) * 500;
        return (
          <motion.span
            key={key}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={
              phase === "in"
                ? { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }
                : phase === "explode"
                  ? { opacity: 0, scale: 2.5, x: explodeX, y: explodeY, rotate: 720 }
                  : { opacity: 1, scale: 1, x: 0, y: 0, rotate: 0 }
            }
            transition={{ duration: 0.7 / speed, delay: (i * 0.02) / speed, ease: "easeOut" }}
            className="inline-block"
            style={{ whiteSpace: ch === " " ? "pre" : undefined }}
          >
            {ch}
          </motion.span>
        );
      })}
    </div>
  );
}

function RibbonSwipe({
  text,
  className,
  speed,
}: {
  text: string;
  className: string;
  speed: number;
}) {
  return (
    <div className="relative">
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          initial={{ x: "-130%", opacity: 0 }}
          animate={{ x: "130%", opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.3 / speed, delay: (i * 0.12) / speed, ease: "easeOut" }}
          className="pointer-events-none absolute -inset-y-12 left-0 w-[140%]"
          style={{
            background: `linear-gradient(90deg, transparent, ${
              ["#ff6fb5", "#b46cff", "#ffd86b", "#6fb8ff"][i]
            }dd, transparent)`,
            transform: `rotate(${-10 + i * 5}deg)`,
            filter: "blur(3px)",
            mixBlendMode: "screen",
          }}
        />
      ))}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7 / speed, delay: 0.8 / speed }}
        className={`${className} shimmer-text relative`}
      >
        {text}
      </motion.div>
    </div>
  );
}

function SparkTrail({ text, speed }: { text: string; speed: number }) {
  return (
    <div className="font-script text-5xl md:text-8xl relative">
      {splitLetters(text).map(({ ch, key }, i) => (
        <motion.span
          key={key}
          initial={{ opacity: 0, filter: "blur(10px)", scale: 0.3, y: 20 }}
          animate={{
            opacity: 1,
            filter: "blur(0px)",
            scale: 1,
            y: 0,
            textShadow: [
              "0 0 40px #ffd86b, 0 0 80px #ff6fb5, 0 0 120px #ffd86b",
              "0 0 15px #ffd86b, 0 0 30px #ff6fb5",
            ],
          }}
          transition={{ duration: 0.6 / speed, delay: (i * 0.13) / speed, ease: "easeOut" }}
          className="inline-block text-[var(--gold)]"
          style={{ whiteSpace: ch === " " ? "pre" : undefined }}
        >
          {ch}
        </motion.span>
      ))}
    </div>
  );
}

function StarRain({ text, className, speed }: { text: string; className: string; speed: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.8,
        size: 0.8 + Math.random() * 1.2,
        char: Math.random() > 0.5 ? "✦" : "✧",
      })),
    [],
  );
  return (
    <div className="relative">
      {stars.map((st) => (
        <motion.span
          key={st.id}
          className="pointer-events-none absolute -top-48"
          style={{
            left: `${st.x}%`,
            color: "#ffd86b",
            fontSize: `${st.size}rem`,
            filter: "drop-shadow(0 0 6px #ffd86b)",
          }}
          initial={{ y: 0, opacity: 0, rotate: 0 }}
          animate={{ y: 500, opacity: [0, 1, 1, 0], rotate: 360 }}
          transition={{ duration: 1.8 / speed, delay: st.delay / speed }}
        >
          {st.char}
        </motion.span>
      ))}
      <Letters
        text={text}
        className={`${className} text-gradient-festive glow-gold`}
        stagger={0.05 / speed}
        delay={0.7 / speed}
        variants={{
          hidden: { opacity: 0, y: -50, scale: 0.8 },
          visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6 / speed } },
        }}
      />
    </div>
  );
}

function PulseHeartbeat({
  text,
  className,
  speed,
}: {
  text: string;
  className: string;
  speed: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: [1, 1.12, 1, 1.08, 1],
        filter: [
          "drop-shadow(0 0 20px oklch(0.78 0.18 350 / 0.5))",
          "drop-shadow(0 0 60px oklch(0.85 0.16 90 / 0.9))",
          "drop-shadow(0 0 20px oklch(0.78 0.18 350 / 0.5))",
        ],
      }}
      transition={{
        opacity: { duration: 0.5 / speed },
        scale: { duration: 0.9 / speed, repeat: Infinity, ease: "easeInOut" },
        filter: { duration: 0.9 / speed, repeat: Infinity, ease: "easeInOut" },
      }}
      className={`${className} text-gradient-festive`}
    >
      {text}
    </motion.div>
  );
}

function FloatingSparkles({ count = 14 }: { count?: number }) {
  const sparkles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 2,
      })),
    [count],
  );
  return (
    <>
      {sparkles.map((sp) => (
        <motion.span
          key={sp.id}
          className="pointer-events-none absolute text-[var(--gold)]"
          style={{ left: `${sp.x}%`, top: `${sp.y}%` }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1.2, 0.4] }}
          transition={{ duration: 2.4, delay: sp.delay, repeat: Infinity }}
        >
          ✦
        </motion.span>
      ))}
    </>
  );
}

function DualLanguage({
  primary,
  secondary,
  className,
  speed,
}: {
  primary: string;
  secondary: string;
  className: string;
  speed: number;
}) {
  const [showPrimary, setShowPrimary] = useState(true);

  useEffect(() => {
    setShowPrimary(true);
    const t = setTimeout(() => setShowPrimary(false), 1800 / speed);
    return () => clearTimeout(t);
  }, [primary, speed]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={showPrimary ? "primary" : "secondary"}
        initial={{ opacity: 0, y: 30, filter: "blur(15px)", letterSpacing: "0.3em" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)", letterSpacing: "0em" }}
        exit={{ opacity: 0, y: -30, filter: "blur(15px)", letterSpacing: "0.3em" }}
        transition={{ duration: 0.9 / speed, ease: [0.16, 1, 0.3, 1] }}
        className={`${className} text-gradient-festive glow-pink`}
      >
        {showPrimary ? primary : secondary}
      </motion.div>
    </AnimatePresence>
  );
}

function SplitMerge({
  text,
  className,
  speed,
}: {
  text: string;
  className: string;
  speed: number;
}) {
  const words = text.split(" ");
  const mid = Math.ceil(words.length / 2);
  const left = words.slice(0, mid).join(" ");
  const right = words.slice(mid).join(" ");
  return (
    <div className={`${className} text-gradient-festive flex items-center gap-3 justify-center`}>
      <motion.span
        initial={{ x: "-70vw", opacity: 0, filter: "blur(10px)" }}
        animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.1 / speed, ease: [0.16, 1, 0.3, 1] }}
      >
        {left}
      </motion.span>
      {right && (
        <motion.span
          initial={{ x: "70vw", opacity: 0, filter: "blur(10px)" }}
          animate={{ x: 0, opacity: 1, filter: "blur(0px)" }}
          transition={{ duration: 1.1 / speed, ease: [0.16, 1, 0.3, 1] }}
        >
          {right}
        </motion.span>
      )}
    </div>
  );
}

function UltimateFinale({
  primary,
  secondary,
  className,
  speed,
}: {
  primary: string;
  secondary: string;
  className: string;
  speed: number;
}) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 1800 / speed);
    return () => clearTimeout(t1);
  }, [primary, speed]);

  return (
    <div className="relative flex flex-col items-center gap-6">
      <FloatingSparkles count={36} />
      <motion.div
        initial={{ scale: 0.3, opacity: 0, filter: "blur(25px)", rotate: -8 }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)", rotate: 0 }}
        transition={{ duration: 1.4 / speed, ease: [0.16, 1, 0.3, 1] }}
        className={`${className} shimmer-text glow-pink`}
      >
        {phase === 0 ? primary : secondary}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 / speed, delay: 0.6 / speed }}
        className="font-script text-2xl md:text-4xl text-[var(--gold)] glow-gold"
      >
        {phase === 0 ? `✦ ${secondary} ✦` : `✦ ${primary} ✦`}
      </motion.div>
    </div>
  );
}

// ============== NEW EFFECTS ==============

function LiquidMetal({
  text,
  className,
  speed,
}: {
  text: string;
  className: string;
  speed: number;
}) {
  return (
    <div className="relative">
      <motion.div
        initial={{ y: -150, opacity: 0, scaleY: 2 }}
        animate={{ y: 0, opacity: 1, scaleY: 1 }}
        transition={{ duration: 1.4 / speed, ease: [0.34, 1.56, 0.64, 1] }}
        className={`${className} liquid-gold-text`}
        style={{ filter: "drop-shadow(0 8px 30px oklch(0.85 0.16 90 / 0.6))" }}
      >
        {text}
      </motion.div>
      {/* drips */}
      {[20, 45, 70, 85].map((x, i) => (
        <motion.div
          key={x}
          className="absolute top-full h-3 w-1.5 rounded-b-full"
          style={{
            left: `${x}%`,
            background: "linear-gradient(180deg, #ffd86b, #c9a83d)",
            boxShadow: "0 0 10px #ffd86b",
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: [0, 1.5, 1], opacity: [0, 1, 0.7] }}
          transition={{ duration: 1 / speed, delay: (0.8 + i * 0.1) / speed }}
        />
      ))}
    </div>
  );
}

function GalaxyPortal({
  text,
  className,
  speed,
}: {
  text: string;
  className: string;
  speed: number;
}) {
  const stars = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        id: i,
        x: 50 + (Math.random() - 0.5) * 20,
        y: 50 + (Math.random() - 0.5) * 20,
        endX: Math.random() * 100,
        endY: Math.random() * 100,
        delay: Math.random() * 0.5,
      })),
    [],
  );
  return (
    <div className="relative h-full w-full flex items-center justify-center">
      {/* Portal swirl */}
      <motion.div
        className="absolute h-96 w-96 rounded-full"
        style={{
          background:
            "conic-gradient(from 0deg, oklch(0.6 0.24 295), oklch(0.78 0.18 350), oklch(0.7 0.16 240), oklch(0.6 0.24 295))",
          filter: "blur(40px)",
        }}
        initial={{ scale: 0, rotate: 0, opacity: 0 }}
        animate={{ scale: [0, 1.5, 1], rotate: 360, opacity: [0, 0.7, 0.4] }}
        transition={{ duration: 2 / speed, ease: "easeOut" }}
      />
      {/* Stars warping out */}
      {stars.map((st) => (
        <motion.span
          key={st.id}
          className="pointer-events-none absolute h-1 w-1 rounded-full bg-white"
          style={{ left: `${st.x}%`, top: `${st.y}%`, boxShadow: "0 0 4px white" }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1, 0.5],
            opacity: [0, 1, 0],
            left: `${st.endX}%`,
            top: `${st.endY}%`,
          }}
          transition={{ duration: 1.5 / speed, delay: st.delay / speed }}
        />
      ))}
      <motion.div
        initial={{ scale: 0, opacity: 0, rotate: -180, filter: "blur(20px)" }}
        animate={{ scale: 1, opacity: 1, rotate: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.5 / speed, delay: 0.4 / speed, ease: [0.16, 1, 0.3, 1] }}
        className={`${className} relative z-10 text-gradient-festive glow-pink`}
      >
        {text}
      </motion.div>
    </div>
  );
}

function TypewriterGlitch({
  text,
  className,
  speed,
}: {
  text: string;
  className: string;
  speed: number;
}) {
  const [revealed, setRevealed] = useState(0);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$%^&*";
  useEffect(() => {
    const interval = setInterval(() => {
      setRevealed((r) => {
        if (r >= text.length) {
          clearInterval(interval);
          return r;
        }
        return r + 1;
      });
    }, 80 / speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <div
      className={`${className} font-mono text-[var(--gold)]`}
      style={{ letterSpacing: "0.05em" }}
    >
      {splitLetters(text).map(({ ch, key }, i) => (
        <span
          key={key}
          className="inline-block"
          style={{
            whiteSpace: ch === " " ? "pre" : undefined,
            textShadow: "0 0 12px oklch(0.85 0.16 90 / 0.8)",
          }}
        >
          {i < revealed ? (
            ch
          ) : i === revealed ? (
            <GlitchChar chars={chars} />
          ) : (
            <span className="opacity-20">_</span>
          )}
        </span>
      ))}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        className="inline-block"
      >
        |
      </motion.span>
    </div>
  );
}

function GlitchChar({ chars }: { chars: string }) {
  const [c, setC] = useState(chars[0]);
  useEffect(() => {
    const i = setInterval(() => setC(chars[Math.floor(Math.random() * chars.length)]), 50);
    return () => clearInterval(i);
  }, [chars]);
  return <span className="text-[var(--pink)]">{c}</span>;
}

function ChampagnePop({
  text,
  className,
  speed,
}: {
  text: string;
  className: string;
  speed: number;
}) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: 40 + Math.random() * 20,
        delay: Math.random() * 1.5,
        size: 6 + Math.random() * 12,
      })),
    [],
  );
  return (
    <div className="relative">
      {/* Bubbles rising */}
      {bubbles.map((b) => (
        <motion.span
          key={b.id}
          className="pointer-events-none absolute rounded-full border border-white/40"
          style={{
            left: `${b.x}%`,
            bottom: 0,
            width: b.size,
            height: b.size,
            background:
              "radial-gradient(circle at 30% 30%, white 5%, oklch(0.85 0.16 90 / 0.4) 60%, transparent)",
          }}
          initial={{ y: 100, opacity: 0, scale: 0 }}
          animate={{ y: -400, opacity: [0, 1, 0], scale: [0, 1, 1.2] }}
          transition={{ duration: 2.5 / speed, delay: b.delay / speed }}
        />
      ))}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 60 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8 / speed, delay: 0.4 / speed, ease: [0.34, 1.56, 0.64, 1] }}
        className={`${className} relative z-10`}
        style={{
          background: "linear-gradient(135deg, #ffd86b 0%, #fff5d1 30%, #ffd86b 60%, #c9a83d 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter: "drop-shadow(0 0 30px oklch(0.85 0.16 90 / 0.6))",
        }}
      >
        {text}
      </motion.div>
    </div>
  );
}

function HolographicShift({
  text,
  className,
  speed,
}: {
  text: string;
  className: string;
  speed: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, rotateX: 60 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      transition={{ duration: 1 / speed, ease: [0.16, 1, 0.3, 1] }}
      className={`${className} holographic-text relative`}
      style={{ perspective: 1000 }}
    >
      {text}
      <motion.span
        className="absolute inset-0 holographic-text"
        animate={{ opacity: [0, 0.5, 0], x: [-3, 3, -3] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{ mixBlendMode: "screen" }}
        aria-hidden
      >
        {text}
      </motion.span>
    </motion.div>
  );
}

function PetalShower({
  text,
  className,
  speed,
}: {
  text: string;
  className: string;
  speed: number;
}) {
  const petals = useMemo(
    () =>
      Array.from({ length: 35 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 2,
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * 100,
        char: ["🌸", "🌺", "🌷", "✿"][Math.floor(Math.random() * 4)],
      })),
    [],
  );
  return (
    <div className="relative">
      {petals.map((p) => (
        <motion.span
          key={p.id}
          className="pointer-events-none absolute -top-20 text-2xl"
          style={{ left: `${p.x}%` }}
          initial={{ y: 0, opacity: 0, rotate: p.rotate }}
          animate={{
            y: 600,
            opacity: [0, 1, 1, 0],
            rotate: p.rotate + 360,
            x: p.drift,
          }}
          transition={{ duration: 4 / speed, delay: p.delay / speed, ease: "linear" }}
        >
          {p.char}
        </motion.span>
      ))}
      <motion.div
        initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.4 / speed, ease: "easeOut" }}
        className={`${className} font-script !text-5xl md:!text-8xl text-gradient-festive`}
        style={{ filter: "drop-shadow(0 0 30px oklch(0.78 0.18 350 / 0.5))" }}
      >
        {text}
      </motion.div>
    </div>
  );
}

function KineticTypography({ text, speed }: { text: string; speed: number }) {
  const words = text.split(" ");
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (idx >= words.length) return;
    const t = setTimeout(() => setIdx((i) => i + 1), 350 / speed);
    return () => clearTimeout(t);
  }, [idx, words.length, speed]);

  return (
    <div className="relative flex flex-col items-center gap-1 leading-none">
      {words.slice(0, idx + 1).map((word, i) => {
        const isLast = i === idx;
        return (
          <motion.div
            key={`${word}-${i}`}
            initial={{
              opacity: 0,
              scale: 0.3,
              x: i % 2 === 0 ? -200 : 200,
              skewX: 20,
            }}
            animate={{ opacity: 1, scale: isLast ? 1.15 : 0.9, x: 0, skewX: 0 }}
            transition={{ duration: 0.4 / speed, ease: [0.34, 1.56, 0.64, 1] }}
            className="font-display font-black uppercase tracking-tighter"
            style={{
              fontSize: isLast ? "clamp(3rem, 10vw, 7rem)" : "clamp(1.5rem, 5vw, 3.5rem)",
              background:
                i % 3 === 0
                  ? "linear-gradient(90deg, #ff6fb5, #b46cff)"
                  : i % 3 === 1
                    ? "linear-gradient(90deg, #ffd86b, #ff6fb5)"
                    : "linear-gradient(90deg, #6fb8ff, #b46cff)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: isLast ? "drop-shadow(0 0 20px oklch(0.78 0.18 350 / 0.5))" : "none",
            }}
          >
            {word}
          </motion.div>
        );
      })}
    </div>
  );
}

function AuroraVeil({
  text,
  className,
  speed,
}: {
  text: string;
  className: string;
  speed: number;
}) {
  return (
    <div className="relative">
      {/* Aurora bands */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute -inset-x-20 -inset-y-32"
          style={{
            background: [
              "linear-gradient(180deg, transparent, oklch(0.7 0.2 160 / 0.5), transparent)",
              "linear-gradient(180deg, transparent, oklch(0.6 0.24 295 / 0.5), transparent)",
              "linear-gradient(180deg, transparent, oklch(0.7 0.16 240 / 0.5), transparent)",
            ][i],
            filter: "blur(40px)",
            mixBlendMode: "screen",
          }}
          initial={{ x: -200, opacity: 0, skewY: -8 }}
          animate={{
            x: [-200 + i * 100, 200 - i * 100, -100 + i * 50],
            opacity: [0, 0.8, 0.6],
            skewY: [-8, 8, -4],
          }}
          transition={{
            duration: 4 / speed,
            delay: (i * 0.3) / speed,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      ))}
      <motion.div
        initial={{ opacity: 0, y: 30, filter: "blur(15px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.5 / speed, ease: "easeOut" }}
        className={`${className} relative z-10`}
        style={{
          background:
            "linear-gradient(135deg, oklch(0.9 0.2 160), oklch(0.78 0.18 350), oklch(0.7 0.16 240))",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          filter: "drop-shadow(0 0 40px oklch(0.7 0.2 160 / 0.6))",
        }}
      >
        {text}
      </motion.div>
    </div>
  );
}

type TextEffectProps = {
  text: string;
  className: string;
  speed: number;
};

function SpotlightReveal({ text, className, speed }: TextEffectProps) {
  const beams = [
    { rotate: -26, x: "-32%", color: "oklch(0.85 0.16 90 / 0.38)" },
    { rotate: 22, x: "32%", color: "oklch(0.78 0.18 350 / 0.34)" },
    { rotate: 0, x: "0%", color: "oklch(0.7 0.16 240 / 0.28)" },
  ];

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {beams.map((beam, i) => (
        <motion.div
          key={`${beam.rotate}-${i}`}
          className="pointer-events-none absolute top-[-24%] h-[145%] w-28 origin-top rounded-full blur-md"
          style={{
            left: "50%",
            background: `linear-gradient(180deg, ${beam.color}, transparent 76%)`,
            mixBlendMode: "screen",
          }}
          initial={{ x: beam.x, rotate: beam.rotate - 18, opacity: 0 }}
          animate={{
            rotate: [beam.rotate - 18, beam.rotate + 18, beam.rotate - 6],
            opacity: [0, 0.85, 0.55],
          }}
          transition={{ duration: 2.6 / speed, delay: (i * 0.18) / speed, ease: "easeInOut" }}
        />
      ))}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.92, filter: "blur(18px)" }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.2 / speed, delay: 0.35 / speed, ease: [0.16, 1, 0.3, 1] }}
        className={`${className} relative z-10 text-gradient-festive glow-gold`}
      >
        {text}
      </motion.div>
      <motion.div
        className="absolute bottom-12 h-px w-3/4 bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent"
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: [0, 1, 0.6] }}
        transition={{ duration: 1.1 / speed, delay: 0.45 / speed }}
      />
    </div>
  );
}

function CosmicOrbit({ text, className, speed }: TextEffectProps) {
  const orbits = [
    { size: "18rem", color: "#ffd86b", duration: 4.8, delay: 0 },
    { size: "23rem", color: "#6fb8ff", duration: 6.2, delay: 0.18 },
    { size: "28rem", color: "#ff6fb5", duration: 7.5, delay: 0.35 },
  ];

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <FloatingSparkles count={16} />
      {orbits.map((orbit, i) => (
        <motion.div
          key={orbit.size}
          className="pointer-events-none absolute rounded-full border"
          style={{
            width: orbit.size,
            height: orbit.size,
            borderColor: `${orbit.color}55`,
            boxShadow: `0 0 26px ${orbit.color}30`,
          }}
          initial={{ opacity: 0, scale: 0.55, rotate: i * 35 }}
          animate={{ opacity: [0, 0.75, 0.55], scale: 1, rotate: 360 + i * 35 }}
          transition={{
            opacity: { duration: 1.2 / speed, delay: orbit.delay / speed },
            scale: { duration: 1.2 / speed, delay: orbit.delay / speed, ease: "easeOut" },
            rotate: { duration: orbit.duration / speed, repeat: Infinity, ease: "linear" },
          }}
        >
          <span
            className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background: orbit.color,
              boxShadow: `0 0 18px ${orbit.color}, 0 0 42px ${orbit.color}`,
            }}
          />
        </motion.div>
      ))}
      <motion.div
        initial={{ opacity: 0, scale: 0.65, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1 / speed, ease: [0.34, 1.56, 0.64, 1] }}
        className={`${className} relative z-10 text-gradient-festive glow-pink`}
      >
        {text}
      </motion.div>
    </div>
  );
}

function CandleWish({ text, className, speed }: TextEffectProps) {
  const candles = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        id: i,
        height: 40 + (i % 3) * 13,
        color: ["#ff6fb5", "#b46cff", "#6fb8ff", "#ffd86b"][i % 4],
      })),
    [],
  );

  return (
    <div className="relative flex flex-col items-center gap-8">
      <FloatingSparkles count={18} />
      <motion.div
        initial={{ opacity: 0, y: 40, filter: "blur(16px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 1.2 / speed, delay: 0.45 / speed, ease: "easeOut" }}
        className={`${className} shimmer-text font-script !text-5xl md:!text-8xl`}
      >
        {text}
      </motion.div>
      <div className="flex items-end justify-center gap-2 sm:gap-4">
        {candles.map((candle, i) => (
          <motion.div
            key={candle.id}
            className="relative flex flex-col items-center"
            initial={{ y: 90, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7 / speed, delay: (i * 0.08) / speed, ease: "backOut" }}
          >
            <motion.span
              className="mb-1 block h-7 w-4 rounded-full"
              style={{
                background:
                  "radial-gradient(circle at 50% 25%, #fff8dc 0%, #ffd86b 36%, #ff7a00 72%, transparent 74%)",
                filter: "drop-shadow(0 0 12px #ffd86b)",
              }}
              animate={{ scaleY: [1, 1.22, 0.9, 1.12, 1], scaleX: [1, 0.88, 1.08, 0.94, 1] }}
              transition={{ duration: 0.55 / speed, repeat: Infinity, ease: "easeInOut" }}
            />
            <span
              className="block w-5 rounded-t-sm"
              style={{
                height: candle.height,
                background: `linear-gradient(180deg, white 0%, ${candle.color} 18%, ${candle.color} 100%)`,
                boxShadow: `0 0 14px ${candle.color}70`,
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function LaserScan({ text, className, speed }: TextEffectProps) {
  return (
    <div className="relative">
      <motion.div
        className="pointer-events-none absolute -inset-x-10 top-1/2 z-20 h-1 rounded-full bg-cyan-200 shadow-[0_0_24px_#6fb8ff]"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: [-100, 92, -8], opacity: [0, 1, 0.65] }}
        transition={{ duration: 1.25 / speed, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div
        className="pointer-events-none absolute -inset-x-12 top-1/2 z-10 h-24 -translate-y-1/2 bg-gradient-to-b from-transparent via-cyan-300/20 to-transparent blur-xl"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={{ opacity: [0, 1, 0.35], scaleY: [0, 1, 0.6] }}
        transition={{ duration: 1.4 / speed }}
      />
      <div className={`${className} relative z-10 font-mono uppercase text-gradient-festive`}>
        {splitLetters(text).map(({ ch, key }, i) => (
          <motion.span
            key={key}
            initial={{ opacity: 0, x: i % 2 === 0 ? -22 : 22, clipPath: "inset(0 100% 0 0)" }}
            animate={{ opacity: 1, x: 0, clipPath: "inset(0 0% 0 0)" }}
            transition={{ duration: 0.45 / speed, delay: (i * 0.035) / speed }}
            className="inline-block"
            style={{ whiteSpace: ch === " " ? "pre" : undefined }}
          >
            {ch}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function PhotoFlash({ text, className, speed }: TextEffectProps) {
  const frames = [
    { rotate: -10, x: "-34%", y: "12%", delay: 0 },
    { rotate: 8, x: "30%", y: "-14%", delay: 0.14 },
    { rotate: -2, x: "0%", y: "0%", delay: 0.28 },
  ];

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <motion.div
        className="pointer-events-none absolute inset-0 z-30 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.95, 0] }}
        transition={{ duration: 0.45 / speed, delay: 0.25 / speed }}
      />
      {frames.map((frame, i) => (
        <motion.div
          key={`${frame.rotate}-${i}`}
          className="absolute h-32 w-56 rounded-md border border-white/45 bg-white/10 shadow-[0_18px_60px_-18px_rgba(255,255,255,0.6)] backdrop-blur-sm"
          initial={{ opacity: 0, scale: 0.4, rotate: frame.rotate - 18 }}
          animate={{
            opacity: i === 2 ? 0.95 : 0.28,
            scale: i === 2 ? 1.1 : 0.88,
            rotate: frame.rotate,
            x: frame.x,
            y: frame.y,
          }}
          transition={{ duration: 0.65 / speed, delay: frame.delay / speed, ease: "backOut" }}
        />
      ))}
      <motion.div
        initial={{ opacity: 0, scale: 0.86, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7 / speed, delay: 0.45 / speed, ease: [0.16, 1, 0.3, 1] }}
        className={`${className} relative z-20 text-gradient-festive glow-gold`}
      >
        {text}
      </motion.div>
    </div>
  );
}

function SambaBurst({ text, className, speed }: TextEffectProps) {
  const ribbons = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        rotate: Math.random() * 360,
        color: ["#ff6fb5", "#ffd86b", "#6fb8ff", "#b46cff", "#7affc2"][i % 5],
        delay: Math.random() * 0.7,
      })),
    [],
  );

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      {ribbons.map((ribbon) => (
        <motion.span
          key={ribbon.id}
          className="pointer-events-none absolute h-16 w-2 rounded-full"
          style={{
            left: `${ribbon.x}%`,
            top: `${ribbon.y}%`,
            rotate: `${ribbon.rotate}deg`,
            background: ribbon.color,
            boxShadow: `0 0 18px ${ribbon.color}80`,
          }}
          initial={{ opacity: 0, scaleY: 0, y: 80 }}
          animate={{
            opacity: [0, 1, 0],
            scaleY: [0, 1, 0.65],
            y: [-40, 180],
            rotate: ribbon.rotate + 240,
          }}
          transition={{ duration: 2.2 / speed, delay: ribbon.delay / speed, ease: "easeOut" }}
        />
      ))}
      <div className={`${className} relative z-10 text-gradient-festive glow-pink`}>
        {splitLetters(text).map(({ ch, key }, i) => (
          <motion.span
            key={key}
            initial={{ opacity: 0, y: 80, rotate: i % 2 === 0 ? -12 : 12, scale: 0.65 }}
            animate={{
              opacity: 1,
              y: [0, -16, 0],
              rotate: [0, i % 2 === 0 ? 5 : -5, 0],
              scale: [1, 1.08, 1],
            }}
            transition={{
              opacity: { duration: 0.25 / speed, delay: (i * 0.025) / speed },
              y: { duration: 0.55 / speed, delay: (i * 0.035) / speed, repeat: 2 },
              rotate: { duration: 0.55 / speed, delay: (i * 0.035) / speed, repeat: 2 },
              scale: { duration: 0.55 / speed, delay: (i * 0.035) / speed, repeat: 2 },
            }}
            className="inline-block"
            style={{ whiteSpace: ch === " " ? "pre" : undefined }}
          >
            {ch}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
