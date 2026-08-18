"use strict";

const JPEG_QUALITY = 0.92;
const APP_NAME = "Photo Cleanup Board";
const DB_NAME = "photo-cleanup-board";
const DB_VERSION = 1;
const LEGACY_PROJECT_ID = "active";

let saveTimer = null;

const state = {
  photos: [],
  stacks: [],
  unknown: [],
  removed: [],
  currentDrag: null,
  folderDrag: null,
  photoDrag: null,
  dragPhoto: null,
  stackClickTimer: null,
  compareMode: false,
  compareSlot: null,
  folderSlot: null,
  pendingReviewFiles: [],
  undoStack: [],
  mode: "sort",
  detailPhoto: null,
  detailZoom: 1,
  detailRotation: 0,
  importToken: 0,
  activeProjectId: null,
  activeProjectName: "Untitled Project"
};

const els = {
  dashboardView: document.querySelector("#dashboardView"),
  setupView: document.querySelector("#setupView"),
  boardView: document.querySelector("#boardView"),
  exportView: document.querySelector("#exportView"),
  newProjectButton: document.querySelector("#newProjectButton"),
  dashboardRestoreButton: document.querySelector("#dashboardRestoreButton"),
  dashboardClearButton: document.querySelector("#dashboardClearButton"),
  dashboardProjectList: document.querySelector("#dashboardProjectList"),
  projectImportInput: document.querySelector("#projectImportInput"),
  fileInput: document.querySelector("#fileInput"),
  changePhotosButton: document.querySelector("#changePhotosButton"),
  restoreProjectButton: document.querySelector("#restoreProjectButton"),
  clearProjectButton: document.querySelector("#clearProjectButton"),
  timelineStartInput: document.querySelector("#timelineStartInput"),
  timelineEndInput: document.querySelector("#timelineEndInput"),
  stackModeSelect: document.querySelector("#stackModeSelect"),
  useModifiedDateInput: document.querySelector("#useModifiedDateInput"),
  loadStatus: document.querySelector("#loadStatus"),
  importSummary: document.querySelector("#importSummary"),
  duplicateReviewBox: document.querySelector("#duplicateReviewBox"),
  duplicateReviewStatus: document.querySelector("#duplicateReviewStatus"),
  duplicateReviewList: document.querySelector("#duplicateReviewList"),
  prepareReviewedButton: document.querySelector("#prepareReviewedButton"),
  savedProjectStatus: document.querySelector("#savedProjectStatus"),
  warningBox: document.querySelector("#warningBox"),
  startButton: document.querySelector("#startButton"),
  knownCount: document.querySelector("#knownCount"),
  unknownCount: document.querySelector("#unknownCount"),
  duplicateCount: document.querySelector("#duplicateCount"),
  boardStatus: document.querySelector("#boardStatus"),
  boardGrid: document.querySelector("#boardGrid"),
  stackCells: Array.from(document.querySelectorAll(".stack-cell")),
  centerCell: document.querySelector("#centerCell"),
  centerImage: document.querySelector("#centerImage"),
  centerLabel: document.querySelector(".center-meta span"),
  centerName: document.querySelector("#centerName"),
  centerProgress: document.querySelector("#centerProgress"),
  undoButton: document.querySelector("#undoButton"),
  saveProjectButton: document.querySelector("#saveProjectButton"),
  saveAsProjectButton: document.querySelector("#saveAsProjectButton"),
  exportProjectButton: document.querySelector("#exportProjectButton"),
  compareButton: document.querySelector("#compareButton"),
  comparePanel: document.querySelector("#comparePanel"),
  compareTitle: document.querySelector("#compareTitle"),
  compareStatus: document.querySelector("#compareStatus"),
  compareUnknownImage: document.querySelector("#compareUnknownImage"),
  compareUnknownName: document.querySelector("#compareUnknownName"),
  compareStackLabel: document.querySelector("#compareStackLabel"),
  compareStackGrid: document.querySelector("#compareStackGrid"),
  compareMoveButton: document.querySelector("#compareMoveButton"),
  compareCloseButton: document.querySelector("#compareCloseButton"),
  folderPanel: document.querySelector("#folderPanel"),
  folderTitle: document.querySelector("#folderTitle"),
  folderStatus: document.querySelector("#folderStatus"),
  folderGrid: document.querySelector("#folderGrid"),
  folderRenameButton: document.querySelector("#folderRenameButton"),
  folderCloseButton: document.querySelector("#folderCloseButton"),
  nextUnknownButton: document.querySelector("#nextUnknownButton"),
  removeUnknownButton: document.querySelector("#removeUnknownButton"),
  finishButton: document.querySelector("#finishButton"),
  removedCount: document.querySelector("#removedCount"),
  removedGrid: document.querySelector("#removedGrid"),
  finalGrid: document.querySelector("#finalGrid"),
  saveFolderButton: document.querySelector("#saveFolderButton"),
  exportProjectFromExportButton: document.querySelector("#exportProjectFromExportButton"),
  downloadZipButton: document.querySelector("#downloadZipButton"),
  downloadCsvButton: document.querySelector("#downloadCsvButton"),
  downloadJsonButton: document.querySelector("#downloadJsonButton"),
  backToBoardButton: document.querySelector("#backToBoardButton"),
  restartButton: document.querySelector("#restartButton"),
  sortModeButton: document.querySelector("#sortModeButton"),
  reviewModeButton: document.querySelector("#reviewModeButton"),
  dragPreview: document.querySelector("#dragPreview"),
  detailViewer: document.querySelector("#detailViewer"),
  detailTitle: document.querySelector("#detailTitle"),
  detailImage: document.querySelector("#detailImage"),
  detailMeta: document.querySelector("#detailMeta"),
  detailZoomOutButton: document.querySelector("#detailZoomOutButton"),
  detailZoomInButton: document.querySelector("#detailZoomInButton"),
  detailRotateButton: document.querySelector("#detailRotateButton"),
  detailCloseButton: document.querySelector("#detailCloseButton"),
  backToDashboardButton: document.querySelector("#backToDashboardButton"),
  dashboardGooglePhotosButton: document.querySelector("#dashboardGooglePhotosButton")
};

function init() {
  els.newProjectButton.addEventListener("click", newProject);
  els.dashboardRestoreButton.addEventListener("click", restoreSavedProject);
  els.dashboardClearButton.addEventListener("click", clearAllSavedProjects);
  els.projectImportInput.addEventListener("change", importProjectFile);
  els.fileInput.addEventListener("change", handleFiles);
  els.changePhotosButton.addEventListener("click", chooseDifferentPhotos);
  els.prepareReviewedButton.addEventListener("click", prepareReviewedPhotos);
  els.restoreProjectButton.addEventListener("click", restoreSavedProject);
  els.clearProjectButton.addEventListener("click", clearSavedProject);
  els.startButton.addEventListener("click", startCleanup);
  els.undoButton.addEventListener("click", undoLastAction);
  els.saveProjectButton.addEventListener("click", () => saveProjectNow("Project saved."));
  els.saveAsProjectButton.addEventListener("click", saveProjectAs);
  els.exportProjectButton.addEventListener("click", exportProjectFile);
  els.exportProjectFromExportButton.addEventListener("click", exportProjectFile);
  els.compareButton.addEventListener("click", toggleCompareMode);
  els.compareMoveButton.addEventListener("click", moveComparedPhoto);
  els.compareCloseButton.addEventListener("click", closeCompare);
  els.folderRenameButton.addEventListener("click", renameOpenFolder);
  els.folderCloseButton.addEventListener("click", closeFolder);
  els.nextUnknownButton.addEventListener("click", nextUnknown);
  els.removeUnknownButton.addEventListener("click", removeCurrent);
  els.finishButton.addEventListener("click", showExport);
  els.saveFolderButton.addEventListener("click", saveOutputFolder);
  els.downloadZipButton.addEventListener("click", downloadZip);
  els.downloadCsvButton.addEventListener("click", downloadCsv);
  els.downloadJsonButton.addEventListener("click", downloadJson);
  els.backToBoardButton.addEventListener("click", () => showView("board"));
  els.restartButton.addEventListener("click", restart);
  els.sortModeButton.addEventListener("click", () => setMode("sort"));
  els.reviewModeButton.addEventListener("click", () => setMode("review"));
  els.centerImage.addEventListener("dblclick", () => openDetail(centerCandidate()?.photo));
  els.detailCloseButton.addEventListener("click", closeDetail);
  els.detailZoomOutButton.addEventListener("click", () => zoomDetail(0.8));
  els.detailZoomInButton.addEventListener("click", () => zoomDetail(1.25));
  els.detailRotateButton.addEventListener("click", rotateDetail);
  els.backToDashboardButton.addEventListener("click", () => showView("dashboard"));
  els.dashboardGooglePhotosButton.addEventListener("click", loadFromGooglePhotos);
  window.addEventListener("pointerup", cleanupAbandonedDrag);
  window.addEventListener("pointercancel", cleanupAbandonedDrag);
  window.addEventListener("mouseup", cleanupAbandonedDrag);
  window.addEventListener("touchend", cleanupAbandonedDrag);
  els.centerCell.addEventListener("pointerdown", onCenterPointerDown);
  els.centerCell.addEventListener("pointermove", onCenterPointerMove);
  els.centerCell.addEventListener("pointerup", onCenterPointerUp);
  els.centerCell.addEventListener("pointercancel", cancelDrag);
  els.centerCell.addEventListener("dragstart", (event) => event.preventDefault());
  els.stackCells.forEach((cell) => {
    cell.addEventListener("click", () => scheduleStackClick(Number(cell.dataset.slot)));
    cell.addEventListener("pointerdown", onStackPointerDown);
    cell.addEventListener("pointermove", onStackPointerMove);
    cell.addEventListener("pointerup", onStackPointerUp);
    cell.addEventListener("pointercancel", cancelFolderDrag);
    cell.addEventListener("dblclick", () => openStackFromGesture(Number(cell.dataset.slot)));
  });
  updateCounts();
  checkSavedProject();
}

