
// logFromBackground would miss a bunch of log entries if fired too quickly
// so we had to add this silly queueing mechanism
// The problem that still exists is that sometimes queue entries are out of order
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
                // CRITICAL call right here.  Note the recursion!
                processQueue();
            });
        });
    });
}

// This needs to be a separate async function (not in the addListener callback directly)
// to avoid blocking the message channel
// Sometimes the user will click very quickly on different idons
// and a message is not completed before another one is sent
// Note that prcoessing (without login) messages can typically take a second or two to complete
// Most of that time is because of ShipStation's slow API
async function processMessage(message) {
    let data = await new Promise((resolve) => {
        chrome.storage.local.get(['endpoint', 'name', 'color', 'seconds','apikey'], function(result) {
            resolve(result);
        });
    });
    if (message.quantity !='') {
        logFromBackground('Processing request for order number: ' + message.orderNumber + ' and item SKU: ' + message.itemSku + ' with quantity ' + message.quantity);
    }
    else {
        logFromBackground('Processing request for order number: ' + message.orderNumber + ' and item SKU: ' + message.itemSku);
    }
    url = data.endpoint+'/shipStationLaunch/?name='+data.name+'&color='+data.color+'&seconds='+
    data.seconds+'&orderNumber='+message.orderNumber+'&itemSku='+message.itemSku+'&quantity='+message.quantity;


    //IMPORTANT, IMPORTANT, IMPORTANT
    //Notice this important strategy:  We attempt to do the transaction-->if it fails, then we
    //retry after attempting a login. 
    if (!(await fetchData(url,data.apikey))) {
        //critical await above!  Who would ever want an if statement to just go ahead?!
        //Duh!

        // Show the login modal if needed
        doModalThenFetch(data.endpoint+'/user/login/',url,data.apikey);
    }

}

//This is where messages arrive from the content script running inside the ShipStation webpage
//The message is a request to light up one or more devices
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "voodooCall") {
        processMessage(message); //async call
        sendResponse({done: true}); //so this happens immediately
        return true;
    }
});


//Make a GET request to the Big Block server using the temporary API key
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

            //It's unclear that we want to return false here for EVERY call failure
            //A failure would pop up the login modal
            //But there might be cases where there is no need to login
            //What are some result codes that would indicate no need to login?

            //401 Unauthorized would definitely indicate a need to login
            //But what about 404 Not Found?  Or 403 Forbidden?
            //Or 500 Internal Server Error?
            //fetch is such garbage with its preflight OPTIONS bs that often you
            //don't get real error messages.

            //If the user entered the wrong URL, we really aught to tell them that server
            //wasn't found or that URL was invalid (CORS error or 404)

            //This is the weakness of a writing an extension in a very constrained security environment
            return false;
        }
    } catch (error) {
        // console.log('Error:', error);
        logFromBackground('Communication error: ' + error);
        return false;
    }
}

//I don't particularly like the way Promises work in Javascript
//But I don't particularly like Javascript either
//Oh well...
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

    // Open the modal window to get the login credentials
    //we just need the username  and password
    //In the future, consider making this a window that is connected
    //directly to the Big Block server, i.e. loaded from Big Block
    //could we get access to the session cookie or apikey that way?
    const modalUrl = chrome.runtime.getURL("html/modal.html");
    const windowOptions = {
        url: modalUrl,
        type: "popup", // This makes it a popup window
        width: 400,
        height: 300
    };

    chrome.windows.create(windowOptions);
    const loginRequest = await waitForLogin();
    //not the above sits and spins
    //who knows what other requests are arriving!
    //whatever!
    
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

        response.json().then(res => {
            //notice that the temporary api key is returned in the JSON
            //it is labelled 'apikey' and current setting is for 14 days
            //actually it's using Django's settings.SESSION_COOKIE_AGE
            //so we parallel the lifetime of a session
            if (res) {
                apikey = res.apikey;

                //save the key
                chrome.storage.local.set({apikey}, function() {
                    // console.log('Api Key saved.');
                });

                //okay, now do the original request
                fetchData(furl,apikey);
            } else {
                logFromBackground('Failure details: ' + response.body);
            }
        });

    })
    .catch(error => {
        logFromBackground('Communication error: ' + error);
    });
}

// Listen for clicks on the extension's icon.
chrome.browserAction.onClicked.addListener((tab) => {
    chrome.runtime.openOptionsPage();
});
