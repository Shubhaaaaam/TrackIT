console.log("🔥 Tracker-IT advanced service worker started");

let activeTabId = null;
let activeUrl = null;
let activeStartTime = null;
let windowFocused = true;

const HEARTBEAT_INTERVAL = 30000;

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function normalizeUrl(url) {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
}

function send(event, url) {
  const payload = {
    event,
    url,
    date: todayISO(),
    timestamp: new Date().toISOString()
  };

  return fetch("http://localhost:6001/log_url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
}

function startSession(tabId, url) {
  activeTabId = tabId;
  activeUrl = url;
  activeStartTime = Date.now();
  send("started", url);
}

function endSession(reason = "session terminated") {
  if (!activeUrl) return;
  send(reason, activeUrl);
  activeTabId = null;
  activeUrl = null;
  activeStartTime = null;
}

function pauseSession() {
  if (!activeUrl) return;
  send("paused", activeUrl);
}

function resumeSession() {
  if (!activeUrl) return;
  send("resumed", activeUrl);
}

chrome.tabs.onActivated.addListener(({ tabId }) => {
  if (activeTabId !== null && activeTabId !== tabId) {
    endSession("session terminated");
  }

  chrome.tabs.get(tabId, tab => {
    if (tab?.url?.startsWith("http")) {
      startSession(tabId, normalizeUrl(tab.url));
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    tabId === activeTabId &&
    changeInfo.status === "complete" &&
    tab.url?.startsWith("http")
  ) {
    endSession("session terminated");
    startSession(tabId, normalizeUrl(tab.url));
  }
});

chrome.tabs.onRemoved.addListener(tabId => {
  if (tabId === activeTabId) {
    endSession("session terminated");
  }
});

chrome.windows.onFocusChanged.addListener(windowId => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    windowFocused = false;
    pauseSession();
  } else {
    if (!windowFocused) {
      windowFocused = true;
      resumeSession();
    }
  }
});

setInterval(() => {
  if (activeUrl && windowFocused) {
    send("heartbeat", activeUrl);
  }
}, HEARTBEAT_INTERVAL);

chrome.runtime.onStartup.addListener(() => {
  endSession("session terminated");
});

chrome.runtime.onSuspend.addListener(() => {
  endSession("session terminated");
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_TRACK_STATUS") {
    sendResponse({
      active: !!activeUrl && windowFocused
    });
  }
});
