/* ============================================================
   AllGoMath - Fourier "winding machine" lab (ES module port).
   Signal components are defined on the FE; the authoritative
   frequency spectrum is injected from the backend DFT via
   setSpectrum(). The winding/COM geometry (com()) remains on
   the FE as illustrative geometry per spec.
   ============================================================ */

const ACC = "#c8ff00";
const DUR = 2;          // signal window, seconds
const NS = 480;         // integration / path samples
const FMIN = 0.5, FMAX = 14;   // winding-frequency sweep range (Hz)

export function createFourierLab(canvas, opts) {
  opts = opts || {};
  const ctx = canvas.getContext("2d");
  let dpr = 1, W = 0, H = 0;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const st = {
    comps: [{ f: 3, a: 1 }, { f: 7, a: 0.5 }],
    windF: 3,
    show: { path: true, com: true },
  };
  let raf = null, alive = false;
  let trace = 0;                 // 0..1 progress of the tracing dot
  let sweeping = false, sweepT0 = 0;
  const SWEEP_MS = 7000;
  // injected spectrum state - empty until setSpectrum is called
  let spec = [], specMax = 0.0001, peaks = [];

  /* ---- maths ---- */
  function g(time) {
    let s = 0;
    for (const c of st.comps) s += c.a * Math.cos(2 * Math.PI * c.f * time);
    return s;
  }
  function maxAmp() {
    let m = 0; for (const c of st.comps) m += Math.abs(c.a);
    return Math.max(0.0001, m);
  }
  // centre of mass of the wound signal at winding frequency f
  // (FE-only illustrative geometry - NOT the authoritative transform)
  function com(f) {
    let rx = 0, ry = 0;
    for (let i = 0; i < NS; i++) {
      const tt = i / NS * DUR, v = g(tt), ang = 2 * Math.PI * f * tt;
      rx += v * Math.cos(ang); ry -= v * Math.sin(ang);
    }
    return [rx / NS, ry / NS];
  }

  /* ---- panels ---- */
  function panelLabel(txt, x, y) {
    ctx.fillStyle = "rgba(255,255,255,.4)";
    ctx.font = "10px 'Space Mono',monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText(txt, x, y);
  }

  function drawTime(x, y, w, h) {
    const cy = y + h / 2, ma = maxAmp(), sc = (h / 2) * 0.86 / ma;
    ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, cy); ctx.lineTo(x + w, cy); ctx.stroke();
    // signal
    ctx.strokeStyle = ACC; ctx.lineWidth = 1.8; ctx.beginPath();
    for (let i = 0; i <= w; i++) {
      const tt = i / w * DUR, py = cy - g(tt) * sc;
      i ? ctx.lineTo(x + i, py) : ctx.moveTo(x + i, py);
    }
    ctx.stroke();
    // scan dot
    const tx = x + trace * w, tt = trace * DUR;
    ctx.strokeStyle = "rgba(200,255,0,.25)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(tx, y + 4); ctx.lineTo(tx, y + h - 4); ctx.stroke();
    ctx.fillStyle = ACC; ctx.beginPath(); ctx.arc(tx, cy - g(tt) * sc, 3.2, 0, Math.PI * 2); ctx.fill();
    panelLabel("TIME DOMAIN  ·  ƒ(t)", x, y - 6);
  }

  function drawWinding(x, y, w, h) {
    const cx = x + w / 2, cy = y + h / 2;
    const R = Math.min(w, h) * 0.5 * 0.84;
    const sc = R / maxAmp();
    // grid: concentric rings + axes
    ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 1;
    for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(cx, cy, R * k / 3, 0, Math.PI * 2); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x + 6, cy); ctx.lineTo(x + w - 6, cy);
    ctx.moveTo(cx, y + 6); ctx.lineTo(cx, y + h - 6); ctx.stroke();
    // wound path
    if (st.show.path) {
      const upto = Math.max(2, Math.floor(trace * NS));
      ctx.lineWidth = 1.4;
      for (let i = 0; i < NS; i++) {
        const tt = i / NS * DUR, v = g(tt), ang = 2 * Math.PI * st.windF * tt;
        const px = cx + sc * v * Math.cos(ang), py = cy - sc * v * Math.sin(ang);
        if (i === 0) { ctx.beginPath(); ctx.moveTo(px, py); }
        else ctx.lineTo(px, py);
        if (i === upto) { // split: traced portion bright, rest faint
          ctx.strokeStyle = ACC; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(px, py);
        }
      }
      ctx.strokeStyle = "rgba(200,255,0,.16)"; ctx.stroke();
      // tracing dot
      const tt = trace * DUR, v = g(tt), ang = 2 * Math.PI * st.windF * tt;
      ctx.fillStyle = ACC;
      ctx.beginPath(); ctx.arc(cx + sc * v * Math.cos(ang), cy - sc * v * Math.sin(ang), 3, 0, Math.PI * 2); ctx.fill();
    }
    // centre of mass (magnified for visibility)
    if (st.show.com) {
      const [rx, ry] = com(st.windF);
      const MAG = 3;
      const mx = cx + sc * rx * MAG, my = cy - sc * ry * MAG;
      ctx.strokeStyle = "rgba(255,255,255,.4)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(mx, my); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(mx, my, 4, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.arc(mx, my, 8, 0, Math.PI * 2); ctx.stroke();
    }
    panelLabel("COMPLEX PLANE  ·  wind " + st.windF.toFixed(2) + " Hz", x, y - 6);
  }

  function drawSpectrum(x, y, w, h) {
    const baseY = y + h - 16, plotH = h - 26;
    ctx.strokeStyle = "rgba(255,255,255,.07)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x + w, baseY); ctx.stroke();
    const fx = f => x + (f - FMIN) / (FMAX - FMIN) * w;
    const my = m => baseY - (m / specMax) * plotH;
    if (spec.length) {
      // curve
      ctx.strokeStyle = ACC; ctx.lineWidth = 1.8; ctx.beginPath();
      spec.forEach((s, i) => { const px = fx(s.f), py = my(s.mag); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); });
      ctx.stroke();
      // fill under curve
      ctx.lineTo(fx(FMAX), baseY); ctx.lineTo(fx(FMIN), baseY); ctx.closePath();
      ctx.fillStyle = "rgba(200,255,0,.08)"; ctx.fill();
      // peak ticks
      ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.font = "9px 'Space Mono',monospace"; ctx.textAlign = "center";
      peaks.forEach(pf => {
        const px = fx(pf);
        ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.moveTo(px, baseY); ctx.lineTo(px, y + 14); ctx.stroke();
        ctx.fillText(pf.toFixed(1), px, y + 11);
      });
    }
    // current winding-frequency marker
    const cxm = fx(Math.max(FMIN, Math.min(FMAX, st.windF)));
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cxm, baseY); ctx.lineTo(cxm, y + 4); ctx.stroke();
    const cur = com(st.windF), curMag = Math.hypot(cur[0], cur[1]);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cxm, my(curMag), 3.2, 0, Math.PI * 2); ctx.fill();
    // axis labels
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.font = "9px 'Space Mono',monospace";
    ctx.textAlign = "left"; ctx.fillText(FMIN + "Hz", x, baseY + 12);
    ctx.textAlign = "right"; ctx.fillText(FMAX + "Hz", x + w, baseY + 12);
    ctx.textAlign = "left";
    panelLabel("FREQUENCY DOMAIN  ·  |transform|", x, y - 6);
  }

  function frame() {
    if (!alive) { raf = requestAnimationFrame(frame); return; }
    ctx.clearRect(0, 0, W, H);
    const pad = 20, gap = 24, labelGap = 22;
    const topH = H * 0.32;
    drawTime(pad, pad + labelGap, W - 2 * pad, topH - labelGap);
    const botY = topH + pad + labelGap + 8;
    const botH = H - botY - pad;
    const halfW = (W - 2 * pad - gap) / 2;
    drawWinding(pad, botY, halfW, botH);
    drawSpectrum(pad + halfW + gap, botY, halfW, botH);

    trace += 0.0032; if (trace >= 1) trace = 0;
    if (sweeping) {
      const p = (performance.now() - sweepT0) / SWEEP_MS;
      if (p >= 1) { sweeping = false; }
      else { st.windF = FMIN + (FMAX - FMIN) * p; }
    }
    if (opts.onStat) {
      const cur = com(st.windF);
      opts.onStat({ windF: st.windF, mag: Math.hypot(cur[0], cur[1]) / specMax, peaks, sweeping });
    }
    raf = requestAnimationFrame(frame);
  }

  resize(); window.addEventListener("resize", resize);
  alive = true; frame();

  function notify() { if (opts.onComps) opts.onComps(st.comps.map(c => ({ ...c }))); }
  function emitEdit() { if (opts.onEdit) opts.onEdit(); }

  // fire initial onComps so the Components panel populates on mount
  notify();

  return {
    comps() { return st.comps.map(c => ({ ...c })); },
    addComp() {
      if (st.comps.length >= 5) return;
      const used = new Set(st.comps.map(c => c.f));
      let f = 2; while (used.has(f) && f < FMAX) f += 1;
      st.comps.push({ f, a: 0.5 }); emitEdit(); notify();
    },
    removeComp(i) {
      if (st.comps.length <= 1) return;
      st.comps.splice(i, 1); emitEdit(); notify();
    },
    setFreq(i, v) { if (st.comps[i]) { st.comps[i].f = v; emitEdit(); } },
    setAmp(i, v) { if (st.comps[i]) { st.comps[i].a = v; emitEdit(); } },
    setWindF(v) { st.windF = v; sweeping = false; },
    sweep() { sweeping = true; sweepT0 = performance.now(); },
    reset() { st.comps = [{ f: 3, a: 1 }, { f: 7, a: 0.5 }]; st.windF = 3; sweeping = false; emitEdit(); notify(); },
    setToggle(k, v) { st.show[k] = !!v; },
    range() { return { FMIN, FMAX }; },
    getSignal() {
      const signal = new Array(NS);
      for (let i = 0; i < NS; i++) signal[i] = g(i / NS * DUR);
      return { signal, sampleRate: NS / DUR }; // sampleRate = 240
    },
    setSpectrum(spectrum, pks) {
      spec = (spectrum || []).filter(b => b.freq >= FMIN && b.freq <= FMAX).map(b => ({ f: b.freq, mag: b.mag }));
      specMax = 0.0001; for (const s of spec) if (s.mag > specMax) specMax = s.mag;
      peaks = (pks || []).filter(p => p >= FMIN && p <= FMAX);
    },
    dispose() { alive = false; if (raf) cancelAnimationFrame(raf); window.removeEventListener('resize', resize); },
  };
}
