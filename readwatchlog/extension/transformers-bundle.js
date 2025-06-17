// Simple Transformers.js AI – Summarizes everything, no filtering
class TransformersAI {
  constructor() {
    this.isLoaded = false;
    this.summarizer = null;
    this.initPromise = null;
  }

  async initialize() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  async _doInitialize() {
    try {
      console.log("🤖 Loading Transformers.js summarizer...");

      // Load from CDN
      const { pipeline, env } = await import(chrome.runtime.getURL('transformer/transformer.min.js'));

      env.localModelPath = chrome.runtime.getURL("transformers/models");
      env.cacheDir = "indexeddb"; // Optional: stores model files in browser storage

      env.allowRemoteModels = true;
      env.allowLocalModels = true;

      this.summarizer = await pipeline('summarization', 'Xenova/distilbart-cnn-6-6', {
      quantized: true,
      localFilesOnly: true,
      modelBasePath: chrome.runtime.getURL('transformer/models')
    });

      this.isLoaded = true;
      console.log("✅ Summarizer model loaded!");
      this._broadcastStatus('ready');
    } catch (err) {
      console.error("❌ Failed to load summarizer:", err);
      this.isLoaded = false;
      this._broadcastStatus('error');
    }
  }

  async summarize(title, content = '', maxLength = 80) {
    if (!this.isLoaded) return this._fallbackSummary(title, maxLength);

    try {
      const text = content ? `${title}. ${content}` : title;
      if (text.length < 50) return `📝 ${title}`;

      const result = await this.summarizer(text, {
        max_length: maxLength,
        min_length: 20,
        do_sample: false
      });

      return `🤖 ${result[0].summary_text}`;
    } catch (err) {
      console.error("Summarization failed:", err);
      return this._fallbackSummary(title, maxLength);
    }
  }

  async isHighQuality(title, url, content = '') {
    // Always return true — accept everything
    return true;
  }

  _fallbackSummary(title, maxLength) {
    return title.length <= maxLength ? `📝 ${title}` : `📝 ${title.slice(0, maxLength - 3)}...`;
  }

  _broadcastStatus(status) {
    try {
      chrome.runtime.sendMessage({
        type: 'AI_STATUS',
        status
      }).catch(() => {});
    } catch (e) {}
  }

  getStatus() {
    return {
      isLoaded: this.isLoaded,
      hasModels: !!this.summarizer
    };
  }
}

// Create global instance
window.simpleAI = new TransformersAI();
window.simpleAI.initialize();