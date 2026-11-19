// Vice City Cover Studio — app logic.
//
// Wires the editor to the cover renderer: photo slots, layout and grade
// buttons, caption fields, per-panel time/place labels, drag-to-crop and
// scroll-to-zoom on the preview, and PNG exports in the three post sizes.
// The same state drives the live preview and every export.

(function () {
  'use strict';

  var SAMPLES = [
    { src: 'samples/boulevard.jpg', name: 'boulevard.jpg (sample)' },
    { src: 'samples/pier.jpg', name: 'pier.jpg (sample)' },
  ];

  var EXPORT_SIZES = [
    { w: 1080, h: 1080, label: '1080×1080' },
    { w: 1080, h: 1350, label: '1080×1350' },
    { w: 1920, h: 1080, label: '1920×1080' },
  ];

  var state = {
    size: { w: 1080, h: 1080 },
    layoutId: 'oneNight',
    gradeId: 'afterDark',
    kicker: 'WELCOME TO VICE CITY',
    title: 'AFTER DARK',
    script: 'One Night in Vice City',
    tagline: '',
    taglineEdited: false,
    badge: 'EST. 2026',
    burst: '1 NIGHT ONLY',
    photos: [null, null],
    panels: window.VCCover.clonePanels(),
  };

  var canvas = document.getElementById('coverCanvas');
  var ctx = canvas.getContext('2d');
  var statusEl = document.getElementById('status');
  var renderQueued = false;
  var presentMode = new URLSearchParams(location.search).get('present') === '1';

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function queueRender() {
    if (renderQueued) return;
    renderQueued = true;
    requestAnimationFrame(function () {
      renderQueued = false;
      render();
    });
  }

  function render() {
    if (presentMode) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    } else {
      canvas.width = state.size.w;
      canvas.height = state.size.h;
    }
    window.VCCover.drawCover(ctx, canvas.width, canvas.height, state);
  }

  function renderOffscreen(w, h) {
    var off = document.createElement('canvas');
    off.width = w;
    off.height = h;
    window.VCCover.drawCover(off.getContext('2d'), w, h, state);
    return off;
  }

  function downloadPNG(offCanvas, fileName) {
    return new Promise(function (resolve) {
      offCanvas.toBlob(function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 5000);
        resolve(blob);
      }, 'image/png');
    });
  }

  function exportSize(size) {
    var off = renderOffscreen(size.w, size.h);
    return downloadPNG(off, 'vice-city-cover-' + size.w + 'x' + size.h + '.png');
  }

  function exportAllSizes() {
    var chain = Promise.resolve();
    EXPORT_SIZES.forEach(function (size) {
      chain = chain.then(function () { return exportSize(size); });
    });
    chain.then(function () {
      setStatus('Exported all 3 sizes — 1080×1080, 1080×1350 and 1920×1080.');
    });
    return chain;
  }

  // ------------------------------------------------------------------ photos

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('could not load ' + src)); };
      img.src = src;
    });
  }

  function setPhotoSlot(slot, img, name) {
    state.photos[slot] = img;
    var thumb = document.getElementById(slot === 0 ? 'thumbA' : 'thumbB');
    var nameEl = document.getElementById(slot === 0 ? 'nameA' : 'nameB');
    thumb.src = img.src;
    nameEl.textContent = name;
    queueRender();
  }

  function bindFileInput(slot) {
    var input = document.getElementById(slot === 0 ? 'fileA' : 'fileB');
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        loadImage(reader.result).then(function (img) {
          setPhotoSlot(slot, img, file.name);
          setStatus('Photo ' + (slot === 0 ? 'A' : 'B') + ' updated — ' + file.name + '.');
        });
      };
      reader.readAsDataURL(file);
    });
  }

  // ------------------------------------------------------------------ editor

  function buildChoiceButtons(containerId, items, currentId, onPick) {
    var box = document.getElementById(containerId);
    box.textContent = '';
    items.forEach(function (item) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn' + (item.id === currentId ? ' active' : '');
      btn.textContent = item.name;
      btn.addEventListener('click', function () { onPick(item.id); });
      box.appendChild(btn);
    });
  }

  function refreshChoices() {
    buildChoiceButtons('layoutButtons', window.VCCover.LAYOUTS, state.layoutId, setLayout);
    buildChoiceButtons('gradeButtons', window.VCCover.GRADES, state.gradeId, setGrade);
  }

  function buildLabelRows() {
    var box = document.getElementById('labelRows');
    box.textContent = '';
    var layout = window.VCCover.layoutById(state.layoutId);
    for (var i = 0; i < layout.count; i++) {
      (function (index) {
        var panel = state.panels[index];
        var row = document.createElement('div');
        row.className = 'label-row';

        var top = document.createElement('div');
        top.className = 'label-top';

        var num = document.createElement('span');
        num.className = 'num';
        num.textContent = String(index + 1);
        top.appendChild(num);

        var pick = document.createElement('select');
        pick.className = 'photo-pick';
        pick.setAttribute('aria-label', 'Photo for panel ' + (index + 1));
        var optA = document.createElement('option');
        optA.value = '0';
        optA.textContent = 'Photo A';
        var optB = document.createElement('option');
        optB.value = '1';
        optB.textContent = 'Photo B';
        pick.appendChild(optA);
        pick.appendChild(optB);
        pick.value = String(panel.photo);
        pick.addEventListener('change', function () {
          panel.photo = Number(pick.value);
          queueRender();
        });
        top.appendChild(pick);

        var zoomOut = document.createElement('button');
        zoomOut.type = 'button';
        zoomOut.className = 'zoom-btn';
        zoomOut.textContent = '−';
        zoomOut.title = 'Zoom panel out';
        zoomOut.addEventListener('click', function () {
          panel.crop.zoom = Math.max(1, panel.crop.zoom / 1.2);
          queueRender();
        });
        top.appendChild(zoomOut);

        var zoomIn = document.createElement('button');
        zoomIn.type = 'button';
        zoomIn.className = 'zoom-btn';
        zoomIn.textContent = '+';
        zoomIn.title = 'Zoom panel in';
        zoomIn.addEventListener('click', function () {
          panel.crop.zoom = Math.min(4, panel.crop.zoom * 1.2);
          queueRender();
        });
        top.appendChild(zoomIn);
        row.appendChild(top);

        var fields = document.createElement('div');
        fields.className = 'label-fields';

        var timeInput = document.createElement('input');
        timeInput.type = 'text';
        timeInput.value = panel.time;
        timeInput.maxLength = 12;
        timeInput.setAttribute('aria-label', 'Time for panel ' + (index + 1));
        timeInput.addEventListener('input', function () {
          panel.time = timeInput.value;
          queueRender();
        });
        fields.appendChild(timeInput);

        var placeInput = document.createElement('input');
        placeInput.type = 'text';
        placeInput.value = panel.place;
        placeInput.maxLength = 20;
        placeInput.setAttribute('aria-label', 'Place for panel ' + (index + 1));
        placeInput.addEventListener('input', function () {
          panel.place = placeInput.value;
          queueRender();
        });
        fields.appendChild(placeInput);
        row.appendChild(fields);

        box.appendChild(row);
      })(i);
    }
  }

  function setLayout(id) {
    state.layoutId = id;
    refreshChoices();
    buildLabelRows();
    syncTaglineInput();
    queueRender();
  }

  function setGrade(id) {
    state.gradeId = id;
    refreshChoices();
    queueRender();
  }

  function syncTaglineInput() {
    var input = document.getElementById('taglineInput');
    input.value = window.VCCover.taglineFor(state);
  }

  function bindCaption() {
    var kicker = document.getElementById('kickerInput');
    var title = document.getElementById('titleInput');
    var script = document.getElementById('scriptInput');
    var tagline = document.getElementById('taglineInput');
    kicker.addEventListener('input', function () {
      state.kicker = kicker.value;
      queueRender();
    });
    title.addEventListener('input', function () {
      state.title = title.value;
      queueRender();
    });
    script.addEventListener('input', function () {
      state.script = script.value;
      queueRender();
    });
    tagline.addEventListener('input', function () {
      state.tagline = tagline.value;
      state.taglineEdited = true;
      queueRender();
    });
    document.getElementById('taglineAuto').addEventListener('click', function () {
      state.tagline = '';
      state.taglineEdited = false;
      syncTaglineInput();
      queueRender();
    });
    syncTaglineInput();
  }

  function bindExport() {
    var sizeSelect = document.getElementById('sizeSelect');
    sizeSelect.addEventListener('change', function () {
      var parts = sizeSelect.value.split('x');
      state.size = { w: Number(parts[0]), h: Number(parts[1]) };
      queueRender();
    });
    var buttons = document.querySelectorAll('.export-btn');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var parts = btn.getAttribute('data-export').split('x');
        var size = { w: Number(parts[0]), h: Number(parts[1]) };
        exportSize(size).then(function () {
          setStatus('Exported vice-city-cover-' + size.w + 'x' + size.h + '.png.');
        });
      });
    });
    document.getElementById('exportAll').addEventListener('click', function () {
      exportAllSizes();
    });
  }

  // ------------------------------------------------------------------- crop

  var drag = null;

  function canvasPoint(evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left) * (canvas.width / rect.width),
      y: (evt.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function hitPanel(point) {
    var layout = window.VCCover.layoutById(state.layoutId);
    for (var i = 0; i < layout.count; i++) {
      var r = window.VCCover.panelRectAt(state, canvas.width, canvas.height, i);
      if (point.x >= r.x && point.x < r.x + r.w && point.y >= r.y && point.y < r.y + r.h) return i;
    }
    return -1;
  }

  canvas.addEventListener('pointerdown', function (evt) {
    var point = canvasPoint(evt);
    var index = hitPanel(point);
    if (index < 0) return;
    var panel = state.panels[index];
    drag = { index: index, lastX: point.x, lastY: point.y, panel: panel };
    canvas.classList.add('dragging');
    canvas.setPointerCapture(evt.pointerId);
  });

  canvas.addEventListener('pointermove', function (evt) {
    if (!drag) return;
    var point = canvasPoint(evt);
    var panel = drag.panel;
    var img = state.photos[panel.photo];
    if (!img) return;
    var r = window.VCCover.panelRectAt(state, canvas.width, canvas.height, drag.index);
    var iw = img.naturalWidth || img.width;
    var ih = img.naturalHeight || img.height;
    var base = Math.max(r.w / iw, r.h / ih);
    var drawnW = iw * base * panel.crop.zoom;
    var drawnH = ih * base * panel.crop.zoom;
    panel.crop.fx -= (point.x - drag.lastX) / drawnW;
    panel.crop.fy -= (point.y - drag.lastY) / drawnH;
    panel.crop.fx = Math.max(0, Math.min(1, panel.crop.fx));
    panel.crop.fy = Math.max(0, Math.min(1, panel.crop.fy));
    drag.lastX = point.x;
    drag.lastY = point.y;
    queueRender();
  });

  function endDrag() {
    drag = null;
    canvas.classList.remove('dragging');
  }
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  canvas.addEventListener('wheel', function (evt) {
    evt.preventDefault();
    var point = canvasPoint(evt);
    var index = hitPanel(point);
    if (index < 0) return;
    var panel = state.panels[index];
    panel.crop.zoom = Math.max(1, Math.min(4, panel.crop.zoom * Math.exp(-evt.deltaY * 0.0012)));
    queueRender();
  }, { passive: false });

  // ------------------------------------------------------------------- boot

  var readyPromise = Promise.all([
    document.fonts.load('400 100px Anton').catch(function () { return null; }),
    document.fonts.load('400 100px Pacifico').catch(function () { return null; }),
    loadImage(SAMPLES[0].src),
    loadImage(SAMPLES[1].src),
  ]).then(function (results) {
    setPhotoSlot(0, results[2], SAMPLES[0].name);
    setPhotoSlot(1, results[3], SAMPLES[1].name);
    return document.fonts.ready.then(function () {
      render();
      setStatus('Sample photos loaded — drag a panel to re-crop, scroll to zoom.');
      return true;
    });
  }).catch(function (err) {
    setStatus('Could not load the sample photos (' + err.message + '). Load your own photos above.');
    render();
    return false;
  });

  if (presentMode) document.body.classList.add('present');

  bindFileInput(0);
  bindFileInput(1);
  refreshChoices();
  buildLabelRows();
  bindCaption();
  bindExport();
  render();

  window.coverApp = {
    state: state,
    ready: readyPromise,
    render: render,
    setLayout: setLayout,
    setGrade: setGrade,
    exportSize: exportSize,
    exportAllSizes: exportAllSizes,
    setSize: function (w, h) {
      state.size = { w: w, h: h };
      queueRender();
    },
    present: function (layoutId, gradeId, w, h) {
      document.body.classList.add('present');
      presentMode = true;
      state.layoutId = layoutId;
      state.gradeId = gradeId;
      state.size = { w: w, h: h };
      refreshChoices();
      buildLabelRows();
      syncTaglineInput();
      render();
    },
  };
})();
