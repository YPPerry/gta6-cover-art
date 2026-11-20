// Neon / After is an offline, browser-only cover compositor. Images are decoded locally and
// the same drawing function paints both the live preview and full-resolution PNG exports.
const canvas = document.querySelector('#cover');
const ctx = canvas.getContext('2d', { alpha: false });
const state = {
  layout: 'mosaic', treatment: 'sunset', size: '1080x1350', headline: 'AFTER HOURS', subline: 'A CITY THAT NEVER SLEEPS',
  photos: [], frames: [], selected: 0, dragging: null, dragOrigin: null,
};
const layouts = {
  mosaic: [
    { x: 0, y: 0, w: .61, h: .57, name: '01 · SUNSET DRIVE' },
    { x: .625, y: 0, w: .375, h: .34, name: '02 · HIGH RISE' },
    { x: .625, y: .355, w: .375, h: .215, name: '03 · LATE CHECK-IN' },
    { x: 0, y: .585, w: .30, h: .285, name: '04 · NEON MILE' },
    { x: .315, y: .585, w: .685, h: .285, name: '05 · OPEN ROAD' },
  ],
  portrait: [
    { x: 0, y: 0, w: .48, h: .395, name: '01 · THE ARRIVAL' },
    { x: .495, y: 0, w: .505, h: .395, name: '02 · AFTER DARK' },
    { x: 0, y: .41, w: .505, h: .46, name: '03 · CITY LIGHTS' },
    { x: .52, y: .41, w: .48, h: .22, name: '04 · NO ALIBI' },
    { x: .52, y: .645, w: .48, h: .225, name: '05 · LAST CALL' },
  ],
  panorama: [
    { x: 0, y: 0, w: 1, h: .42, name: '01 · COASTLINE' },
    { x: 0, y: .435, w: .49, h: .435, name: '02 · THE STRIP' },
    { x: .505, y: .435, w: .495, h: .205, name: '03 · NEON HOURS' },
    { x: .505, y: .655, w: .495, h: .215, name: '04 · NO TURNING BACK' },
  ],
};
const palette = [
  ['#ff637f', '#563b81', '#151d43'], ['#ffae6e', '#e94e8a', '#27224e'],
  ['#62e6de', '#6450a8', '#201b3c'], ['#f478ae', '#38386e', '#131b38'],
];
const $ = (selector) => document.querySelector(selector);
const sizeSelect = $('#size');

function framesForLayout() {
  state.frames = layouts[state.layout].map((frame, index) => ({
    ...frame, photo: state.photos.length ? index % state.photos.length : -1,
    zoom: 1, cropX: 0, cropY: 0,
  }));
  state.selected = Math.min(state.selected, state.frames.length - 1);
  updatePanelControls();
}

function updatePanelControls() {
  const panel = $('#panel-select');
  panel.replaceChildren(...state.frames.map((frame, index) => new Option(frame.name, String(index))));
  panel.value = String(state.selected);
  $('#panel-count').textContent = `${String(state.frames.length).padStart(2, '0')} FRAMES`;
  const photoSelect = $('#photo-select');
  photoSelect.replaceChildren(new Option('GRADIENT ONLY', '-1'), ...state.photos.map((photo, index) => new Option(photo.name, String(index))));
  const frame = state.frames[state.selected];
  photoSelect.value = String(frame?.photo ?? -1);
  $('#zoom').value = frame?.zoom ?? 1;
  $('#pan-x').value = frame?.cropX ?? 0;
  $('#pan-y').value = frame?.cropY ?? 0;
  syncRangeLabels();
}

function syncRangeLabels() {
  $('#zoom-value').value = `${Number($('#zoom').value).toFixed(2)}×`;
  $('#x-value').value = Number($('#pan-x').value).toFixed(2);
  $('#y-value').value = Number($('#pan-y').value).toFixed(2);
}

