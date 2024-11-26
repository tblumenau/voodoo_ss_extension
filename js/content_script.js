// Utility to sanitize text
function sanitizeText(text) {
    return text.replace(/&nbsp;/g, '').replace(/\s+/g, '').trim();
}

// Function to retrieve stored data from chrome.storage.local
function getStoredData() {
    // Create a new Promise to handle the asynchronous operation
    let storedData = new Promise((resolve) => {
        // Use chrome.storage.local.get to retrieve the specified keys
        chrome.storage.local.get(['endpoint', 'name', 'pickword', 'color', 'seconds', 'apikey', 'addorder', 'addupcbarcode', 'addshipment', 'beep', 'autosubmit', 'minimalmode'], function (result) {
            // Check for any errors during the retrieval
            if (chrome.runtime.lastError) {
                // Log the error to the console for debugging purposes
                console.error('Error retrieving settings:', chrome.runtime.lastError);
                return; // Exit the callback if an error occurred
            }

            // Resolve the Promise with the retrieved result
            resolve(result);
        });
    });

    // Return the Promise
    return storedData;
}

/**
 * Function to find the previous sibling element with a non-empty first child text content.
 * This function starts from the given element and traverses its previous siblings
 * until it finds a sibling whose first child's text content is not empty.
 *
 * @param {HTMLElement} startElement - The element to start the search from.
 * @returns {HTMLElement|null} - The previous sibling element with non-empty first child text content, or null if none is found.
 */
function findPreviousSiblingWithNonEmptyFirstChildText(startElement) {
    // Start with the immediately preceding sibling of the given element
    let previousSibling = startElement.previousElementSibling;

    // Loop through previous siblings
    while (previousSibling !== null) {
        // Check if the previous sibling has a firstChild
        if (previousSibling.firstChild) {
            // Trim the innerText to ensure it's not just whitespace
            const textContent = previousSibling.firstChild.innerText?.trim();

            // Check if the trimmed text is not empty
            if (textContent) {
                return previousSibling; // Found the matching sibling
            }
        }

        // Move to the next previous sibling
        previousSibling = previousSibling.previousElementSibling;
    }

    // Return null if no matching sibling is found
    return null;
}

/**
 * Function to find the previous sibling element that matches a given selector.
 * This function starts from the given element and traverses its previous siblings
 * until it finds a sibling that matches the specified selector.
 *
 * @param {HTMLElement} element - The element to start the search from.
 * @param {string} selector - The CSS selector to match against previous siblings.
 * @returns {HTMLElement|null} - The previous sibling element that matches the selector, or null if none is found.
 */
function closestPreviousSibling(element, selector) {
    // Start with the immediate previous sibling
    let prevSibling = element.previousElementSibling;

    // Iterate over previous siblings until a match is found or there are no more siblings
    while (prevSibling !== null) {
        if (prevSibling.matches(selector)) {
            return prevSibling; // Return the matching sibling
        }
        // Move to the next previous sibling
        prevSibling = prevSibling.previousElementSibling;
    }

    return null; // Return null if no matching sibling is found
}

/**
 * Function to find the next sibling element that matches a given selector.
 * This function starts from the given element and traverses its next siblings
 * until it finds a sibling that matches the specified selector.
 *
 * @param {HTMLElement} element - The element to start the search from.
 * @param {string} selector - The CSS selector to match against next siblings.
 * @returns {HTMLElement|null} - The next sibling element that matches the selector, or null if none is found.
 */
function closestNextSibling(element, selector) {
    // Start with the immediate next sibling
    let nextSibling = element.nextElementSibling;

    // Iterate over next siblings until a match is found or there are no more siblings
    while (nextSibling !== null) {
        if (nextSibling.matches(selector)) {
            return nextSibling; // Return the matching sibling
        }
        // Move to the next sibling
        nextSibling = nextSibling.nextElementSibling;
    }

    return null; // Return null if no matching sibling is found
}


//check if some parent or parent of a parent, etc. has a class that starts with the given prefix
function hasAncestorWithClass(element, classPrefix) {
    let currentElement = element.parentElement;

    while (currentElement !== null) {
        // Split class names and check each one
        const classNames = currentElement.className.split(/\s+/);
        for (let className of classNames) {
            if (className.startsWith(classPrefix)) {
                return true; // An ancestor with the matching class prefix was found
            }
        }
        // Move up to the next parent element
        currentElement = currentElement.parentElement;
    }

    return false; // No matching ancestor was found
}



/**
 * Function to send a "kill" command to a device for a given SKU.
 * This function checks if the SKU exists in the document's killNonces,
 * sets a flag to prevent auto-submit, and sends a "kill" command to the device.
 *
 * @param {string} itemSku - The SKU of the item to send the "kill" command for.
 */
