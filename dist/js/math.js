import { seed } from './state.js';

export function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

export function noise(x) {
  const ix = Math.floor(x);
  const fx = x - ix;
  const t = fx * fx * (3 - 2 * fx);
  const seedA = Math.sin(ix * 127.1 + seed * 0.01) * 43758.5453;
  const seedB = Math.sin((ix + 1) * 127.1 + seed * 0.01) * 43758.5453;
  const a = seedA - Math.floor(seedA);
  const b = seedB - Math.floor(seedB);
  return a + (b - a) * t;
}

export function fbm(x, octaves = 4) {
  let val = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise(x * freq);
    amp *= 0.5;
    freq *= 2.1;
  }
  return val;
}
