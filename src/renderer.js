// renderer.js — UI logic for index.html
// Manages screen state, language toggle, drag-and-drop, and result rendering.

// ── Language state ──────────────────────────────────────────────────────────
let currentLang = 'ja';
let currentResult = null; // holds the last Gemini response

const strings = {
  ja: {
    dropTitle: '書類の写真をここに入れてください',
    dropSub: '役所や学校から届いた書類の写真を入れると、\n何を・いつまでに・どうすればいいかを3行でお伝えします',
    chooseBtn: '写真を選ぶ',
    loading: '書類を読んでいます…',
    deadlineLabel: '期限',
    deadlineNone: '期限は見つかりませんでした',
    actionLabels: ['何を', 'いつまでに', 'どうやって'],
    daysLeft: (n) => n === 0 ? '今日まで' : n > 0 ? `あと${n}日` : `期限を過ぎています（${Math.abs(n)}日前）`,
    errNotDoc: '書類を読み取れませんでした。書類の写真を入れてください。',
    errRateLimit: 'サーバーが混雑しています。数分待ってからもう一度お試しください。',
    errTimeout: '時間切れです（30秒）。もう一度お試しください。',
    errApi: '読み取りに失敗しました。もう一度お試しください。',
    errNoKey: 'APIキーが設定されていません。設定からキーを入力してください。',
    retryBtn: 'もう一度試す',
    anotherBtn: '別の書類を読む',
    cameraBtn: 'カメラで撮る',
    cameraCancel: 'キャンセル',
    cameraRetake: '撮り直す',
    cameraUse: 'これで読む',
    cameraBack: 'ホームに戻る',
    cameraErrPermission: 'カメラの使用が許可されていません。\nシステムの設定でカメラを許可してください。',
    cameraErrNotFound: 'カメラが見つかりませんでした。\nPCにカメラが接続されているか確認してください。',
    cameraErrInUse: 'カメラを起動できませんでした。\n他のアプリがカメラを使用中の可能性があります。',
    cameraErrGeneric: 'カメラを使用できませんでした。',
  },
  en: {
    dropTitle: 'Drop your document photo here',
    dropSub: 'Drop a photo of an official document and get\n3-line action instructions — what to do, by when, and how.',
    chooseBtn: 'Choose photo',
    loading: 'Reading document…',
    deadlineLabel: 'Deadline',
    deadlineNone: 'No deadline found',
    actionLabels: ['What', 'By when', 'How'],
    daysLeft: (n) => n === 0 ? 'Due today' : n > 0 ? `${n} days left` : `Overdue by ${Math.abs(n)} days`,
    errNotDoc: 'Could not read a document. Please use a photo of an official document.',
    errRateLimit: 'Server is busy. Please wait a few minutes and try again.',
    errTimeout: 'Request timed out (30s). Please try again.',
    errApi: 'Reading failed. Please try again.',
    errNoKey: 'No API key set. Please enter your key in settings.',
    retryBtn: 'Try again',
    anotherBtn: 'Read another document',
    cameraBtn: 'Use camera',
    cameraCancel: 'Cancel',
    cameraRetake: 'Retake',
    cameraUse: 'Use this',
    cameraBack: 'Back to home',
    cameraErrPermission: 'Camera access was denied.\nPlease allow it in your system settings.',
    cameraErrNotFound: 'No camera found.\nPlease check that a camera is connected.',
    cameraErrInUse: 'Could not start camera.\nAnother app may be using it.',
    cameraErrGeneric: 'Could not use camera.',
  },
};

// ── Screen management ────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── DOM helpers ───────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

// ── Language toggle ──────────────────────────────────────────────────────────
function setLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  updateHomeText();
  if (currentResult) renderResult(currentResult);
}

document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLang(btn.dataset.lang));
});

function updateHomeText() {
  const s = strings[currentLang];
  $('drop-title').textContent = s.dropTitle;
  $('drop-sub').innerHTML = s.dropSub.replace('\n', '<br>');
  $('choose-btn').textContent = s.chooseBtn;
  $('camera-open-btn').textContent = '📷 ' + s.cameraBtn;
  $('camera-cancel-btn').textContent = s.cameraCancel;
  $('camera-retake-btn').textContent = s.cameraRetake;
  $('camera-use-btn').textContent = s.cameraUse;
  $('camera-back-btn').textContent = s.cameraBack;
}

// ── Startup: check for API key ────────────────────────────────────────────────
async function init() {
  const hasKey = await window.api.hasApiKey();
  if (hasKey) {
    showScreen('screen-home');
    updateHomeText();
  } else {
    showScreen('screen-setup');
  }
}

init();

