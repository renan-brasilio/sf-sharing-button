/**
 * @description Content script for the SF Sharing Button Chrome extension.
 *
 * This script injects a "Sharing" button into Salesforce Lightning pages to provide
 * quick access to record sharing details. It automatically detects the current record ID
 * from the URL or page elements and creates a sharing URL when the button is clicked.
 *
 * The script attempts to insert the button into the Lightning global actions menu first.
 * If that fails, it falls back to creating a floating button in the top-right corner.
 * It uses a MutationObserver to handle dynamic page changes and re-insert the button
 * when needed.
 *
 * @function isValidSfId - Validates Salesforce record IDs (15 or 18 characters)
 * @function extractRecordId - Extracts record ID from URL patterns or data attributes
 * @function deepQuerySelector - Searches through shadow DOM for elements
 * @function buildButton - Creates the sharing button with click handler
 * @function insertInGlobalActionsUl - Inserts button into Lightning global actions
 * @function insertFloatingButton - Creates floating button as fallback
 * @function tryInsert - Main insertion logic with fallback strategy
 * @function getTranslation - Gets translated text based on browser language
 * @function detectLanguage - Detects user's browser language
 *
 * @listens DOM mutations via MutationObserver
 * @sends chrome.runtime.sendMessage with type "openSharing" and sharing URL
 */
