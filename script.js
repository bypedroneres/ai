const DESKTOP_W = 3840, DESKTOP_H = 2160;
const MOBILE_W = 1290, MOBILE_H = 2796;

const PALETTES = [
  { name: 'Charcoal', colors: ['#000000','#141414','#2a2a2a','#404040','#595959','#737373','#8c8c8c','#b3b3b3','#d9d9d9','#ffffff'] },
  { name: 'Stone',    colors: ['#1a1714','#2c2825','#3e3a35','#534e47','#6b655c','#857d72','#9f9688','#b8b0a3','#d1c9bd','#ece6dc'] },
  { name: 'Blue',     colors: ['#01052b','#04137a','#0825c7','#0d39ff','#1552ff','#2f73ff','#58a3ff','#7dc3ff','#aedfff','#edf8ff'] },
  { name: 'Sunrise',  colors: ['#031c35','#05284a','#063862','#0b4b7a','#ff5b40','#ff7240','#ff9438','#ffb33f','#ffd064','#fff0c8'] },
  { name: 'Fire',     colors: ['#1a0000','#450000','#7a0000','#b30000','#e63900','#ff6a00','#ff9500','#ffb700','#ffd166','#fff1c2'] },
  { name: 'Purple',   colors: ['#100014','#22002e','#3f005a','#5c0085','#7a00b3','#9b1fff','#b84dff','#cf88ff','#e4c2ff','#f7ebff'] },
];

const PATTERNS = ['flowing-hills', 'smooth-wave', 'sand-dunes', 'mountains', 'concentric-arcs', 'desert-dunes'];
const PATTERN_LABELS = ['Colinas', 'Onda', 'Dunas', 'Montanhas', 'Arcos', 'Deserto'];

let currentPattern = 0;
let currentPalette = 0;
let seed = Math.random() * 10000 | 0;
let inverted = false;

function mulberry32(a) {
  return function() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function noise(x) {
  const ix = Math.floor(x);
  const fx = x - ix;
  const t = fx * fx * (3 - 2 * fx);
  const seedA = Math.sin(ix * 127.1 + seed * 0.01) * 43758.5453;
  const seedB = Math.sin((ix + 1) * 127.1 + seed * 0.01) * 43758.5453;
  const a = seedA - Math.floor(seedA);
  const b = seedB - Math.floor(seedB);
  return a + (b - a) * t;
}

function fbm(x, octaves = 4) {
  let val = 0, amp = 0.5, freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * noise(x * freq);
    amp *= 0.5;
    freq *= 2.1;
  }
  return val;
}

function lerpColor(c1, c2, t) {
  const r1 = parseInt(c1.slice(1,3),16), g1 = parseInt(c1.slice(3,5),16), b1 = parseInt(c1.slice(5,7),16);
  const r2 = parseInt(c2.slice(1,3),16), g2 = parseInt(c2.slice(3,5),16), b2 = parseInt(c2.slice(5,7),16);
  return `rgb(${Math.round(r1+(r2-r1)*t)},${Math.round(g1+(g2-g1)*t)},${Math.round(b1+(b2-b1)*t)})`;
}

function getColor(palette, t) {
  const colors = PALETTES[palette].colors;
  const ct = inverted ? 1 - t : t;
  const idx = ct * (colors.length - 1);
  const i = Math.floor(idx);
  const f = idx - i;
  if (i >= colors.length - 1) return colors[colors.length - 1];
  if (i < 0) return colors[0];
  return lerpColor(colors[i], colors[i+1], f);
}

function getBgColor(palette) {
  const colors = PALETTES[palette].colors;
  return inverted ? colors[colors.length - 1] : colors[0];
}

function drawPattern(ctx, w, h, pattern, palette, s) {
  seed = s;
  const rng = mulberry32(s);
  ctx.fillStyle = getBgColor(palette);
  ctx.fillRect(0, 0, w, h);

  switch(PATTERNS[pattern]) {
    case 'flowing-hills':  drawFlowingHills(ctx, w, h, palette, rng); break;
    case 'smooth-wave':    drawSmoothWave(ctx, w, h, palette, rng); break;
    case 'sand-dunes':     drawSandDunes(ctx, w, h, palette, rng); break;
    case 'mountains':      drawMountains(ctx, w, h, palette, rng); break;
    case 'concentric-arcs':drawConcentricArcs(ctx, w, h, palette, rng); break;
    case 'desert-dunes':   drawDesertDunes(ctx, w, h, palette, rng); break;
  }
}