function killOnDeviceForSKU(itemSku) {
    // Check if the itemSku exists in the document's killNonces
    if (itemSku in document.killNonces) {
        // Set a flag to prevent auto-submit
        document.preventAutoSubmit = true;

        console.log('killing ' + itemSku);

        // Retrieve the nonce for the itemSku
        let nonce = document.killNonces[itemSku];

        // Create an array to hold the command data
        let array = [];

        // Create an object to hold the command data
        let data = {};
        data['command'] = 'kill';
        data['location'] = itemSku;
        data['nonce'] = nonce;

        // Add the command data object to the array
        array.push(data);

        // Send a message to the background script with the "kill" command
        chrome.runtime.sendMessage({ action: "voodooDevices", array }, function (response) {
            // For now, background.js only returns true in the done parameter
            if (response.done) {
                // Handle successful response (if needed)
            } else {
                // Handle unsuccessful response (if needed)
            }
        });

        // Remove the nonce from killNonces
        delete document.killNonces[itemSku];
    }
}

/**
 * Function to perform the "kill" operation for a given element.
 * This function finds the relevant SKU for the element and sends a "kill" command to the device.
 *
 * @param {HTMLElement} element - The element to perform the "kill" operation on.
 */
function doKill(element) {
    // Get the parent element of the given element
    let infoDiv = element.parentElement;

    // Find the closest previous sibling that matches the specified selector
    infoDiv = closestPreviousSibling(infoDiv, 'div[class*="info-and-buttons-"]');

    // Query all span elements with class starting with "sku-upc-"
    let skuLines = infoDiv.querySelectorAll('span[class^="sku-upc-"]');

    // Get the first element from the NodeList
    let master = skuLines[0];

    // Get the inner text of the first child element and extract the SKU
    itemSku = master.firstElementChild.innerText;
    itemSku = itemSku.replace('SKU:', '');
    itemSku = sanitizeText(itemSku);

    // Send the "kill" command for the extracted SKU
    killOnDeviceForSKU(itemSku);
}

async function doImageClickWork(target, attribute) {
    console.log('doing click for ' + attribute);

    const parentDiv = target.parentElement;

    let orderNumber = '';
    let itemSku = '';
    let quantity = '';
    let extra = '';

    const storedData = await getStoredData();

    switch (attribute) {
        case 'c1':
            ({ orderNumber, itemSku, extra } = handleColumnC1(parentDiv, storedData));
            break;
        case 'c2':
            ({ orderNumber, itemSku, extra } = handleColumnC2(parentDiv, storedData));
            break;
        case 'p2':
            ({ orderNumber, itemSku, quantity, extra } = handlePanelP2(parentDiv, storedData));
            break;
        case 'm1':
            ({ orderNumber, itemSku, extra } = handleMasterM1(parentDiv, storedData));
            break;
        case 'm2':
            ({ orderNumber, itemSku, quantity, extra } = handleMasterM2(parentDiv, target, storedData));
            break;
        case 'b1':
            ({ orderNumber, itemSku, extra } = handleBatchB1(parentDiv));
            break;
        case 's1':
            handleScanS1(storedData);
            return; // Prevents further execution
        case 's2':
            handleScanS2(target,storedData);
            return; // Prevents further execution
        default:
            console.warn('Unknown attribute: ' + attribute);
            return;
    }

    chrome.runtime.sendMessage({ action: "voodooCall", itemSku: itemSku, orderNumber: orderNumber, quantity: quantity, extra: extra }, function (response) {
        // for now, background.js only returns true in the done parameter
        if (response.done) {
        }
        else {
        }
    });
}

// Helper functions for specific attributes

function handleColumnC1(parentDiv, storedData) {
    const orderNumber = parentDiv.innerText;
    const itemSku = 'all';
    const extra = storedData.addorder ? orderNumber : '';
    return { orderNumber, itemSku, extra };
}

function handleColumnC2(parentDiv, storedData) {
    let itemSku = parentDiv.innerText;
    let orderNumber = parentDiv.parentElement.firstChild.innerText;

    if (itemSku.includes('Item')) itemSku = 'all';
    if (!orderNumber) {
        const result = findPreviousSiblingWithNonEmptyFirstChildText(parentDiv.parentElement);
        orderNumber = result.firstChild.innerText;
    }

    const extra = storedData.addorder ? orderNumber : '';
    return { orderNumber, itemSku, extra };
}

function handlePanelP2(parentDiv, storedData) {
    let itemSku = sanitizeText(parentDiv.innerText.replace('SKU:', ''));
    const displayWrapper = parentDiv.closest('div[class*="item-display-wrapper"]');
    let quantity = sanitizeText(
        closestNextSibling(displayWrapper, 'div[class*="quantity-column"]').innerText
    );

    let orderNumber = sanitizeText(
        closestPreviousSibling(displayWrapper, 'div[class*="item-list-title"]').innerText.replace('Items from Order #', '')
    );
    if (orderNumber === 'Items' || orderNumber === '') {
        const master = parentDiv.closest('div[class^="side-bar"]');
        orderNumber = master.firstChild.firstChild.firstChild.innerText;
    }

    const extra = storedData.addorder ? orderNumber : '';
    return { orderNumber, itemSku, quantity, extra };
}

function handleMasterM1(parentDiv, storedData) {
    const master = parentDiv.closest('div[class^="drawer"]').querySelector('div[class*="order-info-order-number"]');
    const orderNumber = master.innerText.replace('Order # ', '');
    const itemSku = 'all';
    const extra = storedData.addorder ? orderNumber : '';
    return { orderNumber, itemSku, extra };
}

