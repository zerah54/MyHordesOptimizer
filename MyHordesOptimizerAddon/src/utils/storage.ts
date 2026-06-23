export function getStorageItem(key: string): Promise<any> {
    return new Promise((resolve, error) => {
        try {
            GM.getValue(key).then((result) => {
                resolve(result);
            });
        } catch (error) {
            try {
                browser.storage.local.get(key).then((result) => {
                    resolve(result[key]);
                });
            } catch (error) {
                try {
                    chrome.storage.local.get(key).then((result) => {
                        resolve(result[key]);
                    });
                } catch (error) {
                    console.error(error);
                }
            }
        }

    })
}


export function setStorageItem(key, value) {
    try {
        return GM.setValue(key, value);
    } catch (error) {
        try {
            const key_value = {};
            key_value[key] = value;
            return browser.storage.local.set(key_value);
        } catch (error) {
            try {
                const key_value = {};
                key_value[key] = value;
                return chrome.storage.local.set(key_value);
            } catch (error) {
                console.error(error);
            }
        }
    }

}
