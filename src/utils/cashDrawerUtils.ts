/**
 * Cash Drawer Hardware Utility
 * Standard ESC/POS RJ11 cash drawer kick-out pulse
 * Command: ESC p m t1 t2 (27, 112, 0, 25, 250)
 * Pin 2 (m=0), Pulse ON: 25 * 2ms = 50ms, Pulse OFF: 250 * 2ms = 500ms
 */

export const ESC_POS_DRAWER_KICK = String.fromCharCode(27, 112, 0, 25, 250);

/**
 * Play realistic mechanical solenoid / bell tone of physical cash drawer opening
 */
export const playCashDrawerSound = (): void => {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const audioCtx = new AudioCtx();
    const now = audioCtx.currentTime;

    // Dual-tone solenoid pop + bell chime
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    const gain2 = audioCtx.createGain();

    // Solenoid mechanical thud (low freq thump)
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(160, now);
    osc1.frequency.exponentialRampToValueAtTime(45, now + 0.09);
    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    // Mechanical chime / bell ping
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1850, now);
    osc2.frequency.exponentialRampToValueAtTime(1400, now + 0.28);
    gain2.gain.setValueAtTime(0.25, now);
    gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.3);

    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);

    osc1.start(now);
    osc1.stop(now + 0.1);
    osc2.start(now);
    osc2.stop(now + 0.3);
  } catch {
    // Audio context fallback
  }
};

/**
 * Triggers standard ESC/POS RJ11 kick-out command to connected receipt printer / cash drawer
 * @returns boolean indicating command dispatched
 */
export const triggerCashDrawer = (): boolean => {
  try {
    // 1. Dispatch ESC/POS signal to hardware interface / logger
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('escpos-drawer-pulse', {
          detail: {
            command: ESC_POS_DRAWER_KICK,
            bytes: [27, 112, 0, 25, 250],
            timestamp: Date.now(),
          },
        })
      );
    }

    // 2. Audible physical drawer feedback
    playCashDrawerSound();

    return true;
  } catch {
    return false;
  }
};
