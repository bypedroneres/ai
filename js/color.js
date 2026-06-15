import { PALETTES } from './constants.js';
import { inverted } from './state.js';

export function lerpColor(c1, c2, t) {
  const r1 = parseInt(c1.slice(1,3),16), g1 = parseInt(c1.slice(3,5),16), b1 = parseInt(c1.slice(5,7),16);
  const r2 = parseInt(c2.slice(1,3),16), g2 = parseInt(c2.slice(3,5),16), b2 = parseInt(c2.slice(5,7),16);
  return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
}

export function getColor(palette, t) {
  const colors = PALETTES[palette].colors;
  const ct = inverted ? 1 - t : t;
  const idx = ct * (colors.length - 1);
  const i = Math.floor(idx);
  const f = idx - i;
  if (i >= colors.length - 1) return colors[colors.length - 1];
  if (i < 0) return colors[0];
  return lerpColor(colors[i], colors[i+1], f);
}

export function getBgColor(palette) {
  const colors = PALETTES[palette].colors;
  return inverted ? colors[colors.length - 1] : colors[0];
}
