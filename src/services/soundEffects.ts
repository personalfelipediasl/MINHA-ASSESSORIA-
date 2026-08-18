let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playBeep(freq = 880, durationMs = 150, type: OscillatorType = 'sine') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000);
  } catch (err) {
    console.debug('Audio not allowed yet:', err);
  }
}

export function playStageAlert() {
  playBeep(660, 100);
  setTimeout(() => playBeep(880, 100), 120);
  setTimeout(() => playBeep(1100, 250), 240);
  triggerVibration([100, 50, 100]);
}

export function playWorkoutFinish() {
  playBeep(523.25, 150); // C5
  setTimeout(() => playBeep(659.25, 150), 160); // E5
  setTimeout(() => playBeep(783.99, 150), 320); // G5
  setTimeout(() => playBeep(1046.5, 400), 480); // C6
  triggerVibration([200, 100, 300]);
}

export function triggerVibration(pattern: number | number[] = 100) {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration errors
    }
  }
}
