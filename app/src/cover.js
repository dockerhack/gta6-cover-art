// Vice City After Dark — the cover renderer.
//
// Draws a multi-panel GTA-style poster (photo panels + colour grade + bold
// lettering) onto any canvas, at any size. Pure canvas, no network: the photos
// are the caller's images and the fonts are the app's own OFL files under
// app/fonts/ (Anton for the title, Pacifico for the neon script subtitle).
//
// The cover is two zones: the art area (top 74%) holds the photo panels, and
// the title band (bottom 26%) holds the kicker, the giant title, the script
// subtitle and the tagline. The same drawCover() paints the live preview and
// the exported PNG, so what the maker sees is exactly what they share.

export const ART_BOTTOM = 0.74;

// Five multi-panel layouts. Each panel is a rectangle in normalised cover
// coordinates (0..1) inside the art area; `photos` is the default photo slot
// each panel shows (0, 1 or 2) when that many photos are loaded.
export const LAYOUTS = [
  {
    id: 'night-drive',
    name: 'Night Drive',
    panels: [
      { x: 0, y: 0, w: 0.6, h: 0.74 },
      { x: 0.6, y: 0, w: 0.4, h: 0.25 },
      { x: 0.6, y: 0.25, w: 0.4, h: 0.245 },
      { x: 0.6, y: 0.495, w: 0.4, h: 0.245 },
    ],
    photos: [0, 1, 0, 1],
  },
  {
    id: 'the-crew',
    name: 'The Crew',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.47 },
      { x: 0, y: 0.47, w: 0.333, h: 0.27 },
      { x: 0.333, y: 0.47, w: 0.334, h: 0.27 },
      { x: 0.667, y: 0.47, w: 0.333, h: 0.27 },
    ],
    photos: [0, 1, 0, 1],
  },
  {
    id: 'getaway',
    name: 'Getaway',
    panels: [
      { x: 0, y: 0, w: 0.38, h: 0.37 },
      { x: 0, y: 0.37, w: 0.38, h: 0.37 },
      { x: 0.38, y: 0, w: 0.62, h: 0.74 },
    ],
    photos: [1, 0, 0],
  },
  {
    id: 'city-strips',
    name: 'City Strips',
    panels: [
      { x: 0, y: 0, w: 0.24, h: 0.74 },
      { x: 0.24, y: 0, w: 0.19, h: 0.74 },
      { x: 0.43, y: 0, w: 0.19, h: 0.74 },
      { x: 0.62, y: 0, w: 0.19, h: 0.74 },
      { x: 0.81, y: 0, w: 0.19, h: 0.74 },
    ],
    photos: [0, 1, 0, 1, 0],
  },
  {
    id: 'mosaic',
    name: 'Mosaic',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.37 },
      { x: 0.5, y: 0, w: 0.5, h: 0.185 },
      { x: 0.5, y: 0.185, w: 0.5, h: 0.185 },
      { x: 0, y: 0.37, w: 0.333, h: 0.37 },
      { x: 0.333, y: 0.37, w: 0.334, h: 0.37 },
      { x: 0.667, y: 0.37, w: 0.333, h: 0.37 },
    ],
    photos: [0, 1, 0, 1, 0, 1],
  },
];

export const SIZES = [
  { id: '1920x1080', label: '1920 x 1080 (wide)', w: 1920, h: 1080 },
  { id: '1080x1080', label: '1080 x 1080 (square)', w: 1080, h: 1080 },
  { id: '1080x1350', label: '1080 x 1350 (portrait)', w: 1080, h: 1350 },
];