async function handleFiles(event) {
  const importToken = state.importToken + 1;
  state.importToken = importToken;
  resetWorkingState();
  const files = Array.from(event.target.files || []).filter((file) => file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name));
  els.startButton.disabled = true;
  els.changePhotosButton.classList.toggle("hidden", files.length === 0);
  els.duplicateReviewBox.classList.add("hidden");
  if (!files.length) {
    els.loadStatus.textContent = "No photos selected.";
    return;
  }

  const review = analyzeSelectedFiles(files);
  state.pendingReviewFiles = review.files;
  renderImportSummary(files.length, review);
  if (review.possibleGroups.length) {
    renderDuplicateReview(review);
    els.loadStatus.textContent = `${review.files.length} photo${review.files.length === 1 ? "" : "s"} selected. ${review.autoSkipped.length} clear filename/size duplicate${review.autoSkipped.length === 1 ? "" : "s"} skipped before import.`;
    showWarnings(review.autoSkipped.map((file) => `${file.name}: skipped clear duplicate before import`));
    return;
  }

  await prepareFiles(review.files, importToken, review.autoSkipped);
}

async function prepareFiles(files, importToken, preSkipped = []) {
  const skipped = preSkipped.map((file) => `${file.name}: skipped clear duplicate before import`);
  els.duplicateReviewBox.classList.add("hidden");
  els.startButton.disabled = true;
  els.loadStatus.textContent = files.length ? `Preparing ${files.length} photo${files.length === 1 ? "" : "s"}...` : "No photos selected.";

  for (let index = 0; index < files.length; index += 1) {
    if (importToken !== state.importToken) return;
    const file = files[index];
    els.loadStatus.textContent = `Preparing ${index + 1} of ${files.length}: ${file.name}`;
    try {
      const photo = await preparePhoto(file, index);
      if (importToken !== state.importToken) {
        URL.revokeObjectURL(photo.url);
        return;
      }
      state.photos.push(photo);
    } catch (error) {
      if (importToken !== state.importToken) return;
      skipped.push(`${file.name}: ${error.message || "conversion failed"}`);
    }
  }

  if (importToken !== state.importToken) return;
  const duplicatePreview = countExactDuplicates(state.photos);
  els.loadStatus.textContent = `${state.photos.length} photo${state.photos.length === 1 ? "" : "s"} ready. ${duplicatePreview} duplicate image${duplicatePreview === 1 ? "" : "s"} will be removed automatically.`;
  els.startButton.disabled = state.photos.length === 0;
  showWarnings(skipped);
  updateCounts();
  scheduleProjectSave();
}

function renderImportSummary(selectedCount, review) {
  const possibleCount = review.possibleGroups.reduce((sum, group) => sum + group.length, 0);
  els.importSummary.classList.remove("hidden");
  els.importSummary.innerHTML = `<div class="import-summary-list">
    <span>Selected: ${selectedCount}</span>
    <span>Clear filename/size duplicates skipped: ${review.autoSkipped.length}</span>
    <span>Possible duplicates for review: ${possibleCount}</span>
    <span>Ready before review: ${review.files.length}</span>
  </div>`;
}

function resetWorkingState() {
  revokeUrls();
  state.photos = [];
  state.stacks = [];
  state.unknown = [];
  state.removed = [];
  state.currentDrag = null;
  state.dragPhoto = null;
  state.compareMode = false;
  state.compareSlot = null;
  state.folderSlot = null;
  state.pendingReviewFiles = [];
  state.undoStack = [];
  state.mode = "sort";
}

function chooseDifferentPhotos() {
  resetSelection();
  els.fileInput.click();
}

/**
 * Google Photos import flow.
 * Prompts the user to sign in to Google, lists albums, lets them pick one,
 * and imports ALL photos from that album into the cleanup board.
 */
async function loadFromGooglePhotos() {
  if (typeof GooglePhotosAPI === "undefined") {
    els.loadStatus.textContent = "Google Photos integration not loaded.";
    return;
  }

  resetWorkingState();
  els.startButton.disabled = true;
  els.changePhotosButton.classList.add("hidden");
  els.duplicateReviewBox.classList.add("hidden");
  els.loadStatus.textContent = "Connecting to Google Photos…";

  try {
    const albums = await GooglePhotosAPI.listAlbums();
    if (!albums.length) {
      els.loadStatus.textContent = "No albums found in your Google Photos library.";
      return;
    }

    // Let the user pick an album via a simple prompt dialog
    const albumNames = albums.map((a) => a.title);
    const selectedTitle = await showAlbumPicker(albumNames);
    if (!selectedTitle) {
      els.loadStatus.textContent = "No album selected.";
      return;
    }

    const album = albums.find((a) => a.title === selectedTitle);
    if (!album) {
      els.loadStatus.textContent = `Album "${selectedTitle}" not found.`;
      return;
    }

    els.loadStatus.textContent = `Fetching all photos from album ${album.title}…`;
    showView("setup");

    const mediaItems = await GooglePhotosAPI.fetchAllPhotosFromAlbum(album.id);
    els.loadStatus.textContent = `Retrieved ${mediaItems.length} photo(s) from Google Photos. Preparing…`;

    // Convert mediaItems into synthetic File objects so the existing prepareFiles pipeline handles them
    const importToken = state.importToken + 1;
    state.importToken = importToken;

    const syntheticFiles = await buildSyntheticFilesFromMediaItems(mediaItems, importToken);
    const review = analyzeSelectedFiles(syntheticFiles);
    state.pendingReviewFiles = review.files;

    renderImportSummary(syntheticFiles.length, review);

    if (review.possibleGroups.length) {
      renderDuplicateReview(review);
      els.loadStatus.textContent = `${review.files.length} photo(s) ready. ${review.autoSkipped.length} clear duplicate(s) skipped.`;
      showWarnings(review.autoSkipped.map((f) => `${f.name}: skipped clear duplicate before import`));
      return;
    }

    await prepareFiles(review.files, importToken, review.autoSkipped);
  } catch (error) {
    els.loadStatus.textContent = `Google Photos import failed: ${error.message || "unknown error"}`;
    console.error("[Google Photos import]", error);
  }
}

/**
 * Simple album picker — uses window.prompt() so no extra UI markup is needed.
 * Returns the selected album title, or empty string if cancelled.
 */
function showAlbumPicker(albumTitles) {
  return new Promise((resolve) => {
    const defaultChoice = albumTitles[0] || "";
    const input = window.prompt(
      `Choose a Google Photos album to import.\n\nType the full album name exactly:\n\n${albumTitles.slice(0, 20).join("\n")}${albumTitles.length > 20 ? `\n…and ${albumTitles.length - 20} more` : ""}`,
      defaultChoice
    );
    resolve(input ? input.trim() : "");
  });
}

/**
 * Downloads each mediaItem's baseUrl as a JPEG and wraps it into a synthetic File
 * compatible with the existing preparePhoto() pipeline.
 */
async function buildSyntheticFilesFromMediaItems(mediaItems, importToken) {
  const files = [];
  for (let i = 0; i < mediaItems.length; i++) {
    if (importToken !== state.importToken) return files;
    const item = mediaItems[i];
    try {
      // Google PhotosbaseUrl supports =d for JPEG download; we use a known-safe quality parameter
      const downloadUrl = item.baseUrl + "=d";
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const fileName = item.filename || `gp_photo_${i + 1}.jpg`;
      const file = new File([blob], fileName, { type: "image/jpeg", lastModified: new Date(item.creationTime || Date.now()).getTime() });
      files.push(file);
    } catch (err) {
      console.warn(`Failed to download ${item.filename || i}:`, err.message || err);
    }
  }
  return files;
}

function resetSelection() {
  state.importToken += 1;
  resetWorkingState();
  els.fileInput.value = "";
  els.loadStatus.textContent = "No photos selected.";
  els.importSummary.classList.add("hidden");
  els.importSummary.innerHTML = "";
  els.startButton.disabled = true;
  els.changePhotosButton.classList.add("hidden");
  els.duplicateReviewBox.classList.add("hidden");
  els.duplicateReviewList.innerHTML = "";
  els.warningBox.classList.add("hidden");
  updateCounts();
}

