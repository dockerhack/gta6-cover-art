// One Night in Vice City — the editor.
//
// Wires the page: upload up to three photos, pick a layout and a colour
// grade, write the caption and each panel's time + place label, crop each
// panel by dragging it, and export the cover as a PNG in 1080 x 1080,
// 1080 x 1350 or 1920 x 1080. Photos are read on the person's own machine
// and never uploaded anywhere. A `?shot=` query sets up a fixed scene for a
// screenshot instead (./shots.js).

import {
  drawCover,
  defaultPanels,
  defaultLabels,
  defaultTagline,
  autoCrop,
  layoutById,
  gradeById,
  sizeById,
  panelAt,
  LAYOUTS,
  GRADES,
  SIZES,
} from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const statusEl = $('status');

// --- state ---------------------------------------------------------------

const state = {
  photos: [null, null, null],
  panels: defaultPanels('one-night'),
  labels: defaultLabels('one-night'),
  layout: 'one-night',
  grade: 'afterdark',
  size: '1920x1080',
  kicker: 'WELCOME TO VICE CITY',
  title: 'AFTER DARK',
  subtitle: 'One Night in Vice City',
  // The tagline starts as the default for the opening layout (five scenes)
  // and follows the layout's scene count until the maker types their own.
  tagline: defaultTagline('one-night'),
  badge: 'EST. 2026',
};

let selected = 0;
// True once the maker has typed a tagline of their own: from then on the
// tagline is theirs, and switching layouts no longer rewrites it.
let taglineEdited = false;
let drag = null;

