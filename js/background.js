// Listen for clicks on the extension's icon.
chrome.action.onClicked.addListener((tab) => {
    chrome.runtime.openOptionsPage();
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === "voodooCall") {
        chrome.storage.sync.get(['endpoint', 'name', 'color', 'seconds','apikey','datestamp'], function(data) {
            // Here you can use the options to modify the page, open modals, etc.
            console.log('Options retrieved:', message);
            //if the datestamp is more than 240 hours old, clear the apikey
            if (data.datestamp) {
                let date = new Date().getTime();
                let diff = date - data.datestamp;
                let hours = diff / 1000 / 60 / 60;
                if (hours > 240) {
                    chrome.storage.sync.remove('apikey', function() {
                        console.log('Api Key removed.');
                    });
                    data.apikey = null;
                }
            }
            else {
                chrome.storage.sync.remove('apikey', function() {
                    console.log('Api Key removed.');
                });
                data.apikey = null;
            }
            url = data.endpoint+'/shipStationLaunch/?name='+data.name+'&color='+data.color+'&seconds='+
            data.seconds+'&orderNumber='+message.orderNumber+'&itemSku='+message.itemSku;
    
            if (!fetchData(url,data.apikey)) {
                // Show the login modal
                doModalThenFetch(data.endpoint+'/user/login/',url,data.apikey);
            }

        });
        sendResponse({done: true});
        return false;
    }
});


async function fetchData(url, apikey) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'api-key': apikey,
            },
        });

        if (response.ok) {
            console.log(response);
            return true;
        } else {
            console.log(response);
            return false;
        }
    } catch (error) {
        console.log('Error:', error);
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
    const modalUrl = chrome.runtime.getURL("html/modal.html");
    const windowOptions = {
        url: modalUrl,
        type: "popup", // This makes it a popup window
        width: 400,
        height: 300
    };

    chrome.windows.create(windowOptions);
    const loginRequest = await waitForLogin();
    console.log('Login request:', loginRequest);
    console.log('To:', loginUrl);
    // Send the login request to the server
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
        // Log the entire response
        console.log(response);
        // Log the response text if available
        response.json().then(res => {
            if (res) {
                console.log(res);
                apikey = res.apikey;
                console.log('Key:', apikey);
                datestamp = new Date().getTime();
                //save the key
                chrome.storage.sync.set({apikey,datestamp}, function() {
                    console.log('Api Key saved.');
                });
                fetchData(furl,apikey);
            } else {
                console.log('No response json found.');
            }
        });

    })
    .catch(error => {
        console.log(error);
    });
}
