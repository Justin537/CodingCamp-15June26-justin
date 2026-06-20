/* ═══════════════════════════════════════════
   THEME — light / dark
═══════════════════════════════════════════ */
const THEME_KEY   = 'dashboard_theme';
const btnTheme    = document.getElementById('theme-toggle');

function applyTheme(theme) {
  if (theme === 'light') {
    document.body.classList.add('light');
    btnTheme.textContent = '☀️';
    btnTheme.setAttribute('aria-label', 'Switch to dark mode');
  } else {
    document.body.classList.remove('light');
    btnTheme.textContent = '🌙';
    btnTheme.setAttribute('aria-label', 'Switch to light mode');
  }
}

function toggleTheme() {
  const next = document.body.classList.contains('light') ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
}

// Init theme from storage (default: dark)
applyTheme(localStorage.getItem(THEME_KEY) || 'dark');
btnTheme.addEventListener('click', toggleTheme);


/* ═══════════════════════════════════════════
   GREETING — name, time & date
═══════════════════════════════════════════ */
const NAME_KEY      = 'dashboard_name';
const greetingMsg   = document.getElementById('greeting-msg');
const greetingDate  = document.getElementById('greeting-date');
const greetingTime  = document.getElementById('greeting-time');
const nameEditBtn   = document.getElementById('name-edit-btn');
const nameForm      = document.getElementById('name-form');
const nameInput     = document.getElementById('name-input');
const nameSaveBtn   = document.getElementById('name-save-btn');
const nameCancelBtn = document.getElementById('name-cancel-btn');

function getSavedName() {
  return localStorage.getItem(NAME_KEY) || '';
}

function buildGreeting(period, name) {
  return name ? `${period}, ${name}! 👋` : `${period}! 👋`;
}

function updateClock() {
  const now    = new Date();
  const h      = now.getHours();
  const period = h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';

  greetingMsg.textContent = buildGreeting(period, getSavedName());

  greetingDate.textContent = now.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  greetingTime.textContent = now.toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
}

// ── Name edit form
function openNameForm() {
  nameInput.value = getSavedName();
  nameForm.removeAttribute('hidden');
  nameEditBtn.setAttribute('hidden', '');
  nameInput.focus();
  nameInput.select();
}

function closeNameForm() {
  nameForm.setAttribute('hidden', '');
  nameEditBtn.removeAttribute('hidden');
}

function saveName() {
  const name = nameInput.value.trim();
  localStorage.setItem(NAME_KEY, name);
  closeNameForm();
  updateClock(); // refresh greeting immediately
}

nameEditBtn.addEventListener('click', openNameForm);
nameSaveBtn.addEventListener('click', saveName);
nameCancelBtn.addEventListener('click', closeNameForm);
nameInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') saveName();
  if (e.key === 'Escape') closeNameForm();
});

updateClock();
setInterval(updateClock, 1000);


/* ═══════════════════════════════════════════
   FOCUS TIMER — 25 minutes
═══════════════════════════════════════════ */
const TIMER_TOTAL    = 25 * 60;   // seconds
let timerRemaining   = TIMER_TOTAL;
let timerInterval    = null;
let timerRunning     = false;

const timerDisplay  = document.getElementById('timer-display');
const btnStart      = document.getElementById('timer-start');
const btnStop       = document.getElementById('timer-stop');
const btnReset      = document.getElementById('timer-reset');

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timerRemaining);
}

