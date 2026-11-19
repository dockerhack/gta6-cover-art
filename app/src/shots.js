// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo loaded; ?shot=cover shows the cover alone, at its export size.
// Query params: photo (boulevard | pier — which sample is photo 1),
// title, kicker, subtitle, tagline, grade, layout, size (1920x1080 |
// 1080x1080 | 1080x1350). Panel labels always come from the layout's
// default itinerary, so a shot shows the timeline as designed.
// window.__shotReady is set once painted.
import { drawCover, autoCrop, defaultLabels, defaultTagline, sizeById } from './cover.js';

function applyParams(query, state) {
  const get = (key) => query.get(key);
  if (get('layout')) state.layout = get('layout');
  if (get('grade')) state.grade = get('grade');
  if (get('size')) state.size = get('size');
  if (get('title')) state.title = get('title');
  if (get('kicker')) state.kicker = get('kicker');
  if (get('subtitle')) state.subtitle = get('subtitle');
  if (get('tagline')) state.tagline = get('tagline');
  if (get('badge')) state.badge = get('badge');
}

export async function runShot(shot, query, api) {
  const { state, loadImage, render, setStatus } = api;
  if (shot === 'cover') document.body.classList.add('shot-cover');
  applyParams(query, state);
  // A shot without an explicit tagline shows the layout's own scene count:
  // the mosaic shot reads SIX SCENES, the one-night shot FIVE SCENES.
  // An explicit tagline in the query still wins, exactly as typed.
  if (!query.get('tagline')) state.tagline = defaultTagline(state.layout);
  // Labels follow the layout: a shot of a layout shows its itinerary.
  state.labels = defaultLabels(state.layout);

  // Load the two sample photos; `photo` picks which one is photo 1 (the hero).
  const first = query.get('photo') === 'pier' ? 'pier' : 'boulevard';
  const second = first === 'pier' ? 'boulevard' : 'pier';
  try {
    state.photos[0] = await loadImage(`samples/${first}.jpg`);
    state.photos[1] = await loadImage(`samples/${second}.jpg`);
    state.photos[2] = null;
  } catch (err) {
    setStatus(`Shot photos failed to load: ${err.message}`);
  }

  // Keep the caption inputs in sync with the shot's words, including the
  // selected panel's time + place label.
  const sync = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value;
  };
  sync('kicker', state.kicker);
  sync('title', state.title);
  sync('subtitle', state.subtitle);
  sync('tagline', state.tagline);
  sync('badge', state.badge);
  sync('label-time', (state.labels[0] || {}).time || '');
  sync('label-place', (state.labels[0] || {}).place || '');

  if (shot === 'cover') {
    // Full export resolution, drawn straight onto the preview canvas; the
    // page CSS scales it to the viewport, so the screenshot is the real art.
    const size = sizeById(state.size);
    const canvas = document.getElementById('preview');
    canvas.width = size.w;
    canvas.height = size.h;
    autoCrop(state, size.w, size.h);
    drawCover(canvas, state, {});
  } else {
    render();
    const canvas = document.getElementById('preview');
    autoCrop(state, canvas.width, canvas.height);
    render();
    // The editor shot shows the export section: scroll the controls column
    // to its bottom so the export buttons — and the selected-panel controls
    // above them — are fully in frame instead of cut off by the viewport.
    const controls = document.querySelector('.controls');
    if (controls) controls.scrollTop = controls.scrollHeight;
  }

  await document.fonts.ready;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
