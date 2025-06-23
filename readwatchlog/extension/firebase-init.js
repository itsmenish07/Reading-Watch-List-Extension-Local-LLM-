// firebase-init.js

const PROJECT_ID = "reading-tracker-ai"; // 🔁 Replace if changed
const COLLECTION_NAME = "readingItems";

export async function pushToFirebase(entry) {
  console.log("🌐 Attempting Firebase push...");

  const firestoreURL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_NAME}`;

  const body = {
    fields: {
      title: { stringValue: entry.title || "Untitled" },
      type: { stringValue: entry.type || "Unknown" },
      url: { stringValue: entry.url || "N/A" },
      summary: { stringValue: entry.summary || "No summary provided" },
      timestamp: { stringValue: new Date().toISOString() }
    }
  };

  try {
    const response = await fetch(firestoreURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      console.log("✅ Synced to Firebase:", entry.title);
    } else {
      const errorText = await response.text();
      console.error("❌ Firebase sync failed:", errorText);
    }
  } catch (err) {
    console.error("❌ Network error pushing to Firebase:", err);
  }
}