function handleMasterM2(parentDiv, target, storedData) {
    // Get the item SKU
    const skuElement = parentDiv.parentElement.querySelector('div[class*="item-sku-with-order-number"]');
    let itemSku = skuElement.innerText.replace('SKU:', '');
    itemSku = sanitizeText(itemSku);

    // Get the quantity
    let quantity = sanitizeText(target.previousElementSibling.innerText);

    // Get the order number
    const drawerElement = parentDiv.closest('div[class^="drawer"]');
    const orderInfoElement = drawerElement.querySelector('div[class*="order-info-order-number"]');
    let orderNumber = sanitizeText(orderInfoElement.innerText.replace('Order #', ''));

    // Determine extra based on stored data
    const extra = storedData.addorder ? orderNumber : '';

    return { orderNumber, itemSku, quantity, extra };
}

function handleBatchB1(parentDiv) {
    const orders = [];
    const children = document.querySelectorAll('div[data-column^="order-number"]');

    // Collect order numbers from buttons inside child elements
    children.forEach(childDiv => {
        const button = childDiv.querySelector('button');
        if (button) {
            orders.push(button.innerText);
        }
    });

    // Combine all orders into a single string
    const orderNumber = orders.join(',');
    const itemSku = 'all';

    // Extract the batch name from the button inside parentDiv
    const extraButton = parentDiv.querySelector('button');
    const extra = extraButton ? extraButton.innerText : '';

    return { orderNumber, itemSku, extra };
}

function handleScanS1(storedData) {
    const infoChildren = document.querySelector('div[class^="scan-page-"] div[class^="body-header-"]').children;

    const orderNumber = infoChildren[3].innerText;
    const shipmentNumber = infoChildren[1].innerText;

    const array = [];
    const children = document.querySelectorAll('div[class^="item-list-container-"] div[class*="info-and-buttons-"]');

    children.forEach(childDiv => {

        // Extract SKU and sanitize
        const skuLines = childDiv.querySelectorAll('span[class^="sku-upc-"]');

        const itemSku = sanitizeText(skuLines[0].firstElementChild.innerText.replace('SKU:', ''));
        const itemUPC = sanitizeText(skuLines[1].innerText.replace('UPC:', ''));

        // Send kill command for the extracted SKU
        killOnDeviceForSKU(itemSku);

        // Extract and sanitize quantity
        const quantityElement = closestNextSibling(childDiv, 'div[class*="counts-"]');
        const quantity = sanitizeText(quantityElement.firstChild.innerText);


        const data = createCommandData(storedData, itemSku, itemUPC, quantity, orderNumber, shipmentNumber, productName);

        if (data) {
            array.push(data);
        }
    });

    chrome.runtime.sendMessage({ action: "voodooDevices", array }, (response) => {
        if (response.done) {
            console.log('Device commands sent successfully');
        } else {
            console.error('Failed to send device commands');
        }
    });
}



// Helper function to create command data
function createCommandData(storedData, itemSku, itemUPC, quantity, orderNumber, shipmentNumber, productName) {
    
    // Generate the command data object
    const data = {
        command: 'flash',
        location: itemSku,
        color: storedData.color,
        seconds: storedData.seconds,
        quantity: quantity,
        nonce: generateKillNonce(storedData, orderNumber, shipmentNumber, itemSku, quantity)
    };

    let lineCount = 1;
    if (storedData.name) data['line' + lineCount++] = storedData.name;
    if (storedData.pickword) data['line' + lineCount++] = storedData.pickword;
    data['line' + lineCount++] = itemSku;
    if (storedData.addproductname) data['line' + lineCount++] = productName;
    if (storedData.addupcbarcode && itemUPC) data['barcode'] = itemUPC;
    if (storedData.addskubarcode) data['barcode'] = itemSku;
    if (storedData.addorder) data['line' + lineCount++] = orderNumber;
    if (storedData.addshipment) data['line' + lineCount++] = shipmentNumber;
    if (storedData.beep) data['sound'] = '15,c5,4';

    // Store nonce in the document's killNonces object
    document.killNonces[itemSku] = data.nonce;

    return data;
}

// Helper function to generate a unique nonce
function generateKillNonce(storedData, orderNumber, shipmentNumber, itemSku, quantity) {
    const randomString = () =>
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);

    return `${storedData.name}-${orderNumber}-${shipmentNumber}-${itemSku}-qty:${quantity}-${randomString()}`;
}


