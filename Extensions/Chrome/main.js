chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        if (request.type === "notifications") {
            chrome.notifications.create(request.content);
        } else if (request.type === "checkForUpdate") {
            chrome.runtime.requestUpdateCheck((status) => {
                if (status === "update_available") {
                    const onUpdateAvailable = () => {
                        chrome.runtime.onUpdateAvailable.removeListener(onUpdateAvailable);
                        sendResponse({status: "ready"});
                        // Laisse le temps au message de réponse d'être acheminé avant que reload() ne détruise le canal
                        setTimeout(() => chrome.runtime.reload(), 250);
                    };
                    chrome.runtime.onUpdateAvailable.addListener(onUpdateAvailable);
                } else {
                    sendResponse({status: status});
                }
            });
            return true;
        }
    }
);