function fitSize() {
  const [width, height] = state.size.split('x').map(Number);
  canvas.width = width;
  canvas.height = height;
  $('#preview-size').textContent = `${width} × ${height}`;
  drawCover();
}

function gradientFill(frame, w, h, index) {
  const colors = palette[index % palette.length];
  const gradient = ctx.createLinearGradient(0, frame.y * h, w, (frame.y + frame.h) * h);
  gradient.addColorStop(0, colors[0]); gradient.addColorStop(.52, colors[1]); gradient.addColorStop(1, colors[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(frame.x * w, frame.y * h, frame.w * w, frame.h * h);
}

function drawImageInFrame(frame, w, h, index) {
  const image = state.photos[frame.photo]?.image;
  gradientFill(frame, w, h, index);
  const x = frame.x * w, y = frame.y * h, fw = frame.w * w, fh = frame.h * h;
  if (!image?.naturalWidth) return;
  const fit = Math.max(fw / image.naturalWidth, fh / image.naturalHeight) * frame.zoom;
  const iw = image.naturalWidth * fit, ih = image.naturalHeight * fit;
  const centerX = x + fw / 2 + frame.cropX * (iw - fw) / 2;
  const centerY = y + fh / 2 + frame.cropY * (ih - fh) / 2;
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, fw, fh); ctx.clip();
  ctx.drawImage(image, centerX - iw / 2, centerY - ih / 2, iw, ih);
  const grade = ctx.createLinearGradient(x, y, x + fw, y + fh);
  const grades = {
    sunset: ['rgba(255,133,118,.27)', 'rgba(96,55,132,.18)', 'rgba(16,17,54,.55)'],
    neon: ['rgba(255,66,164,.30)', 'rgba(75,52,151,.20)', 'rgba(18,37,67,.49)'],
    midnight: ['rgba(138,109,255,.25)', 'rgba(46,45,116,.20)', 'rgba(8,19,48,.63)'],
  }[state.treatment];
  grade.addColorStop(0, grades[0]); grade.addColorStop(.48, grades[1]); grade.addColorStop(1, grades[2]);
  ctx.fillStyle = grade; ctx.fillRect(x, y, fw, fh);
  const glow = ctx.createRadialGradient(x + fw * .75, y + fh * .1, 0, x + fw * .75, y + fh * .1, Math.max(fw, fh) * .7);
  glow.addColorStop(0, 'rgba(255,93,174,.21)'); glow.addColorStop(1, 'rgba(255,93,174,0)');
  ctx.fillStyle = glow; ctx.fillRect(x, y, fw, fh); ctx.restore();
}

function drawFrameLabels(w, h) {
  ctx.save();
  state.frames.forEach((frame, index) => {
    const x = frame.x * w, y = frame.y * h, fw = frame.w * w, fh = frame.h * h;
    const shade = ctx.createLinearGradient(0, y + fh * .42, 0, y + fh);
    shade.addColorStop(0, 'rgba(12,12,31,0)'); shade.addColorStop(1, 'rgba(12,12,31,.75)');
    ctx.fillStyle = shade; ctx.fillRect(x, y, fw, fh);
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.font = `700 ${Math.max(11, Math.min(w, h) * .012)}px "Archivo"`;
    ctx.textAlign = 'left'; ctx.fillText(frame.name, x + fw * .045, y + fh - fh * .08, fw * .9);
  });
  ctx.restore();
}

function drawTitle(w, h) {
  const titleTop = h * .895;
  const sun = ctx.createLinearGradient(0, titleTop, w, h);
  sun.addColorStop(0, '#ffb36d'); sun.addColorStop(.43, '#ff4d99'); sun.addColorStop(1, '#7853d8');
  ctx.save();
  ctx.fillStyle = 'rgba(15,13,32,.97)'; ctx.fillRect(0, titleTop, w, h - titleTop);
  ctx.fillStyle = sun; ctx.fillRect(0, titleTop, w, Math.max(4, h * .004));
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  const title = state.headline.trim().toUpperCase();
  if (title) {
    let fontSize = h * .069;
    ctx.font = `900 ${fontSize}px "Archivo Black"`;
    while (ctx.measureText(title).width > w * .9 && fontSize > 18) { fontSize -= 2; ctx.font = `900 ${fontSize}px "Archivo Black"`; }
    ctx.shadowColor = '#ff4caa'; ctx.shadowBlur = h * .013; ctx.lineWidth = Math.max(2, h * .0022);
    ctx.strokeStyle = 'rgba(28,19,50,.9)'; ctx.strokeText(title, w / 2, h * .958, w * .91);
    ctx.fillStyle = '#fff8f2'; ctx.fillText(title, w / 2, h * .958, w * .91);
  }
  ctx.shadowBlur = 0; ctx.fillStyle = '#ffc078';
  ctx.font = `700 ${Math.max(9, h * .013)}px "Archivo"`;
  ctx.fillText(state.subline.trim().toUpperCase(), w / 2, h * .982, w * .84);
  ctx.textAlign = 'left'; ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.font = `700 ${Math.max(7, h * .008)}px "Archivo"`;
  ctx.fillText('VICE CITY  ·  1986', w * .035, h * .916);
  ctx.textAlign = 'right'; ctx.fillText('N / A   ◈   VOL. 01', w * .965, h * .916);
  ctx.restore();
}

function drawCover() {
  const w = canvas.width, h = canvas.height;
  ctx.fillStyle = '#111126'; ctx.fillRect(0, 0, w, h);
  const gap = Math.max(5, Math.round(Math.min(w, h) * .009));
  state.frames.forEach((frame, index) => {
    drawImageInFrame(frame, w, h, index);
    ctx.strokeStyle = '#171426'; ctx.lineWidth = gap; ctx.strokeRect(frame.x * w, frame.y * h, frame.w * w, frame.h * h);
  });
  drawFrameLabels(w, h);
  drawTitle(w, h);
  // Keep the editor's selected frame visible in the preview; exports are clean and unselected.
  if (document.body.dataset.exporting !== 'true' && !document.body.classList.contains('screenshot-mode')) {
    const frame = state.frames[state.selected];
    if (frame) {
      ctx.save(); ctx.strokeStyle = '#7cf8e9'; ctx.lineWidth = Math.max(2, Math.min(w, h) * .0025);
      ctx.setLineDash([Math.max(5, w * .008), Math.max(4, w * .006)]);
      ctx.strokeRect(frame.x * w + gap, frame.y * h + gap, frame.w * w - gap * 2, frame.h * h - gap * 2);
      ctx.restore();
    }
  }
}

function addPhoto(file, url, name = file.name) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => { state.photos.push({ name, image, url }); resolve(); };
    image.onerror = reject;
    image.src = url;
  });
}

