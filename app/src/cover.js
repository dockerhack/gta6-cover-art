// Vice City Cover Studio — cover renderer.
//
// Draws the whole cover on a canvas: photo panels with per-panel crops,
// time-and-place chips, the colour grade, the dark scrim, the giant
// gradient title overlapping the photos, the script line, the tagline and
// the badges. Everything is drawn from a plain state object, so the live
// preview and the PNG exports are the same drawing at different sizes.

(function () {
  'use strict';

  // ---------------------------------------------------------------- layouts

  // Every rect is normalized (0..1) against the cover. A layout's rects are
  // listed left to right, top to bottom; the cover shows the first `count`
  // timeline stops in them.
  var LAYOUTS = [
    {
      id: 'oneNight',
      name: 'One Night',
      count: 5,
      rects: [
        { x: 0.0, y: 0, w: 0.2, h: 1 },
        { x: 0.2, y: 0, w: 0.2, h: 1 },
        { x: 0.4, y: 0, w: 0.2, h: 1 },
        { x: 0.6, y: 0, w: 0.2, h: 1 },
        { x: 0.8, y: 0, w: 0.2, h: 1 },
      ],
    },
    {
      id: 'mosaic',
      name: 'Mosaic',
      count: 6,
      rects: [
        { x: 0.0, y: 0, w: 1 / 3, h: 0.5 },
        { x: 1 / 3, y: 0, w: 1 / 3, h: 0.5 },
        { x: 2 / 3, y: 0, w: 1 / 3, h: 0.5 },
        { x: 0.0, y: 0.5, w: 1 / 3, h: 0.5 },
        { x: 1 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
        { x: 2 / 3, y: 0.5, w: 1 / 3, h: 0.5 },
      ],
    },
    {
      id: 'getaway',
      name: 'Getaway',
      count: 3,
      rects: [
        { x: 0.0, y: 0, w: 1 / 3, h: 1 },
        { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
        { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
      ],
    },
    {
      id: 'split',
      name: 'Split',
      count: 2,
      rects: [
        { x: 0.0, y: 0, w: 0.58, h: 1 },
        { x: 0.58, y: 0, w: 0.42, h: 1 },
      ],
    },
    {
      id: 'quartet',
      name: 'Quartet',
      count: 4,
      rects: [
        { x: 0.0, y: 0, w: 0.5, h: 0.5 },
        { x: 0.5, y: 0, w: 0.5, h: 0.5 },
        { x: 0.0, y: 0.5, w: 0.5, h: 0.5 },
        { x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
      ],
    },
    {
      id: 'hero',
      name: 'Hero',
      count: 1,
      rects: [{ x: 0, y: 0, w: 1, h: 1 }],
    },
  ];

  // ---------------------------------------------------------------- grades

  // A grade is a canvas filter for the photo plus a tint painted over it.
  var GRADES = [
    { id: 'afterDark', name: 'After Dark' },
    { id: 'sunset', name: 'Vice Sunset' },
    { id: 'posterInk', name: 'Poster Ink' },
    { id: 'neonMono', name: 'Neon Mono' },
  ];

  // ---------------------------------------------------------------- the night

  // The six stops of the night. `photo` is a slot index (0 = Photo A,
  // 1 = Photo B). `crop` is the focal point in the photo (0..1) and the
  // zoom (1 = the whole photo, larger = closer in).
  var DEFAULT_PANELS = [
    { photo: 1, time: '8:12 PM', place: 'NEON PIER', crop: { fx: 0.42, fy: 0.3, zoom: 1.35 } },
    { photo: 0, time: '10:47 PM', place: 'PALM ROW', crop: { fx: 0.78, fy: 0.18, zoom: 1.45 } },
    { photo: 0, time: '12:30 AM', place: 'THE STRIP', crop: { fx: 0.55, fy: 0.28, zoom: 1.3 } },
    { photo: 1, time: '2:05 AM', place: 'MARINA LIGHTS', crop: { fx: 0.85, fy: 0.45, zoom: 1.35 } },
    { photo: 0, time: '4:40 AM', place: 'ROOFTOP 9', crop: { fx: 0.12, fy: 0.25, zoom: 1.5 } },
    { photo: 1, time: '5:55 AM', place: 'MIDNIGHT FERRY', crop: { fx: 0.12, fy: 0.62, zoom: 1.4 } },
  ];

  function clonePanels() {
    return DEFAULT_PANELS.map(function (p) {
      return { photo: p.photo, time: p.time, place: p.place, crop: { fx: p.crop.fx, fy: p.crop.fy, zoom: p.crop.zoom } };
    });
  }

  function layoutById(id) {
    for (var i = 0; i < LAYOUTS.length; i++) {
      if (LAYOUTS[i].id === id) return LAYOUTS[i];
    }
    return LAYOUTS[0];
  }

  var NUMBER_WORDS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];

  function numberWord(n) {
    return NUMBER_WORDS[n] || String(n);
  }

  function taglineFor(state) {
    if (state.taglineEdited && state.tagline.trim() !== '') return state.tagline;
    var count = layoutById(state.layoutId).count;
    var scenes = count === 1 ? 'SCENE' : 'SCENES';
    return numberWord(count) + ' ' + scenes + ' · ONE NIGHT · NO SLEEP';
  }

  // ---------------------------------------------------------------- helpers

  function roundRectPath(ctx, x, y, w, h, r) {
    var rr = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.arcTo(x + w, y, x + w, y + rr, rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
    ctx.lineTo(x + rr, y + h);
    ctx.arcTo(x, y + h, x, y + h - rr, rr);
    ctx.lineTo(x, y + rr);
    ctx.arcTo(x, y, x + rr, y, rr);
    ctx.closePath();
  }

  // Paints one panel's photo, cover-fitting it into (px, py, pw, ph) with
  // the panel's crop: the focal point lands in the panel's centre, and the
  // image is clamped so it always covers the whole panel (no dark gaps).
  function paintPhoto(ctx, img, panel, px, py, pw, ph) {
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    if (!iw || !ih) return false;
    var base = Math.max(pw / iw, ph / ih);
    var scale = base * panel.crop.zoom;
    var dw = iw * scale;
    var dh = ih * scale;
    var dx = px + pw / 2 - panel.crop.fx * dw;
    var dy = py + ph / 2 - panel.crop.fy * dh;
    dx = Math.max(px + pw - dw, Math.min(px, dx));
    dy = Math.max(py + ph - dh, Math.min(py, dy));
    ctx.drawImage(img, dx, dy, dw, dh);
    return true;
  }

  function photoFilter(gradeId) {
    if (gradeId === 'afterDark') return 'brightness(0.84) contrast(1.1) saturate(1.18) hue-rotate(-8deg)';
    if (gradeId === 'sunset') return 'brightness(1.03) contrast(1.06) saturate(1.4) sepia(0.22)';
    if (gradeId === 'posterInk') return 'contrast(1.55) saturate(0.4) brightness(1.06)';
    if (gradeId === 'neonMono') return 'grayscale(1) contrast(1.28) brightness(0.92)';
    return 'none';
  }

  // The tint each grade paints over its photo, clipped to the panel.
  function paintGradeTint(ctx, gradeId, px, py, pw, ph) {
    var g;
    if (gradeId === 'afterDark') {
      g = ctx.createLinearGradient(0, py, 0, py + ph);
      g.addColorStop(0, 'rgba(8,14,40,0.32)');
      g.addColorStop(0.45, 'rgba(8,14,40,0.05)');
      g.addColorStop(1, 'rgba(120,0,60,0.18)');
      ctx.fillStyle = g;
      ctx.fillRect(px, py, pw, ph);
      var glow = ctx.createRadialGradient(px + pw / 2, py + ph, 10, px + pw / 2, py + ph, ph * 0.7);
      glow.addColorStop(0, 'rgba(255,46,136,0.20)');
      glow.addColorStop(1, 'rgba(255,46,136,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(px, py, pw, ph);
    } else if (gradeId === 'sunset') {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      g = ctx.createLinearGradient(0, py, 0, py + ph);
      g.addColorStop(0, 'rgba(255,140,40,0.55)');
      g.addColorStop(0.55, 'rgba(255,90,90,0.35)');
      g.addColorStop(1, 'rgba(255,60,120,0.55)');
      ctx.fillStyle = g;
      ctx.fillRect(px, py, pw, ph);
      ctx.restore();
    } else if (gradeId === 'posterInk') {
      ctx.fillStyle = 'rgba(255,240,210,0.07)';
      ctx.fillRect(px, py, pw, ph);
      // Halftone dots: a small dot pattern stamped over the panel.
      var dot = document.createElement('canvas');
      dot.width = 9;
      dot.height = 9;
      var dctx = dot.getContext('2d');
      dctx.fillStyle = 'rgba(0,0,0,0.16)';
      dctx.beginPath();
      dctx.arc(4.5, 4.5, 1.6, 0, Math.PI * 2);
      dctx.fill();
      var pattern = ctx.createPattern(dot, 'repeat');
      ctx.fillStyle = pattern;
      ctx.fillRect(px, py, pw, ph);
    } else if (gradeId === 'neonMono') {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      g = ctx.createLinearGradient(0, py, 0, py + ph);
      g.addColorStop(0, 'rgba(0,220,255,0.16)');
      g.addColorStop(1, 'rgba(255,0,140,0.18)');
      ctx.fillStyle = g;
      ctx.fillRect(px, py, pw, ph);
      ctx.restore();
    }
  }

  // Shortens "TIME · PLACE" until it fits maxW, trimming the place first.
  function fitChipLabel(ctx, time, place, maxW) {
    var label = (time + ' · ' + place).toUpperCase();
    if (ctx.measureText(label).width <= maxW) return label;
    var p = place.toUpperCase();
    while (p.length > 1 && ctx.measureText((time + ' · ' + p + '…').toUpperCase()).width > maxW) {
      p = p.slice(0, -1);
    }
    return (time + ' · ' + p + '…').toUpperCase();
  }

  // A chip sits at the panel's top. Panels in the top row sit lower
  // (below the kicker, badge and starburst band); lower rows hug the top.
  function paintChip(ctx, panel, px, py, pw, ph, scale, coverH, topRow) {
    var fs = Math.min(pw * 0.085, ph * 0.055, 26 * scale);
    fs = Math.max(fs, 9 * scale);
    var label = (panel.time + ' · ' + panel.place).toUpperCase();
    ctx.font = '400 ' + fs + 'px Anton, "Arial Narrow", sans-serif';
    var pad = fs * 0.9;
    var maxW = pw - 12 * scale;
    // Shrink first so the whole label fits; shorten the place with an
    // ellipsis only when it still does not fit at the smallest size.
    while (ctx.measureText(label).width > maxW - pad * 2 && fs > 8 * scale) {
      fs *= 0.92;
      ctx.font = '400 ' + fs + 'px Anton, "Arial Narrow", sans-serif';
    }
    label = fitChipLabel(ctx, panel.time, panel.place, maxW - pad * 2);
    var tw = ctx.measureText(label).width;
    var bw = Math.min(tw + pad * 2, maxW);
    var bh = fs * 1.9;
    var bx = px + 8 * scale;
    var by = topRow ? py + coverH * 0.095 : py + 8 * scale;
    ctx.save();
    roundRectPath(ctx, bx, by, bw, bh, bh / 2);
    ctx.fillStyle = 'rgba(4,4,12,0.86)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = Math.max(1, scale);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, bx + pad, by + bh / 2 + fs * 0.04);
    ctx.restore();
  }

  function paintStarburst(ctx, text, cx, cy, r, scale) {
    var spikes = 12;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.21);
    ctx.beginPath();
    for (var i = 0; i < spikes * 2; i++) {
      var ang = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      var rad = i % 2 === 0 ? r : r * 0.72;
      var x = Math.cos(ang) * rad;
      var y = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffd166';
    ctx.fill();
    ctx.strokeStyle = '#1a0b00';
    ctx.lineWidth = Math.max(1.5, scale * 1.5);
    ctx.stroke();
    ctx.fillStyle = '#1a0b00';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var fs = r * 0.34;
    ctx.font = '400 ' + fs + 'px Anton, "Arial Narrow", sans-serif';
    var words = text.split(' ');
    var mid = Math.ceil(words.length / 2);
    ctx.fillText(words.slice(0, mid).join(' '), 0, -fs * 0.55);
    ctx.fillText(words.slice(mid).join(' '), 0, fs * 0.55);
    ctx.restore();
  }

  // ---------------------------------------------------------------- the cover

  function drawCover(ctx, W, H, state) {
    var layout = layoutById(state.layoutId);
    var scale = W / 1080;
    var gap = Math.max(2, W * 0.003);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#05050e';
    ctx.fillRect(0, 0, W, H);

    // Panels.
    for (var i = 0; i < layout.count; i++) {
      var rect = layout.rects[i];
      var panel = state.panels[i];
      var px = rect.x * W + gap / 2;
      var py = rect.y * H + gap / 2;
      var pw = rect.w * W - gap;
      var ph = rect.h * H - gap;
      ctx.save();
      ctx.beginPath();
      ctx.rect(px, py, pw, ph);
      ctx.clip();
      var img = state.photos[panel.photo];
      var drawn = false;
      if (img && img.complete && (img.naturalWidth || img.width)) {
        ctx.filter = photoFilter(state.gradeId);
        drawn = paintPhoto(ctx, img, panel, px, py, pw, ph);
        ctx.filter = 'none';
      }
      if (!drawn) {
        var bg = ctx.createLinearGradient(px, py, px, py + ph);
        bg.addColorStop(0, '#1b2340');
        bg.addColorStop(1, '#3a1040');
        ctx.fillStyle = bg;
        ctx.fillRect(px, py, pw, ph);
      }
      paintGradeTint(ctx, state.gradeId, px, py, pw, ph);
      ctx.restore();
      paintChip(ctx, panel, px, py, pw, ph, scale, H, rect.y === 0);
    }

    // Top shade so the kicker stays readable over bright photos.
    var topShade = ctx.createLinearGradient(0, 0, 0, H * 0.13);
    topShade.addColorStop(0, 'rgba(3,3,10,0.55)');
    topShade.addColorStop(1, 'rgba(3,3,10,0)');
    ctx.fillStyle = topShade;
    ctx.fillRect(0, 0, W, H * 0.13);

    // Dark scrim behind the title, rising from the bottom third.
    var scrim = ctx.createLinearGradient(0, H * 0.52, 0, H);
    scrim.addColorStop(0, 'rgba(4,4,12,0)');
    scrim.addColorStop(0.45, 'rgba(4,4,12,0.5)');
    scrim.addColorStop(1, 'rgba(4,4,12,0.88)');
    ctx.fillStyle = scrim;
    ctx.fillRect(0, H * 0.52, W, H * 0.48);

    // Kicker.
    var kickerSize = Math.max(13 * scale, 11);
    ctx.save();
    ctx.font = '400 ' + kickerSize + 'px Anton, "Arial Narrow", sans-serif';
    try { ctx.letterSpacing = Math.round(kickerSize * 0.32) + 'px'; } catch (e) { /* older canvas */ }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 6 * scale;
    ctx.fillText(state.kicker.toUpperCase(), W / 2, H * 0.048);
    try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
    ctx.restore();

    // EST. badge, top right.
    var badgeText = state.badge;
    var badgeSize = Math.max(12 * scale, 10);
    ctx.save();
    ctx.font = '400 ' + badgeSize + 'px Anton, "Arial Narrow", sans-serif';
    var badgeW = ctx.measureText(badgeText).width + badgeSize * 1.6;
    var badgeH = badgeSize * 2.1;
    var badgeX = W - badgeW - 12 * scale;
    var badgeY = H * 0.028;
    roundRectPath(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fillStyle = 'rgba(4,4,12,0.72)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = Math.max(1, scale);
    ctx.stroke();
    ctx.fillStyle = '#ffe9f4';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + badgeSize * 0.04);
    ctx.restore();

    // Starburst badge, top left, clear of the kicker and the chips.
    paintStarburst(ctx, state.burst, W * 0.075, H * 0.045, W * 0.042, scale);

    // The title: giant, gradient-filled, black-outlined, magenta glow,
    // overlapping the bottom third of the photos.
    var title = state.title.toUpperCase();
    var titleSize = W * 0.15;
    ctx.save();
    ctx.font = '400 ' + titleSize + 'px Anton, "Arial Narrow", sans-serif';
    try { ctx.letterSpacing = Math.round(titleSize * 0.015) + 'px'; } catch (e) { /* older canvas */ }
    var titleW = ctx.measureText(title).width;
    var titleX = W / 2;
    var titleY = H * 0.875;
    var grad = ctx.createLinearGradient(titleX - titleW / 2, 0, titleX + titleW / 2, 0);
    grad.addColorStop(0, '#ffc46b');
    grad.addColorStop(0.35, '#ff7a5c');
    grad.addColorStop(0.7, '#ff2e88');
    grad.addColorStop(1, '#c04df0');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.lineWidth = titleSize * 0.055;
    ctx.strokeStyle = '#07070f';
    ctx.strokeText(title, titleX, titleY);
    ctx.shadowColor = 'rgba(255,46,136,0.85)';
    ctx.shadowBlur = titleSize * 0.22;
    ctx.fillStyle = grad;
    ctx.fillText(title, titleX, titleY);
    ctx.shadowBlur = 0;
    try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
    ctx.restore();

    // Script line under the title.
    var scriptSize = W * 0.042;
    ctx.save();
    ctx.font = '400 ' + scriptSize + 'px Pacifico, cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffe9f4';
    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = 5 * scale;
    ctx.fillText(state.script, W / 2, H * 0.93);
    ctx.restore();

    // Tagline at the very bottom.
    var tagSize = Math.max(13 * scale, 11);
    ctx.save();
    ctx.font = '400 ' + tagSize + 'px Anton, "Arial Narrow", sans-serif';
    try { ctx.letterSpacing = Math.round(tagSize * 0.3) + 'px'; } catch (e) { /* older canvas */ }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 4 * scale;
    ctx.fillText(taglineFor(state), W / 2, H * 0.978);
    try { ctx.letterSpacing = '0px'; } catch (e) { /* older canvas */ }
    ctx.restore();

    // Vignette: dark edges so the cover reads as night.
    var vig = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.42, W / 2, H * 0.5, Math.max(W, H) * 0.75);
    vig.addColorStop(0, 'rgba(2,2,12,0)');
    vig.addColorStop(1, 'rgba(2,2,12,0.5)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  // The panel rect (in cover pixels) of panel i for a hit test.
  function panelRectAt(state, W, H, i) {
    var layout = layoutById(state.layoutId);
    var rect = layout.rects[i];
    return { x: rect.x * W, y: rect.y * H, w: rect.w * W, h: rect.h * H };
  }

  window.VCCover = {
    LAYOUTS: LAYOUTS,
    GRADES: GRADES,
    DEFAULT_PANELS: DEFAULT_PANELS,
    clonePanels: clonePanels,
    layoutById: layoutById,
    numberWord: numberWord,
    taglineFor: taglineFor,
    drawCover: drawCover,
    panelRectAt: panelRectAt,
  };
})();