function handleScanS2(target,storedData) {

    let infoChildren = document.querySelector('div[class^="scan-page-"] div[class^="body-header-"]').children;

    let orderNumber = infoChildren[3].innerText;
    let shipmentNumber = infoChildren[1].innerText;

    let infoDiv = target.parentElement.parentElement;
    infoDiv = closestPreviousSibling(infoDiv, 'div[class*="info-and-buttons-"]');


    // Extract SKU and sanitize
    const productName = infoDiv.querySelector('span[class^="name-"]').innerText.trim();
    const skuLines = infoDiv.querySelectorAll('span[class^="sku-upc-"]');

    const itemSku = sanitizeText(skuLines[0].firstElementChild.innerText.replace('SKU:', ''));
    const itemUPC = sanitizeText(skuLines[1].innerText.replace('UPC:', ''));

    // Send kill command for the extracted SKU
    killOnDeviceForSKU(itemSku);

    // Extract and sanitize quantity
    const quantityElement = closestNextSibling(infoDiv, 'div[class*="counts-"]');

    const quantity = sanitizeText(quantityElement.firstChild.innerText);

    // Generate command data
    const data = createCommandData(storedData, itemSku, itemUPC, quantity, orderNumber, shipmentNumber, productName);

    // Send the command to background.js
    chrome.runtime.sendMessage({ action: "voodooDevices", array: [data] }, (response) => {
        if (response.done) {
            console.log('Device command sent successfully');
        } else {
            console.error('Failed to send device command');
        }
    });
}

