import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AmbientBackground } from "@/features/birthday-effects/components/AmbientBackground";
import { ControlPanel } from "@/features/birthday-effects/components/ControlPanel";
import { EffectStage } from "@/features/birthday-effects/components/EffectStage";
import { EFFECTS, EFFECT_IDS } from "@/features/birthday-effects/effects-list";
import type { EffectId } from "@/features/birthday-effects/effects";

const VIDEO_MIME_TYPES = [
  'video/mp4;codecs="avc1.42E01E"',
  "video/mp4;codecs=h264",
  "video/mp4",
  "video/webm;codecs=vp9",
  "video/webm;codecs=vp8",
  "video/webm",
];

type DisplayCaptureOptions = DisplayMediaStreamOptions & {
  preferCurrentTab?: boolean;
  selfBrowserSurface?: "include" | "exclude";
};

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const EFFECT_SEQUENCE_PLAY_TIME = 7200;
const VIDEO_SEQUENCE_RECORDING_TIME = 8600;

function getSupportedVideoMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  return VIDEO_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function getVideoExtension(mimeType: string) {
  return mimeType.includes("mp4") ? "mp4" : "webm";
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createVideoFileName(effectId: EffectId, mimeType: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `birthday-brilliance-${effectId}-${timestamp}.${getVideoExtension(mimeType)}`;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Birthday Brilliance — Happy Birthday e Feliz Aniversário" },
      {
        name: "description",
        content: `Galeria interativa com ${EFFECTS.length} efeitos animados em sequência: Happy Birthday e Feliz Aniversário.`,
      },
      { property: "og:title", content: "Birthday Brilliance" },
      {
        property: "og:description",
        content: `${EFFECTS.length} animações cinematográficas para Happy Birthday e Feliz Aniversário.`,
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Great+Vibes&family=Inter:wght@400;500;600&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [current, setCurrent] = useState<EffectId | null>(null);
  const [runId, setRunId] = useState(0);
  const [name, setName] = useState("");
  const [speed, setSpeed] = useState(1);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const runAllAbort = useRef(false);

  const play = useCallback((id: EffectId) => {
    setCurrent(id);
    setRunId((r) => r + 1);
  }, []);

  const handleReplay = () => {
    if (current) setRunId((r) => r + 1);
  };

  const handleRandom = () => {
    const next = EFFECT_IDS[Math.floor(Math.random() * EFFECT_IDS.length)];
    play(next);
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    runAllAbort.current = false;
    for (const id of EFFECT_IDS) {
      if (runAllAbort.current) break;
      play(id);
      await new Promise((r) => setTimeout(r, EFFECT_SEQUENCE_PLAY_TIME / speed));
    }
    setIsRunningAll(false);
  };

  const handleClear = () => {
    runAllAbort.current = true;
    setCurrent(null);
  };

  const handleDownloadVideo = async (effectToRecord: EffectId) => {
    if (isRecordingVideo) return;

    if (!navigator.mediaDevices?.getDisplayMedia || typeof MediaRecorder === "undefined") {
      window.alert("Este navegador não suporta gravação de vídeo da aba.");
      return;
    }

    const selectedMimeType = getSupportedVideoMimeType();
    const captureOptions: DisplayCaptureOptions = {
      audio: false,
      preferCurrentTab: true,
      selfBrowserSurface: "include",
      video: {
        frameRate: { ideal: 30, max: 30 },
        height: { ideal: 1080 },
        width: { ideal: 1920 },
      },
    };

    let stream: MediaStream | null = null;

    try {
      runAllAbort.current = true;
      flushSync(() => {
        setCurrent(effectToRecord);
        setRunId((r) => r + 1);
        setIsRecordingVideo(true);
      });
      stream = await navigator.mediaDevices.getDisplayMedia(captureOptions);

      const recorder = new MediaRecorder(
        stream,
        selectedMimeType ? { mimeType: selectedMimeType } : undefined,
      );
      const chunks: BlobPart[] = [];
      const recording = new Promise<Blob>((resolve, reject) => {
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data);
        };
        recorder.onerror = () => reject(new Error("Não foi possível gravar o vídeo."));
        recorder.onstop = () => {
          const mimeType = selectedMimeType || recorder.mimeType || "video/webm";
          resolve(new Blob(chunks, { type: mimeType }));
        };
      });

      const videoTrack = stream.getVideoTracks()[0];
      const stoppedByUser = new Promise<void>((resolve) => {
        videoTrack?.addEventListener("ended", () => resolve(), { once: true });
      });
      const stopRecorder = () => {
        if (recorder.state !== "inactive") recorder.stop();
      };

      await wait(350);
      recorder.start(100);
      await wait(180);
      play(effectToRecord);
      await Promise.race([
        wait(Math.max(VIDEO_SEQUENCE_RECORDING_TIME, VIDEO_SEQUENCE_RECORDING_TIME / speed)),
        stoppedByUser,
      ]);
      stopRecorder();

      const blob = await recording;
      if (!blob.size) {
        window.alert("A gravação terminou sem dados. Tente selecionar a aba do projeto.");
        return;
      }

      downloadBlob(blob, createVideoFileName(effectToRecord, blob.type || selectedMimeType));
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") return;
      console.error(error);
      window.alert("Não consegui gerar o vídeo. Tente novamente selecionando esta aba.");
    } finally {
      stream?.getTracks().forEach((track) => track.stop());
      setIsRecordingVideo(false);
    }
  };

  useEffect(
    () => () => {
      runAllAbort.current = true;
    },
    [],
  );

  const currentMeta = current ? EFFECTS.find((e) => e.id === current) : null;

  return (
    <main
      className={`relative flex min-h-screen flex-col ${
        isRecordingVideo ? "bg-white text-slate-950" : ""
      }`}
    >
      {!isRecordingVideo && <AmbientBackground />}

      {/* Header */}
      {!isRecordingVideo && (
        <header className="px-6 pt-8 text-center sm:pt-12">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--gold)]/80">
            ✦ ✦ ✦ Vitrine Interativa ✦ ✦ ✦
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-gradient-festive sm:text-5xl md:text-6xl">
            Birthday Brilliance
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Clique em um efeito para animar <span className="text-foreground">Happy Birthday</span>{" "}
            e depois <span className="text-foreground">Feliz Aniversário</span>.
          </p>
        </header>
      )}

      {/* Stage */}
      <section
        className={
          isRecordingVideo
            ? "fixed inset-0 z-50 m-0 bg-white text-slate-950"
            : "relative mx-4 mt-8 flex-1 sm:mx-8"
        }
      >
        <div
          className={
            isRecordingVideo
              ? "relative h-screen w-screen overflow-hidden bg-white"
              : "glass-strong relative h-[42vh] min-h-[320px] w-full overflow-hidden rounded-3xl shadow-[var(--shadow-elegant)] sm:h-[48vh]"
          }
        >
          <EffectStage
            key={`${current ?? "empty"}-${runId}`}
            effect={current}
            runId={runId}
            speed={speed}
            name={name}
            onClear={handleClear}
            isExportingVideo={isRecordingVideo}
          />
          {currentMeta && !isRecordingVideo && (
            <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/40 px-4 py-1 backdrop-blur">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--gold)]">
                {currentMeta.icon} {currentMeta.label}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Controls */}
      {!isRecordingVideo && (
        <section className="mx-4 my-8 sm:mx-8">
          <ControlPanel
            current={current}
            onSelect={play}
            onReplay={handleReplay}
            onClear={handleClear}
            onRandom={handleRandom}
            onRunAll={handleRunAll}
            onDownloadVideo={handleDownloadVideo}
            isRunningAll={isRunningAll}
            isRecordingVideo={isRecordingVideo}
            name={name}
            setName={setName}
            speed={speed}
            setSpeed={setSpeed}
          />
        </section>
      )}

      {!isRecordingVideo && (
        <footer className="pb-6 text-center text-xs text-muted-foreground/60">
          Feito com brilho · 🎂 · ✨
        </footer>
      )}
    </main>
  );
}