function startTimer() {
  if (timerRunning) return;
  if (timerRemaining === 0) return;
  timerRunning = true;
  timerDisplay.classList.add('running');
  timerDisplay.classList.remove('ended');
  timerInterval = setInterval(() => {
    timerRemaining--;
    renderTimer();
    if (timerRemaining === 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerDisplay.classList.remove('running');
      timerDisplay.classList.add('ended');
      // browser notification attempt
      if (Notification.permission === 'granted') {
        new Notification('Focus session complete! 🎉');
      }
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timerDisplay.classList.remove('running');
}

function resetTimer() {
  stopTimer();
  timerRemaining = TIMER_TOTAL;
  timerDisplay.classList.remove('ended');
  renderTimer();
}

btnStart.addEventListener('click', () => {
  // Request notification permission on first start
  if (Notification.permission === 'default') Notification.requestPermission();
  startTimer();
});
btnStop.addEventListener('click', stopTimer);
btnReset.addEventListener('click', resetTimer);

renderTimer();


/* ═══════════════════════════════════════════
   TO-DO LIST
═══════════════════════════════════════════ */
const TODO_KEY    = 'dashboard_todos';
const todoInput   = document.getElementById('todo-input');
const btnTodoAdd  = document.getElementById('todo-add');
const todoList    = document.getElementById('todo-list');

// Edit modal elements
const editModal   = document.getElementById('edit-modal');
const editInput   = document.getElementById('edit-input');
const btnEditSave = document.getElementById('edit-save');
const btnEditCancel = document.getElementById('edit-cancel');
let editingId     = null;

// ── Storage helpers
function loadTodos() {
  return JSON.parse(localStorage.getItem(TODO_KEY) || '[]');
}

function saveTodos(todos) {
  localStorage.setItem(TODO_KEY, JSON.stringify(todos));
}

// ── Render
function renderTodos() {
  const todos = loadTodos();
  todoList.innerHTML = '';

  if (todos.length === 0) {
    todoList.innerHTML = '<li style="color:var(--text-muted);font-size:0.88rem;padding:8px 4px;">No tasks yet. Add one above!</li>';
    return;
  }

  todos.forEach(todo => {
    const li = document.createElement('li');
    li.className = `todo-item${todo.done ? ' done' : ''}`;
    li.dataset.id = todo.id;

    li.innerHTML = `
      <input type="checkbox" aria-label="Mark done" ${todo.done ? 'checked' : ''} />
      <span class="todo-item-text">${escapeHtml(todo.text)}</span>
      <div class="todo-actions">
        <button class="btn-icon" title="Edit" data-action="edit">✏️</button>
        <button class="btn-icon btn-danger" title="Delete" data-action="delete">🗑️</button>
      </div>
    `;

    // Checkbox — mark done/undone
    li.querySelector('input[type="checkbox"]').addEventListener('change', () => toggleTodo(todo.id));

    // Edit / Delete buttons
    li.querySelector('[data-action="edit"]').addEventListener('click', () => openEditModal(todo.id));
    li.querySelector('[data-action="delete"]').addEventListener('click', () => deleteTodo(todo.id));

    todoList.appendChild(li);
  });
}

// ── CRUD
function addTodo() {
  const text = todoInput.value.trim();
  if (!text) return;
  const todos = loadTodos();
  todos.push({ id: Date.now(), text, done: false });
  saveTodos(todos);
  todoInput.value = '';
  renderTodos();
}

function toggleTodo(id) {
  const todos = loadTodos().map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveTodos(todos);
  renderTodos();
}

function deleteTodo(id) {
  const todos = loadTodos().filter(t => t.id !== id);
  saveTodos(todos);
  renderTodos();
}

function openEditModal(id) {
  const todo = loadTodos().find(t => t.id === id);
  if (!todo) return;
  editingId = id;
  editInput.value = todo.text;
  editModal.removeAttribute('hidden');
  editInput.focus();
}

function closeEditModal() {
  editModal.setAttribute('hidden', '');
  editingId = null;
}

function saveEdit() {
  const text = editInput.value.trim();
  if (!text || editingId === null) return;
  const todos = loadTodos().map(t => t.id === editingId ? { ...t, text } : t);
  saveTodos(todos);
  closeEditModal();
  renderTodos();
}

btnTodoAdd.addEventListener('click', addTodo);
todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTodo(); });
btnEditSave.addEventListener('click', saveEdit);
btnEditCancel.addEventListener('click', closeEditModal);
editInput.addEventListener('keydown', e => { if (e.key === 'Enter') saveEdit(); });
editModal.addEventListener('click', e => { if (e.target === editModal) closeEditModal(); });

renderTodos();


/* ═══════════════════════════════════════════
   QUICK LINKS
═══════════════════════════════════════════ */
const LINKS_KEY   = 'dashboard_links';
const linksGrid   = document.getElementById('links-grid');
const linkLabel   = document.getElementById('link-label');
const linkUrl     = document.getElementById('link-url');
const btnLinkAdd  = document.getElementById('link-add');

// Default links (GitHub & YouTube) seeded once
const DEFAULT_LINKS = [
  { id: 'default-gh', label: 'GitHub',  url: 'https://github.com' },
  { id: 'default-yt', label: 'YouTube', url: 'https://youtube.com' },
];

function loadLinks() {
  const stored = localStorage.getItem(LINKS_KEY);
  if (stored) return JSON.parse(stored);
  // First run — seed defaults
  localStorage.setItem(LINKS_KEY, JSON.stringify(DEFAULT_LINKS));
  return DEFAULT_LINKS;
}

function saveLinks(links) {
  localStorage.setItem(LINKS_KEY, JSON.stringify(links));
}

function getFavicon(url) {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return null;
  }
}

function renderLinks() {
  const links = loadLinks();
  linksGrid.innerHTML = '';

  if (links.length === 0) {
    linksGrid.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No links yet.</p>';
    return;
  }

  links.forEach(link => {
    const chip = document.createElement('div');
    chip.className = 'link-chip';

    const favicon = getFavicon(link.url);
    chip.innerHTML = `
      ${favicon ? `<img src="${favicon}" width="16" height="16" alt="" onerror="this.remove()" />` : ''}
      <a href="${escapeAttr(link.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>
      <button class="chip-delete" title="Remove link" aria-label="Remove ${escapeHtml(link.label)}">×</button>
    `;

    chip.querySelector('.chip-delete').addEventListener('click', () => deleteLink(link.id));
    linksGrid.appendChild(chip);
  });
}

function addLink() {
  const label = linkLabel.value.trim();
  const url   = linkUrl.value.trim();
  if (!label || !url) { alert('Please fill in both a label and a URL.'); return; }

  // Basic URL validation
  try { new URL(url); } catch { alert('Please enter a valid URL (include https://).'); return; }

  const links = loadLinks();
  links.push({ id: Date.now(), label, url });
  saveLinks(links);
  linkLabel.value = '';
  linkUrl.value   = '';
  renderLinks();
}

function deleteLink(id) {
  const links = loadLinks().filter(l => l.id !== id && l.id !== String(id));
  saveLinks(links);
  renderLinks();
}

btnLinkAdd.addEventListener('click', addLink);
linkUrl.addEventListener('keydown', e => { if (e.key === 'Enter') addLink(); });

renderLinks();


/* ═══════════════════════════════════════════
   UTILITIES
═══════════════════════════════════════════ */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;');
}
