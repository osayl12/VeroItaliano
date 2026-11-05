import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

/**
 * THE PULL – the page's signature move.
 * Scroll progress p (0 -> 1) inside the act:
 *   0.00–0.15  a knife traces one slice
 *   0.15–0.80  the slice lifts toward you; canvas cheese strands stretch between slice and pie
 *              and snap one by one (a fast flick snaps them early, a slow pull stretches them long)
 *   0.80–1.00  the slice settles (text + button are CSS, driven by --p)
 * Everything is drawn from ONE real photo: the pie, the gap and the lifted slice.
 *
 * geo: where the pizza sits in the photo (fractions of the image). Defaults fit the Margherita photo.
 */
const DEFAULT_GEO = { cx: 0.505, cy: 0.451, rx: 0.318, ry: 0.383, a0: 64, a1: 112 };

const clamp = (v) => Math.min(1, Math.max(0, v));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// strands: which cut edge (0 = first edge, 1 = second, 2 = across the tip), how far from the tip, when it snaps
const STRANDS = [
  { side: 2, t: 0.05, brk: 0.96, w: 7 },
  { side: 2, t: 0.12, brk: 0.84, w: 5.5 },
  { side: 0, t: 0.1, brk: 0.9, w: 6 },
  { side: 1, t: 0.1, brk: 0.78, w: 6 },
  { side: 0, t: 0.24, brk: 0.66, w: 4.5 },
  { side: 1, t: 0.26, brk: 0.72, w: 4.5 },
  { side: 0, t: 0.4, brk: 0.52, w: 3.5 },
  { side: 1, t: 0.42, brk: 0.58, w: 3.5 },
  { side: 0, t: 0.56, brk: 0.44, w: 2.5 },
  { side: 1, t: 0.6, brk: 0.4, w: 2.5 }
];

