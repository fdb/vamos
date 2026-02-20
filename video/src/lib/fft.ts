/**
 * Cooley-Tukey radix-2 FFT and helpers for spectrum visualization.
 */

/** In-place radix-2 FFT. Arrays must have power-of-2 length. */
export function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;

  // Bit-reversal permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    while (j & bit) {
      j ^= bit;
      bit >>= 1;
    }
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }

  // Butterfly stages
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const angle = (2 * Math.PI) / len;
    const wRe = Math.cos(angle);
    const wIm = Math.sin(angle);

    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let j = 0; j < half; j++) {
        const a = i + j;
        const b = a + half;
        const tRe = re[b] * curRe - im[b] * curIm;
        const tIm = re[b] * curIm + im[b] * curRe;
        re[b] = re[a] - tRe;
        im[b] = im[a] - tIm;
        re[a] += tRe;
        im[a] += tIm;
        const newRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = newRe;
      }
    }
  }
}

/**
 * Compute magnitude spectrum of two summed sawtooth oscillators.
 *
 * @param fftSize - Window size (power of 2, e.g. 4096)
 * @param fundamentalCycles - Cycles of the base oscillator in the window
 *   (determines bin position: harmonics land at multiples of this value)
 * @param detuneCents - Detune of second oscillator in cents
 * @param numBins - How many frequency bins to return
 * @returns Normalized magnitude array (0–1)
 */
export function detunedSawSpectrum(
  fftSize: number,
  fundamentalCycles: number,
  detuneCents: number,
  numBins: number,
): number[] {
  const re = new Float64Array(fftSize);
  const im = new Float64Array(fftSize);

  const detuneRatio = Math.pow(2, detuneCents / 1200);
  const freq2Cycles = fundamentalCycles * detuneRatio;

  for (let i = 0; i < fftSize; i++) {
    const t1 = (i * fundamentalCycles) / fftSize;
    const t2 = (i * freq2Cycles) / fftSize;
    const saw1 = 2 * (t1 % 1) - 1;
    const saw2 = 2 * (t2 % 1) - 1;

    // Hanning window — reduces spectral leakage between bins
    const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / fftSize));
    re[i] = (saw1 + saw2) * w;
  }

  fft(re, im);

  // Magnitudes for first numBins bins
  const mags: number[] = [];
  let maxMag = 0;
  for (let i = 0; i < numBins; i++) {
    const mag = Math.sqrt(re[i] * re[i] + im[i] * im[i]);
    mags.push(mag);
    if (mag > maxMag) maxMag = mag;
  }

  // Normalize to 0–1
  if (maxMag > 0) {
    for (let i = 0; i < numBins; i++) {
      mags[i] /= maxMag;
    }
  }

  return mags;
}