// Four colour grades. Each grade maps a pixel's luminance through a gradient
// (stops of [luminance, [r, g, b]]) and blends the result with the photo.
// `halftone` posterises instead, and adds a print-dot texture on top.
export const GRADES = [
  {
    id: 'afterdark',
    name: 'After Dark',
    hint: 'Neon night — teal shadows, magenta highlights',
    blend: 0.72,
    title: ['#7df9ff', '#c86bff', '#ff2ea6'],
    glow: '#ff2ea6',
    subtitle: '#ff5ec4',
    kicker: '#ffd319',
    stops: [
      [0, [4, 12, 26]],
      [0.25, [8, 42, 66]],
      [0.5, [16, 96, 110]],
      [0.75, [150, 70, 140]],
      [1, [255, 190, 215]],
    ],
  },
  {
    id: 'sunset',
    name: 'Vice Sunset',
    hint: 'Warm dusk — orange and pink, like the boulevard at 7pm',
    blend: 0.68,
    title: ['#ffe259', '#ff7b00', '#ff2e88'],
    glow: '#ff7b00',
    subtitle: '#ff8fd1',
    kicker: '#ffe259',
    stops: [
      [0, [18, 8, 42]],
      [0.3, [110, 32, 82]],
      [0.55, [225, 105, 45]],
      [0.8, [255, 175, 85]],
      [1, [255, 238, 200]],
    ],
  },
  {
    id: 'halftone',
    name: 'Poster Ink',
    hint: 'Comic-book print — flat colour, halftone dots',
    blend: 1,
    posterize: 5,
    title: ['#ff2e88', '#ff2e88', '#ff2e88'],
    glow: '#111111',
    subtitle: '#111111',
    kicker: '#111111',
    stops: null,
  },
  {
    id: 'neonmono',
    name: 'Neon Mono',
    hint: 'Two-tone night — deep blue shadows, hot pink light',
    blend: 0.88,
    title: ['#ffffff', '#ffb3dd', '#ff2ea6'],
    glow: '#37e6ff',
    subtitle: '#37e6ff',
    kicker: '#37e6ff',
    stops: [
      [0, [6, 8, 36]],
      [0.35, [40, 40, 95]],
      [0.65, [140, 60, 140]],
      [1, [255, 150, 205]],
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) ?? SIZES[0];
}

// Builds a fresh panel list for a layout: each panel shows its default photo
// slot, at 1x zoom, centred. Callers keep one list per layout switch.
export function defaultPanels(layoutId) {
  const layout = layoutById(layoutId);
  return layout.panels.map((_, i) => ({
    photo: layout.photos[i] ?? 0,
    zoom: 1,
    ox: 0,
    oy: 0,
  }));
}

// Sets each panel's crop so a face is in frame: when the photo is cropped
// vertically by a panel, the panel starts by showing the photo's upper part
// (where faces usually are) instead of its middle. Call after photos load or
// the layout changes; the maker can still drag any panel afterwards.
export function autoCrop(state, coverW, coverH) {
  const layout = layoutById(state.layout);
  const loadedPhotos = state.photos.filter(Boolean);
  layout.panels.forEach((p, i) => {
    const panel = state.panels[i];
    if (!panel) return;
    const img = loadedPhotos.length === 0
      ? null
      : loadedPhotos[panel.photo % loadedPhotos.length] ?? null;
    if (!img) {
      panel.ox = 0;
      panel.oy = 0;
      return;
    }
    const pw = p.w * coverW;
    const ph = p.h * coverH;
    const scale = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
    panel.oy = img.naturalHeight * scale > ph + 1 ? 0.7 : 0;
    panel.ox = 0;
  });
}

// --- colour grading -------------------------------------------------------

const lutCache = new Map();

// A 256-entry lookup per channel for a grade: luminance -> graded colour.
function gradeLuts(grade) {
  if (lutCache.has(grade.id)) return lutCache.get(grade.id);
  const stops = grade.stops;
  const r = new Uint8Array(256);
  const g = new Uint8Array(256);
  const b = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0];
    let c = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) {
        a = stops[s];
        c = stops[s + 1];
        break;
      }
    }
    const f = c[0] === a[0] ? 0 : (t - a[0]) / (c[0] - a[0]);
    r[i] = Math.round(a[1][0] + (c[1][0] - a[1][0]) * f);
    g[i] = Math.round(a[1][1] + (c[1][1] - a[1][1]) * f);
    b[i] = Math.round(a[1][2] + (c[1][2] - a[1][2]) * f);
  }
  const luts = { r, g, b };
  lutCache.set(grade.id, luts);
  return luts;
}

