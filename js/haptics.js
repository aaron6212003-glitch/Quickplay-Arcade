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
    console.log(`[Haptics Sandbox] Vibration scale triggered: ${style.toUpperCase()}`);
  }
}
