chrome.runtime.onInstalled.addListener(() => {
    console.log("Advanced Ad Blocker (Manifest V3) installed.");

    chrome.declarativeNetRequest.updateDynamicRules(
        {
            removeRuleIds: [1, 2, 3, 4, 5, 6],
            addRules: [
                {
                    id: 1,
                    priority: 1,
                    action: { type: "block" },
                    condition: {
                        urlFilter: "*://*.doubleclick.net/*",
                        resourceTypes: ["script", "image", "xmlhttprequest", "sub_frame"]
                    }
                },
                {
                    id: 2,
                    priority: 1,
                    action: { type: "block" },
                    condition: {
                        urlFilter: "*://*.googlesyndication.com/*",
                        resourceTypes: ["script", "image", "xmlhttprequest", "sub_frame"]
                    }
                }
            ]
        },
        () => {
            if (chrome.runtime.lastError) {
                console.error("Gagal memperbarui aturan pemblokiran:", chrome.runtime.lastError);
            } else {
                console.log("Aturan pemblokiran diperbarui.");
            }
        }
    );
});
