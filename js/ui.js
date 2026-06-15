import { DESKTOP_W, DESKTOP_H, MOBILE_W, MOBILE_H, PALETTES, PATTERNS, PATTERN_LABELS } from './constants.js';
import { currentPattern, currentPalette, seed, setCurrentPattern, setCurrentPalette, setSeed, setInverted } from './state.js';
import { getBgColor } from './color.js';
import { drawPattern } from './patterns.js';

function drawClockOverlay(ctx, w, h, type) {
  const bg = getBgColor(currentPalette);
  const r = parseInt(bg.slice(1,3), 16), g = parseInt(bg.slice(3,5), 16), b = parseInt(bg.slice(5,7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  ctx.fillStyle = brightness > 125 ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.9)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (type === 'desktop') {
    ctx.font = '300 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.fillText('Domingo, 14 de Junho', w / 2, h * 0.22);
    ctx.font = '600 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.fillText('09:41', w / 2, h * 0.30);
  } else if (type === 'mobile') {
    ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.fillText('DOMINGO, 14 DE JUNHO', w / 2, h * 0.16);
    ctx.font = '700 68px -apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto';
    ctx.fillText('09:41', w / 2, h * 0.26);
  }
}

function drawMiniPattern(ctx, w, h, patternIdx) {
  drawPattern(ctx, w, h, patternIdx, 0, 42);
}

function render() {
  const dCtx = document.getElementById('previewDesktop').getContext('2d');
  const mCtx = document.getElementById('previewMobile').getContext('2d');

  drawPattern(dCtx, 960, 540, currentPattern, currentPalette, seed);
  drawPattern(mCtx, 290, 628, currentPattern, currentPalette, seed);

  drawClockOverlay(dCtx, 960, 540, 'desktop');
  drawClockOverlay(mCtx, 290, 628, 'mobile');
}

function exportImage(w, h, filename) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  drawPattern(c.getContext('2d'), w, h, currentPattern, currentPalette, seed);
  c.toBlob(function(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
  }, 'image/png');
}

function buildStyleGrid() {
  const grid = document.getElementById('styleGrid');
  PATTERNS.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'style-btn' + (i === currentPattern ? ' active' : '');
    btn.title = PATTERN_LABELS[i];
    const c = document.createElement('canvas');
    c.width = 80; c.height = 80;
    btn.appendChild(c);
    grid.appendChild(btn);
    drawMiniPattern(c.getContext('2d'), 80, 80, i);
    btn.onclick = () => {
      setCurrentPattern(i);
      grid.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render();
    };
  });
}

function buildPaletteRow() {
  const row = document.getElementById('paletteRow');
  PALETTES.forEach((pal, i) => {
    const swatch = document.createElement('button');
    swatch.className = 'palette-swatch' + (i === currentPalette ? ' active' : '');
    swatch.title = pal.name;
    const show = [pal.colors[0], pal.colors[Math.floor(pal.colors.length/2)], pal.colors[pal.colors.length-1]];
    show.forEach(c => {
      const s = document.createElement('span');
      s.style.background = c;
      swatch.appendChild(s);
    });
    row.appendChild(swatch);
    swatch.onclick = () => {
      setCurrentPalette(i);
      row.querySelectorAll('.palette-swatch').forEach(b => b.classList.remove('active'));
      swatch.classList.add('active');
      render();
    };
  });
}

document.getElementById('modal').addEventListener('click', function(e) {
  if (e.target === this) this.classList.remove('active');
});
document.getElementById('modalClose').addEventListener('click', function() {
  document.getElementById('modal').classList.remove('active');
});

document.getElementById('siteThemeBtn').onclick = () => {
  document.body.classList.toggle('site-dark');
};

document.getElementById('btnShuffle').onclick = () => {
  setSeed(Math.random() * 100000 | 0);
  render();
};

document.getElementById('btnDark').onclick = () => {
  setInverted(false);
  document.getElementById('btnDark').classList.add('active');
  document.getElementById('btnLight').classList.remove('active');
  render();
};

document.getElementById('btnLight').onclick = () => {
  setInverted(true);
  document.getElementById('btnLight').classList.add('active');
  document.getElementById('btnDark').classList.remove('active');
  render();
};

document.getElementById('btnDesktop').onclick = () => {
  exportImage(DESKTOP_W, DESKTOP_H, 'wllpr-desktop-4k.png');
};

document.getElementById('btnMobile').onclick = () => {
  exportImage(MOBILE_W, MOBILE_H, 'wllpr-iphone.png');
};

buildStyleGrid();
buildPaletteRow();
render();