// Grades an ImageData in place: luminance-mapped colour blended with the
// original pixel, or posterisation for the halftone grade.
function applyGrade(imageData, grade) {
  const d = imageData.data;
  const blend = grade.blend;
  if (grade.posterize) {
    const levels = grade.posterize - 1;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.round(Math.round((d[i] / 255) * levels) / levels * 255);
      d[i + 1] = Math.round(Math.round((d[i + 1] / 255) * levels) / levels * 255);
      d[i + 2] = Math.round(Math.round((d[i + 2] / 255) * levels) / levels * 255);
    }
    return;
  }
  const { r, g, b } = gradeLuts(grade);
  for (let i = 0; i < d.length; i += 4) {
    const l = Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
    d[i] = Math.round(d[i] * (1 - blend) + r[l] * blend);
    d[i + 1] = Math.round(d[i + 1] * (1 - blend) + g[l] * blend);
    d[i + 2] = Math.round(d[i + 2] * (1 - blend) + b[l] * blend);
  }
}

// A small halftone dot tile, reused as a repeating pattern.
let dotPattern = null;
function halftonePattern(ctx) {
  if (dotPattern) return dotPattern;
  const tile = document.createElement('canvas');
  tile.width = 10;
  tile.height = 10;
  const t = tile.getContext('2d');
  t.fillStyle = '#000';
  t.beginPath();
  t.arc(5, 5, 2.1, 0, Math.PI * 2);
  t.fill();
  dotPattern = ctx.createPattern(tile, 'repeat');
  return dotPattern;
}

// --- panel drawing ---------------------------------------------------------

function drawPhotoInto(ctx, img, x, y, w, h, panel) {
  // Cover-fit the photo into the panel rect, then apply the panel's zoom
  // and pan (ox/oy are -1..1 across the panel).
  const base = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const scale = base * panel.zoom;
  const pw = img.naturalWidth * scale;
  const ph = img.naturalHeight * scale;
  // Pan spans the whole cropped overflow, so ox/oy of -1..1 reach the photo's
  // edges: positive oy shows the top of the photo, where faces usually are.
  const dx = x + (w - pw) / 2 + panel.ox * Math.max(0, (pw - w) / 2);
  const dy = y + (h - ph) / 2 + panel.oy * Math.max(0, (ph - h) / 2);
  ctx.drawImage(img, dx, dy, pw, ph);
}

