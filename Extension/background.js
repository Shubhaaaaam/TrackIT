const tabToUrl = {};
let lastActiveTabId = null;

const siteDisplayNames = {
  'google.com': 'Google.com',
  'youtube.com': 'YouTube',
  'facebook.com': 'Facebook',
  'twitter.com': 'X',
  'x.com': 'X',
  'instagram.com': 'Instagram',
  'linkedin.com': 'LinkedIn',
  'amazon.': 'Amazon',
  'wikipedia.org': 'Wikipedia',
  'reddit.com': 'Reddit',
  'netflix.com': 'Netflix',
  'microsoft.com': 'Microsoft',
  'apple.com': 'Apple',
  'bing.com': 'Bing.com',
  'duckduckgo.com': 'DuckDuckGo.com',
  'yahoo.com': 'Yahoo.com'
};

function getDisplayUrl(url) {
  let displayUrl = url;
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    if (url === 'https://www.google.com/' || url === 'http://www.google.com/') {
      displayUrl = 'Google.com';
      return displayUrl;
    }

    for (const key in siteDisplayNames) {
      if (hostname.includes(key)) {
        displayUrl = siteDisplayNames[key];
        return displayUrl;
      }
    }

    displayUrl = urlObj.origin + '/';

  } catch (e) {
    console.error("Invalid URL:", url, e);
    displayUrl = url;
  }
  return displayUrl;
}


chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith("http")) {
    const processedUrl = getDisplayUrl(tab.url);
    if (tabToUrl[tabId] !== processedUrl) {
      tabToUrl[tabId] = processedUrl;
      fetch('http://localhost:5000/log_url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event: 'visited',
          url: processedUrl,
          timestamp: new Date().toISOString()
        })
      })
        .then(response => response.json())
        .then(data => console.log('URL visited logged:', data))
        .catch(error => console.error('Error logging URL visit:', error));
    }
  }
});

chrome.tabs.onActivated.addListener(function (activeInfo) {
  const currentActiveTabId = activeInfo.tabId;

  if (lastActiveTabId !== null && lastActiveTabId !== currentActiveTabId) {
    const terminatedUrl = tabToUrl[lastActiveTabId];
    if (terminatedUrl) {
      fetch('http://localhost:5000/log_url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event: 'session terminated',
          url: terminatedUrl,
          timestamp: new Date().toISOString()
        })
      })
        .then(response => response.json())
        .then(data => console.log('Session terminated logged:', data))
        .catch(error => console.error('Error logging session termination:', error));
    }
  }

  chrome.tabs.get(currentActiveTabId, function (tab) {
    if (tab && tab.url && tab.url.startsWith("http")) {
      const processedUrl = getDisplayUrl(tab.url);

      tabToUrl[currentActiveTabId] = processedUrl;
      fetch('http://localhost:5000/log_url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event: 'started',
          url: processedUrl,
          timestamp: new Date().toISOString()
        })
      })
        .then(response => response.json())
        .then(data => console.log('Session started logged:', data))
        .catch(error => console.error('Error logging session start:', error));
    }
  });

  lastActiveTabId = currentActiveTabId;
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
  const url = tabToUrl[tabId];
  if (url) {
    fetch('http://localhost:5000/log_url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: 'session terminated',
        url: url,
        timestamp: new Date().toISOString()
      })
    })
      .then(response => response.json())
      .then(data => console.log('URL closed logged:', data))
      .catch(error => console.error('Error logging URL close:', error))
      .finally(() => {
        delete tabToUrl[tabId];
        if (lastActiveTabId === tabId) {
          lastActiveTabId = null;
        }
      });
  }
});