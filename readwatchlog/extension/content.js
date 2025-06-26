// Enhanced Content Script with Simple Local AI
let isInitialized = false;
let aiReady = false;

const script = document.createElement("script");
script.src = chrome.runtime.getURL("main.js");
script.type = "text/javascript";
(document.head || document.documentElement).appendChild(script);

// ✅ Wait before posting
setTimeout(() => {
  chrome.storage.local.get("readingList", (result) => {
  const items = result.readingList || [];
  window.postMessage({ type: "EXT_ITEMS", data: items }, "*");
});

}, 1000); // 👈 1 second delay ensures main.js is ready


// Initialize when page loads
(async function initializeExtension() {
  if (isInitialized) return;
  isInitialized = true;
  
  console.log("🚀 Reading Tracker extension loading...");
  
  // Initialize AI (instant for simple AI)
  if (window.simpleAI) {
    await window.simpleAI.initialize();
    aiReady = window.simpleAI.isLoaded;
    console.log("✅ Simple AI ready!");
    
    // Broadcast status to popup
    try {
      chrome.runtime.sendMessage({
        type: 'AI_STATUS',
        status: 'ready'
      }).catch(() => {});
    } catch (error) {
      // Ignore if popup is closed
    }
  }
  
  // Set up page monitoring
  setupPageMonitoring();
})();

function setupPageMonitoring() {
  // Monitor for YouTube videos (SPA navigation)
  if (window.location.hostname === 'www.youtube.com') {
    setupYouTubeMonitoring();
  }
  
  // Monitor articles on other sites
  if (isArticlePage()) {
    setTimeout(() => logCurrentPage(), 2000); // Wait for page to fully load
  }
  
  // Monitor for navigation changes (SPA sites)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      setTimeout(() => handlePageChange(), 1000);
    }
  }).observe(document, { subtree: true, childList: true });
}

function setupYouTubeMonitoring() {
  let currentVideoId = null;
  
  function checkForNewVideo() {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('v');
    
    if (videoId && videoId !== currentVideoId) {
      currentVideoId = videoId;
      setTimeout(() => logYouTubeVideo(), 3000); // Wait for title to load
    }
  }
  
  // Check immediately and on changes
  checkForNewVideo();
  
  // Monitor for YouTube navigation
  const observer = new MutationObserver(checkForNewVideo);
  observer.observe(document.body, { childList: true, subtree: true });
}

async function logYouTubeVideo() {
  try {
    // Get video title with multiple selectors
    const titleSelectors = [
      'h1.ytd-watch-metadata yt-formatted-string',
      'h1.ytd-video-primary-info-renderer',
      '.watch-main-col h1',
      '#watch-headline-title',
      'h1[class*="title"]'
    ];
    
    let titleElement = null;
    for (const selector of titleSelectors) {
      titleElement = document.querySelector(selector);
      if (titleElement && titleElement.textContent.trim()) break;
    }
    
    if (!titleElement) {
      console.log("❌ Could not find YouTube video title");
      return;
    }
    
    const title = titleElement.textContent.trim();
    const url = window.location.href.split('&')[0]; // Clean URL
    
    // Get video description for better context
    const descSelectors = [
      '#expand.ytd-video-secondary-info-renderer',
      '.watch-main-col #watch-description-text',
      '#description',
      '[id*="description"]'
    ];
    
    let description = '';
    for (const selector of descSelectors) {
      const descElement = document.querySelector(selector);
      if (descElement) {
        description = descElement.textContent.trim().substring(0, 500);
        break;
      }
    }
    
    await logContent('video', title, url, description);
    
  } catch (error) {
    console.error("Error logging YouTube video:", error);
  }
}

function handlePageChange() {
  if (window.location.hostname === 'www.youtube.com' && window.location.pathname === '/watch') {
    setTimeout(() => logYouTubeVideo(), 2000);
  } else if (isArticlePage()) {
    setTimeout(() => logCurrentPage(), 2000);
  }
}

function isArticlePage() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  
  // Common article patterns
  const articleSites = [
    'medium.com', 'dev.to', 'hackernoon.com', 'towardsdatascience.com',
    'blog.', 'news.', 'article', '/blog/', '/post/', '/article/',
    'substack.com', 'github.com', 'stackoverflow.com'
  ];
  
  return articleSites.some(pattern => 
    hostname.includes(pattern) || pathname.includes(pattern)
  ) || hasArticleIndicators();
}

