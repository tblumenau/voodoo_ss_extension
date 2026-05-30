function resizeLoginWindow() {
    const loginForm = document.getElementById('loginForm');
    const contentHeight = Math.ceil(Math.max(
        loginForm.getBoundingClientRect().height,
        loginForm.scrollHeight,
        document.body.scrollHeight,
        document.documentElement.scrollHeight
    ));
    const chromeHeight = Math.max(0, window.outerHeight - window.innerHeight);
    const targetHeight = Math.max(360, contentHeight + chromeHeight + 12);

    if (chrome.windows?.getCurrent && chrome.windows?.update) {
        chrome.windows.getCurrent({}, function(currentWindow) {
            if (chrome.runtime.lastError || !currentWindow?.id) {
                return;
            }

            chrome.windows.update(currentWindow.id, { height: targetHeight });
        });
        return;
    }

    if (typeof window.resizeTo === 'function') {
        window.resizeTo(window.outerWidth, targetHeight);
    }
}

function renderEndpointNotice() {
    const endpointNotice = document.getElementById('endpointNotice');

    chrome.storage.local.get({ endpoint: '' }, function(storedData) {
        const endpoint = storedData.endpoint || 'the configured endpoint';
        endpointNotice.textContent = `Enter your credentials for logging in at ${endpoint}.`;
        requestAnimationFrame(() => requestAnimationFrame(resizeLoginWindow));
    });
}

document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Send credentials back to the background script
    chrome.runtime.sendMessage({action: "login", username, password}, function(response) {
        // Assuming we receive a response indicating success
        // Check for success if necessary
        window.close(); // Close the login window
    });
});

window.addEventListener('load', resizeLoginWindow);
renderEndpointNotice();
