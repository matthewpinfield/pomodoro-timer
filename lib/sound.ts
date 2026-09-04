// Synthesized transition chimes via the Web Audio API - no audio assets needed.

export type ChimeKind = "workComplete" | "breakComplete";

let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!sharedContext) {
    sharedContext = new AudioContextClass();
  }
  if (sharedContext.state === "suspended") {
    sharedContext.resume().catch(() => {});
  }
  return sharedContext;
}

function playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number, volume = 0.15) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  // Smooth attack/release envelope so the tone doesn't click
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

// Two distinguishable two-note chimes: a calming descending tone for "time to
// rest" and a brighter ascending tone for "back to work" - so the sound alone
// tells you which transition just happened, not just that one did.
export function playTransitionChime(kind: ChimeKind) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const notes: [number, number] =
    kind === "workComplete"
      ? [784.0, 523.25] // G5 -> C5, descending
      : [523.25, 784.0]; // C5 -> G5, ascending

  playTone(ctx, notes[0], now, 0.35);
  playTone(ctx, notes[1], now + 0.18, 0.4);
}