(function () {
  const LI_ID = "gpt-sf-sharing-li"; // ID for the <li> element in the global actions menu
  const BTN_ID = "gpt-sf-sharing-btn"; // ID for the button in the global actions menu
  const BTN_FLOAT_ID = "gpt-sf-sharing-float"; // ID for the floating button

  /**
   * @description Detects the user's browser language and returns the appropriate language code
   * @returns {string} The language code (defaults to 'en' if not supported)
   */
  function detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    const langCode = browserLang.split('-')[0].toLowerCase(); // Get primary language code

    // Check if we have translations for this language
    if (window.sfSharingTranslations && window.sfSharingTranslations[langCode]) {
      return langCode;
    }

    // Fallback to English if language not supported
    return 'en';
  }

  /**
   * @description Gets translated text for the specified key based on user's browser language
   * @param {string} key - The translation key
   * @returns {string} The translated text
   */
  function getTranslation(key) {
    const lang = detectLanguage();
    const translations = window.sfSharingTranslations || {};
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  }

  /**
   * @description Validates Salesforce record IDs (15 or 18 characters)
   * @param {string} id - The record ID to validate
   * @returns {boolean} True if the ID is a valid Salesforce record ID, false otherwise
   */
  function isValidSfId(id) {
    return /^[a-zA-Z0-9]{15}([a-zA-Z0-9]{3})?$/.test(id || "");
  }

  /**
   * @description Extracts the Salesforce record ID from the current URL or page elements
   * @returns {string|null} The record ID if found, null otherwise
   */
  function extractRecordId() {
    const href = window.location.href; // Get the current URL
    const hash = window.location.hash ? decodeURIComponent(window.location.hash) : ""; // Get the hash part of the URL

    const patterns = [
      /\/lightning\/r\/[^/]+\/([a-zA-Z0-9]{15,18})\//, // /lightning/r/Object/ID/view
      /\/lightning\/r\/([a-zA-Z0-9]{15,18})\//,        // /lightning/r/ID/view
      /\/sObject\/([a-zA-Z0-9]{15,18})\//,            // /sObject/ID/view (console)
      /\/r\/[^/]+\/([a-zA-Z0-9]{15,18})\//            // /r/Object/ID/view (console)
    ];

    for (const re of patterns) {
      let m = href.match(re); // Match the pattern against the URL
      if (m && isValidSfId(m[1])) return m[1]; // If the pattern matches and the ID is valid, return the ID
      m = hash.match(re); // Match the pattern against the hash
      if (m && isValidSfId(m[1])) return m[1]; // If the pattern matches and the ID is valid, return the ID
    }

    const el = document.querySelector("[data-recordid]"); // Try to find the record ID in the data-recordid attribute
    if (el && isValidSfId(el.getAttribute("data-recordid"))) { // If the record ID is valid, return it
      return el.getAttribute("data-recordid");
    }
    return null; // If no record ID is found, return null
  }

  /**
   * @description Deeply queries through open Shadow DOMs or synthetic shadow
   * @param {string} selector - The CSS selector to search for
   * @param {Document} root - The root element to search in (default: document)
   * @returns {Element|null} The first matching element or null if not found
   */
  function deepQuerySelector(selector, root = document) {
    // Try standard query first
    try {
      const direct = root.querySelector(selector); // Try to find the element with the selector
      if (direct) return direct; // If the element is found, return it
    } catch (e) {}

    // Explore potential shadow roots
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

    // Explore potential shadow roots
    while (walker.nextNode()) {
      const el = walker.currentNode; // Get the current node
      if (el && el.shadowRoot) { // If the node has a shadow root
        try {
          const found = el.shadowRoot.querySelector(selector); // Try to find the element with the selector
          if (found) return found; // If the element is found, return it
        } catch (e) {}
      }
    }
    return null; // If no element is found, return null
  }

  /**
   * @description Builds the sharing button element
   * @returns {HTMLButtonElement} The created button element
   */
  function buildButton() {
    const btn = document.createElement("button"); // Create a button element
    btn.id = BTN_ID; // Set the ID of the button
    btn.textContent = getTranslation("buttonText"); // Set the text content of the button
    btn.title = getTranslation("buttonTitle"); // Set the title of the button
    // Prefer SLDS button classes to blend with header
    btn.className = "slds-button slds-button_neutral"; // Set the class of the button
    btn.style.cssText = [
      "padding:4px 10px", // Set the padding of the button
      "height:28px", // Set the height of the button
      "line-height:20px", // Set the line height of the button
      "cursor:pointer" // Set the cursor of the button
    ].join(";");
    btn.addEventListener("click", () => { // Add a click event listener to the button
      const recordId = extractRecordId(); // Get the record ID
      if (!recordId) { // If no record ID is found, show an alert
        alert(getTranslation("errorNoRecordId"));
        return;
      }
      const url = `${location.origin}/p/share/CustomObjectSharingDetail?parentId=${recordId}`; // Create the sharing URL
      chrome.runtime.sendMessage({ type: "openSharing", url }); // Send a message to the background script
    });
    return btn;
  }

  /**
   * @description Inserts the sharing button into the global actions menu
   * @returns {boolean} True if the button was inserted, false if it already exists
   */
  function insertInGlobalActionsUl() {
    if (document.getElementById(LI_ID) || document.getElementById(BTN_ID)) return true; // If the button already exists, return true

    const ul = deepQuerySelector("ul.slds-global-actions"); // Try to find the global actions menu
    if (!ul) return false; // If no global actions menu is found, return false

    // Build <li> container following SLDS header pattern
    const li = document.createElement("li"); // Create a list item element
    li.id = LI_ID; // Set the ID of the list item
    li.className = "slds-global-actions__item"; // Set the class of the list item
    li.style.listStyle = "none"; // Set the list style of the list item

    const btn = buildButton(); // Build the button
    li.appendChild(btn); // Append the button to the list item

    // Prepend so it appears before the org badge and other icons
    if (ul.firstChild) {
      ul.insertBefore(li, ul.firstChild); // If the first child of the global actions menu exists, insert the list item before it
    } else {
      ul.appendChild(li); // If the first child of the global actions menu does not exist, append the list item to the global actions menu
    }
    return true;
  }

  /**
   * @description Inserts the sharing button as a floating button
   */
  function insertFloatingButton() {
    if (document.getElementById(BTN_ID) || document.getElementById(BTN_FLOAT_ID)) return; // If the button already exists, return
    const btn = document.createElement("button"); // Create a button element
    btn.id = BTN_FLOAT_ID; // Set the ID of the button
    btn.textContent = getTranslation("buttonText"); // Set the text content of the button
    btn.title = getTranslation("buttonTitle"); // Set the title of the button
    btn.style.cssText = [
      "position:fixed", // Set the position of the button
      "top:8px", // Set the top position of the button
      "right:12px", // Set the right position of the button
      "z-index:2147483647", // Set the z-index of the button
      "padding:6px 12px", // Set the padding of the button
      "border:1px solid #d0d0d0", // Set the border of the button
      "border-radius:6px", // Set the border radius of the button
      "background:#fff", // Set the background color of the button
      "cursor:pointer", // Set the cursor of the button
      "font-size:12px", // Set the font size of the button
      "box-shadow:0 1px 3px rgba(0,0,0,0.15)"
    ].join(";");
    btn.addEventListener("click", () => { // Add a click event listener to the button
      const recordId = extractRecordId(); // Get the record ID
      if (!recordId) { // If no record ID is found, show an alert
        alert(getTranslation("errorNoRecordId"));
        return;
      }
      const url = `${location.origin}/p/share/CustomObjectSharingDetail?parentId=${recordId}`; // Create the sharing URL
      chrome.runtime.sendMessage({ type: "openSharing", url }); // Send a message to the background script
    });
    document.body.appendChild(btn); // Append the button to the body
  }

  /**
   * @description Main insertion logic with fallback strategy
   */
  function tryInsert() {
    if (!insertInGlobalActionsUl()) { // If the button was not inserted into the global actions menu
      setTimeout(() => { // Wait for 1.5 seconds
        if (!insertInGlobalActionsUl()) insertFloatingButton(); // If the button was not inserted into the global actions menu, insert the floating button
      }, 1500);
    }
  }

  tryInsert();

  /**
   * @description MutationObserver to handle dynamic page changes
   */
  const observer = new MutationObserver(() => {
    if (!document.getElementById(LI_ID) && !document.getElementById(BTN_FLOAT_ID)) { // If the button was not inserted into the global actions menu and the floating button does not exist
      tryInsert(); // Try to insert the button
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true }); // Observe the document for changes
})();