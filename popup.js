document.addEventListener("DOMContentLoaded", () => {
    const toggleBlockingButton = document.getElementById("toggle-blocking");
    const statusDisplay = document.getElementById("status");
    const elementListContainer = document.getElementById("element-list");
    const searchInput = document.getElementById("search-elements");
    const checkAllButton = document.getElementById("check-all");
    const uncheckAllButton = document.getElementById("uncheck-all");
    const saveSettingsButton = document.getElementById("save-settings");

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];

        if (activeTab && activeTab.url) {
            const currentDomain = new URL(activeTab.url).hostname;
            statusDisplay.textContent = `Domain: ${currentDomain}`;

            chrome.storage.local.get(["whitelist", "blockedElements"], (data) => {
                const whitelist = data.whitelist || [];
                const blockedElements = data.blockedElements || {};
                const currentBlocked = blockedElements[currentDomain] || [];

                const isWhitelisted = whitelist.includes(currentDomain);
                toggleBlockingButton.textContent = isWhitelisted
                    ? "Enable Blocking"
                    : "Disable on This Site";

                toggleBlockingButton.addEventListener("click", () => {
                    const updatedWhitelist = isWhitelisted
                        ? whitelist.filter(domain => domain !== currentDomain)
                        : [...whitelist, currentDomain];

                    chrome.storage.local.set({ whitelist: updatedWhitelist }, () => {
                        toggleBlockingButton.textContent = isWhitelisted
                            ? "Disable on This Site"
                            : "Enable Blocking";
                        chrome.tabs.reload();
                    });
                });

                chrome.scripting.executeScript(
                    {
                        target: { tabId: activeTab.id },
                        func: () => {
                            return Array.from(document.querySelectorAll("*"))
                                .filter(el => el.id || el.className)
                                .map(el => ({
                                    tag: el.tagName.toLowerCase(),
                                    id: el.id,
                                    class: el.className
                                }));
                        },
                    },
                    (results) => {
                        const elements = results?.[0]?.result || [];
                        elementListContainer.innerHTML = "";

                        if (elements.length === 0) {
                            elementListContainer.innerHTML = "<p>There are no elements to block.</p>";
                            return;
                        }

                        elements.forEach((element, index) => {
                            const listItem = document.createElement("div");
                            listItem.className = "element-item";

                            const checkbox = document.createElement("input");
                            checkbox.type = "checkbox";
                            checkbox.id = `element-${index}`;
                            checkbox.dataset.tag = element.tag;
                            checkbox.dataset.id = element.id;
                            checkbox.dataset.class = element.class;

                            const label = document.createElement("label");
                            label.htmlFor = `element-${index}`;
                            label.textContent = `${element.tag}${element.id ? `#${element.id}` : ""}${element.class ? `.${element.class}` : ""}`;

                            listItem.appendChild(checkbox);
                            listItem.appendChild(label);
                            elementListContainer.appendChild(listItem);

                            if (currentBlocked.some(blocked =>
                                blocked.tag === element.tag &&
                                blocked.id === element.id &&
                                blocked.class === element.class
                            )) {
                                checkbox.checked = true;
                            }
                        });
                    }
                );
            });

            checkAllButton.addEventListener("click", () => {
                elementListContainer.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
                    checkbox.checked = true;
                });
            });

            uncheckAllButton.addEventListener("click", () => {
                elementListContainer.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
                    checkbox.checked = false;
                });
            });

            searchInput.addEventListener("input", (event) => {
                const query = event.target.value.toLowerCase();
                elementListContainer.querySelectorAll(".element-item").forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = text.includes(query) ? "block" : "none";
                });
            });

            saveSettingsButton.addEventListener("click", () => {
                const selectedElements = Array.from(elementListContainer.querySelectorAll("input[type='checkbox']:checked")).map(checkbox => ({
                    tag: checkbox.dataset.tag,
                    id: checkbox.dataset.id,
                    class: checkbox.dataset.class
                }));

                chrome.storage.local.get("blockedElements", (data) => {
                    const updatedBlockedElements = {
                        ...data.blockedElements,
                        [currentDomain]: selectedElements
                    };

                    chrome.storage.local.set({ blockedElements: updatedBlockedElements }, () => {
                        alert("Settings saved successfully!");
                        chrome.tabs.reload();
                    });
                });
            });
        } else {
            statusDisplay.textContent = "The tab does not have a valid URL.";
            toggleBlockingButton.style.display = "none";
        }
    });
});
