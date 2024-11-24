
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


function doImageClickWork(target,attribute) {
    parentDiv  = target.parentElement;

    chrome.storage.local.get(['endpoint', 'name', 'pickword', 'color', 'seconds','apikey','addorder', 'addupc','addshipment','autosubmit'], function(storedData) {
        
        let addorder = storedData.addorder;
        let addupc = storedData.addupc;
        let autosubmit = storedData.autosubmit;   
        let addshipment = storedData.addshipment;
        let name = storedData.name;     
        let pickword = storedData.pickword;
        let color = storedData.color;
        let seconds = storedData.seconds;


        let orderNumber = '';
        let itemSku = '';
        let quantity = '';
        let extra = '';

        //c1 is the order column
        if (attribute=='c1') {
            orderNumber = parentDiv.innerText;
            itemSku = 'all';
            if (addorder) {
                extra = orderNumber;
            }
        }

        //c2 is the item SKU column
        else if (attribute=='c2') {
            itemSku = parentDiv.innerText;
            orderNumber = parentDiv.parentElement.firstChild.innerText;
            if (itemSku.includes('Item')) {
                itemSku = 'all';
            }
            if (orderNumber=='') {
                const result = findPreviousSiblingWithNonEmptyFirstChildText(parentDiv.parentElement);
                orderNumber = result.firstChild.innerText;
            }
            if (addorder) {
                extra = orderNumber;
            }
        }

        //p1 is the top of the side panel

        //p2 is the item SKU in the side panel
        else if (attribute=='p2') {
            itemSku = parentDiv.innerText;
            itemSku = itemSku.replace('SKU:','');
            itemSku = itemSku.replace(/ /g,'');
            itemSku = itemSku.replace(/&nbsp;/g,'');
            itemSku = itemSku.trim();

            displayWrapper = parentDiv.closest('div[class*="item-display-wrapper"]');
            quantity = closestNextSibling(displayWrapper,'div[class*="quantity-column"]').innerText;
            quantity = quantity.replace(/ /g,'');
            quantity = quantity.replace(/&nbsp;/g,'');
            quantity = quantity.trim(); 

            //where there is more than one order selected
            let master = parentDiv.closest('div[class*="item-display-wrapper"]');
            let title = closestPreviousSibling(master,'div[class*="item-list-title"]');
            orderNumber = title.innerText;        
            orderNumber = orderNumber.replace('Items from Order #','');

            //if only one order was selected, the above will yield 'Items'
            if (orderNumber=='Items'||orderNumber=='') {
                master = parentDiv.closest('div[class^="side-bar"]');
                orderNumber = master.firstChild.firstChild.firstChild.innerText;
            }
            if (addorder) {
                extra = orderNumber;
            }
        }

        //m1 is the top of the master panel (once an order is clicked on)
        else if (attribute=='m1') {
            let master = parentDiv.closest('div[class^="drawer"]');
            master = master.querySelector('div[class*="order-info-order-number"]');
            orderNumber = master.innerText;
            orderNumber = orderNumber.replace('Order # ','');
            itemSku = 'all';
            if (addorder) {
                extra = orderNumber;
            }
        }

        //m2 is the item SKU in the master panel
        else if (attribute=='m2') {
            let master = parentDiv.parentElement.querySelector('div[class*="item-sku-with-order-number"]');
            itemSku = master.innerText;
            itemSku = itemSku.replace('SKU:','');
            itemSku = itemSku.replace(/ /g,'');
            itemSku = itemSku.replace(/&nbsp;/g,'');
            itemSku = itemSku.trim();

            quantity = target.previousElementSibling.innerText;
            quantity = quantity.replace(/ /g,'');
            quantity = quantity.replace(/&nbsp;/g,'');
            quantity = quantity.trim(); 

            master = parentDiv.closest('div[class^="drawer"]');
            master = master.querySelector('div[class*="order-info-order-number"]');
            orderNumber = master.innerText;
            orderNumber = orderNumber.replace('Order #','');
            orderNumber = orderNumber.replace(/ /g,'');
            orderNumber = orderNumber.replace(/&nbsp;/g,'');
            orderNumber = orderNumber.trim();

            if (addorder) {
                extra = orderNumber;
            }
        }
        else if (attribute=='b1') {
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
        else if (attribute=='s1') {
            //Use the new style of calling the background.js

            let infoChildren = document.querySelector('div[class^="scan-page-"] div[class^="body-header-"]').children;

            let orderNumber = infoChildren[3].innerText;
            let shipmentNumber = infoChildren[1].innerText;

            //create an array
            let array = [];
            let children = document.querySelectorAll('div[class^="item-list-container-"] div[class*="info-and-buttons-"]');
            children.forEach(childDiv => {

                //in the info and buttons div, add the nonce attribute for a kill
                //but first check if it's already there
                //if it is, we skip this item
                let nonce = childDiv.getAttribute('killnonce');
                if (!nonce) {


                    //get first child of childDiv that has a class that starts with 'label-'
                    let skuLines = childDiv.querySelectorAll('span[class^="sku-upc-"]');
                    let master = skuLines[0];
                    itemSku = master.innerText;
                    itemSku = itemSku.replace('SKU:','');
                    itemSku = itemSku.replace(/&nbsp;/g,'');
                    itemSku = itemSku.replace(/ /g,'');

                    master = skuLines[1];
                    itemUPC = master.innerText;
                    itemUPC = itemUPC.replace('UPC:','');
                    itemUPC = itemUPC.replace(/&nbsp;/g,'');
                    itemUPC = itemUPC.replace(/ /g,'');

                    //find the next sibling that has a class that starts with 'counts-'
                    let quantity = closestNextSibling(childDiv,'div[class*="counts-"]').firstChild.innerText;
                    let data = {};
                    let lineCount = 1;
                    data['command'] = 'flash';
                    data['location'] = itemSku;
                    data['color'] = color;
                    data['seconds'] = seconds;

                    data['quantity'] = quantity;
                    if (name) {
                        data['line'+lineCount++] = name;
                    }
                    if (pickword) {
                        data['line'+lineCount++] = pickword;
                    }
                    data['line'+lineCount++] = itemSku;
                    if (addupc && itemUPC) {
                        data['barcode'] = itemUPC;
                    }
                    if (addorder) {
                        data['line'+lineCount++] = orderNumber;
                    }
                    if (addshipment) {
                        data['line'+lineCount++] = shipmentNumber;
                    }

                    //if we get here, we need to add the killnonce
                    let killNonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
                    killNonce = name + '-' + orderNumber + '-' + shipmentNumber + '-' + itemSku + '- qty: ' + quantity + '-' + killNonce;

                    data['nonce'] = killNonce;

                    childDiv.setAttribute('killnonce',killNonce);

                    array.push(data);
                }
            });
            
            
            




            chrome.runtime.sendMessage({action: "voodooDevices",array}, function(response) {
                //for now, background.js only returns true in the done parameter
                if (response.done) {
                }
                else {
                }
            });
                


            return; //this prevents the sendmessage to voodooCall below!
            
        }
        else if (attribute=='s2') {
        }


        chrome.runtime.sendMessage({action: "voodooCall",itemSku: itemSku, orderNumber: orderNumber, quantity: quantity, extra: extra}, function(response) {
            // for now, background.js only returns true in the done parameter
            if (response.done) {
            }
            else {
            }
        });
    });

}



function imageClickHandler(event) {
    // Handle the click event
    // console.log('Button clicked:', event.target);


    event.stopImmediatePropagation();
    event.preventDefault();

    doImageClickWork(event.target, event.target.getAttribute('vType'));

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

// Function to add a button to a div if it doesn't already have one

//make this a global load so that it doesn't neet to be repeatedly loaded
const imageUrl = chrome.runtime.getURL('icons/icon16.png');


function addButtonToDivIfNeeded(div, type) {

    chrome.storage.local.get({minimalmode: true,autosubmit:false}, function(storedData) {

        //There are a few cases where we don't want to add a button
        if (div.innerText.trim() === '') {
            return;
        }
        if (div.querySelector('div[class^="header"]')) {
            return;
        }
        if (type!='m1' && type!='m2' && hasAncestorWithClass(div,'order-details-drawer')) {
            return;
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

            // const img = document.createElement('img');
            // above moved to global

            button.src = imageUrl; // Path to the image
            button.width = 16;
            button.height = 16;
            button.setAttribute('vType', type);
            
        
            if (type == 'p1') {
                const regex = /Item(s?)/;
                if (regex.test(div.textContent)) {

                    if (hasAncestorWithClass(div,'orders-drawer-scrollable')) {
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

                    button.style.cssText = 'margin-left:4px; margin-top: 6px; border: none; background: none;'; 
                    if (storedData.autosubmit && storedData.minimalmode) {
                        button.style.cssText = 'margin-left:4px; margin-top: 6px; border: none; background: none; visibility: hidden;';
                    }
                    
                    //Note that the div is actually a span here!
                    div.appendChild(button);
            }
            else if (type == 's2') {


                button.style.cssText = 'float: right; margin-right: 8px; margin-top: 2px; border: none; background: none;';
                if (storedData.autosubmit && storedData.minimalmode) {
                    button.style.cssText = 'float: right; margin-right: 8px; margin-top: 2px; border: none; background: none; visibility: hidden;';
                }
                div.insertBefore(button, div.firstChild);

                if (storedData.autosubmit) {
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
    });
}

// MutationObserver callback function
// This is called whenever anything changes in the interface
// We get a list of the changes
// We loop through the changes and check if they are the type we want
// If they are, we check if they are the specific elements we want

const callback = function(mutationsList, observer) {
    for (const mutation of mutationsList) {
        if (mutation.type === 'attributes') {
            if (mutation.attributeName === 'style') {
                if (mutation.target.matches('div[class^="scan-page-"] span[class*="info-and-buttons-"]')) {
                    //style changed on the row
                    //if it switched to verified and there is a killnonce, we need to kill the device
                    let killNonce = mutation.target.getAttribute('killnonce');
                    if (killNonce) {
                        let data = {};
                        data['command'] = 'kill';
                        data['nonce'] = killNonce;
                        chrome.runtime.sendMessage({action: "voodooDevices",array:[data]}, function(response) {
                            //for now, background.js only returns true in the done parameter
                            if (response.done) {
                            }
                            else {
                            }
                        });
                    }
                }
            }
        }
        if (mutation.type === 'childList') {


            mutation.addedNodes.forEach(node => {

                if (node.nodeType === Node.ELEMENT_NODE) {
                    // Additionally, check if there are matching child nodes in the added node
                        
                    
                    node.querySelectorAll('div[data-column="order-number"][role="cell"]').forEach(childDiv => {
                                    //get minimalmode from storage
                        chrome.storage.local.get({minimalmode: true}, function(storedData) {

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
                    node.querySelectorAll('div[data-column="item-sku"][role="cell"]').forEach(childDiv => {
                        chrome.storage.local.get({minimalmode: true}, function(storedData) {

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

                    node.querySelectorAll('div[class^="item-sku-"]').forEach(childDiv => {
                        addButtonToDivIfNeeded(childDiv, 'p2');
                    });
                    node.querySelectorAll('div[class*="shipment-items-section-header-labels"]').forEach(childDiv => {
                        addButtonToDivIfNeeded(childDiv.parentElement, 'm1');
                    });
                    node.querySelectorAll('div[aria-labelledby="quantity"][role="cell"]').forEach(childDiv => {
                        addButtonToDivIfNeeded(childDiv, 'm2');
                    });
                    node.querySelectorAll('div[class^="batch-title"]').forEach(childDiv => {
                        addButtonToDivIfNeeded(childDiv, 'b1');
                    });                
                    node.querySelectorAll('div[class^="scan-page-"] span[class^="info-"]').forEach(childSpan => {
                        //if previous sibling is a span and it has a class that starts with 'label-'
                        var sibling = childSpan.previousElementSibling;
                        if (sibling && sibling.matches('span[class^="label-"]')) {
                            //if if sibling's content is 'Order'
                            if (sibling.innerText == 'Order') {
                                addButtonToDivIfNeeded(childSpan, 's1');
                            }
                        }
                    });
                    node.querySelectorAll('div[class^="scan-page-"] div[class^="item-list-"] div[class*="item-count-"]').forEach(childDiv => {
                        //if it's not the verified
                        if (!childDiv.matches('div[class*="verified-"]')) {
                            //if previous sibling is a span and it has a class that starts
                            addButtonToDivIfNeeded(childDiv, 's2');
                        }
                    });
                }
            });                 
            
        }
    }
};

// Create a new MutationObserver instance and start observing
const observer = new MutationObserver(callback);
observer.observe(document.body, { childList: true, subtree: true , attributes: true, attributeFilter: ['class','style']});


