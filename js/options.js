// Save the settings
function saveOptions() {
    const endpoint = document.getElementById('id_endpoint').value;
    const name = document.getElementById('id_name').value;
    const color = document.getElementById('id_color').value;
    const seconds = document.getElementById('id_seconds').value;
    const minimalmode = document.getElementById('id_minimal_mode').checked;
    chrome.storage.sync.set({endpoint,name,color,seconds,minimalmode}, function() {
        console.log('Settings saved.');
        window.close(); // Close the options window
    });
}

function restoreOptions() {
    // Request all keys at once
    chrome.storage.sync.get(['endpoint', 'name', 'color', 'seconds', 'minimalmode'], function(data) {
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