function renderPhotoList() {
  const list = $('#photo-list'); list.replaceChildren();
  if (!state.photos.length) { list.innerHTML = '<span class="empty-photos">Add photos to fill your frames</span>'; return; }
  state.photos.forEach((photo, index) => {
    const chip = document.createElement('span'); chip.className = 'photo-chip';
    chip.textContent = `${String(index + 1).padStart(2, '0')} · ${photo.name.slice(0, 18)}`; list.append(chip);
  });
}

function selectedFrame() { return state.frames[state.selected]; }
function refreshAfterEdit() { updatePanelControls(); drawCover(); }

$('#photo-input').addEventListener('change', async (event) => {
  const files = [...event.target.files].filter((file) => file.type.startsWith('image/'));
  for (const file of files) {
    try { await addPhoto(file, URL.createObjectURL(file)); }
    catch { showToast(`Could not open ${file.name}`); }
  }
  if (files.length) {
    state.frames.forEach((frame, index) => { frame.photo = index % state.photos.length; });
    renderPhotoList(); refreshAfterEdit(); showToast(`${files.length} photo${files.length === 1 ? '' : 's'} added to this device`);
  }
  event.target.value = '';
});
$('#layout').addEventListener('change', (event) => { state.layout = event.target.value; framesForLayout(); drawCover(); });
$('#treatment').addEventListener('change', (event) => { state.treatment = event.target.value; drawCover(); });
$('#panel-select').addEventListener('change', (event) => { state.selected = Number(event.target.value); refreshAfterEdit(); });
$('#photo-select').addEventListener('change', (event) => { selectedFrame().photo = Number(event.target.value); drawCover(); });
for (const [id, key] of [['zoom', 'zoom'], ['pan-x', 'cropX'], ['pan-y', 'cropY']]) {
  $(`#${id}`).addEventListener('input', (event) => { selectedFrame()[key] = Number(event.target.value); syncRangeLabels(); drawCover(); });
}
$('#caption').addEventListener('input', (event) => { state.headline = event.target.value; $('#caption-count').textContent = `${event.target.value.length} / 34`; drawCover(); });
$('#subline').addEventListener('input', (event) => { state.subline = event.target.value; drawCover(); });
sizeSelect.addEventListener('change', (event) => { state.size = event.target.value; fitSize(); });
$('#reset').addEventListener('click', () => { Object.assign(selectedFrame(), { zoom: 1, cropX: 0, cropY: 0 }); refreshAfterEdit(); });

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
}
function frameAt(point) {
  return state.frames.findIndex((frame) => point.x >= frame.x && point.x <= frame.x + frame.w && point.y >= frame.y && point.y <= frame.y + frame.h);
}
canvas.addEventListener('pointerdown', (event) => {
  const point = canvasPoint(event), found = frameAt(point);
  if (found < 0) return;
  state.selected = found; state.dragging = found; state.dragOrigin = { point, x: selectedFrame().cropX, y: selectedFrame().cropY };
  canvas.setPointerCapture(event.pointerId); updatePanelControls(); drawCover();
});
canvas.addEventListener('pointermove', (event) => {
  if (state.dragging === null) return;
  const frame = state.frames[state.dragging], point = canvasPoint(event), start = state.dragOrigin;
  frame.cropX = Math.max(-1, Math.min(1, start.x + (point.x - start.point.x) / Math.max(.15, frame.w)));
  frame.cropY = Math.max(-1, Math.min(1, start.y + (point.y - start.point.y) / Math.max(.15, frame.h)));
  $('#pan-x').value = frame.cropX; $('#pan-y').value = frame.cropY; syncRangeLabels(); drawCover();
});
canvas.addEventListener('pointerup', () => { state.dragging = null; });
canvas.addEventListener('pointercancel', () => { state.dragging = null; });

