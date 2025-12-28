const tabToUrl = {};
let lastActiveTabId = null;
const siteDisplayNames = {
  'mail.google.com': 'Gmail',
  'google.com': 'Google',
  'bing.com': 'Bing',
  'duckduckgo.com': 'DuckDuckGo',
  'yahoo.com': 'Yahoo',
  'baidu.com': 'Baidu',
  'ask.com': 'Ask',
  'facebook.com': 'Facebook',
  'instagram.com': 'Instagram',
  'tiktok.com': 'TikTok',
  'twitter.com': 'X',
  'x.com': 'X',
  'snapchat.com': 'Snapchat',
  'pinterest.com': 'Pinterest',
  'reddit.com': 'Reddit',
  'discord.com': 'Discord',
  'quora.com': 'Quora',
  'threads.net': 'Threads',
  'telegram.org': 'Telegram',
  'whatsapp.com': 'WhatsApp',
  'wechat.com': 'WeChat',
  'youtube.com': 'YouTube',
  'netflix.com': 'Netflix',
  'primevideo.com': 'Prime Video',
  'hotstar.com': 'Disney+ Hotstar',
  'twitch.tv': 'Titch',
  'spotify.com': 'Spotify',
  'soundcloud.com': 'SoundCloud',
  'hulu.com': 'Hulu',
  'disneyplus.com': 'Disney+',
  'crunchyroll.com': 'Crunchyroll',
  'amazon.com': 'Amazon',
  'amazon.in': 'Amazon India',
  'amazon.': 'Amazon',
  'flipkart.com': 'Flipkart',
  'ebay.com': 'eBay',
  'aliexpress.com': 'AliExpress',
  'shein.com': 'Shein',
  'myntra.com': 'Myntra',
  'etsy.com': 'Etsy',
  'walmart.com': 'Walmart',
  'nike.com': 'Nike',
  'adidas.com': 'Adidas',
  'ajio.com': 'AJIO',
  'snapdeal.com': 'Snapdeal',
  'meesho.com': 'Meesho',
  'microsoft.com': 'Microsoft',
  'apple.com': 'Apple',
  'tesla.com': 'Tesla',
  'adobe.com': 'Adobe',
  'nvidia.com': 'NVIDIA',
  'intel.com': 'Intel',
  'amd.com': 'AMD',
  'openai.com': 'OpenAI',
  'deepmind.com': 'DeepMind',
  'anthropic.com': 'Anthropic',
  'wikipedia.org': 'Wikipedia',
  'stackoverflow.com': 'StackOverflow',
  'geeksforgeeks.org': 'GeeksForGeeks',
  'w3schools.com': 'W3Schools',
  'coursera.org': 'Coursera',
  'udemy.com': 'Udemy',
  'khanacademy.org': 'Khan Academy',
  'edx.org': 'edX',
  'brilliant.org': 'Brilliant',
  'linkedin.com': 'LinkedIn',
  'zoom.us': 'Zoom',
  'slack.com': 'Slack',
  'notion.so': 'Notion',
  'canva.com': 'Canva',
  'github.com': 'GitHub',
  'gitlab.com': 'GitLab',
  'bitbucket.org': 'Bitbucket',
  'trello.com': 'Trello',
  'asana.com': 'Asana',
  'monday.com': 'Monday.com',
  'bbc.com': 'BBC',
  'cnn.com': 'CNN',
  'nytimes.com': 'New York Times',
  'indiatimes.com': 'India Times',
  'theguardian.com': 'The Guardian',
  'forbes.com': 'Forbes',
  'news18.com': 'News18',
  'ndtv.com': 'NDTV',
  'hindustantimes.com': 'Hindustan Times',
  'moneycontrol.com': 'Moneycontrol',
  'economictimes.com': 'Economic Times',
  'paypal.com': 'PayPal',
  'upi': 'UPI Payment',
  'stripe.com': 'Stripe',
  'razorpay.com': 'Razorpay',
  'phonepe.com': 'PhonePe',
  'paytm.com': 'Paytm',
  'sbi.co.in': 'SBI',
  'hdfcbank.com': 'HDFC Bank',
  'booking.com': 'Booking',
  'airbnb.com': 'Airbnb',
  'makemytrip.com': 'MakeMyTrip',
  'agoda.com': 'Agoda',
  'goibibo.com': 'Goibibo',
  'googlemaps.com': 'Google Maps',
  'uber.com': 'Uber',
  'ola.cabs': 'Ola',
  'medium.com': 'Medium',
  'imgur.com': 'Imgur',
  'indeed.com': 'Indeed',
  'glassdoor.com': 'Glassdoor',
  'zomato.com': 'Zomato',
  'swiggy.com': 'Swiggy',
  'dominos.co.in': 'Dominos',
  'mcdonalds.com': 'McDonalds',
  'chatgpt.com': 'ChatGPT',
  'claude.ai': 'Claude AI',
  'character.ai': 'Character AI'
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
      fetch('http://localhost:6001/log_url', {
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