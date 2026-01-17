export type ToastTone = "success" | "error" | "info";

interface WindowWithWebkit extends Window {
  webkitAudioContext: typeof AudioContext;
}

export const playToastSound = (tone: ToastTone = "success") => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as WindowWithWebkit).webkitAudioContext;
    const audioContext = new AudioContextClass();
    const now = audioContext.currentTime;

    if (tone === "success") {
      // Quirky "pop-bloop" sound
      const osc1 = audioContext.createOscillator();
      const osc2 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      const gain2 = audioContext.createGain();

      osc1.connect(gain1);
      osc2.connect(gain2);
      gain1.connect(audioContext.destination);
      gain2.connect(audioContext.destination);

      // First pop
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

      // Second bloop
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(600, now + 0.07);
      osc2.frequency.exponentialRampToValueAtTime(900, now + 0.12);
      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.1, now + 0.07);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc1.start(now);
      osc1.stop(now + 0.1);
      osc2.start(now + 0.07);
      osc2.stop(now + 0.18);

    } else if (tone === "error") {
      // Quirky "bonk" sound
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

      osc.start(now);
      osc.stop(now + 0.18);

    } else {
      // Quirky "blip" for info
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();

      osc.connect(gain);
      gain.connect(audioContext.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(700, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.06);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.start(now);
      osc.stop(now + 0.15);
    }
  } catch {
    // Silently fail if audio is not available
  }
};