// 1. FUNÇÃO AUXILIAR: Desenha a silhueta detalhada de um pinheiro
function drawPineTree(ctx, x, bottomY, width, height, rng) {
  ctx.save();
  
  // Desenha o tronco escondido na base
  ctx.beginPath();
  ctx.moveTo(x - width * 0.1, bottomY);
  ctx.lineTo(x - width * 0.1, bottomY - height * 0.2);
  ctx.lineTo(x + width * 0.1, bottomY - height * 0.2);
  ctx.lineTo(x + width * 0.1, bottomY);
  ctx.fill();

  // Desenha as camadas de folhagem (sobreposição de triângulos recortados)
  const segments = 4;
  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1); // 0 no topo, 1 na base
    
    // Calcula os pontos de cada saia do pinheiro
    const segHeight = height * 0.85;
    const topY = bottomY - height + (segHeight * t * 0.5);
    const currBottomY = bottomY - height + (segHeight * (t + 0.25));
    const currWidth = width * (0.3 + t * 0.7);

    ctx.beginPath();
    ctx.moveTo(x, topY); // Ponta do segmento
    
    // Lado esquerdo com leve imperfeição orgânica
    ctx.lineTo(x - currWidth / 2 - (rng() * 2), currBottomY); 
    // Lado direito com leve imperfeição orgânica
    ctx.lineTo(x + currWidth / 2 + (rng() * 2), currBottomY); 
    
    ctx.closePath();
    ctx.fill();
  }
  
  ctx.restore();
}

// 1. FUNÇÃO AUXILIAR: Desenha a silhueta detalhada e orgânica de um pinheiro
function drawPineTree(ctx, x, bottomY, width, height, rng) {
  ctx.save();
  
  // Desenha o tronco curto
  ctx.beginPath();
  ctx.moveTo(x - width * 0.08, bottomY);
  ctx.lineTo(x - width * 0.08, bottomY - height * 0.15);
  ctx.lineTo(x + width * 0.08, bottomY - height * 0.15);
  ctx.lineTo(x + width * 0.08, bottomY);
  ctx.fill();

  // Desenha as saias de folhas sobrepostas com pontas caídas irregulares
  const segments = 5;
  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1);
    const segHeight = height * 0.88;
    const topY = bottomY - height + (segHeight * t * 0.45);
    const currBottomY = bottomY - height + (segHeight * (t + 0.22));
    const currWidth = width * (0.25 + t * 0.75);

    ctx.beginPath();
    ctx.moveTo(x, topY);
    
    // Adiciona pequenas variações orgânicas nas pontas dos galhos laterais
    const jitterL = (rng() - 0.5) * (width * 0.1);
    const jitterR = (rng() - 0.5) * (width * 0.1);
    
    ctx.lineTo(x - currWidth / 2 + jitterL, currBottomY);
    ctx.lineTo(x + currWidth / 2 + jitterR, currBottomY);
    ctx.closePath();
    ctx.fill();
  }
  
  ctx.restore();
}

