// == Salesforce Sharing Button Content Script ==
// Appends a <li> with a "Sharing" button inside <ul class="slds-global-actions"> in the Lightning header.

(function () {
  const LI_ID = "gpt-sf-sharing-li";
  const BTN_ID = "gpt-sf-sharing-btn";
  const BTN_FLOAT_ID = "gpt-sf-sharing-float";

  function isValidSfId(id) {
    return /^[a-zA-Z0-9]{15}([a-zA-Z0-9]{3})?$/.test(id || "");
  }

  function extractRecordId() {
    const href = window.location.href;
    const hash = window.location.hash ? decodeURIComponent(window.location.hash) : "";

    const patterns = [
      /\/lightning\/r\/[^/]+\/([a-zA-Z0-9]{15,18})\//, // /lightning/r/Object/ID/view
      /\/lightning\/r\/([a-zA-Z0-9]{15,18})\//,        // /lightning/r/ID/view
      /\/sObject\/([a-zA-Z0-9]{15,18})\//,            // #/sObject/ID/view (console)
      /\/r\/[^/]+\/([a-zA-Z0-9]{15,18})\//            // #/r/Object/ID/view
    ];

    for (const re of patterns) {
      let m = href.match(re);
      if (m && isValidSfId(m[1])) return m[1];
      m = hash.match(re);
      if (m && isValidSfId(m[1])) return m[1];
    }

    const el = document.querySelector("[data-recordid]");
    if (el && isValidSfId(el.getAttribute("data-recordid"))) {
      return el.getAttribute("data-recordid");
    }

    return null;
  }

  // Deep query through open Shadow DOMs or synthetic shadow.
  function deepQuerySelector(selector, root = document) {
    // Try standard query first
    try {
      const direct = root.querySelector(selector);
      if (direct) return direct;
    } catch (e) {}

    // Explore potential shadow roots
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      const el = walker.currentNode;
      if (el && el.shadowRoot) {
        try {
          const found = el.shadowRoot.querySelector(selector);
          if (found) return found;
        } catch (e) {}
      }
    }
    return null;
  }

  function buildButton() {
    const btn = document.createElement("button");
    btn.id = BTN_ID;
    btn.textContent = "Sharing";
    btn.title = "Open Sharing Detail for this record";
    // Prefer SLDS button classes to blend with header
    btn.className = "slds-button slds-button_neutral";
    btn.style.cssText = [
      "padding:4px 10px",
      "height:28px",
      "line-height:20px",
      "cursor:pointer"
    ].join(";");
    btn.addEventListener("click", () => {
      const recordId = extractRecordId();
      if (!recordId) {
        alert("Could not detect a Record Id on this page. Open a record detail page and try again.");
        return;
      }
      const url = `${location.origin}/p/share/CustomObjectSharingDetail?parentId=${recordId}`;
      chrome.runtime.sendMessage({ type: "openSharing", url });
    });
    return btn;
  }

  function insertInGlobalActionsUl() {
    if (document.getElementById(LI_ID) || document.getElementById(BTN_ID)) return true;

    const ul = deepQuerySelector("ul.slds-global-actions");
    if (!ul) return false;

    // Build <li> container following SLDS header pattern
    const li = document.createElement("li");
    li.id = LI_ID;
    li.className = "slds-global-actions__item";
    li.style.listStyle = "none";

    const btn = buildButton();
    li.appendChild(btn);

    // Prepend so it appears before the org badge and other icons
    if (ul.firstChild) {
      ul.insertBefore(li, ul.firstChild);
    } else {
      ul.appendChild(li);
    }
    return true;
  }

  function insertFloatingButton() {
    if (document.getElementById(BTN_ID) || document.getElementById(BTN_FLOAT_ID)) return;
    const btn = document.createElement("button");
    btn.id = BTN_FLOAT_ID;
    btn.textContent = "Sharing";
    btn.title = "Open Sharing Detail for this record";
    btn.style.cssText = [
      "position:fixed",
      "top:8px",
      "right:12px",
      "z-index:2147483647",
      "padding:6px 12px",
      "border:1px solid #d0d0d0",
      "border-radius:6px",
      "background:#fff",
      "cursor:pointer",
      "font-size:12px",
      "box-shadow:0 1px 3px rgba(0,0,0,0.15)"
    ].join(";");
    btn.addEventListener("click", () => {
      const recordId = extractRecordId();
      if (!recordId) {
        alert("Could not detect a Record Id on this page. Open a record detail page and try again.");
        return;
      }
      const url = `${location.origin}/p/share/CustomObjectSharingDetail?parentId=${recordId}`;
      chrome.runtime.sendMessage({ type: "openSharing", url });
    });
    document.body.appendChild(btn);
  }

  function tryInsert() {
    if (!insertInGlobalActionsUl()) {
      setTimeout(() => {
        if (!insertInGlobalActionsUl()) insertFloatingButton();
      }, 1500);
    }
  }

  tryInsert();

  const observer = new MutationObserver(() => {
    if (!document.getElementById(LI_ID) && !document.getElementById(BTN_FLOAT_ID)) {
      tryInsert();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();