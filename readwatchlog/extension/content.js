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

    // Save to local storage
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

        // Delay to ensure it's saved before reading
        setTimeout(() => {
          chrome.storage.local.get(['readingList'], (result) => {
            console.log("📦 Storage now:", result.readingList);
          });
        }, 500);
      });
    });

    // ✅ ALSO SEND to background for Firebase logging
    chrome.runtime.sendMessage({
      title: entry.title,
      type: entry.type,
      source: entry.url,
      description: entry.summary
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("⚠️ Could not send to background:", chrome.runtime.lastError.message);
      } else if (response?.status === 'saved') {
        console.log("☁️ Firebase push scheduled via background.js");
      }
    });

  } catch (error) {
    console.error(`Failed to log ${type}:`, error);
  }
}
