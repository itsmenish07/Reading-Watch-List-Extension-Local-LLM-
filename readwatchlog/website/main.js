let currentItems = [];
let currentFilter = "All";

// Render all the cards
function renderCards() {
    const cardGrid = document.getElementById('cardGrid');
    if (!cardGrid) {
        console.error("Element with ID 'cardGrid' not found in DOM.");
        return;
    }

    const filteredItems = currentFilter === "All"
  ? currentItems
  : currentItems.filter(item => item.type.toLowerCase() === currentFilter.toLowerCase());


    cardGrid.innerHTML = filteredItems.map(item => `
        <div class="card">
            <h2 class="card-title">${item.title}</h2>
            <div class="card-type">
                <span class="type-label">Type:</span>
                <span class="type-value">${item.type}</span>
            </div>
            <p class="card-description">${item.description}</p>
            <a href="${item.source}" class="view-source" target="_blank">View Source</a>
        </div>
    `).join('');

    updateViewingText();
}



// Update filter display text
function updateViewingText() {
    const viewingText = document.querySelector('.viewing-text');
    if (viewingText) {
        viewingText.innerHTML = `Viewing: <strong>${currentFilter}</strong>`;
    }
}

// Cycle through filters
function toggleFilter() {
    const filters = ["All", "Article", "Video"];
    const currentIndex = filters.indexOf(currentFilter);
    const nextIndex = (currentIndex + 1) % filters.length;
    currentFilter = filters[nextIndex];
    renderCards();
}

// Optional: Smooth scroll for nav links
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        // Implement scrolling if needed
    });
});

window.addEventListener("message", (event) => {
  if (event.data?.type === "EXT_ITEMS") {
    console.log("✅ Received EXT_ITEMS in main.js", event.data.data);
    loadItemsFromExtension(event.data.data);
  }
});

// 🔵 Function to be called by your extension script
function loadItemsFromExtension(dataArray) {
  console.log("Loaded items:", dataArray);

  currentItems = dataArray.map(item => ({
    title: item.title || 'Untitled',
    type: item.type || 'Article',
    description: item.description || item.summary || 'No description available.', // ✅ FIXED LINE
    source: item.source || item.url || '#'
  }));

  renderCards();
}


// Initialize with empty cards first
// renderCards();
if (typeof chrome !== 'undefined' && chrome.storage) {
  chrome.storage.local.get(["readingList"], (result) => {
    const items = result.readingList || [];
    loadItemsFromExtension(items);
  });
}

console.log("Mapped item:", {
  title: item.title,
  type: item.type,
  description: item.description,
  summary: item.summary,
  source: item.source,
  url: item.url
});