/*

async function doImageClickWork(target, attribute) {
    console.log('doing click for ' + attribute);

    parentDiv = target.parentElement;

    let orderNumber = '';
    let itemSku = '';
    let quantity = '';
    let extra = '';

    //c1 is the order column
    if (attribute == 'c1') {
        orderNumber = parentDiv.innerText;
        itemSku = 'all';

        let storedData = await getStoredData();

        if (storedData.addorder) {
            extra = orderNumber;
        }
    }

    //c2 is the item SKU column
    else if (attribute == 'c2') {
        itemSku = parentDiv.innerText;
        orderNumber = parentDiv.parentElement.firstChild.innerText;
        if (itemSku.includes('Item')) {
            itemSku = 'all';
        }
        if (orderNumber == '') {
            const result = findPreviousSiblingWithNonEmptyFirstChildText(parentDiv.parentElement);
            orderNumber = result.firstChild.innerText;
        }

        let storedData = await getStoredData();


        if (storedData.addorder) {
            extra = orderNumber;
        }
    }

    //p1 is the top of the side panel

    //p2 is the item SKU in the side panel
    else if (attribute == 'p2') {
        itemSku = parentDiv.innerText;
        itemSku = itemSku.replace('SKU:', '');
        itemSku = sanitizeText(itemSku);

        displayWrapper = parentDiv.closest('div[class*="item-display-wrapper"]');
        quantity = closestNextSibling(displayWrapper, 'div[class*="quantity-column"]').innerText;
        quantity = sanitizeText(quantity);

        //where there is more than one order selected
        let master = parentDiv.closest('div[class*="item-display-wrapper"]');
        let title = closestPreviousSibling(master, 'div[class*="item-list-title"]');
        orderNumber = title.innerText;
        orderNumber = orderNumber.replace('Items from Order #', '');

        //if only one order was selected, the above will yield 'Items'
        if (orderNumber == 'Items' || orderNumber == '') {
            master = parentDiv.closest('div[class^="side-bar"]');
            orderNumber = master.firstChild.firstChild.firstChild.innerText;
        }

        let storedData = await getStoredData();

        if (storedData.addorder) {
            extra = orderNumber;
        }
    }

    //m1 is the top of the master panel (once an order is clicked on)
    else if (attribute == 'm1') {
        let master = parentDiv.closest('div[class^="drawer"]');
        master = master.querySelector('div[class*="order-info-order-number"]');
        orderNumber = master.innerText;
        orderNumber = orderNumber.replace('Order # ', '');
        itemSku = 'all';

        let storedData = await getStoredData();

        if (storedData.addorder) {
            extra = orderNumber;
        }
    }

    //m2 is the item SKU in the master panel
    else if (attribute == 'm2') {
        let master = parentDiv.parentElement.querySelector('div[class*="item-sku-with-order-number"]');
        itemSku = master.innerText;
        itemSku = itemSku.replace('SKU:', '');
        itemSku = sanitizeText(itemSku);

        quantity = target.previousElementSibling.innerText;
        quantity = sanitizeText(quantity);

        master = parentDiv.closest('div[class^="drawer"]');
        master = master.querySelector('div[class*="order-info-order-number"]');
        orderNumber = master.innerText;
        orderNumber = orderNumber.replace('Order #', '');
        orderNumber = sanitizeText(orderNumber);

        let storedData = await getStoredData();

        if (storedData.addorder) {
            extra = orderNumber;
        }
    }
    else if (attribute == 'b1') {
        let orders = []
        //let master = parentDiv.parentElement.parentElement.querySelector('div[class^="grid-rows-container"]');
        //for each div inside master, if there is a div that has data-column=="order-number"
        //then get the text inside that div and append it to the list of orders

        //let children = document.querySelectorAll('div[class^="grid-rows-"]');
        let children = document.querySelectorAll('div[data-column^="order-number"]');
        children.forEach(childDiv => {
            button = childDiv.querySelector('button');
            if (button) {
                orders.push(button.innerText);
            }
        });

        //now set orderNumber to all the orders separated by a comma
        orderNumber = orders.join(',');
        itemSku = 'all';

        //extra is the batch name
        extra = parentDiv.querySelector('button').innerText;
    }
    else if (attribute == 's1') {
        //Use the new style of calling the background.js
        let storedData = await getStoredData();

        let infoChildren = document.querySelector('div[class^="scan-page-"] div[class^="body-header-"]').children;

        let orderNumber = infoChildren[3].innerText;
        let shipmentNumber = infoChildren[1].innerText;

        //create an array
        let array = [];
        let children = document.querySelectorAll('div[class^="item-list-container-"] div[class*="info-and-buttons-"]');
        children.forEach(childDiv => {

            // Query all span elements with class starting with "sku-upc-"
            let skuLines = childDiv.querySelectorAll('span[class^="sku-upc-"]');

            // Get the first element from the NodeList and extract the SKU
            let master = skuLines[0];
            let itemSku = master.firstElementChild.innerText;
            itemSku = itemSku.replace('SKU:', '');
            itemSku = sanitizeText(itemSku);

            // Get the second element from the NodeList and extract the UPC
            master = skuLines[1];
            let itemUPC = master.innerText;
            itemUPC = itemUPC.replace('UPC:', '');
            itemUPC = sanitizeText(itemUPC);

            // Send the "kill" command for the extracted SKU just in case there is already one pending
            killOnDeviceForSKU(itemSku);

            // Find the quantity from the closest next sibling with class containing "counts-"
            let quantity = closestNextSibling(childDiv, 'div[class*="counts-"]').firstChild.innerText;

            // Create an object to hold the command data
            let data = {};
            let lineCount = 1;
            data['command'] = 'flash';
            data['location'] = itemSku;
            data['color'] = storedData.color;
            data['seconds'] = storedData.seconds;
            data['quantity'] = quantity;

            // Add additional lines to the command data based on stored settings
            if (storedData.name) {
                data['line' + lineCount++] = storedData.name;
            }
            if (storedData.pickword) {
                data['line' + lineCount++] = storedData.pickword;
            }
            data['line' + lineCount++] = itemSku;
            if (storedData.addupcbarcode && itemUPC) {
                data['barcode'] = itemUPC;
            }
            if (storedData.addorder) {
                data['line' + lineCount++] = orderNumber;
            }
            if (storedData.addshipment) {
                data['line' + lineCount++] = shipmentNumber;
            }
            if (storedData.beep) {
                data['sound'] = '15,c5,4';
            }

            // Generate a unique nonce for the kill command
            let killNonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            killNonce = storedData.name + '-' + orderNumber + '-' + shipmentNumber + '-' + itemSku + '-qty:' + quantity + '-' + killNonce;

            // Add the nonce to the command data
            data['nonce'] = killNonce;

            // Store the nonce in the document's killNonces object
            document.killNonces[itemSku] = killNonce;

            // Add the command data to the array
            array.push(data);

        });







        chrome.runtime.sendMessage({ action: "voodooDevices", array }, function (response) {
            //for now, background.js only returns true in the done parameter
            if (response.done) {
            }
            else {
            }
        });



        return; //this prevents the sendmessage to voodooCall below!

    }
    else if (attribute == 's2') {

        let infoChildren = document.querySelector('div[class^="scan-page-"] div[class^="body-header-"]').children;

        let orderNumber = infoChildren[3].innerText;
        let shipmentNumber = infoChildren[1].innerText;

        let infoDiv = parentDiv.parentElement;
        infoDiv = closestPreviousSibling(infoDiv, 'div[class*="info-and-buttons-"]');

        // Query all span elements with class starting with "sku-upc-"
        let skuLines = childDiv.querySelectorAll('span[class^="sku-upc-"]');

        // Get the first element from the NodeList and extract the SKU
        let master = skuLines[0];
        let itemSku = master.firstElementChild.innerText;
        itemSku = itemSku.replace('SKU:', '');
        itemSku = sanitizeText(itemSku);

        // Get the second element from the NodeList and extract the UPC
        master = skuLines[1];
        let itemUPC = master.innerText;
        itemUPC = itemUPC.replace('UPC:', '');
        itemUPC = sanitizeText(itemUPC);

        // Send the "kill" command for the extracted SKU just in case there is already one pending
        killOnDeviceForSKU(itemSku);

        // Find the quantity from the closest next sibling with class containing "counts-"
        let quantity = closestNextSibling(childDiv, 'div[class*="counts-"]').firstChild.innerText;

        // Create an object to hold the command data
        let data = {};
        let lineCount = 1;
        data['command'] = 'flash';
        data['location'] = itemSku;
        data['color'] = storedData.color;
        data['seconds'] = storedData.seconds;
        data['quantity'] = quantity;

        // Add additional lines to the command data based on stored settings
        if (storedData.name) {
            data['line' + lineCount++] = storedData.name;
        }
        if (storedData.pickword) {
            data['line' + lineCount++] = storedData.pickword;
        }
        data['line' + lineCount++] = itemSku;
        if (storedData.addupcbarcode && itemUPC) {
            data['barcode'] = itemUPC;
        }
        if (storedData.addorder) {
            data['line' + lineCount++] = orderNumber;
        }
        if (storedData.addshipment) {
            data['line' + lineCount++] = shipmentNumber;
        }
        if (storedData.beep) {
            data['sound'] = '15,c5,4';
        }

        // Generate a unique nonce for the kill command
        let killNonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        killNonce = storedData.name + '-' + orderNumber + '-' + shipmentNumber + '-' + itemSku + '-qty:' + quantity + '-' + killNonce;

        // Add the nonce to the command data
        data['nonce'] = killNonce;

        // Store the nonce in the document's killNonces object
        document.killNonces[itemSku] = killNonce;

        // Add the command data to the array
        array.push(data);







        chrome.runtime.sendMessage({ action: "voodooDevices", array }, function (response) {
            //for now, background.js only returns true in the done parameter
            if (response.done) {
            }
            else {
            }
        });



        return; //this prevents the sendmessage to voodooCall below!
    }


    chrome.runtime.sendMessage({ action: "voodooCall", itemSku: itemSku, orderNumber: orderNumber, quantity: quantity, extra: extra }, function (response) {
        // for now, background.js only returns true in the done parameter
        if (response.done) {
        }
        else {
        }
    });
}
*/


