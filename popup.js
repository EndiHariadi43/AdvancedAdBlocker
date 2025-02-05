document.addEventListener("DOMContentLoaded", () => {
    const toggleBlockingButton = document.getElementById("toggle-blocking");
    const statusDisplay = document.getElementById("status");
    const elementListContainer = document.getElementById("element-list");
    const searchInput = document.getElementById("search-elements");
    const checkAllButton = document.getElementById("check-all");
    const uncheckAllButton = document.getElementById("uncheck-all");
    const saveSettingsButton = document.getElementById("save-settings");

    // Dapatkan tab aktif dan domain saat ini
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const activeTab = tabs[0];

        if (activeTab && activeTab.url) {
            const currentDomain = new URL(activeTab.url).hostname;
            statusDisplay.textContent = `Domain: ${currentDomain}`;

            // Dapatkan whitelist dan elemen yang diblokir
            chrome.storage.local.get(["whitelist", "blockedElements"], (data) => {
                const whitelist = data.whitelist || [];
                const blockedElements = data.blockedElements || {};
                const currentBlocked = blockedElements[currentDomain] || [];

                // Update tombol whitelist
                const isWhitelisted = whitelist.includes(currentDomain);
                toggleBlockingButton.textContent = isWhitelisted
                    ? "Aktifkan Pemblokiran"
                    : "Nonaktifkan di Situs Ini";

                // Event listener untuk toggle whitelist
                toggleBlockingButton.addEventListener("click", () => {
                    const updatedWhitelist = isWhitelisted
                        ? whitelist.filter(domain => domain !== currentDomain)
                        : [...whitelist, currentDomain];

                    chrome.storage.local.set({ whitelist: updatedWhitelist }, () => {
                        toggleBlockingButton.textContent = isWhitelisted
                            ? "Nonaktifkan di Situs Ini"
                            : "Aktifkan Pemblokiran";
                        chrome.tabs.reload();
                    });
                });

                // Eksekusi skrip untuk mendapatkan elemen DOM
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
                            elementListContainer.innerHTML = "<p>Tidak ada elemen yang dapat diblokir.</p>";
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

                            // Tandai elemen yang sudah diblokir
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

            // Event listener untuk "Pilih Semua"
            checkAllButton.addEventListener("click", () => {
                elementListContainer.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
                    checkbox.checked = true;
                });
            });

            // Event listener untuk "Hapus Semua"
            uncheckAllButton.addEventListener("click", () => {
                elementListContainer.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
                    checkbox.checked = false;
                });
            });

            // Pencarian elemen
            searchInput.addEventListener("input", (event) => {
                const query = event.target.value.toLowerCase();
                elementListContainer.querySelectorAll(".element-item").forEach(item => {
                    const text = item.textContent.toLowerCase();
                    item.style.display = text.includes(query) ? "block" : "none";
                });
            });

            // Simpan pengaturan
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
                        alert("Pengaturan berhasil disimpan!");
                        chrome.tabs.reload();
                    });
                });
            });
        } else {
            statusDisplay.textContent = "Tab tidak memiliki URL yang valid.";
            toggleBlockingButton.style.display = "none";
        }
    });
});
