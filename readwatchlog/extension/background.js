// background.js
import { pushToFirebase } from './firebase-init.js';

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
  console.log("📨 Received data from content script:", data);

  chrome.storage.local.get(["logs"], async (result) => {
    const logs = result.logs || [];

    const newEntry = {
      ...data,
      time: Date.now()
    };

    logs.push(newEntry);

    chrome.storage.local.set({ logs }, async () => {
      console.log("✅ Saved locally:", newEntry);

      try {
        await pushToFirebase({
          title: newEntry.title,
          type: newEntry.type,
          url: newEntry.source,
          summary: newEntry.description || "No summary available",
          timestamp: new Date().toISOString()
        });

        console.log("📤 Successfully pushed to Firebase");
        sendResponse({ status: "saved" });
      } catch (err) {
        console.error("❌ Failed to push to Firebase:", err);
        sendResponse({ status: "error", error: err.message });
      }
    });
  });

  return true; // Allows async sendResponse
});
