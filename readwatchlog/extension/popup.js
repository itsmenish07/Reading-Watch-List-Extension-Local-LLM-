let currentFilter = 'all';
let allEntries = [];

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  loadEntries();
  checkAIStatus();
  
  // Listen for AI status updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'AI_STATUS') {
      updateAIStatus(message.status);
    }
  });
});

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      renderEntries();
    });
  });
}

function loadEntries() {
  chrome.storage.local.get(['readingList'], (result) => {
    allEntries = result.readingList || [];
    renderEntries();
    updateStats();
  });
}

function updateStats() {
  const articles = allEntries.filter(e => e.type === 'article').length;
  const videos = allEntries.filter(e => e.type === 'video').length;
  
  document.getElementById('totalCount').textContent = allEntries.length;
  document.getElementById('articleCount').textContent = articles;
  document.getElementById('videoCount').textContent = videos;
}

function renderEntries() {
  const content = document.getElementById('content');
  let filteredEntries = allEntries;
  
  if (currentFilter !== 'all') {
    filteredEntries = allEntries.filter(entry => entry.type === currentFilter);
  }
  
  if (filteredEntries.length === 0) {
    const emptyMessage = currentFilter === 'all' 
      ? 'Browse articles and videos to see your AI-powered reading list!'
      : `No ${currentFilter}s found. Start ${currentFilter === 'article' ? 'reading' : 'watching'} to see content here!`;
    content.innerHTML = `<div class="empty">${emptyMessage}</div>`;
    return;
  }
  
  content.innerHTML = filteredEntries.map(entry => `
    <div class="entry ${entry.type}">
      <div class="entry-title" onclick="openUrl('${entry.url}')">${entry.title}</div>
      <div class="entry-summary">${entry.summary || entry.title}</div>
      <div class="entry-meta">
        <span>📍 ${entry.domain} • ⏰ ${formatTime(entry.timestamp)}</span>
        <button class="delete-btn" onclick="deleteEntry('${entry.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function deleteEntry(id) {
  allEntries = allEntries.filter(entry => entry.id != id);
  chrome.storage.local.set({ readingList: allEntries });
  renderEntries();
  updateStats();
}

function openUrl(url) {
  chrome.tabs.create({ url: url });
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins/60)}h ago`;
  return `${Math.floor(diffMins/1440)}d ago`;
}

async function checkAIStatus() {
  // Initial status check
  updateAIStatus('loading');
  
  // Try to get status from content script
  try {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {type: 'GET_AI_STATUS'}, (response) => {
        if (response && response.status) {
          updateAIStatus(response.status);
        }
      });
    }
  } catch (error) {
    console.log("Could not check AI status:", error);
  }
  
  // Fallback: assume ready after 10 seconds
  setTimeout(() => {
    const statusEl = document.getElementById('aiStatus');
    if (statusEl.classList.contains('loading')) {
      updateAIStatus('ready');
    }
  }, 10000);
}

function updateAIStatus(status) {
  const statusEl = document.getElementById('aiStatus');
  statusEl.className = `ai-status ${status}`;
  
  switch(status) {
    case 'loading':
      statusEl.textContent = '🤖 Loading AI models...';
      break;
    case 'ready':
      statusEl.textContent = '🧠 AI Ready - Smart summaries enabled';
      break;
    case 'error':
      statusEl.textContent = '⚠️ AI Offline - Basic mode active';
      break;
  }
}

// Make functions global for onclick handlers
window.deleteEntry = deleteEntry;
window.openUrl = openUrl;