function drawPineTree(ctx, x, bottomY, width, height, rng) {
  ctx.save();
  
  // Tronco proporcional
  ctx.beginPath();
  ctx.moveTo(x - width * 0.08, bottomY);
  ctx.lineTo(x - width * 0.08, bottomY - height * 0.15);
  ctx.lineTo(x + width * 0.08, bottomY - height * 0.15);
  ctx.lineTo(x + width * 0.08, bottomY);
  ctx.fill();

  // Camadas de folhas (5 segmentos)
  const segments = 5;
  for (let i = 0; i < segments; i++) {
    const t = i / (segments - 1);
    const segHeight = height * 0.85;
    const topY = bottomY - height + (segHeight * t * 0.45);
    const currBottomY = bottomY - height + (segHeight * (t + 0.22));
    const currWidth = width * (0.25 + t * 0.75);

    ctx.beginPath();
    ctx.moveTo(x, topY);
    
    const jitterL = (rng() - 0.5) * (width * 0.08);
    const jitterR = (rng() - 0.5) * (width * 0.08);
    
    ctx.lineTo(x - currWidth / 2 + jitterL, currBottomY);
    ctx.lineTo(x + currWidth / 2 + jitterR, currBottomY);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawFlowingHills(ctx, w, h, pal, rng) {
  const layers = 5; 
  const isDesktop = w > h; 
  
  for (let i = 0; i < layers; i++) {
    const t = (i + 1) / layers;
    
    // Espaçamento vertical balanceado no desktop
    const spacingFactor = isDesktop ? 0.40 : 0.33;
    const baseY = h * (0.55 + (i / layers) * spacingFactor); 
    ctx.fillStyle = getColor(pal, t * 0.85 + 0.1);

    // --- PASSO 1: Silhueta da montanha ---
    ctx.beginPath();
    ctx.moveTo(0, h);
    
    let ridgePoints = [];
    const geometryStep = Math.max(4, Math.round(w / 120)); 
    
    for (let x = 0; x <= w + geometryStep; x += geometryStep) {
      const nx = x / w; 
      let y;
      
      if (i < 2) {
        // MONTAGNHAS DE FUNDO ROCHOSAS
        const mountainAmplitude = isDesktop ? 0.32 : 0.12;
        const mountainFreq = isDesktop ? 4.5 : 2.5;
        
        // CORREÇÃO: Puxamos o fundo ligeiramente mais para cima para dar contraste de pico
        y = baseY + fbm(nx * mountainFreq + i * 4.5, 10) * h * mountainAmplitude - (isDesktop ? h * 0.12 : h * 0.05);
      } else {
        // ENCOSTAS DA FRENTE (Onde as árvores sentam)
        const hillAmplitude = isDesktop ? 0.16 : 0.06;
        const hillFreq = isDesktop ? 2.5 : 1.5;
        
        // CORREÇÃO: Afundamos a linha de base da frente ligeiramente para dar espaço para as árvores preencherem
        y = baseY + fbm(nx * hillFreq + i * 2.1, 8) * h * hillAmplitude - (isDesktop ? h * 0.01 : h * 0.02);
      }
      
      ridgePoints.push({ x, y });
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    // --- PASSO 2: Floresta responsiva ---
    if (i >= 1) {
      let baseTreeWidth, baseTreeHeight;

      if (isDesktop) {
        // Mantém as árvores elegantes, mas com proporção estável
        baseTreeWidth = h * (0.014 + i * 0.004); 
        baseTreeHeight = baseTreeWidth * (1.9 + rng() * 0.2); 
      } else {
        baseTreeWidth = w * (0.022 + i * 0.008); 
        baseTreeHeight = baseTreeWidth * (2.2 + rng() * 0.4); 
      }
      
      const stepX = baseTreeWidth * 0.35; 
      
      for (let x = 0; x <= w; x += stepX) {
        const pct = x / w;
        const ptIndex = Math.floor(pct * (ridgePoints.length - 1));
        const pt = ridgePoints[ptIndex] || ridgePoints[ridgePoints.length - 1];
        
        // CORREÇÃO DO BUG DO ESPAÇO VAZIO:
        // No desktop, aumentamos a quantidade de linhas verticais para baixo (rowsDown).
        // Isso faz com que as árvores carimbem muito mais para baixo dentro da montanha,
        // cobrindo 100% de qualquer buraco ou linha cinza vazia.
        const rowsDown = isDesktop 
          ? (i === 1 ? 3 : 5 + (layers - i)) // Muito mais preenchimento vertical no PC
          : (i === 1 ? 1 : 2 + (layers - i)); // Mantém o mobile original intacto
        
        for (let row = 0; row < rowsDown; row++) {
          const yOffset = row * (baseTreeHeight * 0.22); // Passos verticais mais curtos para densidade total
          const currentBottomY = pt.y + yOffset;
          
          if (currentBottomY > h + 20) continue;

          // Variação de altura estilizada para o Desktop
          const scale = isDesktop ? (0.65 + rng() * 1.1) : (0.8 + rng() * 0.4);
          
          const currentWidth = baseTreeWidth * (isDesktop ? Math.min(scale, 1.1) : scale); 
          const currentHeight = baseTreeHeight * scale;
          const currentX = x + (rng() - 0.5) * (stepX * 0.5);

          drawPineTree(ctx, currentX, currentBottomY, currentWidth, currentHeight, rng);
        }
      }
    }
  }
}

function drawSmoothWave(ctx, w, h, pal, rng) {
  const layers = 8 + (rng() * 5 | 0);
  const centerX = w * (0.45 + rng() * 0.1);
  const baseY = h * (0.75 + rng() * 0.08); 
  for (let i = layers; i >= 0; i--) {
    const t = i / layers;
    const spread = h * (0.8 + t * 1.8); 
    const peakH = h * (0.05 + t * 0.3);
    const skew = rng() * 0.2 - 0.10;
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, baseY + peakH * 0.5);
    const steps = 120;
    for (let s = 0; s <= steps; s++) {
      const st = s / steps;
      const x = st * w;
      const dist = (x - centerX) / spread;
      const bell = Math.exp(-dist * dist * 0.4);
      const asymmetry = 1 + skew * dist;
      const wave = bell * peakH * asymmetry;
      const micro = fbm((x / h) * 2 + i * 1.4, 3) * h * 0.008;
      const y = baseY - wave + micro;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = getColor(pal, 0.1 + (1 - t) * 0.8);
    ctx.fill();
  }
}

function drawSandDunes(ctx, w, h, pal, rng) {
  const layers = 7 + (rng() * 5 | 0);
  for (let i = 0; i < layers; i++) {
    const t = (i + 1) / layers;
    const baseY = h * (0.55 + t * 0.35);
    const freq = 0.5 + rng() * 0.8;
    const phase = rng() * 10;
    ctx.beginPath();
    for (let x = 0; x <= w; x += 2) {
      const nx = x / h;
      const wave = Math.sin(nx * Math.PI * freq + phase) * h * 0.05;
      const n = fbm(nx * 0.8 + i * 2.1, 3) * h * 0.05;
      const y = baseY + wave + n;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = getColor(pal, t * 0.8 + 0.15);
    ctx.fill();
  }
}

function drawMountains(ctx, w, h, pal, rng) {
  const layers = 5 + (rng() * 3 | 0);
  for (let i = 0; i < layers; i++) {
    const t = (i + 1) / layers;
    const baseY = h * (0.55 + t * 0.35);
    const peakCount = 2 + (rng() * 2 | 0);
    const offset = rng() * 50;
    ctx.beginPath();
    ctx.moveTo(-2, h + 2);
    const peaks = [];
    for (let p = 0; p < peakCount; p++) {
      peaks.push({
        cx: w * (0.1 + rng() * 0.8),
        peakH: h * (0.1 + rng() * 0.15) * (1 - i * 0.08),
        width: h * (0.6 + rng() * 0.6),
      });
    }
    for (let x = -2; x <= w + 2; x += 2) {
      let y = baseY;
      for (const p of peaks) {
        const dist = Math.abs(x - p.cx);
        if (dist < p.width) {
          const rise = (1 - dist / p.width);
          const sharpness = 1.3 + rng() * 0.3;
          const peakY = Math.pow(rise, sharpness) * p.peakH;
          y = Math.min(y, baseY - peakY);
        }
      }
      const micro = fbm((x / h) * 1.5 + i * 2.3 + offset, 3) * h * 0.008;
      ctx.lineTo(x, y + micro);
    }
    ctx.lineTo(w + 2, h + 2);
    ctx.closePath();
    ctx.fillStyle = getColor(pal, t * 0.8 + 0.12);
    ctx.fill();
  }
}

function drawConcentricArcs(ctx, w, h, pal, rng) {
  // 1. ESPALHAR MAIS: Aumentamos o raio para até 2.2x a altura da tela.
  // Isso faz com que a transição entre os anéis fique muito mais aberta e suave.
    const maxR = h * 1.0;    // Espalha muito mais as cores

  // 2. BAIXAR O CENTRO: Fixamos o Y na base exata da tela (h * 1.0) ou levemente abaixo.
  // O X ganha uma variação sutil bem no meio para manter a simetria elegante.
  const originX = w * (0.45 + rng() * 0.1);
const originY = h * 1.5;

  const rings = 14 + (rng() * 6 | 0); 

  for (let i = rings; i >= 0; i--) {
    const t = i / rings;
    const r = maxR * t;

    ctx.beginPath();
    ctx.arc(originX, originY, r, 0, Math.PI * 2);
    ctx.closePath();

    ctx.fillStyle = getColor(pal, 0.1 + (1 - t) * 0.8); 
    ctx.fill();
  }
}

function drawDesertDunes(ctx, w, h, pal, rng) {
  for (let i = 0; i < 15; i++) {
    const t = i / 15;
    ctx.beginPath();
    
    // 1. O ponto de partida Y agora só nasce na metade inferior (de 50% a 100% da altura)
    let x = w * rng(), y = h * (0.5 + rng() * 0.5);
    ctx.moveTo(x, y);
    
    for (let j = 0; j < 10; j++) {
      x += (rng() - 0.5) * w * 1;
      // Controla o movimento vertical para não subir demais
      y += (rng() - 0.4) * h * 0.2; 
      
      // 2. Os pontos de controle das curvas foram limitados: 
      // Em vez de 'h * rng()', agora usam apenas a metade de baixo da tela
      const cp1y = h * (0.5 + rng() * 0.5);
      const cp2y = h * (0.5 + rng() * 0.5);
      
      ctx.bezierCurveTo(w * rng(), cp1y, w * rng(), cp2y, x, y);
    }
    
    ctx.strokeStyle = getColor(pal, t);
    ctx.lineWidth = rng() * 3;
    ctx.stroke();
  }
}

// --- NOVA FUNÇÃO PARA RENDERIZAR O RELÓGIO COM COR INTELIGENTE ---
function drawClockOverlay(ctx, w, h, type) {
  // Pega a cor de fundo atual para decidir se o relógio deve ser branco ou preto (Garante contraste)
  const bg = getBgColor(currentPalette);
  const r = parseInt(bg.slice(1,3), 16), g = parseInt(bg.slice(3,5), 16), b = parseInt(bg.slice(5,7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  ctx.fillStyle = brightness > 125 ? 'rgba(0, 0, 0, 0.75)' : 'rgba(255, 255, 255, 0.9)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (type === 'desktop') {
    // Layout Mac Lockscreen: Relógio grande centralizado, Data logo acima
    ctx.font = '300 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.fillText('Domingo, 14 de Junho', w / 2, h * 0.22);
    
    ctx.font = '600 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.fillText('09:41', w / 2, h * 0.30);
  } else if (type === 'mobile') {
    // Layout iPhone Lockscreen: Data fina, seguida pelo Relógio de peso marcante
    ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    ctx.fillText('DOMINGO, 14 DE JUNHO', w / 2, h * 0.16);
    
    ctx.font = '700 68px -apple-system, BlinkMacSystemFont, "SF Pro Display", Roboto';
    ctx.fillText('09:41', w / 2, h * 0.26);
  }
}

function drawMiniPattern(ctx, w, h, patternIdx) {
  seed = 42;
  drawPattern(ctx, w, h, patternIdx, 0, 42);
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
      currentPattern = i;
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
      currentPalette = i;
      row.querySelectorAll('.palette-swatch').forEach(b => b.classList.remove('active'));
      swatch.classList.add('active');
      render();
    };
  });
}

function render() {
  const dCtx = document.getElementById('previewDesktop').getContext('2d');
  const mCtx = document.getElementById('previewMobile').getContext('2d');
  
  // Desenha os padrões estruturais de fundo normalmente
  drawPattern(dCtx, 960, 540, currentPattern, currentPalette, seed);
  drawPattern(mCtx, 290, 628, currentPattern, currentPalette, seed);
  
  // Aplica a camada do relógio por cima apenas nos previews de tela
  drawClockOverlay(dCtx, 960, 540, 'desktop');
  drawClockOverlay(mCtx, 290, 628, 'mobile');
}

function exportImage(w, h, filename) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  // A exportação chama apenas o padrão bruto para que seu wallpaper salve perfeitamente limpo!
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
  seed = Math.random() * 100000 | 0;
  render();
};

document.getElementById('btnDark').onclick = () => {
  inverted = false;
  document.getElementById('btnDark').classList.add('active');
  document.getElementById('btnLight').classList.remove('active');
  render();
};

document.getElementById('btnLight').onclick = () => {
  inverted = true;
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