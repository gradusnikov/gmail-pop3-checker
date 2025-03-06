function createButton() {
  const button = document.createElement('div');
  button.className = 'pop3-check-button T-I J-J5-Ji';
  button.setAttribute('role', 'button');
  button.setAttribute('data-tooltip', 'Check POP3 accounts now');
  button.style.marginLeft = '4px';
  button.innerHTML = 'Check POP3';
  button.addEventListener('click', checkPOP3Accounts);
  return button;
}

async function getGmailParams() {
  // First try to get params from background script
  const params = await chrome.runtime.sendMessage({ action: "getGmailParams" });
  if (params?.ik && params?.at) {
    return params;
  }

  // If no params yet, trigger a refresh to capture them
  const refreshButton = document.querySelector('[aria-label="Refresh"]');
  if (refreshButton) {
    refreshButton.click();
    
    // Wait for parameters to be captured
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      const params = await chrome.runtime.sendMessage({ action: "getGmailParams" });
      if (params?.ik && params?.at) {
        return params;
      }
    }
  }

  throw new Error('Could not capture Gmail parameters');
}

async function checkPOP3Accounts() {
  const button = document.querySelector('.pop3-check-button');
  
  try {
    const originalText = button.innerHTML;
    button.innerHTML = 'Checking...';
    button.style.pointerEvents = 'none';

    // Get required Gmail parameters
    const { ik, at } = await getGmailParams();
    
    // Get user index from URL
    const userIndex = window.location.pathname.match(/\/u\/(\d+)/) ? 
                     window.location.pathname.match(/\/u\/(\d+)/)[1] : '0';

    // Construct the URL with parameters
    const url = new URL(`https://mail.google.com/mail/u/${userIndex}/`);
    url.searchParams.set('ui', '2');
    url.searchParams.set('ik', ik);
    url.searchParams.set('at', at);
    url.searchParams.set('view', 'up');
    url.searchParams.set('act', 'cma_1');
    url.searchParams.set('pcd', '1');
    url.searchParams.set('mb', '0');
    url.searchParams.set('rt', 'c');

    // Make the request
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'x-same-domain': '1'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    // Show success message
    button.innerHTML = '✓ Checking';
    button.style.color = '#34a853';

    setTimeout(() => {
      button.innerHTML = originalText;
      button.style.color = '#3c4043';
      button.style.pointerEvents = 'auto';
    }, 3000);

  } catch (error) {
    console.error('Error checking POP3 accounts:', error);
    button.innerHTML = '✗ Error';
    button.style.color = '#ea4335';
    
    setTimeout(() => {
      button.innerHTML = 'Check POP3';
      button.style.color = '#3c4043';
      button.style.pointerEvents = 'auto';
    }, 2000);
  }
}

function findToolbar() {
  const refreshButton = document.querySelector('[aria-label="Refresh"]');
  if (refreshButton) {
    const toolbarContainer = refreshButton.closest('[role="toolbar"]') || 
                           refreshButton.parentElement;
    
    if (toolbarContainer) {
      return {
        container: toolbarContainer,
        insertBefore: refreshButton.nextElementSibling || null
      };
    }
  }
  
  return null;
}

function addCheckButton() {
  if (document.querySelector('.pop3-check-button')) {
    return;
  }

  const toolbar = findToolbar();
  if (toolbar) {
    const button = createButton();
    
    try {
      if (toolbar.insertBefore) {
        toolbar.container.insertBefore(button, toolbar.insertBefore);
      } else {
        toolbar.container.appendChild(button);
      }
      console.log('Successfully added POP3 check button');
    } catch (error) {
      console.error('Error inserting button:', error);
    }
  }
}

function initializeExtension() {
  addCheckButton();

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        const toolbar = findToolbar();
        if (toolbar && !document.querySelector('.pop3-check-button')) {
          addCheckButton();
          break;
        }
      }
    }
  });

  const gmailView = document.querySelector('#viewport') || document.body;
  observer.observe(gmailView, {
    childList: true,
    subtree: true
  });
}

// Start the extension
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}