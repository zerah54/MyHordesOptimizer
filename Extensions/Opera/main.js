chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        if (request.type === "notifications") {
            chrome.notifications.create(request.content);
        }
    }
);