function analyzeSelectedFiles(files) {
  const clearSeen = new Set();
  const autoSkipped = [];
  const unique = [];
  files.forEach((file) => {
    const key = `${file.name.toLowerCase()}|${file.size}`;
    if (clearSeen.has(key)) {
      autoSkipped.push(file);
    } else {
      clearSeen.add(key);
      unique.push(file);
    }
  });

  const groups = new Map();
  unique.forEach((file) => {
    const key = duplicateNameKey(file.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(file);
  });
  const possibleGroups = Array.from(groups.values()).filter((group) => group.length > 1 && group.some((file) => copyLikeName(file.name)));
  return { files: unique, autoSkipped, possibleGroups };
}

function renderDuplicateReview(review) {
  els.duplicateReviewBox.classList.remove("hidden");
  els.duplicateReviewStatus.textContent = `${review.possibleGroups.length} possible duplicate group${review.possibleGroups.length === 1 ? "" : "s"} found. Checked items will be skipped before import.`;
  els.duplicateReviewList.innerHTML = "";
  review.possibleGroups.forEach((group, groupIndex) => {
    const box = document.createElement("div");
    box.className = "duplicate-review-group";
    const title = document.createElement("strong");
    title.textContent = duplicateNameKey(group[0].name);
    box.appendChild(title);
    group.forEach((file, fileIndex) => {
      const row = document.createElement("label");
      row.className = "duplicate-choice";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.name = file.name;
      input.dataset.size = String(file.size);
      input.checked = fileIndex > 0 || copyLikeName(file.name);
      const text = document.createElement("span");
      text.textContent = `${input.checked ? "Skip" : "Keep"} ${file.name} (${formatBytes(file.size)})`;
      input.addEventListener("change", () => {
        text.textContent = `${input.checked ? "Skip" : "Keep"} ${file.name} (${formatBytes(file.size)})`;
      });
      row.append(input, text);
      box.appendChild(row);
    });
    els.duplicateReviewList.appendChild(box);
  });
}

async function prepareReviewedPhotos() {
  const importToken = state.importToken;
  const skipKeys = new Set(Array.from(els.duplicateReviewList.querySelectorAll("input:checked")).map((input) => `${input.dataset.name}|${input.dataset.size}`));
  const files = state.pendingReviewFiles.filter((file) => !skipKeys.has(`${file.name}|${file.size}`));
  const skipped = state.pendingReviewFiles.filter((file) => skipKeys.has(`${file.name}|${file.size}`));
  await prepareFiles(files, importToken, skipped);
}

function duplicateNameKey(name) {
  return String(name)
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/\s*[-_ ]?copy(?:\s*\(\d+\))?$/i, "")
    .replace(/\s*\(\d+\)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function copyLikeName(name) {
  return /\bcopy\b|\(\d+\)(?=\.[^.]+$)/i.test(String(name));
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function preparePhoto(file, index) {
  const sourceBuffer = await file.arrayBuffer();
  const sourceHash = await hashArrayBuffer(sourceBuffer);
  const metadataDate = parseExifDate(sourceBuffer);
  const jpegBlob = await convertToJpeg(file);
  const jpegHash = await hashArrayBuffer(await jpegBlob.arrayBuffer());
  const url = URL.createObjectURL(jpegBlob);
  const image = await loadImage(url);

  return {
    id: `${file.name}-${file.size}-${file.lastModified || 0}-${index}`,
    originalName: file.name,
    originalSize: file.size,
    jpegName: getJpegName(file.name),
    jpegBlob,
    jpegSize: jpegBlob.size,
    url,
    width: image.naturalWidth || image.width,
    height: image.naturalHeight || image.height,
    sourceHash,
    jpegHash,
    metadataDate,
    metadataYear: metadataDate ? metadataDate.getFullYear() : null,
    modifiedYear: file.lastModified ? new Date(file.lastModified).getFullYear() : null,
    lastModified: file.lastModified || null
  };
}

async function convertToJpeg(file) {
  const sourceUrl = URL.createObjectURL(file);
  try {
    try {
      return await browserJpeg(file, sourceUrl);
    } catch {
      return await serverJpeg(file);
    }
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

async function browserJpeg(file, sourceUrl) {
  const image = await loadImage(sourceUrl);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0);
  return await canvasToBlob(canvas, "image/jpeg", JPEG_QUALITY);
}

async function serverJpeg(file) {
  throw new Error("No server available for conversion. Please use a standard JPEG/PNG image instead of HEIC.");
}

function startCleanup() {
  rememberUndo("Start cleanup");
  const seenOriginals = new Set();
  const seenImages = new Set();
  const unique = [];
  state.removed = [];
  state.photos.forEach((photo) => {
    if (seenOriginals.has(photo.sourceHash) || seenImages.has(photo.jpegHash)) {
      state.removed.push({ ...photo, reason: "Duplicate image" });
      return;
    }
    seenOriginals.add(photo.sourceHash);
    seenImages.add(photo.jpegHash);
    unique.push(photo);
  });

  state.stacks = buildStacks(unique, getTimelineSettings());
  state.unknown = [];
  unique.forEach((photo) => {
    const stack = findStackForPhoto(photo);
    if (stack) stack.photos.push(photo);
    else state.unknown.push(photo);
  });

  showView("board");
  renderBoard();
  scheduleProjectSave();
}

function buildStacks(photos, settings) {
  if (settings.mode === "months") {
    return makePeriodStacks(photos, settings, "month");
  }
  if (settings.mode === "seasons") {
    return makePeriodStacks(photos, settings, "season");
  }

  const photoYears = Array.from(new Set(photos.map(photoYear).filter(Boolean))).sort((a, b) => a - b);
  const startYear = settings.startYear || photoYears[0];
  const endYear = settings.endYear || photoYears[photoYears.length - 1];
  const years = [];
  if (startYear && endYear) {
    const first = Math.min(startYear, endYear);
    const last = Math.max(startYear, endYear);
    for (let year = first; year <= last; year += 1) years.push(year);
  } else {
    years.push(...photoYears);
  }

  if (!years.length) {
    return makeEvenRanges(new Date().getFullYear() - 7, new Date().getFullYear());
  }

  const firstYear = years[0];
  const lastYear = years[years.length - 1];
  const span = lastYear - firstYear + 1;
  let ranges;

  if (settings.mode === "years") {
    ranges = years.map((year) => ({ start: year, end: year, label: String(year) }));
  } else if (settings.mode === "decades") {
    ranges = makeDecades(firstYear, lastYear);
  } else if (settings.mode === "ranges") {
    ranges = makeEvenRanges(firstYear, lastYear);
  } else if (span <= 8 && years.length <= 8) {
    ranges = years.map((year) => ({ start: year, end: year, label: String(year) }));
  } else {
    const firstDecade = Math.floor(firstYear / 10) * 10;
    const lastDecade = Math.floor(lastYear / 10) * 10;
    const decades = makeDecades(firstDecade, lastDecade);
    if (decades.length <= 8) {
      ranges = span > 24 ? makeEvenRanges(firstYear, lastYear) : decades;
    } else {
      ranges = makeEvenRanges(firstYear, lastYear);
    }
  }

  return fillBoardStacks(ranges).map((range) => ({
    key: range.label,
    label: range.label,
    start: range.start,
    end: range.end,
    manual: Boolean(range.manual),
    photos: []
  }));
}

function findStackForPhoto(photo) {
  const sample = state.stacks[0];
  if (sample?.unit === "month" || sample?.unit === "season") {
    const value = photoPeriodValue(photo, sample.unit);
    if (value == null) return null;
    return state.stacks.find((stack) => value >= stack.start && value <= stack.end) || null;
  }
  const year = photoYear(photo);
  if (!year) return null;
  return state.stacks.find((stack) => year >= stack.start && year <= stack.end) || null;
}

function renderBoard() {
  renderStacks();
  renderCenter();
  renderFolder();
  renderRemoved();
  updateCounts();
  updateModeView();
  updateUndoButton();
  scheduleProjectSave();
}

function renderStacks() {
  els.stackCells.forEach((cell) => {
    const slot = Number(cell.dataset.slot);
    const stack = state.stacks[slot];
    cell.innerHTML = "";
    cell.classList.remove("drop-target", "compare-target");
    cell.classList.toggle("compare-target", state.compareMode && Boolean(stack));
    if (!stack) {
      cell.disabled = false;
      cell.innerHTML = `<div class="thumbs"></div><strong>Review</strong><span>Manual folder</span>`;
      return;
    }

    cell.disabled = false;
    const thumbs = document.createElement("div");
    thumbs.className = "thumbs";
    stack.photos.slice(-4).forEach((photo) => {
      const img = document.createElement("img");
      img.src = photo.url;
      img.alt = "";
      thumbs.appendChild(img);
    });
    while (thumbs.children.length < 4) {
      thumbs.appendChild(document.createElement("span"));
    }
    const label = document.createElement("strong");
    label.textContent = stack.label;
    const count = document.createElement("span");
    count.textContent = `${stack.photos.length} photo${stack.photos.length === 1 ? "" : "s"}`;
    cell.append(thumbs, label, count);
  });
}

function renderCenter() {
  const candidate = centerCandidate();
  const current = candidate?.photo || null;
  els.centerCell.classList.toggle("empty", !current);
  els.compareButton.disabled = !current;
  els.nextUnknownButton.disabled = !current || (state.unknown.length <= 1 && !reviewCandidate());
  els.removeUnknownButton.disabled = !current;
  if (!current) {
    els.centerImage.removeAttribute("src");
    els.centerLabel.textContent = "Review";
    els.centerName.textContent = "No unknown photos";
    els.centerProgress.textContent = progressText();
    els.boardStatus.textContent = "No photos are waiting in the center.";
    return;
  }
  els.centerImage.src = current.url;
  els.centerImage.draggable = false;
  els.centerLabel.textContent = candidate.source === "unknown" ? "Unknown Date" : `Reviewing ${state.stacks[candidate.slot]?.label || "Folder"}`;
  els.centerName.textContent = current.originalName;
  els.centerProgress.textContent = progressText();
  els.boardStatus.textContent = state.compareMode ? "Compare mode is on. Choose a stack to view side-by-side." : `Drag ${current.originalName} into the best dated stack.`;
}

function currentUnknown() {
  return centerCandidate()?.photo || null;
}

function centerCandidate() {
  if (state.unknown[0]) return { source: "unknown", photo: state.unknown[0] };
  return reviewCandidate();
}

function reviewCandidate() {
  for (let slot = 0; slot < state.stacks.length; slot += 1) {
    const photo = state.stacks[slot]?.photos[0];
    if (photo) return { source: "stack", slot, index: 0, photo };
  }
  return null;
}

function removeCenterCandidate() {
  const candidate = centerCandidate();
  if (!candidate) return null;
  if (candidate.source === "unknown") return state.unknown.shift();
  return state.stacks[candidate.slot]?.photos.splice(candidate.index, 1)[0] || null;
}

function placeCurrent(slot) {
  const stack = state.stacks[slot];
  if (!stack) return;
  rememberUndo("Move photo");
  const current = removeCenterCandidate();
  if (!current) return;
  stack.photos.push(current);
  closeCompare();
  renderBoard();
}

function stackClicked(slot) {
  if (state.folderDrag?.suppressClick) {
    state.folderDrag = null;
    return;
  }
  state.folderDrag = null;
  if (state.compareMode) {
    showCompare(slot);
    return;
  }
  if (state.mode === "sort") placeCurrent(slot);
  else openFolder(slot);
}

function scheduleStackClick(slot) {
  clearTimeout(state.stackClickTimer);
  state.stackClickTimer = setTimeout(() => {
    state.stackClickTimer = null;
    stackClicked(slot);
  }, 240);
}

function openStackFromGesture(slot) {
  clearTimeout(state.stackClickTimer);
  state.stackClickTimer = null;
  if (state.folderDrag?.holdTimer) clearTimeout(state.folderDrag.holdTimer);
  state.folderDrag = { suppressClick: true };
  openFolder(slot);
}

function nextUnknown() {
  rememberUndo("Next photo");
  if (state.unknown.length > 1) {
    const [photo] = state.unknown.splice(0, 1);
    state.unknown.push(photo);
  } else if (!state.unknown.length) {
    const candidate = reviewCandidate();
    if (!candidate) return;
    const [photo] = state.stacks[candidate.slot].photos.splice(candidate.index, 1);
    state.stacks[candidate.slot].photos.push(photo);
  } else {
    return;
  }
  closeCompare();
  renderBoard();
}

function removeCurrent() {
  rememberUndo("Remove photo");
  const current = removeCenterCandidate();
  if (!current) return;
  state.removed.push({ ...current, reason: "Removed by user" });
  closeCompare();
  renderBoard();
}

function openFolder(slot) {
  const stack = state.stacks[slot];
  if (!stack) return;
  state.folderSlot = slot;
  els.folderPanel.classList.remove("hidden");
  renderFolder();
}

function closeFolder() {
  state.folderSlot = null;
  els.folderPanel.classList.add("hidden");
  els.folderGrid.innerHTML = "";
}

function renameOpenFolder() {
  if (state.folderSlot == null) return;
  renameStack(state.folderSlot);
}

function renameStack(slot) {
  const stack = state.stacks[slot];
  if (!stack) return;
  const nextName = prompt("Folder name", stack.label);
  if (!nextName) return;
  rememberUndo("Rename folder");
  stack.label = nextName.trim() || stack.label;
  stack.key = safeName(stack.label);
  renderBoard();
}

function renderFolder() {
  if (state.folderSlot == null) return;
  const stack = state.stacks[state.folderSlot];
  if (!stack) {
    closeFolder();
    return;
  }
  els.folderTitle.textContent = `${stack.label} Folder`;
  els.folderStatus.textContent = `${stack.photos.length} photo${stack.photos.length === 1 ? "" : "s"} here. Drag photos to reorder them, or tap Move to send one somewhere else.`;
  els.folderGrid.innerHTML = "";
  if (!stack.photos.length) {
    const empty = document.createElement("div");
    empty.className = "folder-card";
    empty.innerHTML = "<span>No photos in this folder yet.</span>";
    els.folderGrid.appendChild(empty);
    return;
  }
  stack.photos.forEach((photo, index) => {
    const card = document.createElement("div");
    card.className = "folder-card";
    card.dataset.index = String(index);
    card.addEventListener("pointerdown", onFolderPhotoPointerDown);
    card.addEventListener("pointermove", onFolderPhotoPointerMove);
    card.addEventListener("pointerup", onFolderPhotoPointerUp);
    card.addEventListener("pointercancel", cancelPhotoDrag);

    const img = document.createElement("img");
    img.src = photo.url;
    img.alt = photo.originalName;
    img.addEventListener("click", (event) => {
      if (state.photoDrag?.suppressClick) {
        state.photoDrag = null;
        event.preventDefault();
        return;
      }
      openDetail(photo);
    });

    const name = document.createElement("strong");
    name.textContent = photo.originalName;

    const meta = document.createElement("span");
    meta.textContent = `Detected: ${detectedLabel(photo)}`;

    const actions = document.createElement("div");
    actions.className = "folder-card-actions";
    const moveButton = document.createElement("button");
    moveButton.type = "button";
    moveButton.className = "secondary";
    moveButton.textContent = "Move";
    moveButton.addEventListener("click", () => toggleMoveTargets(card, index));
    actions.appendChild(moveButton);

    card.append(img, name, meta, actions);
    els.folderGrid.appendChild(card);
  });
}

function toggleMoveTargets(card, photoIndex) {
  const existing = card.querySelector(".move-targets");
  els.folderGrid.querySelectorAll(".move-targets").forEach((panel) => panel.remove());
  if (existing) return;

  const panel = document.createElement("div");
  panel.className = "move-targets";
  state.stacks.forEach((target, targetSlot) => {
    if (targetSlot === state.folderSlot) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ghost";
    button.textContent = target.label;
    button.addEventListener("click", () => moveFromFolder(state.folderSlot, photoIndex, `stack:${targetSlot}`));
    panel.appendChild(button);
  });
  const unknownButton = document.createElement("button");
  unknownButton.type = "button";
  unknownButton.className = "ghost";
  unknownButton.textContent = "Unknown Date";
  unknownButton.addEventListener("click", () => moveFromFolder(state.folderSlot, photoIndex, "unknown"));
  const removedButton = document.createElement("button");
  removedButton.type = "button";
  removedButton.className = "danger";
  removedButton.textContent = "Removed Photos";
  removedButton.addEventListener("click", () => moveFromFolder(state.folderSlot, photoIndex, "removed"));
  panel.append(unknownButton, removedButton);
  card.appendChild(panel);
}

function moveFromFolder(fromSlot, photoIndex, destination) {
  const source = state.stacks[fromSlot];
  if (!source || !destination) return;
  rememberUndo("Move folder photo");
  const [photo] = source.photos.splice(photoIndex, 1);
  if (!photo) return;

  if (destination.startsWith("stack:")) {
    const targetSlot = Number(destination.split(":", 2)[1]);
    const target = state.stacks[targetSlot];
    if (target) target.photos.push(photo);
    else source.photos.splice(photoIndex, 0, photo);
  } else if (destination === "unknown") {
    state.unknown.unshift(photo);
  } else if (destination === "removed") {
    state.removed.push({ ...photo, reason: "Moved to removed" });
  } else {
    source.photos.splice(photoIndex, 0, photo);
  }

  renderBoard();
}

function toggleCompareMode() {
  state.compareMode = !state.compareMode;
  state.compareSlot = null;
  els.compareButton.textContent = state.compareMode ? "Compare On" : "Compare";
  els.comparePanel.classList.toggle("hidden", !state.compareMode);
  if (state.compareMode) {
    els.compareTitle.textContent = "Compare";
    els.compareStatus.textContent = "Choose a stack around the board to compare.";
    renderCompareEmpty();
  } else {
    closeCompare();
  }
  renderBoard();
}

function showCompare(slot) {
  const current = currentUnknown();
  const stack = state.stacks[slot];
  if (!current || !stack) return;
  state.compareSlot = slot;
  els.comparePanel.classList.remove("hidden");
  els.compareTitle.textContent = `Compare With ${stack.label}`;
  els.compareStatus.textContent = `${stack.photos.length} photo${stack.photos.length === 1 ? "" : "s"} in this stack.`;
  els.compareUnknownImage.src = current.url;
  els.compareUnknownName.textContent = current.originalName;
  els.compareStackLabel.textContent = stack.label;
  els.compareMoveButton.disabled = false;
  els.compareStackGrid.innerHTML = "";
  const examples = stack.photos.slice(-24).reverse();
  if (!examples.length) {
    const empty = document.createElement("span");
    empty.textContent = "No examples yet";
    els.compareStackGrid.appendChild(empty);
  } else {
    examples.forEach((photo) => {
      const img = document.createElement("img");
      img.src = photo.url;
      img.alt = photo.originalName;
      els.compareStackGrid.appendChild(img);
    });
  }
}

function moveComparedPhoto() {
  if (state.compareSlot == null) return;
  placeCurrent(state.compareSlot);
}

function closeCompare() {
  state.compareMode = false;
  state.compareSlot = null;
  els.compareButton.textContent = "Compare";
  els.comparePanel.classList.add("hidden");
  renderCompareEmpty();
}

function renderCompareEmpty() {
  els.compareUnknownImage.removeAttribute("src");
  els.compareUnknownName.textContent = "";
  els.compareStackLabel.textContent = "Selected Stack";
  els.compareStackGrid.innerHTML = "";
  els.compareMoveButton.disabled = true;
}

function renderRemoved() {
  els.removedCount.textContent = `${state.removed.length} removed`;
  els.removedGrid.innerHTML = "";
  state.removed.forEach((photo, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mini-card";
    button.innerHTML = `<img alt=""><strong></strong><span></span>`;
    button.querySelector("img").src = photo.url;
    button.querySelector("img").addEventListener("click", (event) => {
      event.stopPropagation();
      openDetail(photo);
    });
    button.querySelector("strong").textContent = photo.originalName;
    button.querySelector("span").textContent = `${photo.reason} - restore`;
    button.addEventListener("click", () => {
      const [restored] = state.removed.splice(index, 1);
      state.unknown.push(restored);
      renderBoard();
    });
    els.removedGrid.appendChild(button);
  });
}

function onCenterPointerDown(event) {
  const current = currentUnknown();
  if (!current || event.target.closest("button")) return;
  const rect = els.centerCell.getBoundingClientRect();
  state.currentDrag = {
    id: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    startX: event.clientX,
    startY: event.clientY,
    active: false,
    magnified: false,
    holdTimer: setTimeout(() => {
      if (!state.currentDrag || state.currentDrag.id !== event.pointerId) return;
      state.currentDrag.magnified = true;
      moveDragPreview(event.clientX, event.clientY, true);
    }, 350)
  };
  state.dragPhoto = current;
  els.centerCell.setPointerCapture(event.pointerId);
}

function onStackPointerDown(event) {
  if (state.compareMode || event.button !== 0) return;
  const cell = event.currentTarget;
  const slot = Number(cell.dataset.slot);
  const stack = state.stacks[slot];
  if (!stack) return;
  const rect = cell.getBoundingClientRect();
  state.folderDrag = {
    id: event.pointerId,
    slot,
    label: stack.label,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    startX: event.clientX,
    startY: event.clientY,
    active: false,
    suppressClick: false,
    holdTimer: setTimeout(() => {
      if (!state.folderDrag || state.folderDrag.id !== event.pointerId || state.folderDrag.active) return;
      openStackFromGesture(slot);
    }, 560)
  };
  cell.setPointerCapture(event.pointerId);
}

function onStackPointerMove(event) {
  if (!state.folderDrag || state.folderDrag.id !== event.pointerId) return;
  const distance = Math.hypot(event.clientX - state.folderDrag.startX, event.clientY - state.folderDrag.startY);
  if (!state.folderDrag.active && distance < 10) return;
  clearTimeout(state.folderDrag.holdTimer);
  state.folderDrag.active = true;
  state.folderDrag.suppressClick = true;
  event.preventDefault();
  moveFolderDragPreview(event.clientX, event.clientY);
  clearDropTargets();
  const target = stackAtPoint(event.clientX, event.clientY);
  if (target && Number(target.dataset.slot) !== state.folderDrag.slot) {
    target.classList.add("drop-target");
  }
}

function onStackPointerUp(event) {
  if (!state.folderDrag || state.folderDrag.id !== event.pointerId) return;
  const drag = state.folderDrag;
  clearTimeout(drag.holdTimer);
  event.currentTarget.releasePointerCapture(event.pointerId);
  clearDropTargets();
  hideDragPreview();
  if (drag.active) {
    const target = stackAtPoint(event.clientX, event.clientY);
    const toSlot = target ? Number(target.dataset.slot) : null;
    if (toSlot != null && toSlot !== drag.slot) reorderStacks(drag.slot, toSlot);
  }
  state.folderDrag = drag.suppressClick ? { suppressClick: true } : null;
}

function cancelFolderDrag() {
  if (state.folderDrag?.holdTimer) clearTimeout(state.folderDrag.holdTimer);
  state.folderDrag = null;
  clearDropTargets();
  hideDragPreview();
}

function reorderStacks(fromSlot, toSlot) {
  const stack = state.stacks[fromSlot];
  if (!stack || !state.stacks[toSlot]) return;
  rememberUndo("Reorder folders");
  state.stacks.splice(fromSlot, 1);
  state.stacks.splice(toSlot, 0, stack);
  state.folderSlot = toSlot;
  renderBoard();
}

function onFolderPhotoPointerDown(event) {
  if (event.button !== 0 || event.target.closest("button")) return;
  const card = event.currentTarget;
  const index = Number(card.dataset.index);
  const stack = state.stacks[state.folderSlot];
  const photo = stack?.photos[index];
  if (!photo) return;
  const rect = card.getBoundingClientRect();
  state.photoDrag = {
    id: event.pointerId,
    slot: state.folderSlot,
    index,
    photo,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    startX: event.clientX,
    startY: event.clientY,
    active: false,
    suppressClick: false
  };
  card.setPointerCapture(event.pointerId);
}

function onFolderPhotoPointerMove(event) {
  if (!state.photoDrag || state.photoDrag.id !== event.pointerId) return;
  const distance = Math.hypot(event.clientX - state.photoDrag.startX, event.clientY - state.photoDrag.startY);
  if (!state.photoDrag.active && distance < 10) return;
  state.photoDrag.active = true;
  state.photoDrag.suppressClick = true;
  event.preventDefault();
  event.currentTarget.classList.add("drag-source");
  movePhotoDragPreview(event.clientX, event.clientY);
  clearDropTargets();
  const target = folderCardAtPoint(event.clientX, event.clientY);
  if (target && Number(target.dataset.index) !== state.photoDrag.index) {
    target.classList.add("drop-target");
  }
}

function onFolderPhotoPointerUp(event) {
  if (!state.photoDrag || state.photoDrag.id !== event.pointerId) return;
  const drag = state.photoDrag;
  event.currentTarget.releasePointerCapture(event.pointerId);
  event.currentTarget.classList.remove("drag-source");
  clearDropTargets();
  hideDragPreview();
  if (drag.active) {
    const target = folderCardAtPoint(event.clientX, event.clientY);
    const toIndex = target ? Number(target.dataset.index) : null;
    if (toIndex != null && toIndex !== drag.index) reorderFolderPhoto(drag.slot, drag.index, toIndex);
  }
  state.photoDrag = drag.suppressClick ? { suppressClick: true } : null;
  if (drag.suppressClick) {
    setTimeout(() => {
      if (state.photoDrag?.suppressClick) state.photoDrag = null;
    }, 120);
  }
}

function cancelPhotoDrag() {
  state.photoDrag = null;
  clearDropTargets();
  hideDragPreview();
}

function cleanupAbandonedDrag() {
  if (!state.currentDrag && !state.folderDrag?.id && !state.photoDrag?.id) return;
  document.querySelectorAll(".drag-source").forEach((item) => item.classList.remove("drag-source"));
  if (state.currentDrag?.holdTimer) clearTimeout(state.currentDrag.holdTimer);
  if (state.folderDrag?.holdTimer) clearTimeout(state.folderDrag.holdTimer);
  state.currentDrag = null;
  state.folderDrag = null;
  state.photoDrag = null;
  els.centerCell.classList.remove("dragging");
  els.boardGrid.classList.remove("dragging-photo");
  clearDropTargets();
  hideDragPreview();
  renderCenter();
}

function reorderFolderPhoto(slot, fromIndex, toIndex) {
  const stack = state.stacks[slot];
  if (!stack || !stack.photos[fromIndex] || !stack.photos[toIndex]) return;
  rememberUndo("Reorder folder photos");
  const [photo] = stack.photos.splice(fromIndex, 1);
  stack.photos.splice(toIndex, 0, photo);
  renderBoard();
}

function onCenterPointerMove(event) {
  if (!state.currentDrag || state.currentDrag.id !== event.pointerId) return;
  const distance = Math.hypot(event.clientX - state.currentDrag.startX, event.clientY - state.currentDrag.startY);
  if (!state.currentDrag.active && distance < 10) {
    if (state.currentDrag.magnified) moveDragPreview(event.clientX, event.clientY, true);
    return;
  }
  clearTimeout(state.currentDrag.holdTimer);
  state.currentDrag.active = true;
  event.preventDefault();
  els.centerCell.classList.add("dragging");
  els.boardGrid.classList.add("dragging-photo");
  moveDragPreview(event.clientX, event.clientY, true);
  clearDropTargets();
  const target = stackAtPoint(event.clientX, event.clientY);
  if (target) {
    target.classList.add("drop-target");
    const stack = state.stacks[Number(target.dataset.slot)];
    els.boardStatus.textContent = `Release to drop into ${stack?.label || "this folder"}.`;
  } else {
    els.boardStatus.textContent = "Move over a folder, then release to drop. Release outside the folders to cancel.";
  }
}

function onCenterPointerUp(event) {
  if (!state.currentDrag || state.currentDrag.id !== event.pointerId) return;
  const wasActive = state.currentDrag.active;
  clearTimeout(state.currentDrag.holdTimer);
  els.centerCell.releasePointerCapture(event.pointerId);
  state.currentDrag = null;
  els.centerCell.classList.remove("dragging");
  els.boardGrid.classList.remove("dragging-photo");
  clearDropTargets();
  hideDragPreview();
  if (wasActive) {
    const target = stackAtPoint(event.clientX, event.clientY);
    if (target) placeCurrent(Number(target.dataset.slot));
  }
}

function cancelDrag() {
  if (state.currentDrag?.holdTimer) clearTimeout(state.currentDrag.holdTimer);
  state.currentDrag = null;
  els.centerCell.classList.remove("dragging");
  els.boardGrid.classList.remove("dragging-photo");
  clearDropTargets();
  hideDragPreview();
  renderCenter();
}

function moveDragPreview(clientX, clientY, large = false) {
  if (!state.currentDrag || !state.dragPhoto) return;
  if (!els.dragPreview.dataset.active) {
    els.dragPreview.innerHTML = `<img alt="">`;
    els.dragPreview.querySelector("img").src = state.dragPhoto.url;
    els.dragPreview.dataset.active = "true";
  }
  els.dragPreview.classList.toggle("large-photo", large);
  els.dragPreview.classList.remove("hidden");
  if (large) {
    const size = largePreviewSize();
    const left = Math.min(Math.max(clientX - size / 2, 8), window.innerWidth - size - 8);
    const top = Math.min(Math.max(clientY - size / 2, 8), window.innerHeight - size - 8);
    els.dragPreview.style.left = `${left}px`;
    els.dragPreview.style.top = `${top}px`;
  } else {
    els.dragPreview.style.left = `${clientX - state.currentDrag.offsetX}px`;
    els.dragPreview.style.top = `${clientY - state.currentDrag.offsetY}px`;
  }
}

function largePreviewSize() {
  if (window.innerWidth <= 760) return Math.min(window.innerWidth * 0.78, 420);
  return Math.min(window.innerWidth * 0.56, 520);
}

function moveFolderDragPreview(clientX, clientY) {
  if (!state.folderDrag) return;
  if (!els.dragPreview.dataset.active) {
    const stack = state.stacks[state.folderDrag.slot];
    els.dragPreview.innerHTML = `<div class="stack-drag-card"><strong></strong><span></span></div>`;
    els.dragPreview.querySelector("strong").textContent = stack?.label || state.folderDrag.label;
    els.dragPreview.querySelector("span").textContent = `${stack?.photos.length || 0} photo${stack?.photos.length === 1 ? "" : "s"}`;
    els.dragPreview.dataset.active = "folder";
  }
  els.dragPreview.classList.remove("hidden");
  els.dragPreview.style.left = `${clientX - state.folderDrag.offsetX}px`;
  els.dragPreview.style.top = `${clientY - state.folderDrag.offsetY}px`;
}

function movePhotoDragPreview(clientX, clientY) {
  if (!state.photoDrag) return;
  if (!els.dragPreview.dataset.active) {
    els.dragPreview.innerHTML = `<img alt="">`;
    els.dragPreview.querySelector("img").src = state.photoDrag.photo.url;
    els.dragPreview.dataset.active = "photo";
  }
  els.dragPreview.classList.remove("large-photo", "hidden");
  els.dragPreview.style.left = `${clientX - state.photoDrag.offsetX}px`;
  els.dragPreview.style.top = `${clientY - state.photoDrag.offsetY}px`;
}

function hideDragPreview() {
  els.dragPreview.classList.add("hidden");
  els.dragPreview.innerHTML = "";
  els.dragPreview.style.left = "";
  els.dragPreview.style.top = "";
  els.dragPreview.classList.remove("large-photo");
  delete els.dragPreview.dataset.active;
  state.dragPhoto = null;
}

function stackAtPoint(x, y) {
  const wasHidden = els.dragPreview.classList.contains("hidden");
  els.dragPreview.classList.add("hidden");
  const target = document.elementFromPoint(x, y)?.closest(".stack-cell");
  if (!wasHidden) els.dragPreview.classList.remove("hidden");
  return target;
}

function folderCardAtPoint(x, y) {
  const wasHidden = els.dragPreview.classList.contains("hidden");
  els.dragPreview.classList.add("hidden");
  const target = document.elementFromPoint(x, y)?.closest(".folder-card");
  if (!wasHidden) els.dragPreview.classList.remove("hidden");
  return target;
}

function clearDropTargets() {
  els.stackCells.forEach((cell) => cell.classList.remove("drop-target"));
  els.folderGrid.querySelectorAll(".folder-card").forEach((card) => card.classList.remove("drop-target"));
}

function showExport() {
  renderFinalGrid();
  showView("export");
  scheduleProjectSave();
}

function renderFinalGrid() {
  els.finalGrid.innerHTML = "";
  outputEntries().forEach((entry) => {
    const card = document.createElement("div");
    card.className = "mini-card";
    card.innerHTML = `<img alt=""><strong></strong><span></span>`;
    card.querySelector("img").src = entry.photo.url;
    card.querySelector("strong").textContent = entry.path;
    card.querySelector("span").textContent = entry.photo.originalName;
    els.finalGrid.appendChild(card);
  });
}

function outputEntries() {
  const entries = [];
  state.stacks.forEach((stack) => {
    const folder = safeName(stack.label);
    stack.photos.forEach((photo, index) => {
      entries.push({ path: `${folder}/${String(index + 1).padStart(3, "0")}_${photo.jpegName}`, photo });
    });
  });
  state.unknown.forEach((photo, index) => {
    entries.push({ path: `unknown-date/${String(index + 1).padStart(3, "0")}_${photo.jpegName}`, photo });
  });
  return entries;
}

async function saveOutputFolder() {
  // Trigger client-side ZIP download (no server needed)
  await downloadZip();
}

async function downloadZip() {
  const folder = `photo-cleanup-${timestamp()}`;
  const entries = await Promise.all(outputEntries().map(async (entry) => ({
    filename: `${folder}/${entry.path}`,
    bytes: new Uint8Array(await entry.photo.jpegBlob.arrayBuffer())
  })));
  entries.push({
    filename: `${folder}/manifest.json`,
    bytes: new TextEncoder().encode(JSON.stringify(manifest(), null, 2))
  });
  downloadBlob(`${folder}.zip`, createStoredZip(entries), "application/zip");
}

function downloadCsv() {
  const rows = [["output path", "original filename", "metadata year", "jpeg size", "status"]];
  outputEntries().forEach((entry) => {
    rows.push([entry.path, entry.photo.originalName, entry.photo.metadataYear || "", entry.photo.jpegSize, entry.path.split("/")[0]]);
  });
  downloadBlob("photo-cleanup.csv", new Blob([rows.map((row) => row.map(csvCell).join(",")).join("\n")], { type: "text/csv" }), "text/csv");
}

function downloadJson() {
  downloadBlob("photo-cleanup.json", new Blob([JSON.stringify(manifest(), null, 2)], { type: "application/json" }), "application/json");
}

function manifest() {
  return {
    appName: APP_NAME,
    exportedAt: new Date().toISOString(),
    originalsModified: false,
    removedPhotosSavedAsImages: false,
    stacks: state.stacks.map((stack) => ({ label: stack.label, start: stack.start, end: stack.end, count: stack.photos.length })),
    unknownCount: state.unknown.length,
    removedCount: state.removed.length,
    removedFiles: state.removed.map((photo) => ({
      originalName: photo.originalName,
      reason: photo.reason,
      metadataYear: photo.metadataYear,
      sourceHash: photo.sourceHash
    })),
    files: outputEntries().map((entry) => ({
      outputPath: entry.path,
      originalName: entry.photo.originalName,
      metadataYear: entry.photo.metadataYear,
      sortYear: photoYear(entry.photo),
      sortPeriod: detectedLabel(entry.photo),
      jpegSize: entry.photo.jpegSize
    }))
  };
}

function showView(name) {
  els.dashboardView.classList.toggle("hidden", name !== "dashboard");
  els.setupView.classList.toggle("hidden", name !== "setup");
  els.boardView.classList.toggle("hidden", name !== "board");
  els.exportView.classList.toggle("hidden", name !== "export");
}

function updateCounts() {
  const known = state.stacks.reduce((sum, stack) => sum + stack.photos.length, 0);
  const exactRemoved = state.removed.filter((photo) => photo.reason === "Exact duplicate" || photo.reason === "Duplicate image").length;
  els.knownCount.textContent = known;
  els.unknownCount.textContent = state.unknown.length;
  els.duplicateCount.textContent = exactRemoved || countExactDuplicates(state.photos);
}

function showWarnings(skipped) {
  const warnings = [];
  if (skipped.length) warnings.push(`Skipped or could not convert ${skipped.length} file(s): ${skipped.slice(0, 3).join("; ")}${skipped.length > 3 ? "..." : ""}`);
  warnings.push("Output is saved to a new folder or ZIP. Original photo folders are not changed.");
  els.warningBox.textContent = warnings.join(" ");
  els.warningBox.classList.toggle("hidden", warnings.length === 0);
}

function restart() {
  resetSelection();
  renderBoard();
  showView("setup");
}

function resetSelection() {
  state.importToken += 1;
  resetWorkingState();
  els.fileInput.value = "";
  els.loadStatus.textContent = "No photos selected.";
  els.importSummary.classList.add("hidden");
  els.importSummary.innerHTML = "";
  els.startButton.disabled = true;
  els.changePhotosButton.classList.add("hidden");
  els.duplicateReviewBox.classList.add("hidden");
  els.duplicateReviewList.innerHTML = "";
  els.warningBox.classList.add("hidden");
  updateCounts();
}

function newProject() {
  const name = prompt("Project name", suggestedProjectName());
  if (name == null) return;
  resetSelection();
  setActiveProject(createProjectId(), cleanProjectName(name));
  setSavedStatus(`New project: ${state.activeProjectName}`);
  showView("setup");
}

function setActiveProject(id, name) {
  state.activeProjectId = id;
  state.activeProjectName = cleanProjectName(name);
}

function cleanProjectName(name) {
  return (name || "").trim() || "Untitled Project";
}

function suggestedProjectName() {
  return `Photo Cleanup ${new Date().toLocaleDateString([], { year: "numeric", month: "short", day: "numeric" })}`;
}

function createProjectId() {
  if (globalThis.crypto?.randomUUID) return `project-${globalThis.crypto.randomUUID()}`;
  return `project-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setMode(mode) {
  state.mode = mode;
  updateModeView();
}

function updateModeView() {
  els.sortModeButton.classList.toggle("active", state.mode === "sort");
  els.reviewModeButton.classList.toggle("active", state.mode === "review");
  if (state.mode === "sort") {
    els.folderPanel.classList.add("hidden");
  } else if (state.stacks.length && state.folderSlot == null) {
    openFolder(0);
  }
}

function rememberUndo(label) {
  if (!state.photos.length && !state.stacks.length) return;
  state.undoStack.push({ label, snapshot: undoSnapshot() });
  if (state.undoStack.length > 25) state.undoStack.shift();
  updateUndoButton();
}

function undoSnapshot() {
  return {
    stacks: state.stacks.map((stack) => ({
      key: stack.key,
      label: stack.label,
      start: stack.start,
      end: stack.end,
      unit: stack.unit,
      manual: stack.manual,
      photoIds: stack.photos.map((photo) => photo.id)
    })),
    unknownIds: state.unknown.map((photo) => photo.id),
    removed: state.removed.map((photo) => ({ id: photo.id, reason: photo.reason })),
    folderSlot: state.folderSlot,
    mode: state.mode
  };
}

function restoreUndoSnapshot(snapshot) {
  const byId = new Map(state.photos.map((photo) => [photo.id, photo]));
  state.stacks = snapshot.stacks.map((stack) => ({
    key: stack.key,
    label: stack.label,
    start: stack.start,
    end: stack.end,
    unit: stack.unit,
    manual: stack.manual,
    photos: stack.photoIds.map((id) => byId.get(id)).filter(Boolean)
  }));
  state.unknown = snapshot.unknownIds.map((id) => byId.get(id)).filter(Boolean);
  state.removed = snapshot.removed.map((item) => {
    const photo = byId.get(item.id);
    return photo ? { ...photo, reason: item.reason } : null;
  }).filter(Boolean);
  state.folderSlot = snapshot.folderSlot;
  state.mode = snapshot.mode || "sort";
}

function undoLastAction() {
  const item = state.undoStack.pop();
  if (!item) return;
  restoreUndoSnapshot(item.snapshot);
  renderBoard();
}

function updateUndoButton() {
  els.undoButton.disabled = state.undoStack.length === 0;
}

function openDetail(photo) {
  if (!photo) return;
  state.detailPhoto = photo;
  state.detailZoom = 1;
  state.detailRotation = 0;
  els.detailTitle.textContent = photo.originalName;
  els.detailImage.src = photo.url;
  els.detailMeta.innerHTML = "";
  [
    `Filename: ${photo.originalName}`,
    `Detected: ${detectedLabel(photo)}`,
    `Taken year: ${photo.metadataYear || "unknown"}`,
    `File year: ${photo.modifiedYear || "unknown"}`,
    `Size: ${formatBytes(photo.originalSize || photo.jpegSize || 0)}`,
    `Dimensions: ${photo.width || "?"} x ${photo.height || "?"}`
  ].forEach((text) => {
    const item = document.createElement("span");
    item.textContent = text;
    els.detailMeta.appendChild(item);
  });
  updateDetailTransform();
  els.detailViewer.classList.remove("hidden");
}

function closeDetail() {
  els.detailViewer.classList.add("hidden");
  els.detailImage.removeAttribute("src");
  state.detailPhoto = null;
}

function zoomDetail(factor) {
  state.detailZoom = Math.min(5, Math.max(0.25, state.detailZoom * factor));
  updateDetailTransform();
}

function rotateDetail() {
  state.detailRotation = (state.detailRotation + 90) % 360;
  updateDetailTransform();
}

function updateDetailTransform() {
  els.detailImage.style.transform = `scale(${state.detailZoom}) rotate(${state.detailRotation}deg)`;
}

function scheduleProjectSave() {
  if (!state.photos.length) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveProjectNow("Project autosaved."), 900);
}

async function saveProjectNow(message) {
  if (!state.photos.length) return;
  try {
    ensureActiveProject();
    await putProject(projectSnapshot());
    els.restoreProjectButton.classList.remove("hidden");
    els.clearProjectButton.classList.remove("hidden");
    els.dashboardRestoreButton.classList.remove("hidden");
    els.dashboardClearButton.classList.remove("hidden");
    await checkSavedProject();
    setSavedStatus(`${state.activeProjectName}: ${message} ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
  } catch (error) {
    setSavedStatus(`Could not save project: ${error.message || error}`, true);
  }
}

async function saveProjectAs() {
  if (!state.photos.length) return;
  const name = prompt("Save project as", state.activeProjectName || suggestedProjectName());
  if (name == null) return;
  setActiveProject(createProjectId(), cleanProjectName(name));
  await saveProjectNow("Project saved as new copy.");
}

function ensureActiveProject() {
  if (!state.activeProjectId) setActiveProject(createProjectId(), state.activeProjectName || suggestedProjectName());
}

function projectSnapshot() {
  ensureActiveProject();
  return {
    id: state.activeProjectId,
    name: state.activeProjectName,
    savedAt: new Date().toISOString(),
    settings: getTimelineSettings(),
    photos: state.photos.map((photo) => ({
      id: photo.id,
      originalName: photo.originalName,
      originalSize: photo.originalSize,
      jpegName: photo.jpegName,
      jpegBlob: photo.jpegBlob,
      jpegSize: photo.jpegSize,
      width: photo.width,
      height: photo.height,
      sourceHash: photo.sourceHash,
      jpegHash: photo.jpegHash,
      metadataDate: photo.metadataDate ? photo.metadataDate.toISOString() : null,
      metadataYear: photo.metadataYear,
      modifiedYear: photo.modifiedYear,
      lastModified: photo.lastModified
    })),
    stacks: state.stacks.map((stack) => ({
      key: stack.key,
      label: stack.label,
      start: stack.start,
      end: stack.end,
      unit: stack.unit,
      manual: stack.manual,
      photoIds: stack.photos.map((photo) => photo.id)
    })),
    unknownIds: state.unknown.map((photo) => photo.id),
    removed: state.removed.map((photo) => ({
      id: photo.id,
      reason: photo.reason
    }))
  };
}

async function portableProjectSnapshot() {
  const snapshot = projectSnapshot();
  snapshot.portable = true;
  snapshot.photos = await Promise.all(state.photos.map(async (photo) => ({
    id: photo.id,
    originalName: photo.originalName,
    originalSize: photo.originalSize,
    jpegName: photo.jpegName,
    jpegDataUrl: await blobToDataUrl(photo.jpegBlob),
    jpegSize: photo.jpegSize,
    width: photo.width,
    height: photo.height,
    sourceHash: photo.sourceHash,
    jpegHash: photo.jpegHash,
    metadataDate: photo.metadataDate ? photo.metadataDate.toISOString() : null,
    metadataYear: photo.metadataYear,
    modifiedYear: photo.modifiedYear,
    lastModified: photo.lastModified
  })));
  return snapshot;
}

async function exportProjectFile() {
  if (!state.photos.length) return;
  const project = await portableProjectSnapshot();
  downloadBlob(`photo-cleanup-project-${timestamp()}.json`, new Blob([JSON.stringify(project)], { type: "application/json" }), "application/json");
}

async function importProjectFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const project = JSON.parse(await file.text());
    if (!project.portable) throw new Error("This does not look like an exported project file.");
    project.photos = await Promise.all(project.photos.map(async (photo) => ({
      ...photo,
      jpegBlob: await dataUrlToBlob(photo.jpegDataUrl)
    })));
    project.id = createProjectId();
    project.name = cleanProjectName(project.name || file.name.replace(/\.json$/i, ""));
    restoreProject(project);
    showView("board");
    saveProjectNow("Imported project saved.");
  } catch (error) {
    setSavedStatus(`Could not import project: ${error.message || error}`, true);
  } finally {
    event.target.value = "";
  }
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function dataUrlToBlob(dataUrl) {
  const response = await fetch(dataUrl);
  return await response.blob();
}

async function restoreSavedProject(projectId = null) {
  try {
    const project = projectId ? await getProject(projectId) : await getLatestProject();
    if (!project) {
      setSavedStatus("No saved project was found.", true);
      return;
    }
    restoreProject(project);
    setSavedStatus(`Opened ${projectName(project)} from ${new Date(project.savedAt).toLocaleString()}.`);
  } catch (error) {
    setSavedStatus(`Could not restore project: ${error.message || error}`, true);
  }
}

function restoreProject(project) {
  resetWorkingState();
  setActiveProject(project.id || createProjectId(), project.name || "Saved Project");
  applySavedSettings(project.settings || {});
  const photos = (project.photos || []).map(savedPhotoToPhoto);
  const byId = new Map(photos.map((photo) => [photo.id, photo]));
  state.photos = photos;
  state.stacks = (project.stacks || []).map((stack) => ({
    key: stack.key,
    label: stack.label,
    start: stack.start,
    end: stack.end,
    unit: stack.unit,
    manual: stack.manual,
    photos: (stack.photoIds || []).map((id) => byId.get(id)).filter(Boolean)
  }));
  state.stacks = fillRestoredStacks(state.stacks);
  state.unknown = (project.unknownIds || []).map((id) => byId.get(id)).filter(Boolean);
  state.removed = (project.removed || []).map((item) => {
    const photo = byId.get(item.id);
    return photo ? { ...photo, reason: item.reason || "Removed" } : null;
  }).filter(Boolean);

  els.fileInput.value = "";
  els.changePhotosButton.classList.remove("hidden");
  els.startButton.disabled = state.photos.length === 0;
  els.loadStatus.textContent = `${state.photos.length} photo${state.photos.length === 1 ? "" : "s"} restored.`;
  showWarnings([]);
  if (state.stacks.length) {
    showView("board");
    renderBoard();
  } else {
    showView("setup");
    updateCounts();
  }
}

function savedPhotoToPhoto(item) {
  const url = URL.createObjectURL(item.jpegBlob);
  return {
    id: item.id,
    originalName: item.originalName,
    originalSize: item.originalSize,
    jpegName: item.jpegName,
    jpegBlob: item.jpegBlob,
    jpegSize: item.jpegSize,
    url,
    width: item.width,
    height: item.height,
    sourceHash: item.sourceHash,
    jpegHash: item.jpegHash,
    metadataDate: item.metadataDate ? new Date(item.metadataDate) : null,
    metadataYear: item.metadataYear,
    modifiedYear: item.modifiedYear,
    lastModified: item.lastModified
  };
}

function applySavedSettings(settings) {
  els.timelineStartInput.value = settings.startYear || "";
  els.timelineEndInput.value = settings.endYear || "";
  els.stackModeSelect.value = settings.mode || "auto";
  els.useModifiedDateInput.checked = Boolean(settings.useModifiedDate);
}

async function checkSavedProject() {
  try {
    const projects = await listProjects();
    renderProjectList(projects);
    const hasProjects = projects.length > 0;
    els.restoreProjectButton.classList.toggle("hidden", !hasProjects);
    els.clearProjectButton.classList.toggle("hidden", !state.activeProjectId);
    els.dashboardRestoreButton.classList.toggle("hidden", !hasProjects);
    els.dashboardClearButton.classList.toggle("hidden", !hasProjects);
    if (hasProjects) {
      setSavedStatus(`${projects.length} saved project${projects.length === 1 ? "" : "s"} available.`);
    }
  } catch {
    setSavedStatus("Saved project storage is not available in this browser.", true);
  }
}

function renderProjectList(projects) {
  els.dashboardProjectList.innerHTML = "";
  if (!projects.length) {
    const empty = document.createElement("div");
    empty.className = "project-card empty";
    empty.innerHTML = "<strong>No saved projects yet</strong><span>Start a new project or import a project file.</span>";
    els.dashboardProjectList.appendChild(empty);
    return;
  }
  projects.forEach((project) => {
    const card = document.createElement("div");
    card.className = "project-card";
    const details = document.createElement("div");
    const savedAt = project.savedAt ? new Date(project.savedAt).toLocaleString() : "not saved yet";
    const photoCount = project.photos?.length || 0;
    details.innerHTML = `<strong></strong><span></span>`;
    details.querySelector("strong").textContent = projectName(project);
    details.querySelector("span").textContent = `${photoCount} photo${photoCount === 1 ? "" : "s"} - saved ${savedAt}`;

    const actions = document.createElement("div");
    actions.className = "project-card-actions";
    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "secondary";
    openButton.textContent = "Open";
    openButton.addEventListener("click", () => restoreSavedProject(project.id));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "ghost";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteSavedProject(project.id, projectName(project)));
    actions.append(openButton, deleteButton);
    card.append(details, actions);
    els.dashboardProjectList.appendChild(card);
  });
}

function projectName(project) {
  return cleanProjectName(project?.name || (project?.id === LEGACY_PROJECT_ID ? "Saved Project" : "Untitled Project"));
}

function setSavedStatus(text, isWarning = false) {
  els.savedProjectStatus.textContent = text;
  els.savedProjectStatus.classList.remove("hidden");
  els.savedProjectStatus.classList.toggle("warning", isWarning);
}

function openProjectDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("projects")) {
        db.createObjectStore("projects", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function putProject(project) {
  const db = await openProjectDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("projects", "readwrite");
    tx.objectStore("projects").put(project);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function getProject(projectId) {
  const db = await openProjectDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("projects", "readonly");
    const request = tx.objectStore("projects").get(projectId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function listProjects() {
  const db = await openProjectDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("projects", "readonly");
    const request = tx.objectStore("projects").getAll();
    request.onsuccess = () => {
      const projects = (request.result || []).sort((a, b) => new Date(b.savedAt || 0) - new Date(a.savedAt || 0));
      resolve(projects);
    };
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

async function getLatestProject() {
  const projects = await listProjects();
  return projects[0] || null;
}

async function clearSavedProject() {
  if (state.activeProjectId) {
    await deleteSavedProject(state.activeProjectId, state.activeProjectName);
    return;
  }
  setSavedStatus("No current saved project is open.", true);
}

async function clearAllSavedProjects() {
  if (!confirm("Clear all saved projects in this browser? Your original photo folders will not be changed.")) return;
  try {
    await deleteAllProjects();
    state.activeProjectId = null;
    state.activeProjectName = "Untitled Project";
    setSavedStatus("All saved projects cleared in this browser.");
    await checkSavedProject();
  } catch (error) {
    setSavedStatus(`Could not clear saved projects: ${error.message || error}`, true);
  }
}

async function deleteSavedProject(projectId, name) {
  if (!projectId) return;
  if (!confirm(`Delete "${cleanProjectName(name)}" from this browser? Your original photo folders will not be changed.`)) return;
  try {
    await deleteProject(projectId);
    if (state.activeProjectId === projectId) {
      state.activeProjectId = null;
      state.activeProjectName = "Untitled Project";
    }
    setSavedStatus(`Deleted ${cleanProjectName(name)}.`);
    await checkSavedProject();
  } catch (error) {
    setSavedStatus(`Could not delete project: ${error.message || error}`, true);
  }
}

async function deleteProject(projectId) {
  const db = await openProjectDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("projects", "readwrite");
    tx.objectStore("projects").delete(projectId);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function deleteAllProjects() {
  const db = await openProjectDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("projects", "readwrite");
    tx.objectStore("projects").clear();
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

function getTimelineSettings() {
  return {
    startYear: readYearInput(els.timelineStartInput),
    endYear: readYearInput(els.timelineEndInput),
    mode: els.stackModeSelect.value,
    useModifiedDate: els.useModifiedDateInput.checked
  };
}

function readYearInput(input) {
  const year = Number(input.value);
  return Number.isInteger(year) && year >= 1800 && year <= 2200 ? year : null;
}

function photoYear(photo) {
  if (photo.metadataYear) return photo.metadataYear;
  if (els.useModifiedDateInput.checked && photo.modifiedYear) return photo.modifiedYear;
  return null;
}

function makeDecades(firstYear, lastYear) {
  const firstDecade = Math.floor(firstYear / 10) * 10;
  const lastDecade = Math.floor(lastYear / 10) * 10;
  const decades = [];
  for (let start = firstDecade; start <= lastDecade; start += 10) {
    decades.push({ start, end: start + 9, label: `${start}s` });
  }
  return decades;
}

function makeEvenRanges(firstYear, lastYear) {
  const first = Math.min(firstYear, lastYear);
  const last = Math.max(firstYear, lastYear);
  const span = last - first + 1;
  const count = Math.min(8, span);
  const ranges = [];
  let start = first;
  for (let index = 0; index < count; index += 1) {
    const remainingYears = last - start + 1;
    const remainingSlots = count - index;
    const size = Math.ceil(remainingYears / remainingSlots);
    const end = Math.min(last, start + size - 1);
    ranges.push({ start, end, label: start === end ? String(start) : `${start}-${end}` });
    start = end + 1;
  }
  return ranges;
}

function fillBoardStacks(ranges) {
  const filled = ranges.slice(0, 8);
  while (filled.length < 8) {
    const index = filled.length + 1;
    filled.push({
      start: 0,
      end: 9999,
      label: `Review ${index}`,
      manual: true
    });
  }
  return filled;
}

function fillRestoredStacks(stacks) {
  const filled = stacks.slice(0, 8);
  while (filled.length < 8) {
    const index = filled.length + 1;
    filled.push({
      key: `review-${index}`,
      label: `Review ${index}`,
      start: 0,
      end: 9999,
      manual: true,
      photos: []
    });
  }
  return filled;
}

function makePeriodStacks(photos, settings, unit) {
  const values = photos.map((photo) => photoPeriodValue(photo, unit)).filter((value) => value != null).sort((a, b) => a - b);
  const firstYear = settings.startYear || periodYear(values[0], unit) || new Date().getFullYear();
  const lastYear = settings.endYear || periodYear(values[values.length - 1], unit) || firstYear;
  const unitsPerYear = unit === "month" ? 12 : 4;
  const firstValue = Math.min(firstYear, lastYear) * unitsPerYear;
  const lastValue = Math.max(firstYear, lastYear) * unitsPerYear + unitsPerYear - 1;
  const ranges = makeEvenPeriodRanges(firstValue, lastValue, unit);
  return fillBoardStacks(ranges).map((range) => ({
    key: range.label,
    label: range.label,
    start: range.start,
    end: range.end,
    unit,
    manual: Boolean(range.manual),
    photos: []
  }));
}

function makeEvenPeriodRanges(firstValue, lastValue, unit) {
  const first = Math.min(firstValue, lastValue);
  const last = Math.max(firstValue, lastValue);
  const span = last - first + 1;
  const count = Math.min(8, span);
  const ranges = [];
  let start = first;
  for (let index = 0; index < count; index += 1) {
    const remainingValues = last - start + 1;
    const remainingSlots = count - index;
    const size = Math.ceil(remainingValues / remainingSlots);
    const end = Math.min(last, start + size - 1);
    ranges.push({ start, end, label: periodRangeLabel(start, end, unit) });
    start = end + 1;
  }
  return ranges;
}

function photoPeriodValue(photo, unit) {
  const date = photoDate(photo);
  if (!date) {
    const year = photoYear(photo);
    if (!year) return null;
    return unit === "month" ? year * 12 : year * 4;
  }
  const year = date.getFullYear();
  if (unit === "month") return year * 12 + date.getMonth();
  return year * 4 + seasonIndex(date.getMonth());
}

function photoDate(photo) {
  if (photo.metadataDate) return photo.metadataDate;
  if (els.useModifiedDateInput.checked && photo.lastModified) return new Date(photo.lastModified);
  return null;
}

function detectedLabel(photo) {
  const sample = state.stacks[0];
  if (sample?.unit === "month" || sample?.unit === "season") {
    const value = photoPeriodValue(photo, sample.unit);
    return value == null ? "unknown" : periodLabel(value, sample.unit);
  }
  return photoYear(photo) || "unknown";
}

function periodYear(value, unit) {
  if (value == null) return null;
  return Math.floor(value / (unit === "month" ? 12 : 4));
}

function periodRangeLabel(start, end, unit) {
  if (start === end) return periodLabel(start, unit);
  return `${periodLabel(start, unit)}-${periodLabel(end, unit)}`;
}

function periodLabel(value, unit) {
  const unitsPerYear = unit === "month" ? 12 : 4;
  const year = Math.floor(value / unitsPerYear);
  const index = value % unitsPerYear;
  if (unit === "month") return `${MONTH_LABELS[index]} ${year}`;
  return `${SEASON_LABELS[index]} ${year}`;
}

function seasonIndex(month) {
  if (month <= 1 || month === 11) return 0;
  if (month <= 4) return 1;
  if (month <= 7) return 2;
  return 3;
}

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SEASON_LABELS = ["Winter", "Spring", "Summer", "Fall"];

function progressText() {
  const sorted = state.stacks.reduce((sum, stack) => sum + stack.photos.length, 0);
  const left = state.unknown.length;
  const total = sorted + left;
  return `${sorted} sorted of ${total}. ${left} left.`;
}

function revokeUrls() {
  state.photos.forEach((photo) => URL.revokeObjectURL(photo.url));
}

function countExactDuplicates(photos) {
  const seenOriginals = new Set();
  const seenImages = new Set();
  let duplicates = 0;
  photos.forEach((photo) => {
    if (seenOriginals.has(photo.sourceHash) || seenImages.has(photo.jpegHash)) {
      duplicates += 1;
    } else {
      seenOriginals.add(photo.sourceHash);
      seenImages.add(photo.jpegHash);
    }
  });
  return duplicates;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image decode failed"));
    image.src = url;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("canvas conversion failed")), type, quality);
  });
}

async function hashArrayBuffer(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function parseExifDate(buffer) {
  const view = new DataView(buffer);
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 4 < view.byteLength) {
    if (view.getUint8(offset) !== 0xff) break;
    const marker = view.getUint8(offset + 1);
    const length = view.getUint16(offset + 2, false);
    if (marker === 0xe1 && offset + 4 + length <= view.byteLength && ascii(view, offset + 4, 6) === "Exif") {
      return parseTiffDate(view, offset + 10, length - 8);
    }
    offset += 2 + length;
  }
  return null;
}

function parseTiffDate(view, start, length) {
  const endian = ascii(view, start, 2);
  const little = endian === "II";
  if (!little && endian !== "MM") return null;
  return readIfdDate(view, start, length, view.getUint32(start + 4, little), little, new Set());
}

function readIfdDate(view, tiffStart, tiffLength, offset, little, seen) {
  if (!offset || seen.has(offset)) return null;
  seen.add(offset);
  const ifd = tiffStart + offset;
  if (ifd + 2 > tiffStart + tiffLength) return null;
  const count = view.getUint16(ifd, little);
  for (let i = 0; i < count; i += 1) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > tiffStart + tiffLength) break;
    const tag = view.getUint16(entry, little);
    const type = view.getUint16(entry + 2, little);
    const valueCount = view.getUint32(entry + 4, little);
    const valueOffset = view.getUint32(entry + 8, little);
    if ((tag === 0x9003 || tag === 0x9004 || tag === 0x0132) && type === 2) {
      const text = ascii(view, valueCount <= 4 ? entry + 8 : tiffStart + valueOffset, valueCount);
      const parsed = exifDate(text);
      if (parsed) return parsed;
    }
    if (tag === 0x8769) {
      const nested = readIfdDate(view, tiffStart, tiffLength, valueOffset, little, seen);
      if (nested) return nested;
    }
  }
  return null;
}

function ascii(view, start, length) {
  let text = "";
  for (let i = 0; i < length && start + i < view.byteLength; i += 1) {
    const code = view.getUint8(start + i);
    if (code === 0) break;
    text += String.fromCharCode(code);
  }
  return text;
}

function exifDate(text) {
  const match = String(text).match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6]));
}

