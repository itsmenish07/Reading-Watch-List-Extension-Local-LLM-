const url = window.location.href;
const hostname = window.location.hostname;

let type = "article";

// Detect video pages
if (hostname.includes("youtube.com") && url.includes("watch")) {
  type = "video";
}

const activity = {
  type,
  url,
  title: document.title,
};

console.log("Detected activity:", activity);

chrome.runtime.sendMessage(activity, (response) => {
  console.log("Background response:", response);
});

