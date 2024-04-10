

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


function imageClickHandler(event) {
    // Handle the click event
    // console.log('Button clicked:', event.target);
    event.stopImmediatePropagation();
    event.preventDefault();
    let attribute = event.target.getAttribute('vType');

    // Get the parent div
    let parentDiv = event.target.parentElement;
    let orderNumber = '';
    let itemSku = '';
    //if parentDiv has an attribute of data-column set to order-number
    if (attribute=='c1') {
        orderNumber = parentDiv.innerText;
        itemSku = 'all';
        console.log('Order Number:', orderNumber);
        console.log('Item SKU:', itemSku);        // Send a message to the background script

        // Send a message to the background script
        // chrome.runtime.sendMessage({ type: 'order-number', orderNumber });
    }
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
        console.log('Order Number:', orderNumber);
        console.log('Item SKU:', itemSku);        // Send a message to the background script
        // chrome.runtime.sendMessage({ type: 'item-sku', itemSku });
    }
    else if (attribute=='p2') {
        itemSku = parentDiv.innerText;

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
        console.log('Order Number:', orderNumber);
        console.log('Item SKU:', itemSku);
    }
    else if (attribute=='m1') {
        let master = parentDiv.closest('div[class^="drawer"]');
        master = master.querySelector('div[class*="order-info-order-number"]');
        orderNumber = master.innerText;
        orderNumber = orderNumber.replace('Order # ','');
        itemSku = 'all';
        console.log('Order Number:', orderNumber);
        console.log('Item SKU:', itemSku);
    }
    else if (attribute=='m2') {
        let master = parentDiv.parentElement.querySelector('div[class*="item-sku-with-order-number"]');
        itemSku = master.innerText;
        itemSku = itemSku.replace('SKU: ','');

        master = parentDiv.closest('div[class^="drawer"]');
        master = master.querySelector('div[class*="order-info-order-number"]');
        orderNumber = master.innerText;
        orderNumber = orderNumber.replace('Order # ','');
        console.log('Order Number:', orderNumber);
        console.log('Item SKU:', itemSku);
    }
    chrome.runtime.sendMessage({action: "voodooCall",itemSku: itemSku, orderNumber: orderNumber}, function(response) {
        console.log('Received:', response);
        if (response.success) {
            console.log('Success!');
        }
        else {
            console.log('Failed!');
        }
        // Use the options as needed here
    });
}


// Function to add a button to a div if it doesn't already have one


const imageUrl = chrome.runtime.getURL('icons/icon16.png');




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

function addButtonToDivIfNeeded(div, type) {
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

    // Check if the div already has a button added by your script
    if (!div.querySelector('.my-custom-button')) { // Use a specific class to identify your buttons
        
        const button = document.createElement('img');
        button.classList.add('my-custom-button'); // Add a class for easy identification
        button.style.cssText = 'float: right; margin-top: 6px; border: none; background: none;'; // Example style to right-justify the button
        // if (type == 'p1') {
        //     button.style.cssText = 'float: right; margin-top: 4px; margin-left: 10px; border: none; background: none;'; // Example style to right-justify the button
        // }
        if (type == 'p2') {
            button.style.cssText = 'float: right; margin-bottom: 7px; border: none; background: none;'; // Example style to right-justify the button
        }
        else if (type == 'm2') {
            button.style.cssText = 'float: right; margin-bottom: 8px; margin-left: 10px; border: none; background: none;'; // Example style to right-justify the button
        }

        // const img = document.createElement('img');
        button.src = imageUrl; // Path to your image
        button.width = 16;
        button.height = 16;
        button.setAttribute('vType', type);
        
    
        // button.appendChild(img);
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
        else {
            div.appendChild(button);
        }
        div.querySelectorAll('img.my-custom-button').forEach(childDiv => {
            childDiv.addEventListener('click', imageClickHandler);
        });
    }
}

// MutationObserver callback function
const callback = function(mutationsList, observer) {
    for (const mutation of mutationsList) {
        if (mutation.type === 'childList') {
            //get minimalmode from storage
            chrome.storage.sync.get(['minimalmode'], function(data) {
                mutation.addedNodes.forEach(node => {
                    // Check if the added node is a DIV and matches your criteria
                    // if (node.nodeType === Node.ELEMENT_NODE && (
                    //         node.matches('div[data-column="order-number"][role="cell"]') ||
                    //         node.matches('div[data-column="item-sku"][role="cell"]')
                    //     )
                    // ) {
                    //     addButtonToDivIfNeeded(node);
                    // }
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Additionally, check if there are matching child nodes in the added node
                        if (!data.minimalmode) {
                            
                        
                            node.querySelectorAll('div[data-column="order-number"][role="cell"]').forEach(childDiv => {
                                addButtonToDivIfNeeded(childDiv, 'c1');
                            });
                            node.querySelectorAll('div[data-column="item-sku"][role="cell"]').forEach(childDiv => {
                                addButtonToDivIfNeeded(childDiv, 'c2');
                            });
                        }
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
                    }
                });
            });
        }
    }
};

// Create a new MutationObserver instance and start observing
const observer = new MutationObserver(callback);
observer.observe(document.body, { childList: true, subtree: true });


