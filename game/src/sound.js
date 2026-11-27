// Tiny synthesized sounds (Web Audio, no audio files): gobbles, jumps, pickups, hits and
// a little fanfare. The context is created on the first user gesture; M toggles mute.
export function createSound() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (ctx === null) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        ctx = new AudioContext();
      } catch {
        ctx = null;
      }
    }
    if (ctx !== null && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0, slideTo = 0) {
    const audio = ensure();
    if (audio === null || muted) return;
    const t = audio.currentTime + when;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo > 0) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  function gobble() {
    // Three quick low clucks, like a turkey objecting to its fate.
    tone(180, 0.09, 'square', 0.12, 0, 120);
    tone(160, 0.09, 'square', 0.12, 0.11, 110);
    tone(200, 0.12, 'square', 0.12, 0.22, 130);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    click() {
      tone(520, 0.06, 'sine', 0.1);
    },
    jump() {
      tone(280, 0.18, 'sine', 0.14, 0, 620);
    },
    corn() {
      tone(880, 0.08, 'sine', 0.12);
      tone(1318, 0.12, 'sine', 0.12, 0.07);
    },
    pie() {
      tone(659, 0.1, 'sine', 0.12);
      tone(880, 0.1, 'sine', 0.12, 0.09);
      tone(1174, 0.16, 'sine', 0.12, 0.18);
    },
    hit() {
      tone(140, 0.25, 'sawtooth', 0.18, 0, 60);
      gobble();
    },
    stumble() {
      tone(220, 0.15, 'sawtooth', 0.1, 0, 140);
    },
    caught() {
      tone(392, 0.22, 'sawtooth', 0.14, 0, 370);
      tone(311, 0.22, 'sawtooth', 0.14, 0.2, 294);
      tone(233, 0.4, 'sawtooth', 0.14, 0.4, 220);
    },
    escaped() {
      const notes = [523, 659, 784, 1046, 1318];
      notes.forEach((freq, i) => tone(freq, 0.22, 'triangle', 0.14, i * 0.12));
    },
  };
}