function getJpegName(name) {
  return `${name.replace(/\.[^.]+$/, "") || "photo"}.jpg`;
}

function safeName(text) {
  return String(text || "photos").replace(/[<>:"/\\|?*\x00-\x1f]/g, "-").replace(/\s+/g, " ").trim() || "photos";
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadBlob(filename, blob, type) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  if (type) link.type = type;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function createStoredZip(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  entries.forEach((entry) => {
    const filenameBytes = new TextEncoder().encode(entry.filename);
    const crc = crc32(entry.bytes);
    const localHeader = new Uint8Array(30 + filenameBytes.length);
    const localView = new DataView(localHeader.buffer);
    writeZipHeader(localView, 0x04034b50, 20, 0, 0, crc, entry.bytes.length, entry.bytes.length, filenameBytes.length);
    localHeader.set(filenameBytes, 30);
    localParts.push(localHeader, entry.bytes);

    const centralHeader = new Uint8Array(46 + filenameBytes.length);
    const centralView = new DataView(centralHeader.buffer);
    writeZipHeader(centralView, 0x02014b50, 20, 20, 0, crc, entry.bytes.length, entry.bytes.length, filenameBytes.length);
    centralView.setUint32(42, offset, true);
    centralHeader.set(filenameBytes, 46);
    centralParts.push(centralHeader);
    offset += localHeader.length + entry.bytes.length;
  });
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endHeader = new Uint8Array(22);
  const endView = new DataView(endHeader.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  return new Blob([...localParts, ...centralParts, endHeader], { type: "application/zip" });
}

function writeZipHeader(view, signature, versionMade, versionNeeded, flags, crc, compressedSize, uncompressedSize, filenameLength) {
  view.setUint32(0, signature, true);
  if (signature === 0x02014b50) {
    view.setUint16(4, versionMade, true);
    view.setUint16(6, versionNeeded, true);
    view.setUint16(8, flags, true);
    view.setUint16(10, 0, true);
    view.setUint32(16, crc, true);
    view.setUint32(20, compressedSize, true);
    view.setUint32(24, uncompressedSize, true);
    view.setUint16(28, filenameLength, true);
  } else {
    view.setUint16(4, versionNeeded, true);
    view.setUint16(6, flags, true);
    view.setUint16(8, 0, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, compressedSize, true);
    view.setUint32(22, uncompressedSize, true);
    view.setUint16(26, filenameLength, true);
  }
}

function crc32(bytes) {
  let crc = -1;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

init();
