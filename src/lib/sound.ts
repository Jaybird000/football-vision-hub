// Subtle WebAudio click for CTA hover/press. Optional, respects reduced-motion.
let ctx: AudioContext | null = null;
function getCtx() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)(); } catch { return null; }
  }
  return ctx;
}

export function tick(volume = 0.04, freq = 880) {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  const a = getCtx();
  if (!a) return;
  const t = a.currentTime;
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(volume, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
  osc.connect(gain).connect(a.destination);
  osc.start(t);
  osc.stop(t + 0.1);
}

export const ctaSoundProps = {
  onMouseEnter: () => tick(0.025, 1320),
  onClick: () => tick(0.05, 660),
};
