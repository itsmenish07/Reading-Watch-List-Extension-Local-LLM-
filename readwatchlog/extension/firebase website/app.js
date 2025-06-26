// app.js

const API_KEY = "AIzaSyCU6E-4Z_txAf-Jub0PYWXwlGjrvsv6X10";
const PROJECT_ID = "reading-watching-tracker";
const COLLECTION = "entries";

const endpoint = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}?key=${API_KEY}`;

async function fetchEntries() {
  const res = await fetch(endpoint);
  const data = await res.json();
  renderEntries(data.documents || []);
}

function renderEntries(entries) {
  const container = document.getElementById("entries");
  container.innerHTML = "";

  if (entries.length === 0) {
    container.textContent = "No entries yet.";
    return;
  }

  for (const doc of entries) {
    const fields = doc.fields;

    const title = fields.title?.stringValue || "Untitled";
    const summary = fields.summary?.stringValue || "";
    const url = fields.url?.stringValue || "#";
    const timestamp = fields.timestamp?.timestampValue || "";

    const div = document.createElement("div");
    div.className = "entry";
    div.innerHTML = `
      <div class="entry-title"><a href="${url}" target="_blank">${title}</a></div>
      <div class="entry-summary">${summary}</div>
      <div class="entry-meta">${new Date(timestamp).toLocaleString()}</div>
    `;
    container.appendChild(div);
  }
}

fetchEntries();
document.getElementById('darkModeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  localStorage.setItem('darkMode', document.body.classList.contains('dark'));
});

if (localStorage.getItem('darkMode') === 'true') {
  document.body.classList.add('dark');
}
const toggleBtn = document.getElementById('darkModeToggle');
let darkMode = false;

toggleBtn.addEventListener('click', () => {
  darkMode = !darkMode;
  document.body.classList.toggle('dark-mode', darkMode);
  // Swap the text so it shows the *other* mode you can switch to
  toggleBtn.textContent = darkMode ? '🌞 Toggle Light Mode' : '🌓 Toggle Dark Mode';
});