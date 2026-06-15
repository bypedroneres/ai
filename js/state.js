export let currentPattern = 0;
export let currentPalette = 0;
export let seed = Math.random() * 10000 | 0;
export let inverted = false;

export function setCurrentPattern(p) { currentPattern = p; }
export function setCurrentPalette(p) { currentPalette = p; }
export function setSeed(s) { seed = s; }
export function setInverted(v) { inverted = v; }