/**
 * Function to handle the click event on an image.
 * This function prevents the default behavior, stops the event from propagating,
 * and performs additional work based on the clicked image.
 *
 * @param {Event} event - The click event object.
 */
function imageClickHandler(event) {
    // Handle the click event
    // console.log('Button clicked:', event.target);

    // Set a flag to prevent auto-submit
    document.preventAutoSubmit = true;

    // Stop the event from propagating further
    event.stopImmediatePropagation();

    // Prevent the default action associated with the event
    event.preventDefault();

    // Perform additional work based on the clicked image
    doImageClickWork(event.target, event.target.getAttribute('vType'));
}



//make this a global load so that it doesn't neet to be repeatedly loaded
const imageUrl = chrome.runtime.getURL('icons/icon16.png');

/**
 * Function to add a button to a div if needed.
 * This function checks if a button of a specific type already exists in the div.
 * If not, it creates and adds the button to the div.
 *
 * @param {HTMLElement} div - The div element to which the button may be added.
 * @param {string} type - The type of button to add (used to identify the button).
 *
async function addButtonToDivIfNeeded(div, type) {


    //There are a few cases where we don't want to add a button
    if (div.innerText.trim() === '') {
        return;
    }
    if (div.querySelector('div[class^="header"]')) {
        return;
    }

    if (type != 'm1' && type != 'm2' && hasAncestorWithClass(div, 'order-details-drawer')) {
        return;
    }

    if (type == 's1') {
        let sibling = div.previousElementSibling;
        if (!sibling) return;
        if (!sibling.matches('span[class^="label-"]')) return;
        if (sibling.innerText != 'Order') return;
    }

    if (type == 's2') {
        if (div.matches('div[class*="verified-quantity-count-"]')) return;
        if (div.parentElement.matches('div[class*="verified-"]')) return;
    }


    
    // if (type=='m1' && !hasAncestorWithClass(div,'shipment-items-section-header-labels')) {
    //     return;
    // }

    // Check if the div already has a button added by the script
    if (!div.querySelector('.my-custom-button')) { // We use this specific class to identify our buttons

        const button = document.createElement('img');  //notice 'button' is a misnomer, it's an img tag
        button.classList.add('my-custom-button'); // Add a class for easy identification
        button.style.cssText = 'float: right; margin-top: 6px; border: none; background: none;';
        // Example style to right-justify the button
        // We modify as needed, below


        if (type == 'p2') {
            button.style.cssText = 'float: right; margin-bottom: 7px; border: none; background: none;';
        }
        else if (type == 'm2') {
            button.style.cssText = 'float: right; margin-bottom: 8px; margin-left: 10px; border: none; background: none;';
        }
        else if (type == 'c1') {
            button.style.cssText = 'float: right; margin-top: -16px; border: none; background: none;';
        }
        // const img = document.createElement('img');
        // above moved to global

        button.src = imageUrl; // Path to the image
        button.width = 16;
        button.height = 16;
        button.setAttribute('vType', type);


        if (type == 'p1') {
            const regex = /Item(s?)/;
            if (regex.test(div.textContent)) {

                if (hasAncestorWithClass(div, 'orders-drawer-scrollable')) {
                    div.style.flex = "0";
                    button.style.cssText = 'float: right; margin-top: 0px; margin-left: 10px; border: none; background: none;'; // Example style to right-justify the button
                }

                // Create a placeholder for the button to ensure unique insertion
                const uniquePlaceholder = '[[BUTTON_PLACEHOLDER]]';

                // Replace the first occurrence of 'Item' with itself plus a unique placeholder
                const updatedHTML = div.innerHTML.replace(regex, match => `${match}${uniquePlaceholder}`);


                // Update the div's HTML with the placeholder
                div.innerHTML = updatedHTML;

                // Now replace the placeholder with your actual button HTML
                div.innerHTML = div.innerHTML.replace(uniquePlaceholder, button.outerHTML);
            }
        }
        else if (type == 'm1') {
            button.style.cssText = 'float: right; margin-top: 4px; margin-left: 10px; border: none; background: none;'; // Example style to right-justify the button
            let master = div.querySelector('h2[class*="order-details-section-title"]');
            master.appendChild(button);
        }
        else if (type == 'b1') {
            button.style.cssText = 'float: right; margin-left: 20px; margin-top: 6px; border: none; background: none;';
            div.appendChild(button);
        }
        else if (type == 's1') {
            let storedData = await getStoredData();

            button.style.cssText = 'margin-left:4px; margin-top: 6px; border: none; background: none;';
            if (storedData.autosubmit && storedData.minimalmode) {
                button.style.cssText = 'margin-left:4px; margin-top: 6px; border: none; background: none; visibility: hidden;';
            }

            //Note that the div is actually a span here!
            div.appendChild(button);
            console.log('added s1 button');

            document.killNonces = {};
            document.preventAutoSubmit = false;
        }
        else if (type == 's2') {
            let storedData = await getStoredData();


            button.style.cssText = 'float: right; margin-left: 8px; margin-top: 2px; border: none; background: none;';
            if (storedData.autosubmit && storedData.minimalmode) {
                button.style.cssText = 'float: right; margin-left: 8px; margin-top: 2px; border: none; background: none; visibility: hidden;';
            }
            // let ins = closestNextSibling(div,'div[class*="counts-"]');
            // ins.appendChild(button);
            div.appendChild(button);
            console.log('added s2 button');

            if (storedData.autosubmit && !document.preventAutoSubmit) {
                doImageClickWork(button, type);
            }
        }
        else {
            div.appendChild(button);
        }

        // Make sure we add a click handler to the button, wherever we inserted it
        div.querySelectorAll('img.my-custom-button').forEach(childDiv => {
            childDiv.addEventListener('click', imageClickHandler);
        });
    }
}
    */