// --- helpers ---------------------------------------------------------------

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${url}`));
    img.src = url;
  });
}

function loadedCount() {
  return state.photos.filter(Boolean).length;
}

function setStatus(text) {
  statusEl.textContent = text;
}

function previewSize() {
  const size = sizeById(state.size);
  const scale = Math.min(1, 960 / Math.max(size.w, size.h));
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

function render() {
  const { w, h } = previewSize();
  if (preview.width !== w || preview.height !== h) {
    preview.width = w;
    preview.height = h;
  }
  drawCover(preview, state, { selected });
  updatePanelControls();
}

// --- photos ---------------------------------------------------------------

async function loadSamplePhotos() {
  try {
    const [boulevard, pier] = await Promise.all([
      loadImage('samples/boulevard.jpg'),
      loadImage('samples/pier.jpg'),
    ]);
    state.photos[0] = boulevard;
    state.photos[1] = pier;
    state.photos[2] = null;
    const { w, h } = previewSize();
    autoCrop(state, w, h);
    setStatus('Sample photos loaded: boulevard + pier.');
  } catch (err) {
    setStatus(`Sample photos failed to load: ${err.message}`);
  }
  render();
}

function bindPhotoInputs() {
  for (let i = 0; i < 3; i++) {
    $(`photo-${i + 1}`).addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const img = await loadImage(URL.createObjectURL(file));
        state.photos[i] = img;
        const { w, h } = previewSize();
        autoCrop(state, w, h);
        setStatus(`Photo ${i + 1} loaded: ${file.name}.`);
      } catch {
        setStatus(`Photo ${i + 1}: that file could not be read as an image.`);
      }
      render();
    });
    $(`clear-${i + 1}`).addEventListener('click', () => {
      state.photos[i] = null;
      $(`photo-${i + 1}`).value = '';
      const { w, h } = previewSize();
      autoCrop(state, w, h);
      setStatus(`Photo ${i + 1} cleared.`);
      render();
    });
  }
  $('samples').addEventListener('click', loadSamplePhotos);
}

// --- layout + grade ---------------------------------------------------------

function buildPicker(containerId, items, current, onPick) {
  const box = $(containerId);
  box.innerHTML = '';
  items.forEach((item) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.textContent = item.name ?? item.label;
    b.title = item.hint ?? item.label ?? item.name;
    if (item.id === current) b.classList.add('active');
    b.addEventListener('click', () => {
      onPick(item.id);
      box.querySelectorAll('.pick').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
    });
    box.appendChild(b);
  });
}

function buildPickers() {
  buildPicker('layouts', LAYOUTS, state.layout, (id) => {
    state.layout = id;
    state.panels = defaultPanels(id);
    state.labels = defaultLabels(id);
    // The tagline counts the layout's scenes — until the maker types their
    // own, which then sticks across layout changes.
    if (!taglineEdited) {
      state.tagline = defaultTagline(id);
      $('tagline').value = state.tagline;
    }
    selected = 0;
    const { w, h } = previewSize();
    autoCrop(state, w, h);
    setStatus(`Layout: ${layoutById(id).name}.`);
    render();
  });
  buildPicker('grades', GRADES, state.grade, (id) => {
    state.grade = id;
    setStatus(`Grade: ${gradeById(id).name}.`);
    render();
  });
  buildPicker('sizes', SIZES, state.size, (id) => {
    state.size = id;
    setStatus(`Export size: ${sizeById(id).label}.`);
    render();
  });
}

// --- captions ---------------------------------------------------------------

function bindCaptions() {
  const fields = [
    ['kicker', 'kicker'],
    ['title', 'title'],
    ['subtitle', 'subtitle'],
    ['tagline', 'tagline'],
    ['badge', 'badge'],
  ];
  fields.forEach(([inputId, key]) => {
    const input = $(inputId);
    input.value = state[key];
    input.addEventListener('input', () => {
      // Typing a tagline claims it: layout switches stop refreshing it.
      if (key === 'tagline') taglineEdited = true;
      state[key] = input.value;
      render();
    });
  });
}

// --- panel editing -----------------------------------------------------------

// The selected panel's time + place label: two small inputs that write
// straight into state.labels[selected] and repaint the cover.
function bindLabels() {
  $('label-time').addEventListener('input', (e) => {
    state.labels[selected].time = e.target.value;
    render();
  });
  $('label-place').addEventListener('input', (e) => {
    state.labels[selected].place = e.target.value;
    render();
  });
}

function updatePanelControls() {
  const layout = layoutById(state.layout);
  const n = layout.panels.length;
  if (selected >= n) selected = 0;
  $('panel-label').textContent = `Panel ${selected + 1} of ${n}`;
  const panel = state.panels[selected];
  const label = state.labels[selected] ?? { time: '', place: '' };
  $('label-time').value = label.time;
  $('label-place').value = label.place;
  const zoom = $('zoom');
  zoom.value = String(panel.zoom);
  $('zoom-value').textContent = `${Math.round(panel.zoom * 100)}%`;
  const select = $('panel-photo');
  select.innerHTML = '';
  // The options name the loaded photos by their upload slot; their values
  // are indexes into the loaded-photo list the panels draw from.
  let compact = 0;
  state.photos.forEach((img, slot) => {
    if (!img) return;
    const opt = document.createElement('option');
    opt.value = String(compact);
    opt.textContent = `Photo ${slot + 1}`;
    select.appendChild(opt);
    compact += 1;
  });
  if (compact === 0) {
    const opt = document.createElement('option');
    opt.value = '0';
    opt.textContent = 'No photo loaded';
    select.appendChild(opt);
  }
  select.value = String(compact === 0 ? 0 : panel.photo % compact);
  select.disabled = compact === 0;
}

function bindPanelControls() {
  $('panel-photo').addEventListener('change', (e) => {
    state.panels[selected].photo = Number(e.target.value);
    render();
  });
  $('zoom').addEventListener('input', (e) => {
    state.panels[selected].zoom = Number(e.target.value);
    render();
  });
  $('reset-crop').addEventListener('click', () => {
    state.panels[selected] = { ...state.panels[selected], zoom: 1, ox: 0, oy: 0 };
    setStatus(`Panel ${selected + 1} crop reset.`);
    render();
  });
  $('fill-all').addEventListener('click', () => {
    const photo = state.panels[selected].photo;
    state.panels.forEach((p) => { p.photo = photo; });
    setStatus(`All panels now show photo ${photo + 1}.`);
    render();
  });
  $('shuffle').addEventListener('click', () => {
    const count = Math.max(1, loadedCount());
    state.panels.forEach((p, i) => { p.photo = (p.photo + 1 + (i % 2)) % count; });
    setStatus('Photos shuffled across the panels.');
    render();
  });
}

function canvasPoint(e) {
  const rect = preview.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * preview.width;
  const y = ((e.clientY - rect.top) / rect.height) * preview.height;
  return { x, y };
}

function bindCanvas() {
  preview.addEventListener('pointerdown', (e) => {
    const { x, y } = canvasPoint(e);
    const hit = panelAt(state, x, y, preview.width, preview.height);
    if (hit === -1) return;
    selected = hit;
    drag = { x, y, ox: state.panels[hit].ox, oy: state.panels[hit].oy };
    preview.setPointerCapture(e.pointerId);
    render();
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const { x, y } = canvasPoint(e);
    const layout = layoutById(state.layout);
    const p = layout.panels[selected];
    const panel = state.panels[selected];
    panel.ox = Math.max(-1, Math.min(1, drag.ox + ((x - drag.x) / (p.w * preview.width)) * 2));
    panel.oy = Math.max(-1, Math.min(1, drag.oy + ((y - drag.y) / (p.h * preview.height)) * 2));
    render();
  });
  preview.addEventListener('pointerup', () => { drag = null; });
  preview.addEventListener('pointercancel', () => { drag = null; });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const panel = state.panels[selected];
    const next = panel.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12);
    panel.zoom = Math.max(1, Math.min(3, next));
    render();
  }, { passive: false });
}

// --- export ------------------------------------------------------------------

function renderExport(sizeId) {
  const size = sizeById(sizeId);
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state, {});
  return canvas;
}

/** Renders the cover at `sizeId` and downloads it as a PNG. */
export function exportPNG(sizeId) {
  return new Promise((resolve) => {
    const size = sizeById(sizeId);
    const canvas = renderExport(sizeId);
    canvas.toBlob((blob) => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `after-dark-cover-${size.w}x${size.h}.png`;
      a.click();
      setStatus(`Exported after-dark-cover-${size.w}x${size.h}.png (${size.w} x ${size.h}).`);
      resolve(a.download);
    }, 'image/png');
  });
}

function bindExport() {
  $('export').addEventListener('click', () => exportPNG(state.size));
  $('export-all').addEventListener('click', async () => {
    for (const size of SIZES) {
      // Small pause between downloads so the browser keeps all three.
      // eslint-disable-next-line no-await-in-loop
      await exportPNG(size.id);
      await new Promise((r) => setTimeout(r, 350));
    }
    setStatus('Exported all three sizes.');
  });
}

// --- boot ----------------------------------------------------------------------

async function boot() {
  buildPickers();
  bindPhotoInputs();
  bindCaptions();
  bindLabels();
  bindPanelControls();
  bindCanvas();
  bindExport();
  // The title and script fonts are local files; wait until they can be drawn.
  try {
    await Promise.all([
      document.fonts.load('40px Anton'),
      document.fonts.load('40px Pacifico'),
      document.fonts.ready,
    ]);
  } catch {
    // Fall back to system fonts if a local font fails to load.
  }
  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    runShot(shot, new URLSearchParams(location.search), {
      state,
      loadImage,
      loadSamplePhotos,
      render,
      setStatus,
    });
  } else {
    await loadSamplePhotos();
  }
}

// Small API for the screenshot driver and for anyone embedding the editor.
window.__viceCity = { state, render, exportPNG, loadSamplePhotos };

boot();
