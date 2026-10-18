/**
 * @description Background script for the SF Sharing Button Chrome extension.
 *
 * This script handles communication between the content script and the extension.
 * It listens for messages from the content script and opens new tabs with sharing URLs
 * when the sharing button is clicked.
 *
 * @listens chrome.runtime.onMessage
 * @param {Object} msg - The message object containing type and url properties
 * @param {string} msg.type - The type of message (expected: "openSharing")
 * @param {string} msg.url - The URL to open in a new tab
 * @param {Object} sender - Information about the message sender
 * @param {Function} sendResponse - Callback function to send response back to sender
 */
function isValidSalesforceUrl(rawUrl) {
  if (typeof rawUrl !== "string") return false;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host.endsWith(".salesforce.com") ||
      host.endsWith(".force.com") ||
      host.endsWith(".visualforce.com")
    );
  } catch {
    return false;
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "openSharing" && isValidSalesforceUrl(msg.url)) {
    chrome.tabs.create({ url: msg.url });
    sendResponse({ ok: true });
  } else if (msg && msg.type === "openSharing") {
    console.warn("Blocked attempt to open non-Salesforce or unsafe URL:", msg.url);
    sendResponse({ ok: false, error: "Invalid or unauthorized URL" });
  }
});