// Save the settings
function saveOptions() {
    const endpoint = document.getElementById('id_endpoint').value;
    const name = document.getElementById('id_name').value;
    const pickword = document.getElementById('id_pickword').value;
    const color = document.getElementById('id_color').value;
    const seconds = document.getElementById('id_seconds').value;
    const minimalmode = document.getElementById('id_minimal_mode').checked;
    const addproductname = document.getElementById('id_addproductname').checked;
    const addorder = document.getElementById('id_addorder').checked;
    const addupcbarcode = document.getElementById('id_addupcbarcode').checked;
    const addskubarcode = document.getElementById('id_addskubarcode').checked;
    const addshipment = document.getElementById('id_addshipment').checked;
    const beep = document.getElementById('id_beep').checked;
    const autosubmit = document.getElementById('id_autosubmit').checked;
    chrome.storage.local.set({endpoint,name,pickword,color,seconds,minimalmode,addorder,addproductname, addskubarcode,addupcbarcode,addshipment,beep,autosubmit}, function() {
        console.log('Settings saved.');
        window.close(); // Close the options window
    });
}

function restoreOptions() {
    // Request all keys at once
    chrome.storage.local.get({
        endpoint: 'https://www.voodoodevices.com/api', 
        name: '',
        pickword: '',
        color: 'red', 
        seconds: 60, 
        minimalmode: true,
        addorder: false,
        addproductname: true,
        addupcbarcode: false,
        addskubarcode: false,
        addshipment: false,
        beep: true,
        autosubmit: false
    }, function(storedData) {
        // Assign the retrieved values
        if (storedData.endpoint) document.getElementById('id_endpoint').value = storedData.endpoint;
        if (storedData.name) document.getElementById('id_name').value = storedData.name;
        if (storedData.pickword) document.getElementById('id_pickword').value = storedData.pickword;
        if (storedData.color) document.getElementById('id_color').value = storedData.color;
        if (storedData.seconds) document.getElementById('id_seconds').value = storedData.seconds;
        if (storedData.minimalmode) document.getElementById('id_minimal_mode').checked = storedData.minimalmode;
        if (storedData.addorder) document.getElementById('id_addorder').checked = storedData.addorder;
        if (storedData.addproductname) document.getElementById('id_addproductname').checked = storedData.addproductname;
        if (storedData.addskubarcode) document.getElementById('id_addskubarcode').checked = storedData.addskubarcode;
        if (storedData.addupcbarcode) document.getElementById('id_addupcbarcode').checked = storedData.addupcbarcode;
        if (storedData.addshipment) document.getElementById('id_addshipment').checked = storedData.addshipment;
        if (storedData.beep) document.getElementById('id_beep').checked = storedData.beep;
        if (storedData.autosubmit) document.getElementById('id_autosubmit').checked = storedData.autosubmit;
    });
}


document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);

document.addEventListener('DOMContentLoaded', function() {
    chrome.storage.local.get('apikey', function(storedData) {
        if (storedData.apikey) {
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
    chrome.storage.local.get({consoleLog: []}, function(storedData) {
        storedData.consoleLog.forEach(appendLogToDOM);
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
