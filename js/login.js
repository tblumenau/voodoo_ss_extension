document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent the default form submission
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Send credentials back to the background script
    chrome.runtime.sendMessage({action: "login", username, password}, function(response) {
        // Assuming we receive a response indicating success
        // Check for success if necessary
        window.close(); // Close the login window
    });
});
