function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getFavicon(url) {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch (e) {
    return '';
  }
}

function renderFeed(logs) {
  const articles = document.getElementById('article-feed');
  const videos = document.getElementById('video-feed');

  articles.innerHTML = '';
  videos.innerHTML = '';

  logs.reverse().forEach(entry => {
    const container = document.createElement('div');
    container.className = 'entry';

    const favicon = getFavicon(entry.url);

    container.innerHTML = `
      <img src="${favicon}" class="favicon">
      <div>
        <p class="entry-title"><a href="${entry.url}" target="_blank">${entry.title}</a></p>
        <p class="entry-type">${entry.type.toUpperCase()} • ${timeAgo(entry.time)}</p>
      </div>
    `;

    if (entry.type === 'article') {
      articles.appendChild(container);
    } else {
      videos.appendChild(container);
    }
  });
}

chrome.storage.local.get(["logs"], (result) => {
  const logs = result.logs || [];
  renderFeed(logs);
});