// ── Setup screen ─────────────────────────────────────────────────────────────
$('eye-btn').addEventListener('click', () => {
  const input = $('key-input');
  input.type = input.type === 'password' ? 'text' : 'password';
});

$('get-key-link').addEventListener('click', () => {
  window.api.openExternal('https://aistudio.google.com/apikey');
});

$('save-btn').addEventListener('click', async () => {
  const apiKey = $('key-input').value.trim();
  if (!apiKey) return;

  const btn = $('save-btn');
  btn.disabled = true;
  btn.textContent = '確認中…';
  $('setup-error').textContent = '';

  const result = await window.api.validateAndSaveKey(apiKey);

  if (result.success) {
    showScreen('screen-home');
    updateHomeText();
  } else {
    $('setup-error').textContent =
      result.error === 'rate_limit'
        ? strings.ja.errRateLimit
        : '鍵が正しくないようです。もう一度確認してください。';
    btn.disabled = false;
    btn.textContent = '保存して始める';
  }
});

$('key-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') $('save-btn').click();
});

// ── Home screen — drag and drop ───────────────────────────────────────────────
const dropZone = $('drop-zone');

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  // Drag-and-drop file reading handled via IPC in slice 2
  // For now, the drop triggers the file picker
  handleChoosePhoto();
});

$('choose-btn').addEventListener('click', handleChoosePhoto);

async function handleChoosePhoto() {
  showResultScreen();
  const response = await window.api.selectAndReadDocument();

  if (!response) {
    // User cancelled the file picker
    showScreen('screen-home');
    return;
  }

  // Show the photo
  if (response.imageDataUrl) {
    $('doc-photo').src = response.imageDataUrl;
  }

  if (response.error) {
    showError(response.error);
    return;
  }

  currentResult = response.result;
  renderResult(response.result);
}

function showResultScreen() {
  // Reset result panel to loading state
  $('loading-state').style.display = 'block';
  $('results-state').style.display = 'none';
  $('error-state').style.display = 'none';
  $('result-footer').style.display = 'none';
  $('retry-btn').style.display = 'none';
  $('doc-photo').src = '';
  $('scan-line').classList.add('active');
  // Reset action items
  [0, 1, 2].forEach(i => {
    const el = $('action-' + i);
    if (el) el.classList.remove('visible');
  });

  showScreen('screen-result');
  $('loading-text').textContent = strings[currentLang].loading;
}

// ── Render results ─────────────────────────────────────────────────────────────
function renderResult(data) {
  const s = strings[currentLang];
  $('scan-line').classList.remove('active');
  $('loading-state').style.display = 'none';
  $('result-footer').style.display = 'block';
  $('retry-btn').style.display = 'none';
  $('another-btn').textContent = s.anotherBtn;

  if (data.error === 'not_a_document') {
    showError('not_a_document');
    return;
  }

  $('results-state').style.display = 'block';
  $('error-state').style.display = 'none';

  // Deadline
  $('deadline-label').textContent = s.deadlineLabel;
  if (data.deadline) {
    if (currentLang === 'ja') {
      $('deadline-value').textContent = data.deadline;        // "2025年10月31日"
      $('deadline-value-sub').textContent = data.deadline_jp || ''; // "令和7年10月31日"
    } else {
      $('deadline-value').textContent = data.en?.by_when || data.deadline;
      $('deadline-value-sub').textContent = '';
    }
    $('deadline-days').textContent = data.days_remaining != null
      ? s.daysLeft(data.days_remaining)
      : '';
    $('deadline-value').style.color = 'var(--vermilion)';
    $('deadline-value').style.removeProperty('color'); // reset before re-apply
    $('deadline-value').style.color = 'var(--vermilion)';
  } else {
    $('deadline-value').textContent = s.deadlineNone;
    $('deadline-value-sub').textContent = '';
    $('deadline-value').style.color = 'var(--ink-muted)';
    $('deadline-days').textContent = '';
  }

  // 3 action lines — staggered reveal
  const content = currentLang === 'ja' ? data.ja : data.en;
  // Construct "by_when" with full year from deadline_iso when available
  function makeByWhen() {
    if (currentLang === 'ja' && data.deadline_iso) {
      const [y, m, d] = data.deadline_iso.split('-').map(Number);
      return `${y}年${m}月${d}日まで`;
    }
    return content?.by_when || data.deadline || null;
  }
  const values = [content?.what, makeByWhen(), content?.how];

  s.actionLabels.forEach((label, i) => {
    $('action-label-' + i).textContent = label;
    $('action-value-' + i).textContent = values[i] || '—';
  });

  [0, 1, 2].forEach((i) => {
    setTimeout(() => {
      $('action-' + i)?.classList.add('visible');
    }, 200 + i * 350);
  });
}

