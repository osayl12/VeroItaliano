import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from './acts.jsx';

/**
 * Oven embers and flour motes on a canvas (atmosphere plane).
 * followPointer: embers drift toward the cursor / finger (used in the last act).
 * Paused when off screen; a single still frame with reduced motion.
 */
export default function Embers({ count = 42, followPointer = false, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext('2d');
    const reduced = prefersReducedMotion();
    const mobile = window.innerWidth < 820;
    const n = Math.round(mobile ? count * 0.5 : count);
    let w = 0, h = 0, dpr = 1, raf = 0, visible = true, last = 0;
    const pointer = { x: 0.5, y: 0.6, active: false };

    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const rand = (a, b) => a + Math.random() * (b - a);
    const spawn = (p = {}) => Object.assign(p, {
      x: rand(0, 1), y: rand(0.3, 1.1), r: rand(0.6, 2.2),
      vy: rand(0.02, 0.07), vx: rand(-0.01, 0.01), life: rand(0.4, 1), flour: Math.random() < 0.25
    });
    const parts = Array.from({ length: n }, () => spawn());

    const draw = (t) => {
      const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
      last = t;
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        if (!reduced) {
          p.y -= p.vy * dt;
          p.x += (p.vx + Math.sin(t / 900 + p.r * 9) * 0.006) * dt;
          if (followPointer && pointer.active) {
            p.x += (pointer.x - p.x) * 0.25 * dt;
            p.y += (pointer.y - p.y) * 0.15 * dt;
          }
          p.life -= dt * 0.12;
          if (p.y < -0.05 || p.life <= 0) spawn(p), (p.y = 1.05);
        }
        const a = Math.max(0, Math.min(1, p.life)) * (p.flour ? 0.35 : 0.9);
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.flour ? `rgba(251,241,217,${a})` : `rgba(255,${120 + (p.r * 40) | 0},31,${a})`;
        if (!p.flour) { ctx.shadowColor = 'rgba(255,138,31,0.9)'; ctx.shadowBlur = 8; } else ctx.shadowBlur = 0;
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      if (!reduced && visible) raf = requestAnimationFrame(draw);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !reduced) { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
    });
    io.observe(canvas);
    raf = requestAnimationFrame(draw);

    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = (e.clientX - r.left) / r.width;
      pointer.y = (e.clientY - r.top) / r.height;
      pointer.active = true;
    };
    const onLeave = () => (pointer.active = false);
    if (followPointer) {
      canvas.parentElement.addEventListener('pointermove', onMove);
      canvas.parentElement.addEventListener('pointerleave', onLeave);
    }
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
      canvas.parentElement?.removeEventListener('pointermove', onMove);
      canvas.parentElement?.removeEventListener('pointerleave', onLeave);
    };
  }, [count, followPointer]);

  return <canvas ref={ref} className={`embers ${className}`} aria-hidden="true" />;
}
