// One Night in Vice City — the cover renderer.
//
// Draws a multi-panel GTA-style poster onto any canvas, at any size: the
// photo panels fill the whole cover, each carrying a time + place chip, and
// the giant gradient title crashes OVER the bottom third of the photos —
// thick black outline, neon glow, a dark scrim behind the lettering —
// instead of sitting in a band below them. The cover is a timeline of one
// night, hour by hour, and the panels are its scenes.
//
// Pure canvas, no network. The photos are the caller's images; the fonts are
// the app's own OFL files under app/fonts/ (Anton for the title, Pacifico
// for the neon script subtitle). The same drawCover() paints the live preview
// and the exported PNG, so what the maker sees is exactly what they share.

export const TITLE_ZONE = 0.62;

// Six multi-panel layouts. Each panel is a rectangle in normalised cover
// coordinates (0..1) across the whole cover; `photos` is the default photo
// slot each panel shows (0, 1 or 2) when that many photos are loaded.
export const LAYOUTS = [
  {
    id: 'one-night',
    name: 'One Night',
    panels: [
      { x: 0, y: 0, w: 0.52, h: 1 },
      { x: 0.52, y: 0, w: 0.24, h: 0.5 },
      { x: 0.76, y: 0, w: 0.24, h: 0.5 },
      { x: 0.52, y: 0.5, w: 0.24, h: 0.5 },
      { x: 0.76, y: 0.5, w: 0.24, h: 0.5 },
    ],
    photos: [0, 1, 0, 1, 0],
  },
  {
    id: 'night-drive',
    name: 'Night Drive',
    panels: [
      { x: 0, y: 0, w: 0.6, h: 1 },
      { x: 0.6, y: 0, w: 0.4, h: 0.34 },
      { x: 0.6, y: 0.34, w: 0.4, h: 0.33 },
      { x: 0.6, y: 0.67, w: 0.4, h: 0.33 },
    ],
    photos: [0, 1, 0, 1],
  },
  {
    id: 'the-crew',
    name: 'The Crew',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.64 },
      { x: 0, y: 0.64, w: 0.333, h: 0.36 },
      { x: 0.333, y: 0.64, w: 0.334, h: 0.36 },
      { x: 0.667, y: 0.64, w: 0.333, h: 0.36 },
    ],
    photos: [0, 1, 0, 1],
  },
  {
    id: 'getaway',
    name: 'Getaway',
    panels: [
      { x: 0, y: 0, w: 0.38, h: 0.5 },
      { x: 0, y: 0.5, w: 0.38, h: 0.5 },
      { x: 0.38, y: 0, w: 0.62, h: 1 },
    ],
    photos: [1, 0, 0],
  },
  {
    id: 'city-strips',
    name: 'City Strips',
    panels: [
      { x: 0, y: 0, w: 0.2, h: 1 },
      { x: 0.2, y: 0, w: 0.2, h: 1 },
      { x: 0.4, y: 0, w: 0.2, h: 1 },
      { x: 0.6, y: 0, w: 0.2, h: 1 },
      { x: 0.8, y: 0, w: 0.2, h: 1 },
    ],
    photos: [0, 1, 0, 1, 0],
  },
  {
    id: 'mosaic',
    name: 'Mosaic',
    panels: [
      { x: 0, y: 0, w: 0.5, h: 0.5 },
      { x: 0.5, y: 0, w: 0.5, h: 0.25 },
      { x: 0.5, y: 0.25, w: 0.5, h: 0.25 },
      { x: 0, y: 0.5, w: 0.333, h: 0.5 },
      { x: 0.333, y: 0.5, w: 0.334, h: 0.5 },
      { x: 0.667, y: 0.5, w: 0.333, h: 0.5 },
    ],
    photos: [0, 1, 0, 1, 0, 1],
  },
];

export const SIZES = [
  { id: '1920x1080', label: '1920 x 1080 (wide)', w: 1920, h: 1080 },
  { id: '1080x1080', label: '1080 x 1080 (square)', w: 1080, h: 1080 },
  { id: '1080x1350', label: '1080 x 1350 (portrait)', w: 1080, h: 1350 },
];