function hasArticleIndicators() {
  // Look for common article HTML patterns
  const indicators = [
    'article', '[role="article"]', '.post', '.article',
    'h1', '.title', '.headline', '.entry-title'
  ];
  
  return indicators.some(selector => document.querySelector(selector));
}

async function logCurrentPage() {
  try {
    // Get page title
    const title = document.title.trim();
    if (!title || title.length < 5) return;
    
    const url = window.location.href;
    
    // Skip if it's not really an article
    if (title.toLowerCase().includes('404') || 
        title.toLowerCase().includes('error') ||
        url.includes('search?') ||
        url.includes('login') ||
        url.includes('signin')) {
      return;
    }
    
    // Get article content for better context
    const content = extractArticleContent();
    
    await logContent('article', title, url, content);
    
  } catch (error) {
    console.error("Error logging article:", error);
  }
}

function extractArticleContent() {
  // Try to find main article content
  const contentSelectors = [
    'article', '[role="article"]', '.post-content', '.article-content',
    '.entry-content', 'main', '.content', '#content', '.post-body'
  ];
  
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent.trim().substring(0, 1000); // First 1000 chars
    }
  }
  
  // Fallback: get text from paragraphs
  const paragraphs = Array.from(document.querySelectorAll('p'))
    .map(p => p.textContent.trim())
    .filter(text => text.length > 50)
    .slice(0, 3)
    .join(' ');
    
  return paragraphs.substring(0, 1000);
}

async function logContent(type, title, url, content = '') {
  try {
    console.log(`📚 Processing ${type}: ${title}`);
    
    // Check quality first (if AI is ready)
    if (aiReady && window.simpleAI) {
      const isQuality = await window.simpleAI.isHighQuality(title, url);
      if (!isQuality) {
        console.log(`🗑️ Skipped low-quality ${type}: ${title}`);
        return;
      }
    }
    
    // Generate summary
    let summary = title;
    if (aiReady && window.simpleAI) {
      summary = await window.simpleAI.summarize(title, content);
    }
    
    // Create entry
    const entry = {
      id: Date.now() + Math.random(), // Ensure uniqueness
      type: type,
      title: title,
      url: url,
      summary: summary,
      timestamp: new Date().toISOString(),
      domain: new URL(url).hostname,
      wordCount: content.split(' ').length || 0
    };
    
    // Save to storage
    chrome.storage.local.get(['readingList'], (result) => {
      const list = result.readingList || [];
      
      // Avoid duplicates
      const exists = list.some(item => item.url === url && item.title === title);
      if (exists) {
        console.log(`⏭️ Already logged: ${title}`);
        return;
      }


      
      list.unshift(entry); // Add to beginning
      
      // Keep only last 100 items
      if (list.length > 100) {
        list.splice(100);
      }
      
      chrome.storage.local.set({ readingList: list }, () => {
  console.log(`✅ Logged ${type}: ${title}`);

  // ⬇️ ADD THIS BLOCK HERE
  const docData = {
    fields: {
      id: { stringValue: entry.id.toString() },
      type: { stringValue: entry.type },
      title: { stringValue: entry.title },
      url: { stringValue: entry.url },
      summary: { stringValue: entry.summary },
      timestamp: { timestampValue: entry.timestamp },
      domain: { stringValue: entry.domain },
      wordCount: { integerValue: entry.wordCount }
    }};

     fetch(`https://firestore.googleapis.com/v1/projects/reading-watching-tracker/databases/(default)/documents/entries?key=AIzaSyCU6E-4Z_txAf-Jub0PYWXwlGjrvsv6X10`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(docData)
  })
    .then(res => res.json())
    .then(data => console.log("✅ Synced to Firebase (REST):", data))
    .catch(err => console.error("❌ Firebase sync failed:", err));
  // ⬆️ END BLOCK

  // Delay to ensure it's saved before reading
  setTimeout(() => {
    chrome.storage.local.get(['readingList'], (result) => {
      console.log("📦 Storage now:", result.readingList);
    });
  }, 500);
});
});
    
  } catch (error) {
    console.error(`Failed to log ${type}:`, error);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_AI_STATUS') {
    sendResponse({
      status: aiReady ? 'ready' : 'loading'
    });
  }
});

chrome.storage.local.get("readingList", (result) => {
    const items = result.readingList || [];
    window.postMessage({ type: "EXT_ITEMS", data: items }, "*");
});