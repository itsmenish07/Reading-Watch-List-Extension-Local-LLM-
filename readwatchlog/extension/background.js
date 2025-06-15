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