/**
 * Checks if a button should be added to the div based on various conditions.
 *
 * @param {HTMLElement} div - The div element to check.
 * @param {string} type - The type of button.
 * @returns {boolean} - Returns true if the button should not be added.
 */
function shouldSkipAddingButton(div, type) {
    if (div.innerText.trim() === '') return true;
    if (div.querySelector('div[class^="header"]')) return true;

    if (type !== 'm1' && type !== 'm2' && hasAncestorWithClass(div, 'order-details-drawer')) return true;

    if (type === 's1') {
        let sibling = div.previousElementSibling;
        if (!sibling || !sibling.matches('span[class^="label-"]') || sibling.innerText !== 'Order') return true;
    }

    if (type === 's2') {
        if (div.matches('div[class*="verified-quantity-count-"]')) return true;
        if (div.parentElement.matches('div[class*="verified-"]')) return true;
    }

    return false;
}

/**
 * Sets the button style based on its type.
 *
 * @param {HTMLElement} button - The button element.
 * @param {string} type - The type of button.
 */

//p1 is the top of the side panel
//p2 is the item SKU in the side panel
//m1 is the top of the master panel (once an order is clicked on)
//m2 is the item SKU in the master panel
//c1 is the order column
//c2 is the item SKU column
//b1 is the batch button
//s1 is the order scan button
//s2 is the item scan button
function setButtonStyle(button, type) {
    const styles = {
        default: 'float: right; margin-top: 6px; border: none; background: none;',
        p2: 'float: right; margin-bottom: 7px; border: none; background: none;',
        m2: 'float: right; margin-bottom: 8px; margin-left: 10px; border: none; background: none;',
        c1: 'float: right; margin-top: -16px; border: none; background: none;',
        p1: 'float: right; margin-top: 0px; margin-left: 10px; border: none; background: none;',
        m1: 'float: right; margin-top: 4px; margin-left: 10px; border: none; background: none;',
        b1: 'float: right; margin-left: 20px; margin-top: 6px; border: none; background: none;',
        s1: 'margin-left: 4px; margin-top: 6px; border: none; background: none;',
        s2: 'float: right; margin-left: 8px; margin-top: 2px; border: none; background: none;',
    };

    button.style.cssText = styles[type] || styles.default;
}

/**
 * Handles button placement and additional behavior based on type.
 *
 * @param {HTMLElement} div - The div element to add the button.
 * @param {HTMLElement} button - The button element.
 * @param {string} type - The type of button.
 */
async function handleButtonPlacement(div, button, type) {
    if (type === 'p1') {  //not currently used!
        const regex = /Item(s?)/;
        if (regex.test(div.textContent)) {
            if (hasAncestorWithClass(div, 'orders-drawer-scrollable')) {
                div.style.flex = '0';
            }

            const placeholder = '[[BUTTON_PLACEHOLDER]]';
            div.innerHTML = div.innerHTML.replace(regex, match => `${match}${placeholder}`);
            div.innerHTML = div.innerHTML.replace(placeholder, button.outerHTML);
        }
    } else if (type === 'm1') {
        const master = div.querySelector('h2[class*="order-details-section-title"]');
        if (master) master.appendChild(button);
    } else if (type === 'b1' || type === 's1' || type === 's2') {
        const storedData = await getStoredData();

        if (storedData.autosubmit && storedData.minimalmode) {
            button.style.visibility = 'hidden';
        }

        div.appendChild(button);

        if (type === 's1') {
            document.killNonces = {};
            document.preventAutoSubmit = false;
        }
        if (type === 's2' && storedData.autosubmit && !document.preventAutoSubmit) {
            doImageClickWork(button, type);
        }
    } else {
        div.appendChild(button);
    }
}

