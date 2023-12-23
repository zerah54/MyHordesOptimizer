browser.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        if (request.type === "notifications") {
            browser.notifications.create(request.content);
        }
    }
);
