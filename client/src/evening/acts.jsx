import { createContext, useContext, useEffect, useRef, useState } from 'react';

/**
 * Tiny scroll driver: one rAF loop for the whole page.
 * Every <Act> is a tall section with a sticky 100vh "stage". While the section scrolls past,
 * its progress p (0 -> 1) is written to the CSS variable --p and passed to onProgress(p, velocity).
 * CSS reads --p (transform / opacity / clip-path only); canvases use onProgress.
 */
const Ctx = createContext(null);

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function ActsProvider({ children }) {
  const acts = useRef(new Set());
  const raf = useRef(0);
  const [reduced] = useState(prefersReducedMotion);

  const tick = () => {
    raf.current = 0;
    const vh = window.innerHeight;
    for (const a of acts.current) {
      const r = a.el.getBoundingClientRect();
      const total = Math.max(1, a.el.offsetHeight - vh);
      const p = a.reducedValue ?? Math.min(1, Math.max(0, -r.top / total));
      if (a.first || Math.abs(p - a.p) > 0.0004) {
        const v = a.first ? 0 : p - a.p;
        a.first = false;
        a.p = p;
        a.el.style.setProperty('--p', p.toFixed(4));
        a.onProgress?.current?.(p, v);
      }
    }
  };
  const request = () => {
    if (!raf.current) raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    request();
    return () => {
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      cancelAnimationFrame(raf.current);
      raf.current = 0; // must reset, or request() thinks a frame is still pending and never runs again
    };
    // subscribe once: request/tick only read refs, so a newer copy of them would behave the same
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const api = {
    reduced,
    register(a) {
      a.first = true;
      a.p = 0;
      acts.current.add(a);
      request();
      return () => acts.current.delete(a);
    },
    request
  };
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export const useActs = () => useContext(Ctx);

/**
 * span = height in viewport-heights. stage = sticky 100vh frame inside.
 * reducedValue: the progress shown when the visitor prefers reduced motion (a finished, static frame).
 */
export function Act({ id, span = 1, className = '', label, onProgress, reducedValue = 1, children, ...rest }) {
  const ref = useRef(null);
  const cb = useRef(onProgress);
  cb.current = onProgress;
  const ctx = useActs();

  useEffect(() => {
    if (!ref.current) return;
    return ctx.register({ el: ref.current, onProgress: cb, reducedValue: ctx.reduced ? reducedValue : undefined });
  }, [ctx, reducedValue]);

  const height = ctx.reduced ? 'auto' : `${span * 100}vh`;
  return (
    <section
      id={id}
      ref={ref}
      className={`act act-${id} ${ctx.reduced ? 'is-static' : ''} ${className}`}
      style={{ height }}
      aria-label={label}
      {...rest}
    >
      <div className="act-stage">{children}</div>
    </section>
  );
}
