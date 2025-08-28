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
 * @function detectLanguage - Detects user's browser language
 * @function getPreferredLanguage - Gets user's preferred language from settings or browser
 * @function getTranslation - Gets translated text based on browser language
 * @function getTranslationAsync - Gets translated text with async language preference support
 * @function isValidSfId - Validates Salesforce record IDs (15 or 18 characters)
 * @function extractRecordId - Extracts record ID from URL patterns or data attributes
 * @function deepQuerySelector - Searches through shadow DOM for elements
 * @function buildButton - Creates the sharing button with click handler
 * @function insertInGlobalActionsUl - Inserts button into Lightning global actions
 * @function insertInClassicPage - Inserts button into classic Salesforce pages (my.salesforce.com)
 * @function insertFloatingButton - Creates floating button as fallback
 * @function tryInsert - Main insertion logic with fallback strategy
 * @function checkUrlChange - Checks for URL changes and re-inserts the button if needed
 *
 * @listens DOM mutations via MutationObserver
 * @sends chrome.runtime.sendMessage with type "openSharing" and sharing URL
 */

(function () {



  // We'll check page relevance inside tryInsert() instead of here
  // This allows the script to run and handle navigation changes

  const LI_ID = "gpt-sf-sharing-li"; // ID for the <li> element in the global actions menu
  const BTN_ID = "gpt-sf-sharing-btn"; // ID for the button in the global actions menu
  const BTN_FLOAT_ID = "gpt-sf-sharing-float"; // ID for the floating button

  /**
   * @description Detects the user's language preference and returns the appropriate language code
   * @returns {string} The language code (defaults to 'en' if not supported)
   */
  function detectLanguage() {
    // Default to browser language detection
    const browserLang = navigator.language || navigator.userLanguage || 'en';
    let langCode = browserLang.split('-')[0].toLowerCase(); // Get primary language code

    // Check if we have translations for this language
    if (window.sfSharingTranslations && window.sfSharingTranslations[langCode]) {
      return langCode;
    }

    // Fallback to English if language not supported
    return 'en';
  }

  /**
   * @description Gets the user's preferred language from settings or browser
   * @returns {Promise<string>} Promise that resolves to the language code
   */
  function getPreferredLanguage() {
    return new Promise((resolve) => {
      try {
        chrome.storage.sync.get({
          languageMode: 'auto',
          selectedLanguage: 'en'
        }, function(items) {
          let langCode;

          if (items.languageMode === 'manual') {
            langCode = items.selectedLanguage;
          } else {
            // Auto mode - use browser language
            const browserLang = navigator.language || navigator.userLanguage || 'en';
            langCode = browserLang.split('-')[0].toLowerCase();
          }

          // Check if we have translations for this language
          if (window.sfSharingTranslations && window.sfSharingTranslations[langCode]) {
            resolve(langCode);
          } else {
            resolve('en'); // Fallback to English
          }
        });
      } catch (e) {
        // If storage is not available, fall back to browser language detection
        resolve(detectLanguage());
      }
    });
  }

  /**
   * @description Gets translated text for the specified key based on user's preferred language
   * @param {string} key - The translation key
   * @returns {string} The translated text
   */
  function getTranslation(key) {
    // Use synchronous fallback for immediate access
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
      /\/r\/[^/]+\/([a-zA-Z0-9]{15,18})\//,           // /r/Object/ID/view (console)
      /\/([a-zA-Z0-9]{15,18})$/,                      // /ID (classic pages like my.salesforce.com/a0p5w000005tyFK)
      /\/([a-zA-Z0-9]{15,18})\//                       // /ID/ (classic pages with trailing slash)
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
    btn.title = getTranslation("buttonTitle"); // Set the title of the button

    // Create the button content with text and icon
    const buttonText = getTranslation("buttonText");
    const shareIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-left: 4px;">
      <path d="M17,3.00192584 C18.6557906,3.00192584 19.9980742,4.34420936 19.9980742,6 C19.9980742,7.65579064 18.6557906,8.99807416 17,8.99807416 C16.1578136,8.99807416 15.3967333,8.6508181 14.852131,8.09167815 L9.39501737,11.2112879 C9.46336462,11.4625994 9.49984273,11.7270397 9.49984273,12 C9.49984273,12.2729603 9.46336462,12.5374006 9.39501737,12.7887121 L14.8528622,15.907571 C15.3974144,15.3488708 16.1581905,15.0019258 17,15.0019258 C18.6557906,15.0019258 19.9980742,16.3442089 19.9980742,17.9999996 C19.9980742,19.6557902 18.6557906,20.9980737 17,20.9980737 C15.3442094,20.9980737 14.0019258,19.6557902 14.0019258,17.9999996 C14.0019258,17.7270393 14.0384039,17.462599 14.1067512,17.2112875 L8.64963752,14.0916781 C8.1050353,14.6508181 7.34395493,14.9980742 6.50176856,14.9980742 C4.84597793,14.9980742 3.5036944,13.6557906 3.5036944,12 C3.5036944,10.3442094 4.84597793,9.00192584 6.50176856,9.00192584 C7.34357809,9.00192584 8.10435419,9.3488712 8.64890633,9.9075714 L14.1067512,6.78871207 C14.0384039,6.5374006 14.0019258,6.27296026 14.0019258,6 C14.0019258,4.34420936 15.3442094,3.00192584 17,3.00192584 Z"/>
    </svg>`;
    btn.innerHTML = `${buttonText} ${shareIcon}`; // Set the HTML content with text and icon

    // Check if we're on a classic Salesforce page
    const isClassicPage = window.location.hostname.includes('my.salesforce.com');

    if (isClassicPage) {
      // Classic button styling
      btn.className = ""; // Remove SLDS classes for classic styling
      btn.style.cssText = [
        "font-weight:700", // Bold font weight
        "font-size:smaller", // Smaller font size
        "display:inline-block", // Inline block display
        "color:var(--slds-c-button-text-color, var(--sds-c-button-text-color, var(--lwc-brandAccessible,rgba(180, 29, 24, 1))))", // Blue color
        "padding:4px", // Padding
        "border-width:1px", // Border width
        "border-style:solid", // Border style
        "border-color:rgb(0, 151, 207)", // Blue border
        "border-radius:7px", // Rounded corners
        "cursor:pointer", // Set the cursor of the button
        "margin-left:5px" // Left margin
      ].join(";");
    } else {
      // Lightning button styling (existing)
      btn.className = "slds-button slds-button_neutral"; // Set the class of the button
      btn.style.cssText = [
        "padding:4px 10px", // Set the padding of the button
        "height:28px", // Set the height of the button
        "line-height:20px", // Set the line height of the button
        "cursor:pointer" // Set the cursor of the button
      ].join(";");
    }

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
   * @description Inserts the sharing button into classic Salesforce pages (my.salesforce.com)
   * @returns {boolean} True if the button was inserted, false if it already exists
   */
  function insertInClassicPage() {
    if (document.getElementById(LI_ID) || document.getElementById(BTN_ID)) {
      return true; // If the button already exists, return true
    }

    // Look for the linkElements div in classic pages
    const linkElementsDiv = document.querySelector("div.linkElements");

    if (!linkElementsDiv) {
      return false; // If no linkElements div is found, return false
    }

    const btn = buildButton(); // Build the button
    btn.id = BTN_ID; // Set the ID of the button

    // Insert the button as the first element in the linkElements div
    if (linkElementsDiv.firstChild) {
      linkElementsDiv.insertBefore(btn, linkElementsDiv.firstChild);
    } else {
      linkElementsDiv.appendChild(btn);
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
    btn.title = getTranslation("buttonTitle"); // Set the title of the button

    // Create the button content with text and icon
    const buttonText = getTranslation("buttonText");
    const shareIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle; margin-left: 4px;">
      <path d="M17,3.00192584 C18.6557906,3.00192584 19.9980742,4.34420936 19.9980742,6 C19.9980742,7.65579064 18.6557906,8.99807416 17,8.99807416 C16.1578136,8.99807416 15.3967333,8.6508181 14.852131,8.09167815 L9.39501737,11.2112879 C9.46336462,11.4625994 9.49984273,11.7270397 9.49984273,12 C9.49984273,12.2729603 9.46336462,12.5374006 9.39501737,12.7887121 L14.8528622,15.907571 C15.3974144,15.3488708 16.1581905,15.0019258 17,15.0019258 C18.6557906,15.0019258 19.9980742,16.3442089 19.9980742,17.9999996 C19.9980742,19.6557902 18.6557906,20.9980737 17,20.9980737 C15.3442094,20.9980737 14.0019258,19.6557902 14.0019258,17.9999996 C14.0019258,17.7270393 14.0384039,17.462599 14.1067512,17.2112875 L8.64963752,14.0916781 C8.1050353,14.6508181 7.34395493,14.9980742 6.50176856,14.9980742 C4.84597793,14.9980742 3.5036944,13.6557906 3.5036944,12 C3.5036944,10.3442094 4.84597793,9.00192584 6.50176856,9.00192584 C7.34357809,9.00192584 8.10435419,9.3488712 8.64890633,9.9075714 L14.1067512,6.78871207 C14.0384039,6.5374006 14.0019258,6.27296026 14.0019258,6 C14.0019258,4.34420936 15.3442094,3.00192584 17,3.00192584 Z"/>
    </svg>`;
    btn.innerHTML = `${buttonText} ${shareIcon}`; // Set the HTML content with text and icon
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
    // Check if this is a relevant Salesforce page
    const url = window.location.href;
    const hostname = window.location.hostname;

    // For Lightning pages, check if it's a record page
    if (hostname.includes('lightning.force.com')) {
      // Only show on record detail pages (/lightning/r/...)
      // NOT on object list pages (/lightning/o/.../list)
      const isRecordPage = url.includes('/lightning/r/');

      if (!isRecordPage) {
        return;
      }
    }

    // For Classic pages, check if it's a record page
    if (hostname.includes('my.salesforce.com')) {
      const isRecordPage = /\/[a-zA-Z0-9]{15,18}$/.test(url) ||
                          /\/[a-zA-Z0-9]{15,18}\//.test(url);

      if (!isRecordPage) {
        return;
      }
    }

    // Check if we're on a classic Salesforce page (my.salesforce.com)
    const isClassicPage = window.location.hostname.includes('my.salesforce.com');
    const recordId = extractRecordId();

    if (isClassicPage) {
      // For classic pages, check if there's a valid Salesforce ID first
      if (!recordId) {
        return;
      }

      // For classic pages, try to insert into linkElements div first
      if (!insertInClassicPage()) {
        setTimeout(() => {
          if (!insertInClassicPage()) {
            insertFloatingButton();
          }
        }, 1500);
      }
    } else {
      // For Lightning pages, use the existing logic
      if (!insertInGlobalActionsUl()) {
        setTimeout(() => {
          if (!insertInGlobalActionsUl()) {
            insertFloatingButton();
          }
        }, 1500);
      }
    }
  }

  tryInsert();

  // Track current URL to detect navigation changes
  let currentUrl = window.location.href;
  let lastRecordId = null;

  /**
   * @description Check if URL has changed and re-insert button if needed
   */
  function checkUrlChange() {
    const newUrl = window.location.href;
    const newRecordId = extractRecordId();

    // Check if URL changed or record ID changed (for same-page navigation)
    if (newUrl !== currentUrl || newRecordId !== lastRecordId) {

      currentUrl = newUrl;
      lastRecordId = newRecordId;

      // Remove existing buttons
      const existingButtons = [
        document.getElementById(LI_ID),
        document.getElementById(BTN_ID),
        document.getElementById(BTN_FLOAT_ID)
      ];

      existingButtons.forEach(btn => {
        if (btn) {
          btn.remove();
        }
      });

      // Try to insert immediately, then retry with delays
      tryInsert();

      // Retry with increasing delays for dynamic content
      setTimeout(() => {
        tryInsert();
      }, 100);
      setTimeout(() => {
        tryInsert();
      }, 500);
      setTimeout(() => {
        tryInsert();
      }, 1000);
      setTimeout(() => {
        tryInsert();
      }, 2000);
    }
  }

  /**
   * @description MutationObserver to handle dynamic page changes
   */
  const observer = new MutationObserver((mutations) => {
    // Check for URL changes
    checkUrlChange();

    // Check if button was removed or if significant DOM changes occurred
    const hasButton = document.getElementById(LI_ID) || document.getElementById(BTN_ID) || document.getElementById(BTN_FLOAT_ID);
    const hasSignificantChanges = mutations.some(mutation =>
      mutation.type === 'childList' &&
      (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)
    );

    if (!hasButton || hasSignificantChanges) {
      // Small delay to let DOM settle
      setTimeout(() => {
        if (!document.getElementById(LI_ID) && !document.getElementById(BTN_ID) && !document.getElementById(BTN_FLOAT_ID)) {
          tryInsert();
        }
      }, 50);
    }
  });

  // More comprehensive observation
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'id', 'data-aura-rendered-by']
  });

  // Listen for popstate events (back/forward navigation)
  window.addEventListener('popstate', () => {
    setTimeout(() => {
      checkUrlChange();
    }, 100);
  });

  // Listen for pushstate/replacestate events (programmatic navigation)
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function(...args) {
    originalPushState.apply(history, args);
    setTimeout(() => {
      checkUrlChange();
    }, 100);
  };

  history.replaceState = function(...args) {
    originalReplaceState.apply(history, args);
    setTimeout(() => {
      checkUrlChange();
    }, 100);
  };

  // Periodic check as fallback (every 2 seconds)
  setInterval(() => {
    const hasButton = document.getElementById(LI_ID) || document.getElementById(BTN_ID) || document.getElementById(BTN_FLOAT_ID);
    if (!hasButton) {
      tryInsert();
    }
  }, 2000);

  /**
   * @description Listen for settings updates from the options page
   */
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'settingsUpdated') {
      // Refresh the button to apply new language settings
      const existingButton = document.getElementById(BTN_ID) || document.getElementById(BTN_FLOAT_ID);
      if (existingButton) {
        existingButton.remove();
        setTimeout(() => {
          tryInsert();
        }, 100);
      }
    }
  });
})();