// Save the settings
function saveOptions() {
    const endpoint = document.getElementById('id_endpoint').value;
    const name = document.getElementById('id_name').value;
    const color = document.getElementById('id_color').value;
    const seconds = document.getElementById('id_seconds').value;
    const minimalmode = document.getElementById('id_minimal_mode').checked;
    chrome.storage.local.set({endpoint,name,color,seconds,minimalmode}, function() {
        console.log('Settings saved.');
        window.close(); // Close the options window
    });
}

function restoreOptions() {
    // Request all keys at once
    chrome.storage.local.get({
        endpoint: 'https://www.voodoodevices.com/api', 
        name: '', 
        color: 'red', 
        seconds: 60, 
        minimalmode: false
    }, function(data) {
        // Assign the retrieved values
        if (data.endpoint) document.getElementById('id_endpoint').value = data.endpoint;
        if (data.name) document.getElementById('id_name').value = data.name;
        if (data.color) document.getElementById('id_color').value = data.color;
        if (data.seconds) document.getElementById('id_seconds').value = data.seconds;
        if (data.minimalmode) document.getElementById('id_minimal_mode').checked = data.minimalmode;
    });
}


document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get('apikey', function(data) {
        if (data.apikey) {
            var logoutButton = document.createElement('button');
            logoutButton.textContent = 'Logout';
            logoutButton.id = 'logout';
            logoutButton.className = 'btn btn-info';
            logoutButton.addEventListener('click', function() {
                chrome.storage.local.remove('apikey', function() {
                    console.log('User logged out.');
                    // You can also refresh the page to update the UI
                    location.reload();
                });
            });
            document.getElementById('logout-button-container').appendChild(logoutButton);
        }
    });
});


// Load logs on opening the options page
document.addEventListener('DOMContentLoaded', loadConsoleLog);

function loadConsoleLog() {
    chrome.storage.local.get({consoleLog: []}, function(data) {
        data.consoleLog.forEach(appendLogToDOM);
    });
}

//The obove code prints the log when the options page is opened.  The code below 
//listens for new messages from the background script and appends them to the log.
//It's the background script's responsibility to store the log entries so if the
//options page is closed and reopened, the log gets reloaded properly.
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "addLogEntry" && request.message) {
        appendLogToDOM(request.message);
        sendResponse({result: "success"});
    }
});

function appendLogToDOM(logEntry) {
    const logContainer = document.getElementById('consoleLog');
    const logElement = document.createElement('div');
    logElement.textContent = logElement.innerText = logEntry;
    logContainer.appendChild(logElement);
    logContainer.scrollTop = logContainer.scrollHeight;
}
