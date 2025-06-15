console.log("✅ Content script loaded");

function isYouTubeVideoPage() {
  return location.hostname.includes('youtube.com') && window.location.href.includes('watch?v=');
}

function getTitle() {
  return document.title || "Untitled Page";
}

function sendPayloadIfVideo() {
  const payload = {
    title: getTitle(),
    url: location.href,
    type: isYouTubeVideoPage() ? 'video' : 'article'
  };

  console.log("✅ Sending payload from content script:", payload);
  chrome.runtime.sendMessage(payload);
}

// Send initially
sendPayloadIfVideo();

// For SPA: hook into history changes
let lastUrl = location.href;
setInterval(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    console.log("🔁 Detected URL change:", location.href);
    sendPayloadIfVideo();
  }
}, 1000); // check every 1 second