let toastTimer;
function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

$('#export').addEventListener('click', () => {
  drawCover();
  document.body.dataset.exporting = 'true'; drawCover();
  canvas.toBlob((blob) => {
    document.body.dataset.exporting = 'false'; drawCover();
    if (!blob) { showToast('PNG could not be created. Try another image.'); return; }
    const [width, height] = state.size.split('x');
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url; link.download = `neon-after-${width}x${height}.png`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    showToast(`Your ${width} × ${height} cover is ready as a PNG`);
  }, 'image/png');
});

async function loadDemoPhotos() {
  for (const [file, label] of [['pier.jpg', 'Sunset pier · demo'], ['boulevard.jpg', 'Neon boulevard · demo']]) {
    try { await addPhoto(new File([], label), `./samples/${file}`, label); } catch { /* the editor still works without demo assets */ }
  }
  if (state.photos.length) state.frames.forEach((frame, index) => { frame.photo = index % state.photos.length; });
  renderPhotoList(); updatePanelControls(); drawCover();
}

await Promise.all([document.fonts.load('700 16px "Archivo"'), document.fonts.load('900 32px "Archivo Black"')]);
framesForLayout(); fitSize();
loadDemoPhotos();
if (new URLSearchParams(location.search).has('shot')) document.body.classList.add('screenshot-mode');
