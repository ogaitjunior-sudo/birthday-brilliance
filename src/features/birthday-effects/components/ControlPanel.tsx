import { motion } from "framer-motion";
import { EFFECTS, EFFECT_IDS } from "@/features/birthday-effects/effects-list";
import type { EffectId } from "@/features/birthday-effects/effects";

interface Props {
  current: EffectId | null;
  onSelect: (id: EffectId) => void;
  onReplay: () => void;
  onClear: () => void;
  onRandom: () => void;
  onRunAll: () => void;
  onDownloadVideo: (id: EffectId) => void;
  isRunningAll: boolean;
  isRecordingVideo: boolean;
  name: string;
  setName: (n: string) => void;
  speed: number;
  setSpeed: (n: number) => void;
}

export function ControlPanel({
  current,
  onSelect,
  onReplay,
  onClear,
  onRandom,
  onRunAll,
  onDownloadVideo,
  isRunningAll,
  isRecordingVideo,
  name,
  setName,
  speed,
  setSpeed,
}: Props) {
  const isBusy = isRunningAll || isRecordingVideo;

  return (
    <div className="space-y-5">
      {/* options bar */}
      <div className="glass-strong flex flex-wrap items-center gap-3 rounded-2xl p-3 sm:p-4">
        <div className="flex flex-1 min-w-[200px] items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Opcional, ex: Maria"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-[var(--pink)] focus:outline-none"
            maxLength={28}
          />
        </div>

        <div className="rounded-lg border border-[var(--gold)]/20 bg-[var(--gold)]/10 px-3 py-2 text-xs font-semibold uppercase tracking-widest text-[var(--gold)]">
          Happy Birthday → Feliz Aniversário
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            Velocidade
          </span>
          <input
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="h-1 w-24 cursor-pointer accent-[var(--pink)]"
          />
          <span className="w-10 text-right text-xs tabular-nums text-foreground/80">
            {speed.toFixed(1)}x
          </span>
        </div>
      </div>

      {/* primary actions */}
      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={onReplay} disabled={!current || isBusy}>
          ↻ Replay
        </ActionButton>
        <ActionButton onClick={onRandom} disabled={isBusy}>
          🎲 Aleatório
        </ActionButton>
        <ActionButton onClick={onRunAll} disabled={isBusy} variant="primary">
          {isRunningAll ? "▶ Tocando todos…" : "▶ Rodar todos"}
        </ActionButton>
        <ActionButton
          onClick={() => {
            if (current) onDownloadVideo(current);
          }}
          disabled={!current || isBusy}
        >
          {isRecordingVideo ? "● Gravando…" : "⬇ Baixar MP4"}
        </ActionButton>
        <ActionButton onClick={onClear} disabled={!current || isBusy}>
          ✕ Limpar
        </ActionButton>
      </div>

      {/* effect grid */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {EFFECTS.map((e, idx) => {
          const active = e.id === current;
          return (
            <motion.div
              key={e.id}
              whileHover={{ y: -2 }}
              className={`group relative overflow-hidden rounded-xl border p-3 text-left transition ${
                active
                  ? "border-[var(--pink)]/60 bg-gradient-to-br from-[var(--pink)]/25 via-[var(--purple)]/20 to-transparent shadow-[0_0_30px_-5px_var(--pink)]"
                  : "border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
              } ${isBusy ? "opacity-50" : ""}`}
            >
              <button
                type="button"
                onClick={() => onSelect(e.id)}
                disabled={isBusy}
                className="block min-h-[112px] w-full pb-10 text-left disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{e.icon}</span>
                  <span className="font-mono text-[10px] text-muted-foreground/60">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="mt-2 text-sm font-semibold text-foreground">{e.label}</div>
                <div className="text-xs text-muted-foreground line-clamp-1">{e.description}</div>
              </button>
              <button
                type="button"
                onClick={() => onDownloadVideo(e.id)}
                disabled={isBusy}
                title={`Baixar ${e.label} em MP4`}
                className="absolute bottom-4 right-4 rounded-full border border-[var(--gold)]/20 bg-black/35 px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--gold)] shadow-[0_0_18px_-8px_var(--gold)] transition hover:border-[var(--gold)]/60 hover:bg-[var(--gold)]/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                MP4
              </button>
              <span
                className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--gold)] to-transparent transition-opacity ${
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                }`}
              />
            </motion.div>
          );
        })}
      </div>

      <p className="text-center text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
        {EFFECT_IDS.length} efeitos · feitos com carinho
      </p>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  variant = "ghost",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "ghost" | "primary";
}) {
  const base =
    "rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-gradient-to-r from-[var(--pink)] via-[var(--purple)] to-[var(--blue)] text-white shadow-[0_8px_30px_-10px_var(--pink)] hover:brightness-110"
      : "glass text-foreground hover:bg-white/10";
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}