/**
 * Main function to add a button to a div if needed.
 *
 * @param {HTMLElement} div - The div element to which the button may be added.
 * @param {string} type - The type of button to add.
 */
async function addButtonToDivIfNeeded(div, type) {
    if (shouldSkipAddingButton(div, type)) return;

    if (!div.querySelector('.my-custom-button')) {
        const button = document.createElement('img');
        button.classList.add('my-custom-button');
        button.src = imageUrl;
        button.width = 16;
        button.height = 16;
        button.setAttribute('vType', type);

        setButtonStyle(button, type);
        await handleButtonPlacement(div, button, type);

        div.querySelectorAll('img.my-custom-button').forEach(childDiv => {
            childDiv.addEventListener('click', imageClickHandler);
        });
    }
}


// MutationObserver callback function
// This is called whenever anything changes in the interface
// We get a list of the changes
// We loop through the changes and check if they are the type we want
// If they are, we check if they are the specific elements we want

const mutationCallback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {

        if (mutation.type === 'childList') {


            mutation.addedNodes.forEach(node => {

                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Additionally, check if there are matching child nodes in the added node


                    node.querySelectorAll('div[class^="grid-page-"] div[data-column="order-number"][role="cell"]').forEach(childDiv => {
                        //get minimalmode from storage
                        chrome.storage.local.get({ minimalmode: true }, function (storedData) {

                            // This was a useful debug step
                            // chrome.storage.sync was not working on firefox
                            // Below helped identify this problem
                            if (chrome.runtime.lastError) {
                                console.error('Error retrieving settings:', chrome.runtime.lastError);
                                return; // Exit the callback if an error occurred
                            }

                            if (!storedData.minimalmode) {
                                addButtonToDivIfNeeded(childDiv, 'c1');
                            }
                        });
                    });
                    node.querySelectorAll('div[class^="grid-page-"] div[data-column="item-sku"][role="cell"]').forEach(childDiv => {
                        chrome.storage.local.get({ minimalmode: true }, function (storedData) {

                            // This was a useful debug step
                            // chrome.storage.sync was not working on firefox
                            // Below helped identify this problem
                            if (chrome.runtime.lastError) {
                                console.error('Error retrieving settings:', chrome.runtime.lastError);
                                return; // Exit the callback if an error occurred
                            }

                            if (!storedData.minimalmode) {
                                addButtonToDivIfNeeded(childDiv, 'c2');
                            }
                        });
                    });


                    //we're not doing p1 (for now)
                    //It's complicated if there is more than one order selected
                    //The side panel might be an amalgamation of multiple orders

                    // node.querySelectorAll('div[class^="collapsible-list-item-header-content"]').forEach(childDiv => {
                    //     addButtonToDivIfNeeded(childDiv, 'p1');
                    // });           

                    node.querySelectorAll('div[class^="grid-page-"] div[class^="item-sku-"]').forEach(childDiv => {
                        addButtonToDivIfNeeded(childDiv, 'p2');
                    });
                    node.querySelectorAll('div[class*="order-details-drawer-"] div[class*="shipment-items-section-header-labels"]').forEach(childDiv => {
                        addButtonToDivIfNeeded(childDiv.parentElement, 'm1');
                    });
                    node.querySelectorAll('div[class*="order-details-drawer-"] div[aria-labelledby="quantity"][role="cell"]').forEach(childDiv => {
                        addButtonToDivIfNeeded(childDiv, 'm2');
                    });
                    node.querySelectorAll('div[class^="grid-page-"] div[class^="batch-title"]').forEach(childDiv => {
                        addButtonToDivIfNeeded(childDiv, 'b1');
                    });
                    node.querySelectorAll('div[class^="scan-page-"] span[class^="info-"]').forEach(childSpan => {
                        addButtonToDivIfNeeded(childSpan, 's1');
                    });
                    node.querySelectorAll('div[class^="scan-page-"] div[class^="item-list-"] div[class*="item-count-"]').forEach(childDiv => {
                        addButtonToDivIfNeeded(childDiv, 's2');
                    });

                    node.querySelectorAll('div[class^="scan-page-"] div[class^="item-list-"] div[class*="item-count-"]').forEach(childDiv => {
                        if (childDiv.parentElement.matches('div[class*="verified-"]')) {
                            // console.log('verified count');
                            doKill(childDiv);
                        }
                    });
                }
            });

        }
    }
};





// Create a new MutationObserver instance and start observing
const observer = new MutationObserver(mutationCallback);
observer.observe(document.body, { childList: true, subtree: true });