function drawPanel(ctx, rect, img, panel, grade, scale) {
  const { x, y, w, h } = rect;
  if (w < 4 || h < 4) return;
  const off = document.createElement('canvas');
  off.width = Math.max(2, Math.round(w));
  off.height = Math.max(2, Math.round(h));
  const octx = off.getContext('2d');
  if (img) {
    drawPhotoInto(octx, img, 0, 0, off.width, off.height, panel);
  } else {
    const g = octx.createLinearGradient(0, 0, off.width, off.height);
    g.addColorStop(0, '#141428');
    g.addColorStop(1, '#05050f');
    octx.fillStyle = g;
    octx.fillRect(0, 0, off.width, off.height);
  }
  const data = octx.getImageData(0, 0, off.width, off.height);
  applyGrade(data, grade);
  octx.putImageData(data, 0, 0);
  ctx.drawImage(off, x, y, w, h);
  if (grade.id === 'halftone') {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = halftonePattern(ctx);
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
  if (!img) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `600 ${Math.max(11, 13 * scale)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('ADD A PHOTO', x + w / 2, y + h / 2);
    ctx.restore();
  }
  // Thin black frame + a hairline of light inside the panel edge.
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = Math.max(2, 3 * scale);
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 2 * scale, y + 2 * scale, w - 4 * scale, h - 4 * scale);
}

// --- lettering -------------------------------------------------------------

function splitTitle(ctx, text, maxWidth, size) {
  ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
  if (ctx.measureText(text).width <= maxWidth) return [text];
  const words = text.split(/\s+/);
  if (words.length < 2) return [text];
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ');
    const b = words.slice(i).join(' ');
    const diff = Math.abs(ctx.measureText(a).width - ctx.measureText(b).width);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

function drawStarburst(ctx, cx, cy, r, lines) {
  const spikes = 14;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.1);
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const rad = i % 2 === 0 ? r : r * 0.72;
    const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd319';
  ctx.fill();
  ctx.strokeStyle = '#0a0a12';
  ctx.lineWidth = Math.max(2, r * 0.05);
  ctx.stroke();
  ctx.fillStyle = '#0a0a12';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const n = lines.length;
  lines.forEach((line, i) => {
    const size = r * (i === n - 1 ? 0.52 : 0.4);
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    ctx.fillText(line, 0, (i - (n - 1) / 2) * size * 1.05);
  });
  ctx.restore();
}

// --- the cover -------------------------------------------------------------

// Draws the whole cover onto `canvas` (its own width/height) from `state`.
// state: { photos, panels, layout, grade, kicker, title, subtitle, tagline, badge }
// opts: { selected } — in the live preview, the selected panel gets an outline.
export function drawCover(canvas, state, opts = {}) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const scale = w / 1920;
  const layout = layoutById(state.layout);
  const grade = gradeById(state.grade);
  const loadedPhotos = state.photos.filter(Boolean);

  // Backdrop: black, so the panel gutters read as ink lines.
  ctx.fillStyle = '#05050f';
  ctx.fillRect(0, 0, w, h);

  const gutter = Math.max(2, Math.round(4 * scale));
  layout.panels.forEach((p, i) => {
    const rect = {
      x: p.x * w + gutter,
      y: p.y * h + gutter,
      w: p.w * w - gutter * 2,
      h: p.h * h - gutter * 2,
    };
    const panel = state.panels[i] ?? { photo: 0, zoom: 1, ox: 0, oy: 0 };
    const img = loadedPhotos.length === 0
      ? null
      : loadedPhotos[panel.photo % loadedPhotos.length] ?? null;
    drawPanel(ctx, rect, img, panel, grade, scale);
  });

  // Night mood: a dark wash from the top, and a vignette over the art area.
  if (grade.id === 'afterdark' || grade.id === 'neonmono') {
    const top = ctx.createLinearGradient(0, 0, 0, h * 0.3);
    top.addColorStop(0, 'rgba(2,6,18,0.55)');
    top.addColorStop(1, 'rgba(2,6,18,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, w, h * 0.3);
  }
  const vig = ctx.createRadialGradient(
    w / 2, h * 0.37, Math.min(w, h) * 0.35,
    w / 2, h * 0.37, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,10,0)');
  vig.addColorStop(1, 'rgba(0,0,10,0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h * ART_BOTTOM);

  // Selected panel outline (preview only, never in the export).
  if (typeof opts.selected === 'number' && opts.selected >= 0) {
    const p = layout.panels[opts.selected];
    if (p) {
      ctx.save();
      ctx.strokeStyle = grade.kicker;
      ctx.lineWidth = Math.max(3, 4 * scale);
      ctx.setLineDash([14 * scale, 8 * scale]);
      ctx.strokeRect(p.x * w + 1, p.y * h + 1, p.w * w - 2, p.h * h - 2);
      ctx.restore();
    }
  }

  // Starburst badge, top-right corner of the art.
  const badgeR = Math.max(34, 62 * scale * (w < h ? 1.15 : 1));
  const badgeLines = String(state.badge || 'EST. 2026').split(' ');
  drawStarburst(ctx, w - badgeR - 18 * scale, badgeR + 18 * scale, badgeR, badgeLines);

  // Title band: a dark wash the lettering sits on.
  const band = ctx.createLinearGradient(0, h * 0.68, 0, h);
  band.addColorStop(0, 'rgba(5,5,18,0)');
  band.addColorStop(0.22, 'rgba(5,5,18,0.88)');
  band.addColorStop(1, 'rgba(5,5,18,0.96)');
  ctx.fillStyle = band;
  ctx.fillRect(0, h * 0.68, w, h * 0.32);

  // Neon streaks across the band for the night grades.
  if (grade.id === 'afterdark' || grade.id === 'neonmono') {
    ctx.save();
    ctx.shadowBlur = 18 * scale;
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.shadowColor = '#37e6ff';
    ctx.strokeStyle = 'rgba(55,230,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.755);
    ctx.lineTo(w * 0.94, h * 0.755);
    ctx.stroke();
    ctx.shadowColor = '#ff2ea6';
    ctx.strokeStyle = 'rgba(255,46,166,0.7)';
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.985);
    ctx.lineTo(w * 0.94, h * 0.985);
    ctx.stroke();
    ctx.restore();
  }

  // Kicker + five stars.
  const kickerSize = Math.max(16, h * 0.03);
  const kickerY = h * 0.795;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffd319';
  ctx.font = `${Math.round(kickerSize * 0.85)}px system-ui, sans-serif`;
  ctx.fillText('★★★★★', w / 2, kickerY - kickerSize * 1.05);
  ctx.fillStyle = grade.kicker;
  ctx.font = `700 ${Math.round(kickerSize)}px system-ui, sans-serif`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(kickerSize * 0.28)}px`;
  ctx.fillText(String(state.kicker || '').toUpperCase(), w / 2, kickerY);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.restore();

  // Giant title, gradient-filled with a thick black outline and a glow.
  const titleText = String(state.title || '').toUpperCase();
  if (titleText) {
    let size = h * 0.135;
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    while (size > 20 && ctx.measureText(titleText).width > w * 0.94) {
      size -= 4;
      ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    }
    const lines = splitTitle(ctx, titleText, w * 0.94, size);
    const lineHeight = size * 0.98;
    const total = lines.length * lineHeight;
    const titleTop = h * 0.885 - total / 2;
    const grad = ctx.createLinearGradient(0, titleTop, 0, titleTop + total);
    grade.title.forEach((c, i) => grad.addColorStop(i / (grade.title.length - 1), c));
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.shadowColor = grade.glow;
    ctx.shadowBlur = size * 0.28;
    ctx.fillStyle = grad;
    lines.forEach((line, i) => {
      ctx.fillText(line, w / 2, titleTop + lineHeight * (i + 0.5));
    });
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#0a0a12';
    ctx.lineWidth = Math.max(3, size * 0.14);
    lines.forEach((line, i) => {
      ctx.strokeText(line, w / 2, titleTop + lineHeight * (i + 0.5));
    });
    ctx.fillStyle = grad;
    lines.forEach((line, i) => {
      ctx.fillText(line, w / 2, titleTop + lineHeight * (i + 0.5));
    });
    ctx.restore();
  }

  // Neon script subtitle, tilted, overlapping the title's lower edge.
  const subtitle = String(state.subtitle || '');
  if (subtitle) {
    const subSize = Math.max(20, h * 0.046);
    const subY = h * 0.885 + (titleText ? h * 0.048 : 0);
    ctx.save();
    ctx.translate(w / 2 + w * 0.1, subY);
    ctx.rotate(-0.045);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${subSize}px Pacifico, cursive`;
    // A bright white core with a coloured neon glow, so the script stays
    // readable over the title and clear of the tagline below it.
    ctx.shadowColor = grade.subtitle;
    ctx.shadowBlur = subSize * 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(subtitle, 0, 0);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = grade.subtitle;
    ctx.fillText(subtitle, 0, 0);
    ctx.restore();
  }

  // Tagline: small caps with a rule on each side.
  const tagline = String(state.tagline || '');
  if (tagline) {
    const tagSize = Math.max(11, h * 0.02);
    const tagY = h * 0.968;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `600 ${Math.round(tagSize)}px system-ui, sans-serif`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(tagSize * 0.3)}px`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(tagline.toUpperCase(), w / 2, tagY);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.beginPath();
    ctx.moveTo(w * 0.06, tagY);
    ctx.lineTo(w * 0.3, tagY);
    ctx.moveTo(w * 0.7, tagY);
    ctx.lineTo(w * 0.94, tagY);
    ctx.stroke();
    ctx.restore();
  }

  // Outer frame: black edge with a hairline of the grade's accent colour.
  ctx.strokeStyle = '#000';
  ctx.lineWidth = Math.max(4, 8 * scale);
  ctx.strokeRect(0, 0, w, h);
  ctx.strokeStyle = grade.id === 'halftone' ? 'rgba(255,211,25,0.5)' : 'rgba(255,255,255,0.14)';
  ctx.lineWidth = Math.max(1, 2 * scale);
  ctx.strokeRect(6 * scale, 6 * scale, w - 12 * scale, h - 12 * scale);
}

// Which panel (if any) contains the point (x, y) in cover pixels.
export function panelAt(state, x, y, w, h) {
  if (y > h * ART_BOTTOM) return -1;
  const layout = layoutById(state.layout);
  for (let i = 0; i < layout.panels.length; i++) {
    const p = layout.panels[i];
    if (x >= p.x * w && x < (p.x + p.w) * w && y >= p.y * h && y < (p.y + p.h) * h) {
      return i;
    }
  }
  return -1;
}