// The night's itinerary, in story order: one label per panel. A layout with
// fewer panels takes the first entries; the six-panel layout takes them all.
// Every place name is original to this app.
export const NIGHT_LABELS = [
  { time: '8:12 PM', place: 'NEON PIER' },
  { time: '10:47 PM', place: 'PALM ROW' },
  { time: '12:30 AM', place: 'THE STRIP' },
  { time: '2:05 AM', place: 'MARINA LIGHTS' },
  { time: '4:40 AM', place: 'ROOFTOP 9' },
  { time: '5:55 AM', place: 'MIDNIGHT FERRY' },
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

// A fresh label list for a layout: one {time, place} per panel, in order.
export function defaultLabels(layoutId) {
  const layout = layoutById(layoutId);
  return layout.panels.map((_, i) => ({ ...NIGHT_LABELS[i % NIGHT_LABELS.length] }));
}

// Scene-count words for the tagline: the cover counts its own panels.
const SCENE_WORDS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];

// The default tagline names the layout's scene count: a six-panel cover is
// SIX SCENES, a five-panel cover is FIVE SCENES. A tagline the maker types
// always wins over this default — the editor only refreshes it while it
// still holds a default, and a shot only uses it when no tagline is given.
export function defaultTagline(layoutId) {
  const n = layoutById(layoutId).panels.length;
  const word = SCENE_WORDS[n] ?? String(n);
  return `${word} SCENES · ONE NIGHT · NO SLEEP`;
}

