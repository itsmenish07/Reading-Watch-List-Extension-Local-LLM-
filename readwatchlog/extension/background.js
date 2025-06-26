chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
  chrome.storage.local.get(["logs"], (result) => {
    const logs = result.logs || [];

    logs.push({
      ...data,
      time: Date.now()
    });

    chrome.storage.local.set({ logs }, () => {
      console.log("✅ Saved to logs:", data);

      // Send a confirmation response back to content.js
      sendResponse({ status: "saved" });
    });
  });

  // Tell Chrome this is an async response
  return true;
});

// content.js or background.js
const item = {
  title: document.title,
  type: window.location.hostname.includes("youtube.com") ? "Video" : "Article",
  description: "This is a dummy summary or extract one",
  source: window.location.href
};

// Save to chrome.storage.local
chrome.storage.local.get(["savedItems"], (result) => {
  const saved = result.savedItems || [];
  saved.push(item);
  chrome.storage.local.set({ savedItems: saved });
});