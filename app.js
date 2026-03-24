// ── Config ────────────────────────────────────────────────────────────────────
const STORAGE_KEY       = 'mindful_sessions';
const TIMER_STATE_KEY   = 'mindful_timer_state';

const SUGGESTIONS = [
  'Close your eyes and take five slow, deep breaths.',
  'Stand up and gently stretch your neck and shoulders.',
  'Look out a window or at something 20 feet away for 20 seconds.',
  'Roll your wrists and wiggle your fingers — your hands worked hard.',
  'Take a short walk, even just to the kitchen and back.',
  'Drink a full glass of water slowly.',
  'Rest your palms over your closed eyes for a moment of darkness.',
  'Do five slow shoulder rolls forward, then five backward.',
];

// ── State ─────────────────────────────────────────────────────────────────────
let mode        = 'work';   // 'work' | 'break'
let running     = false;
let remaining   = 0;
let totalSecs   = 0;
let intervalId  = null;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const timerDisplay  = document.getElementById('timerDisplay');
const modeLabel     = document.getElementById('modeLabel');
const ringProgress  = document.getElementById('ringProgress');
const suggestionBox = document.getElementById('suggestionBox');
const suggestionTxt = document.getElementById('suggestionText');
const btnStartPause = document.getElementById('btnStartPause');
const btnReset      = document.getElementById('btnReset');
const workInput     = document.getElementById('workDuration');
const breakInput    = document.getElementById('breakDuration');
const sessionList   = document.getElementById('sessionList');
const sessionCount  = document.getElementById('sessionCount');

const CIRCUMFERENCE = 2 * Math.PI * 88; // r=88 → ≈ 553

// ── Timer core ────────────────────────────────────────────────────────────────
function getWorkSecs()  { return (parseInt(workInput.value)  || 25) * 60; }
function getBreakSecs() { return (parseInt(breakInput.value) ||  5) * 60; }

function initTimer() {
  remaining = mode === 'work' ? getWorkSecs() : getBreakSecs();
  totalSecs = remaining;
  updateDisplay();
  updateRing();
}

function saveTimerState() {
  localStorage.setItem(TIMER_STATE_KEY, JSON.stringify({
    mode, remaining, totalSecs,
    running,
    suggestion: suggestionBox.hidden ? null : suggestionTxt.textContent,
    workMins:  parseInt(workInput.value)  || 25,
    breakMins: parseInt(breakInput.value) ||  5,
  }));
}

function clearTimerState() {
  localStorage.removeItem(TIMER_STATE_KEY);
}

function tick() {
  remaining--;
  updateDisplay();
  updateRing();
  saveTimerState();
  if (remaining <= 0) onTimerEnd();
}

function onTimerEnd() {
  clearInterval(intervalId);
  running = false;

  if (mode === 'work') {
    saveSession();
    mode = 'break';
    showSuggestion();
    initTimer();
    start(); // auto-start break
  } else {
    mode = 'work';
    hideSuggestion();
    initTimer();
    btnStartPause.textContent = 'Start';
  }
}

function start() {
  running = true;
  btnStartPause.textContent = 'Pause';
  intervalId = setInterval(tick, 1000);
}

function pause() {
  running = false;
  btnStartPause.textContent = 'Resume';
  clearInterval(intervalId);
  saveTimerState();
}

function reset() {
  clearInterval(intervalId);
  running = false;
  mode = 'work';
  hideSuggestion();
  initTimer();
  btnStartPause.textContent = 'Start';
  clearTimerState();
}

// ── UI updates ────────────────────────────────────────────────────────────────
function formatTime(secs) {
  const m = String(Math.floor(secs / 60)).padStart(2, '0');
  const s = String(secs % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function updateDisplay() {
  timerDisplay.textContent = formatTime(remaining);
  modeLabel.textContent    = mode === 'work' ? 'work session' : 'break time';
  document.title           = `${formatTime(remaining)} — ${mode === 'work' ? 'Work' : 'Break'}`;
}

function updateRing() {
  const fraction = totalSecs > 0 ? remaining / totalSecs : 1;
  const offset   = CIRCUMFERENCE * (1 - fraction);
  ringProgress.style.strokeDashoffset = offset;
  ringProgress.classList.toggle('break-mode', mode === 'break');
}

function showSuggestion() {
  const pick = SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)];
  suggestionTxt.textContent = pick;
  suggestionBox.hidden = false;
}

function hideSuggestion() {
  suggestionBox.hidden = true;
}

// ── Session persistence ───────────────────────────────────────────────────────
function loadSessions() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

function saveSession() {
  const sessions = loadSessions();
  sessions.push({ completedAt: new Date().toISOString(), duration: getWorkSecs() / 60 });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  renderHistory();
}

function renderHistory() {
  const sessions = loadSessions();
  const today    = new Date().toDateString();
  const todayS   = sessions.filter(s => new Date(s.completedAt).toDateString() === today);

  sessionCount.textContent = todayS.length;
  sessionList.innerHTML = '';

  // Show most recent first, max 10
  [...todayS].reverse().slice(0, 10).forEach((s, i) => {
    const li   = document.createElement('li');
    const time = new Date(s.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    li.textContent = `Session ${todayS.length - i} — completed at ${time} · ${s.duration} min`;
    sessionList.appendChild(li);
  });
}

// ── Event listeners ───────────────────────────────────────────────────────────
btnStartPause.addEventListener('click', () => {
  if (running) pause(); else start();
});

btnReset.addEventListener('click', reset);

workInput.addEventListener('change', () => {
  if (!running && mode === 'work') initTimer();
});

breakInput.addEventListener('change', () => {
  if (!running && mode === 'break') initTimer();
});

// ── Boot ──────────────────────────────────────────────────────────────────────
function boot() {
  let restored = false;
  try {
    const saved = JSON.parse(localStorage.getItem(TIMER_STATE_KEY));
    if (saved) {
      mode      = saved.mode      || 'work';
      remaining = saved.remaining || 0;
      totalSecs = saved.totalSecs || 0;
      workInput.value  = saved.workMins  || 25;
      breakInput.value = saved.breakMins ||  5;

      if (saved.suggestion) {
        suggestionTxt.textContent = saved.suggestion;
        suggestionBox.hidden = false;
      }

      updateDisplay();
      updateRing();
      btnStartPause.textContent = saved.running ? 'Pause' : 'Resume';

      // If it was running when page closed, resume automatically
      if (saved.running) {
        running = true;
        intervalId = setInterval(tick, 1000);
      }

      restored = true;
    }
  } catch { /* fall through to fresh init */ }

  if (!restored) initTimer();
  renderHistory();
}

boot();