// Four colour grades. Each grade maps a pixel's luminance through a gradient
// (stops of [luminance, [r, g, b]]) and blends the result with the photo.
// `halftone` posterises instead, and adds a print-dot texture on top.
// After Dark is a genuinely dark night grade now: near-black navy shadows,
// deep teal midtones, magenta only in the highlights, blended hard, so the
// panels read as night instead of pink dusk.
export const GRADES = [
  {
    id: 'afterdark',
    name: 'After Dark',
    hint: 'Real night — deep navy shadows, teal midtones, magenta neon',
    blend: 0.85,
    title: ['#7df9ff', '#c86bff', '#ff2ea6'],
    glow: '#ff2ea6',
    subtitle: '#ff5ec4',
    kicker: '#ffd319',
    stops: [
      [0, [2, 6, 18]],
      [0.25, [6, 28, 52]],
      [0.5, [10, 70, 95]],
      [0.75, [90, 60, 130]],
      [1, [235, 160, 200]],
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
    blend: 0.9,
    title: ['#ffffff', '#ffb3dd', '#ff2ea6'],
    glow: '#37e6ff',
    subtitle: '#37e6ff',
    kicker: '#37e6ff',
    stops: [
      [0, [4, 6, 28]],
      [0.35, [30, 30, 80]],
      [0.65, [120, 50, 130]],
      [1, [255, 150, 205]],
    ],
  },
];

// One crop per panel position, so two panels never show the same slice of
// the same photo: each has its own zoom and pan. The cover reads as one
// night of scenes, not two photos repeated.
const CROP_SPREAD = [
  { zoom: 1.05, ox: 0, oy: 0.5 },
  { zoom: 1.5, ox: -0.45, oy: 0.25 },
  { zoom: 1.8, ox: 0.5, oy: -0.2 },
  { zoom: 1.2, ox: 0.35, oy: 0.6 },
  { zoom: 1.45, ox: -0.6, oy: -0.45 },
  { zoom: 1.3, ox: 0.1, oy: 0.15 },
];

// Builds a fresh panel list for a layout: each panel shows its default photo
// slot, at its own crop from the spread. Callers keep one list per layout.
export function defaultPanels(layoutId) {
  const layout = layoutById(layoutId);
  return layout.panels.map((_, i) => {
    const crop = CROP_SPREAD[i % CROP_SPREAD.length];
    return {
      photo: layout.photos[i] ?? 0,
      zoom: crop.zoom,
      ox: crop.ox,
      oy: crop.oy,
    };
  });
}

// Re-frames every panel after photos load or the layout changes, keeping the
// crops varied: the pan spreads across panels instead of centring them all,
// so a face stays in frame up top in one panel while another shows the
// street below. The maker can still drag any panel afterwards.
export function autoCrop(state, coverW, coverH) {
  const layout = layoutById(state.layout);
  const loadedPhotos = state.photos.filter(Boolean);
  const oySpread = [0.7, 0.15, -0.35, 0.5, -0.1, 0.3];
  const oxSpread = [0, -0.4, 0.45, 0.3, -0.55, 0.15];
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
    panel.oy = img.naturalHeight * scale > ph + 1 ? oySpread[i % oySpread.length] : 0;
    panel.ox = img.naturalWidth * scale > pw + 1 ? oxSpread[i % oxSpread.length] : 0;
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

// A rounded-rectangle path (ctx.roundRect is not in every browser build).
function roundRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
}

// The time + place chip on a panel: place name bold on top, time in yellow
// below, on a dark chip with a yellow hairline. Sits in the panel's top-left
// corner, above the title zone, and shrinks to fit narrow panels.
function drawLabelChip(ctx, p, label, w, h, scale) {
  if (!label || !label.place) return;
  const pad = Math.max(6, 10 * scale);
  const inset = Math.max(3, 7 * scale);
  const maxTextW = p.w * w - inset * 2 - pad * 2;
  let placeSize = Math.max(11, h * 0.017);
  ctx.font = `700 ${placeSize}px system-ui, sans-serif`;
  while (placeSize > 8 && ctx.measureText(label.place).width > maxTextW) {
    placeSize -= 1;
    ctx.font = `700 ${placeSize}px system-ui, sans-serif`;
  }
  const timeSize = Math.max(9, h * 0.0125);
  ctx.font = `600 ${timeSize}px system-ui, sans-serif`;
  const textW = Math.max(
    ctx.measureText(label.place).width,
    ctx.measureText(label.time || '').width,
  );
  const chipW = textW + pad * 2;
  const chipH = placeSize * 1.15 + timeSize * 1.25 + pad * 1.5;
  const x = p.x * w + inset;
  const y = p.y * h + inset;
  ctx.save();
  roundRectPath(ctx, x, y, chipW, chipH, Math.max(3, 5 * scale));
  ctx.fillStyle = 'rgba(4,4,14,0.78)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,211,25,0.55)';
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  ctx.stroke();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${placeSize}px system-ui, sans-serif`;
  ctx.fillText(label.place, x + pad, y + pad + placeSize * 0.92);
  ctx.fillStyle = '#ffd319';
  ctx.font = `600 ${timeSize}px system-ui, sans-serif`;
  ctx.fillText(label.time || '', x + pad, y + pad + placeSize * 1.15 + timeSize * 1.05);
  ctx.restore();
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
// state: { photos, panels, labels, layout, grade, kicker, title, subtitle,
//          tagline, badge }
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

  // Night mood: a dark wash from the top, a heavier vignette for the night
  // grades, and a faint overall darken so the panels read as night.
  if (grade.id === 'afterdark' || grade.id === 'neonmono') {
    const top = ctx.createLinearGradient(0, 0, 0, h * 0.3);
    top.addColorStop(0, 'rgba(2,6,18,0.5)');
    top.addColorStop(1, 'rgba(2,6,18,0)');
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, w, h * 0.3);
    ctx.fillStyle = 'rgba(2,6,20,0.16)';
    ctx.fillRect(0, 0, w, h);
  }
  const vig = ctx.createRadialGradient(
    w / 2, h * 0.4, Math.min(w, h) * 0.32,
    w / 2, h * 0.4, Math.max(w, h) * 0.72,
  );
  vig.addColorStop(0, 'rgba(0,0,10,0)');
  vig.addColorStop(1, grade.id === 'afterdark' || grade.id === 'neonmono'
    ? 'rgba(0,0,10,0.45)'
    : 'rgba(0,0,10,0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  // One chip per panel: the night's timeline, hour by hour.
  layout.panels.forEach((p, i) => {
    drawLabelChip(ctx, p, (state.labels || [])[i], w, h, scale);
  });

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

  // Starburst badge, top-right corner of the cover.
  const badgeR = Math.max(34, 62 * scale * (w < h ? 1.15 : 1));
  const badgeLines = String(state.badge || 'EST. 2026').split(' ');
  drawStarburst(ctx, w - badgeR - 18 * scale, badgeR + 18 * scale, badgeR, badgeLines);

  // Title scrim: the bottom third darkens so the giant title reads while
  // the photos still show through above it. This is what makes the title
  // part of the image instead of a caption strip below it.
  const scrim = ctx.createLinearGradient(0, h * TITLE_ZONE, 0, h);
  scrim.addColorStop(0, 'rgba(4,4,14,0)');
  scrim.addColorStop(0.25, 'rgba(4,4,14,0.55)');
  scrim.addColorStop(0.55, 'rgba(4,4,14,0.88)');
  scrim.addColorStop(1, 'rgba(4,4,14,0.94)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, h * TITLE_ZONE, w, h * (1 - TITLE_ZONE));

  // Neon streaks across the title zone for the night grades.
  if (grade.id === 'afterdark' || grade.id === 'neonmono') {
    ctx.save();
    ctx.shadowBlur = 18 * scale;
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.shadowColor = '#37e6ff';
    ctx.strokeStyle = 'rgba(55,230,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.655);
    ctx.lineTo(w * 0.94, h * 0.655);
    ctx.stroke();
    ctx.shadowColor = '#ff2ea6';
    ctx.strokeStyle = 'rgba(255,46,166,0.7)';
    ctx.beginPath();
    ctx.moveTo(w * 0.06, h * 0.99);
    ctx.lineTo(w * 0.94, h * 0.99);
    ctx.stroke();
    ctx.restore();
  }

  // Kicker + five stars, just above the title.
  const kickerSize = Math.max(16, h * 0.03);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffd319';
  ctx.font = `${Math.round(kickerSize * 0.85)}px system-ui, sans-serif`;
  ctx.fillText('★★★★★', w / 2, h * 0.685);
  ctx.fillStyle = grade.kicker;
  ctx.font = `700 ${Math.round(kickerSize)}px system-ui, sans-serif`;
  if ('letterSpacing' in ctx) ctx.letterSpacing = `${Math.round(kickerSize * 0.28)}px`;
  ctx.fillText(String(state.kicker || '').toUpperCase(), w / 2, h * 0.72);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.restore();

  // Giant title, gradient-filled with a thick black outline and a glow,
  // crashing over the bottom third of the photos.
  const titleText = String(state.title || '').toUpperCase();
  let titleTop = h * 0.75;
  let titleTotal = 0;
  if (titleText) {
    let size = h * 0.17;
    ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    while (size > 20 && ctx.measureText(titleText).width > w * 0.94) {
      size -= 4;
      ctx.font = `${size}px Anton, 'Arial Black', sans-serif`;
    }
    let lines = splitTitle(ctx, titleText, w * 0.94, size);
    if (lines.length > 1) {
      // A two-line title shrinks so the whole block still fits the zone.
      size = Math.max(20, Math.round(size * 0.6));
      lines = splitTitle(ctx, titleText, w * 0.94, size);
    }
    const lineHeight = size * 0.98;
    titleTotal = lines.length * lineHeight;
    titleTop = h * 0.83 - titleTotal / 2;
    const grad = ctx.createLinearGradient(0, titleTop, 0, titleTop + titleTotal);
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
    const subY = Math.min(titleTop + titleTotal + h * 0.015, h * 0.95);
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

  // Tagline: small caps with a rule on each side, at the very bottom.
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

// Which panel (if any) contains the point (x, y) in cover pixels. The panels
// fill the whole cover now, so any point inside a panel counts — including
// points under the title, where the panel is still the thing being edited.
export function panelAt(state, x, y, w, h) {
  const layout = layoutById(state.layout);
  for (let i = 0; i < layout.panels.length; i++) {
    const p = layout.panels[i];
    if (x >= p.x * w && x < (p.x + p.w) * w && y >= p.y * h && y < (p.y + p.h) * h) {
      return i;
    }
  }
  return -1;
}
