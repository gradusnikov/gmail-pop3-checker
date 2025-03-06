let gmailParams = null;

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.url.includes('mail.google.com') && details.url.includes('act=')) {
      try {
        const url = new URL(details.url);
        const ik = url.searchParams.get('ik');
        const at = url.searchParams.get('at');
        
        if (ik && at) {
          gmailParams = { ik, at };
        }
      } catch (e) {
        console.error('Error parsing Gmail parameters:', e);
      }
    }
  },
  { urls: ["https://mail.google.com/*"] }
);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getGmailParams") {
    sendResponse(gmailParams);
  }
});