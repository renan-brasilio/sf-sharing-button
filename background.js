chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "openSharing" && msg.url) {
    chrome.tabs.create({ url: msg.url });
    sendResponse({ ok: true });
  }
});