const ThePull = forwardRef(function ThePull({ src, alt, geo = DEFAULT_GEO, staticProgress }, ref) {
  const canvasRef = useRef(null);
  const state = useRef({ img: null, p: staticProgress ?? 0, fast: 0, w: 0, h: 0, cw: 0, ch: 0, pad: { x: 0, y: 0 } });

  const draw = (p = state.current.p, v = 0) => {
    const s = state.current;
    s.p = p;
    // a quick flick = strands snap earlier (smoothed so it doesn't flicker)
    s.fast = Math.max(0, Math.min(1, s.fast * 0.85 + (Math.abs(v) > 0.012 ? 0.35 : 0)));
    const canvas = canvasRef.current;
    if (!canvas || !s.img) return;
    const ctx = canvas.getContext('2d');
    const W = s.w,
      H = s.h;
    const PAD = s.pad;
    ctx.clearRect(0, 0, s.cw, s.ch);
    ctx.save();
    ctx.translate(PAD.x, PAD.y);
    // photo with rounded corners
    ctx.save();
    const rr = Math.min(W, H) * 0.04;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, rr);
    ctx.clip();
    ctx.drawImage(s.img, 0, 0, W, H);
    ctx.restore();

    const C = [geo.cx * W, geo.cy * H];
    const at = (deg) => {
      const a = (deg * Math.PI) / 180;
      return [(geo.cx + geo.rx * Math.cos(a)) * W, (geo.cy + geo.ry * Math.sin(a)) * H];
    };
    const arc = [];
    for (let i = 0; i <= 14; i++) arc.push(at(geo.a0 + ((geo.a1 - geo.a0) * i) / 14));
    const E0 = arc[0],
      E1 = arc[arc.length - 1];
    const wedge = (c) => {
      c.beginPath();
      c.moveTo(C[0], C[1]);
      arc.forEach(([x, y]) => c.lineTo(x, y));
      c.closePath();
    };

    // 1) knife
    const k = clamp(p / 0.15);
    const e = easeInOut(clamp((p - 0.15) / 0.65));
    if (k > 0 && e < 0.05) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 248, 230, 0.85)';
      ctx.lineWidth = Math.max(1.5, W * 0.003);
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 6;
      for (const E of [E0, E1]) {
        ctx.beginPath();
        ctx.moveTo(C[0], C[1]);
        ctx.lineTo(C[0] + (E[0] - C[0]) * k, C[1] + (E[1] - C[1]) * k);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (e <= 0) return ctx.restore();

    // 2) the gap left in the pie (the wooden board under the slice)
    ctx.save();
    wedge(ctx);
    ctx.clip();
    const g = ctx.createRadialGradient(C[0], C[1], 0, C[0], C[1], geo.ry * H);
    g.addColorStop(0, `rgba(30, 16, 8, ${clamp(e * 4)})`);
    g.addColorStop(1, `rgba(74, 42, 22, ${clamp(e * 4)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // slice transform: lift toward the viewer (down + bigger) with a slight tilt
    const piv = [C[0] + ((E0[0] + E1[0]) / 2 - C[0]) * 0.55, C[1] + ((E0[1] + E1[1]) / 2 - C[1]) * 0.55];
    const dy = e * H * 0.42,
      sc = 1 + 0.16 * e,
      rot = -0.08 * e;
    const T = ([x, y]) => {
      const X = (x - piv[0]) * sc,
        Y = (y - piv[1]) * sc;
      return [piv[0] + X * Math.cos(rot) - Y * Math.sin(rot), piv[1] + dy + X * Math.sin(rot) + Y * Math.cos(rot)];
    };

    // 3) cheese strands between the pie and the lifted slice
    const edgePoint = (side, t) => {
      if (side === 2) {
        const mid = arc[7];
        return [C[0] + (mid[0] - C[0]) * t, C[1] + (mid[1] - C[1]) * t];
      }
      const E = side === 0 ? E0 : E1;
      return [C[0] + (E[0] - C[0]) * t, C[1] + (E[1] - C[1]) * t];
    };
    const snapShift = 0.22 * s.fast;
    for (const st of STRANDS) {
      const A = edgePoint(st.side, st.t);
      const B = T(A);
      const thr = st.brk - snapShift;
      const width = Math.max(3, st.w * (W / 330));
      const bow = (st.side === 0 ? -1 : st.side === 1 ? 1 : st.t > 0.08 ? 0.6 : -0.6) * W * 0.018;
      const cheese = (from, to, sag, wdt, side = 0) => {
        const mx = (from[0] + to[0]) / 2 + side,
          my = (from[1] + to[1]) / 2 + sag * 0.35;
        ctx.lineCap = 'round';
        // blobs where the cheese is still attached
        ctx.fillStyle = '#f0c35a';
        for (const q of [from, to]) {
          ctx.beginPath();
          ctx.ellipse(q[0], q[1], wdt * 1.1, wdt * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(160, 100, 20, 0.35)';
        ctx.lineWidth = wdt + 2;
        ctx.beginPath();
        ctx.moveTo(from[0], from[1]);
        ctx.quadraticCurveTo(mx, my, to[0], to[1]);
        ctx.stroke();
        ctx.strokeStyle = '#f0c35a';
        ctx.lineWidth = wdt;
        ctx.beginPath();
        ctx.moveTo(from[0], from[1]);
        ctx.quadraticCurveTo(mx, my, to[0], to[1]);
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255, 244, 205, 0.9)';
        ctx.lineWidth = Math.max(0.8, wdt * 0.38);
        ctx.beginPath();
        ctx.moveTo(from[0], from[1] - wdt * 0.15);
        ctx.quadraticCurveTo(mx, my - wdt * 0.2, to[0], to[1] - wdt * 0.15);
        ctx.stroke();
      };
      if (e < thr) {
        const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
        const thin = Math.max(width * 0.25, width * (1 - (e / thr) * 0.7));
        cheese(A, B, len * 0.18 + H * 0.01, thin, bow * (0.4 + e));
      } else {
        // snapped: two drooping stubs that shrink back
        const r = Math.max(0, 1 - (e - thr) * 5) * 0.28;
        if (r > 0.01) {
          const stub = (from, to) => [from[0] + (to[0] - from[0]) * r, from[1] + (to[1] - from[1]) * r + H * 0.03 * r];
          cheese(A, stub(A, B), H * 0.01, width * 0.45);
          cheese(B, stub(B, A), H * 0.012, width * 0.45);
        }
      }
    }

    // 4) the lifted slice itself, with a soft shadow on the board
    ctx.save();
    ctx.translate(piv[0], piv[1] + dy);
    ctx.rotate(rot);
    ctx.scale(sc, sc);
    ctx.translate(-piv[0], -piv[1]);
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 40 * e;
    ctx.shadowOffsetY = 26 * e;
    wedge(ctx);
    ctx.fillStyle = '#2b170b';
    ctx.fill();
    ctx.restore();
    wedge(ctx);
    ctx.clip();
    ctx.drawImage(s.img, 0, 0, W, H);
    ctx.restore();
    ctx.restore();
  };

  useImperativeHandle(ref, () => ({ draw }));

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
    const fit = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      // as wide as the stage allows, but the whole canvas (photo + room for the slice) must fit the screen height
      const avail = canvas.parentElement.clientWidth;
      const r = img.naturalWidth ? img.naturalHeight / img.naturalWidth : 0.66;
      const maxH = window.innerHeight - 110;
      const cw = Math.min(avail, maxH / (r * 0.92 * 1.36 + 0.03));
      canvas.style.width = `${cw}px`;
      const pad = { x: cw * 0.04, y: cw * 0.03 };
      const w = cw - pad.x * 2;
      const h = img.naturalWidth ? (w * img.naturalHeight) / img.naturalWidth : w * 0.66;
      const ch = h + pad.y + h * 0.36; // room below for the lifted slice
      canvas.style.height = `${ch}px`;
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
      Object.assign(state.current, { w, h, cw, ch, pad });
      draw();
    };
    img.onload = () => {
      state.current.img = img;
      fit();
    };
    const ro = new ResizeObserver(fit);
    ro.observe(canvas.parentElement);
    return () => ro.disconnect();
    // reload only when the photo changes: draw() reads everything else from the state ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  return <canvas ref={canvasRef} className="pull-canvas" role="img" aria-label={alt} />;
});

export default ThePull;
