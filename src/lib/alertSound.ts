type WindowWithWebkitAudio = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const ALERT_SOUND_VOLUME = 0.8;
const BEEP_GAIN = 0.5;

let context: AudioContext | null = null;
let masterGain: GainNode | null = null;
const activeOscillators = new Set<OscillatorNode>();

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!context) {
    const AudioContextConstructor =
      window.AudioContext ??
      (window as WindowWithWebkitAudio).webkitAudioContext;

    if (!AudioContextConstructor) return null;

    context = new AudioContextConstructor();

    // Compressor menjaga suara tetap tidak pecah saat volume tinggi.
    const compressor = context.createDynamicsCompressor();

    masterGain = context.createGain();
    masterGain.gain.value = ALERT_SOUND_VOLUME;
    masterGain.connect(compressor).connect(context.destination);
  }

  return context;
}

export async function unlockAlertSound(): Promise<void> {
  const audioContext = getAudioContext();

  if (!audioContext || audioContext.state === 'running') return;

  try {
    await audioContext.resume();
  } catch {
    // Browser bisa menolak resume sebelum ada interaksi user.
  }
}

/**
 * Hentikan semua beep yang sedang berbunyi, termasuk nada yang sudah
 * dijadwalkan tetapi belum sempat diputar.
 */
export function stopAlertSound(): void {
  for (const oscillator of activeOscillators) {
    try {
      oscillator.stop();
      oscillator.disconnect();
    } catch {
      // Oscillator mungkin sudah berhenti lebih dulu.
    }
  }

  activeOscillators.clear();
}

/** Satu bip dengan envelope halus supaya tidak ada bunyi "klik". */
function beep(
  audioContext: AudioContext,
  frequency: number,
  startTime: number,
  duration: number,
): void {
  if (!masterGain) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = 'square';
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(BEEP_GAIN, startTime + 0.01);
  gain.gain.setValueAtTime(BEEP_GAIN, startTime + duration - 0.02);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);

  activeOscillators.add(oscillator);
  oscillator.addEventListener('ended', () => {
    activeOscillators.delete(oscillator);
    oscillator.disconnect();
    gain.disconnect();
  });
}

/**
 * Memutar pola suara "Masalah" (prob) dari alert lapangan: tiga pasang beep
 * dua nada, cepat dan tajam. Tidak melakukan apa-apa jika AudioContext belum
 * di-unlock oleh interaksi user (kebijakan autoplay browser).
 */
export function playAlertSound(): void {
  const audioContext = getAudioContext();

  if (!audioContext || audioContext.state !== 'running') return;

  stopAlertSound();

  const startTime = audioContext.currentTime + 0.05;

  for (const delay of [0, 0.28, 0.56]) {
    beep(audioContext, 740, startTime + delay, 0.1);
    beep(audioContext, 990, startTime + delay + 0.1, 0.1);
  }
}
