// ── Playhaus Haptics Bridge Utility ──
// Integrates smooth TestFlight tactile haptic feedback with browser vibration fallbacks.

/**
 * Triggers a tactile haptic impact on mobile devices.
 * Supports Capacitor native iOS/Android Haptics and standard Web Vibration API.
 * @param {string} style - 'light', 'medium', or 'heavy'
 */
export async function triggerHaptic(style = 'medium') {
  // 1. Try Native Capacitor Haptic Feedback Plugin if running inside mobile wrapper
  if (window.Capacitor && window.Capacitor.isPluginAvailable('Haptics')) {
    try {
      const { Haptics, ImpactStyle } = window.Capacitor.Plugins;
      let capStyle;
      
      switch (style) {
        case 'light':
          capStyle = ImpactStyle.Light;
          break;
        case 'heavy':
          capStyle = ImpactStyle.Heavy;
          break;
        case 'medium':
        default:
          capStyle = ImpactStyle.Medium;
          break;
      }
      
      await Haptics.impact({ style: capStyle });
      console.log(`[Haptics] Triggered native haptic: ${style}`);
      return;
    } catch (err) {
      console.warn("[Haptics] Capacitor haptic trigger failed. Falling back to web vibration:", err);
    }
  }
  
  // 2. Try HTML5 Web Vibration API as web/mobile browser fallback
  if ('vibrate' in navigator) {
    try {
      let duration;
      switch (style) {
        case 'light':
          duration = 18; // Short, sharp tap
          break;
        case 'heavy':
          duration = 90; // Solid, heavy kick
          break;
        case 'medium':
        default:
          duration = 40; // Balanced click
          break;
      }
      navigator.vibrate(duration);
      console.log(`[Haptics] Triggered web fallback vibration: ${duration}ms`);
    } catch (vibrateErr) {
      console.warn("[Haptics] Web vibration failed:", vibrateErr);
    }
  } else {
    // Console log fallback for desktop developers
    console.log(`[Haptics Dev] Vibration scale triggered: ${style.toUpperCase()}`);
  }
}

// ── Web Audio API Retro Sound Effects Synthesizer ──
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Plays a synthesized retro arcade sound effect.
 * @param {string} type - 'click', 'equip', 'unlock', 'success', 'error', 'coin'
 */
export function playSound(type) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime;

    switch (type) {
      case 'click':
        // Short high-pitched beep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1500, now + 0.08);
        gainNode.gain.setValueAtTime(0.04, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;
      
      case 'equip':
        // High double-beep
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(900, now + 0.06);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.setValueAtTime(0.05, now + 0.06);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      
      case 'unlock':
        // Classic rising powerup chord
        osc.type = 'square';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(500, now + 0.15);
        osc.frequency.exponentialRampToValueAtTime(1000, now + 0.3);
        gainNode.gain.setValueAtTime(0.02, now);
        gainNode.gain.exponentialRampToValueAtTime(0.02, now + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'success':
        // Cheerful major chord arpeggio
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        gainNode.gain.setValueAtTime(0.03, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;

      case 'error':
        // Dissatisfying low buzz
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.22);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.linearRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
        break;
        
      case 'coin':
        // Retro coin sound (ping)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(987.77, now); // B5
        osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6
        gainNode.gain.setValueAtTime(0.03, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;

      case 'laser':
        // Cool retro arcade laser zap
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        gainNode.gain.setValueAtTime(0.04, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;
      
      case 'powerup':
        // Retro arcade rising powerup
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.35);
        
        // Secondary frequency layer for warmth
        const oscPower = ctx.createOscillator();
        const gainPower = ctx.createGain();
        oscPower.type = 'sine';
        oscPower.frequency.setValueAtTime(300, now);
        oscPower.frequency.exponentialRampToValueAtTime(1200, now + 0.35);
        oscPower.connect(gainPower);
        gainPower.connect(ctx.destination);
        gainPower.gain.setValueAtTime(0.02, now);
        gainPower.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        oscPower.start(now);
        oscPower.stop(now + 0.35);
        
        gainNode.gain.setValueAtTime(0.03, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;

      case 'upgrade':
        // Retro arcade rising sci-fi upgrade chirp
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.setValueAtTime(554.37, now + 0.05); // C#5
        osc.frequency.setValueAtTime(659.25, now + 0.1);  // E5
        osc.frequency.setValueAtTime(880, now + 0.15);     // A5
        osc.frequency.setValueAtTime(1108.73, now + 0.2);  // C#6
        gainNode.gain.setValueAtTime(0.03, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'gacha_reveal':
        // Crunchy, high-energy arcade fanfare for legendary/epic unlocks
        osc.type = 'square';
        osc.frequency.setValueAtTime(392.00, now); // G4
        osc.frequency.setValueAtTime(523.25, now + 0.06); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.12); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.18); // G5
        osc.frequency.setValueAtTime(1046.50, now + 0.24); // C6
        osc.frequency.setValueAtTime(1318.51, now + 0.3); // E6
        gainNode.gain.setValueAtTime(0.02, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
        break;
    }
  } catch (err) {
    console.warn("[Sound Manager] AudioContext failed to initialize or trigger:", err);
  }
}
