const logQueue = [];
let processingQueue = false;

function logFromBackground(message) {
    const entry = `${new Date().toLocaleString()}: ${message}`;
    logQueue.push(entry);
    processQueue();
}

function processQueue() {
    if (processingQueue || logQueue.length === 0) return;
    processingQueue = true;

    const entry = logQueue.shift();
    chrome.storage.local.get({consoleLog: []}, function(data) {
        data.consoleLog.push(entry);
        if (data.consoleLog.length > 100) {
            data.consoleLog.shift(); // Keep only the latest 100 entries
        }
        chrome.storage.local.set({consoleLog: data.consoleLog}, function() {
            chrome.runtime.sendMessage({
                action: "addLogEntry",
                message: entry
            }, function(response) {
                if (chrome.runtime.lastError) {
                    // Optionally handle the error here, such as logging it
                }
                // Continue processing the next item in the queue
                processingQueue = false;
                processQueue();
            });
        });
    });
}


async function processMessage(message) {
    let data = await new Promise((resolve) => {
        chrome.storage.local.get(['endpoint', 'name', 'color', 'seconds','apikey'], function(result) {
            resolve(result);
        });
    });
    logFromBackground('Processing request for order number: ' + message.orderNumber + ' and item SKU: ' + message.itemSku);
    
    url = data.endpoint+'/shipStationLaunch/?name='+data.name+'&color='+data.color+'&seconds='+
    data.seconds+'&orderNumber='+message.orderNumber+'&itemSku='+message.itemSku;

    if (!(await fetchData(url,data.apikey))) {
        // Show the login modal
        doModalThenFetch(data.endpoint+'/user/login/',url,data.apikey);
    }

}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "voodooCall") {
        processMessage(message);
        sendResponse({done: true});
        return true; // keep the message channel open until sendResponse is called
    }
});

async function fetchData(url, apikey) {
    if (!apikey) {
        logFromBackground('Not logged in.');
        return false;
    }
    logFromBackground('Attempting: ' + url);
    const startTime = new Date().getTime();
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'api-key': apikey,
            },
        });
        if (!response.ok) {
            logFromBackground(`Error: ${response.status} ${response.statusText}`);
            return false;
        }
        const endTime = new Date().getTime();
        const elapsedTime = endTime - startTime;
        if (response.ok) {
            // console.log(response);
            logFromBackground('Success: ' + response.statusText);
            response.json().then(data => {
                logFromBackground('ShipStationTime: ' + parseFloat(data.ShipStationTime)*1000 + ' ms');
                const vtime = elapsedTime - parseFloat(data.ShipStationTime)*1000;
                logFromBackground('VoodooTime: ' + vtime + ' ms');

                if (data.issues) {
                    for (let issue of data.issues) {
                        logFromBackground('Issue: ' + issue);
                    }
                }
            });
            logFromBackground('Total elapsed time: ' + elapsedTime + ' ms');
    
            return true;
        } else {
            // console.log(response);
            logFromBackground('Failed: ' + response.statusText);
            logFromBackground('Total elapsed time: ' + elapsedTime + ' ms');
            return false;
        }
    } catch (error) {
        // console.log('Error:', error);
        logFromBackground('Communication error: ' + error);
        return false;
    }
}


function waitForLogin() {
    return new Promise((resolve, reject) => {
        chrome.runtime.onMessage.addListener(function listener(request, sender, sendResponse) {
            if (request.action === "login") {
                chrome.runtime.onMessage.removeListener(listener); // Clean up the listener
                resolve(request); // Resolve the promise with the request object
            }
        });
    });
}


async function doModalThenFetch(loginUrl,furl,apikey) {
    logFromBackground('Getting new login credentials.');
    const modalUrl = chrome.runtime.getURL("html/modal.html");
    const windowOptions = {
        url: modalUrl,
        type: "popup", // This makes it a popup window
        width: 400,
        height: 300
    };

    chrome.windows.create(windowOptions);
    const loginRequest = await waitForLogin();
    // console.log('Login request:', loginRequest);
    // console.log('To:', loginUrl);
    // Send the login request to the server
    logFromBackground('Sending login request to ' + loginUrl + ' with username: ' + loginRequest.username);
    const startTime = new Date().getTime();
    fetch(loginUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            'username': loginRequest.username,
            'password': loginRequest.password
        }),
    })
    .then(response => {
        if (!response.ok) {
            logFromBackground(`Communication error: ${response.status} ${response.statusText}`);
            return;
        }
        const endTime = new Date().getTime();
        const elapsedTime = endTime - startTime;
        // Log the entire response
        logFromBackground('Login response: ' + response.statusText);
        logFromBackground('Login request took: ' + elapsedTime + ' ms');

        // console.log(response);
        // Log the response text if available
        response.json().then(res => {
            if (res) {
                // console.log(res);
                apikey = res.apikey;
                // console.log('Key:', apikey);
                //save the key
                chrome.storage.local.set({apikey}, function() {
                    // console.log('Api Key saved.');
                });
                fetchData(furl,apikey);
            } else {
                // console.log('No response json found.');
                logFromBackground('Failure details: ' + response.body);
            }
        });

    })
    .catch(error => {
        // console.log(error);
        logFromBackground('Communication error: ' + error);
    });
}

// Listen for clicks on the extension's icon.
chrome.browserAction.onClicked.addListener((tab) => {
    chrome.runtime.openOptionsPage();
});