function showError(errorCode) {
  const s = strings[currentLang];
  $('scan-line').classList.remove('active');
  $('loading-state').style.display = 'none';
  $('results-state').style.display = 'none';
  $('error-state').style.display = 'block';
  $('result-footer').style.display = 'block';
  $('another-btn').textContent = s.anotherBtn;

  const messages = {
    not_a_document: s.errNotDoc,
    rate_limit: s.errRateLimit,
    timeout: s.errTimeout,
    api_error: s.errApi,
    no_api_key: s.errNoKey,
  };
  $('error-msg').textContent = messages[errorCode] || s.errApi;

  if (errorCode === 'api_error' || errorCode === 'rate_limit' || errorCode === 'timeout') {
    $('retry-btn').style.display = 'inline-block';
    $('retry-btn').textContent = s.retryBtn;
  }
}

// ── Result screen buttons ──────────────────────────────────────────────────────
$('another-btn').addEventListener('click', () => {
  currentResult = null;
  showScreen('screen-home');
  updateHomeText();
});

$('retry-btn').addEventListener('click', handleChoosePhoto);

// ── Settings overlay ──────────────────────────────────────────────────────────
function openSettings() {
  $('settings-overlay').classList.add('open');
}
function closeSettings() {
  $('settings-overlay').classList.remove('open');
}

$('gear-btn').addEventListener('click', openSettings);
$('gear-btn-result').addEventListener('click', openSettings);
$('gear-btn-camera').addEventListener('click', openSettings);
$('close-settings-btn').addEventListener('click', closeSettings);
$('settings-overlay').addEventListener('click', (e) => {
  if (e.target === $('settings-overlay')) closeSettings();
});

$('change-key-btn').addEventListener('click', () => {
  closeSettings();
  showScreen('screen-setup');
  $('key-input').value = '';
  $('setup-error').textContent = '';
});

$('delete-key-btn').addEventListener('click', async () => {
  await window.api.deleteApiKey();
  closeSettings();
  currentResult = null;
  showScreen('screen-setup');
  $('key-input').value = '';
  $('setup-error').textContent = '';
});

// ── Camera screen ─────────────────────────────────────────────────────────────
let cameraStream = null;
let capturedDataUrl = null;

async function openCamera() {
  showScreen('screen-camera');
  $('camera-video').style.display = 'block';
  $('camera-snapshot').style.display = 'none';
  $('camera-snapshot').src = '';
  $('camera-viewfinder-ctrl').style.display = 'flex';
  $('camera-review-ctrl').style.display = 'none';
  $('camera-error-overlay').style.display = 'none';
  capturedDataUrl = null;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 3840 }, height: { ideal: 2160 }, facingMode: { ideal: 'environment' } },
      audio: false,
    });
    cameraStream = stream;
    $('camera-video').srcObject = stream;
  } catch (err) {
    showCameraError(err);
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
  $('camera-video').srcObject = null;
}

function showCameraError(err) {
  stopCamera();
  const s = strings[currentLang];
  let msg;
  if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
    msg = s.cameraErrPermission;
  } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
    msg = s.cameraErrNotFound;
  } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
    msg = s.cameraErrInUse;
  } else {
    msg = s.cameraErrGeneric;
  }
  $('camera-error-msg').textContent = msg;
  $('camera-error-overlay').style.display = 'flex';
}

$('camera-open-btn').addEventListener('click', openCamera);

$('camera-cancel-btn').addEventListener('click', () => {
  stopCamera();
  showScreen('screen-home');
  updateHomeText();
});

$('camera-back-btn').addEventListener('click', () => {
  showScreen('screen-home');
  updateHomeText();
});

$('camera-shutter-btn').addEventListener('click', () => {
  const video = $('camera-video');
  const canvas = $('camera-canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  capturedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

  stopCamera();

  $('camera-snapshot').src = capturedDataUrl;
  $('camera-snapshot').style.display = 'block';
  $('camera-video').style.display = 'none';
  $('camera-viewfinder-ctrl').style.display = 'none';
  $('camera-review-ctrl').style.display = 'flex';
});

$('camera-retake-btn').addEventListener('click', openCamera);

$('camera-use-btn').addEventListener('click', async () => {
  if (!capturedDataUrl) return;
  const [meta, base64] = capturedDataUrl.split(',');
  const mimeType = meta.split(':')[1].split(';')[0];

  showResultScreen();
  $('doc-photo').src = capturedDataUrl;

  const response = await window.api.readDocumentFromBase64({ base64, mimeType });

  if (!response) {
    showScreen('screen-home');
    return;
  }

  if (response.error) {
    showError(response.error);
    return;
  }

  currentResult = response.result;
  renderResult(response.result);
});
