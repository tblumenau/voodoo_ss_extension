// Listen for clicks on the extension's icon.
chrome.action.onClicked.addListener((tab) => {

    chrome.runtime.openOptionsPage();

});

