import { useEffect, useRef } from "react";

export function AmbientBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
    };
    resize();
    window.addEventListener("resize", resize);

    type P = { x: number; y: number; r: number; vy: number; vx: number; a: number; hue: number };
    const particles: P[] = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: (Math.random() * 2 + 0.4) * dpr,
      vy: -(Math.random() * 0.3 + 0.05) * dpr,
      vx: (Math.random() - 0.5) * 0.15 * dpr,
      a: Math.random() * 0.6 + 0.2,
      hue: [330, 290, 250, 50][Math.floor(Math.random() * 4)],
    }));

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const p of particles) {
        p.y += p.vy;
        p.x += p.vx;
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 8);
        grd.addColorStop(0, `hsla(${p.hue}, 90%, 70%, ${p.a})`);
        grd.addColorStop(1, `hsla(${p.hue}, 90%, 70%, 0)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 8, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-20" aria-hidden>
        <div className="absolute -top-40 -left-40 h-[60vh] w-[60vh] rounded-full bg-[var(--purple)] opacity-30 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[60vh] w-[60vh] rounded-full bg-[var(--pink)] opacity-30 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 h-[40vh] w-[40vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--blue)] opacity-20 blur-[140px]" />
      </div>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 -z-10" aria-hidden />
    </>
  );
}
