chrome.storage.sync.get(["whitelist", "blockedElements"], (data) => {
    const currentDomain = window.location.hostname;
    const whitelist = data.whitelist || [];
    const blockedElements = data.blockedElements || {};

    if (whitelist.some(domain => currentDomain.endsWith(domain))) {
        console.log(`Pemblokiran dinonaktifkan untuk situs ini: ${currentDomain}`);
        return;
    }

    function removeAds() {
        const adSelectors = [
            "div[class*='ad']",
            "iframe[src*='ads']",
            "iframe[src*='doubleclick']",
            "iframe[src*='googlesyndication']",
            "div[id^='div-gpt-ad']",
            "div[class*='sponsored']",
            "section[class*='sponsored']"
        ];

        adSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(ad => {
                if (!ad.dataset.processed) {
                    console.log(`Menghapus iklan: ${selector}`);
                    ad.remove();
                    ad.dataset.processed = "true";
                }
            });
        });
    }

    function removeYouTubeAds() {
        const youtubeAdSelectors = [
            "div#player-ads",
            "div.ytp-ad-module",
            "div.ytp-ad-overlay-container",
            "div.ytp-ad-image-overlay",
            "ytd-promoted-sparkles-web-renderer",
            "ytd-companion-slot-renderer",
            "div#ad-container",
            "iframe[src*='doubleclick.net']",
            "iframe[src*='googleadservices.com']",
            "div[class*='ytp-ad']",
            "div[class*='ad-showing']",
            "div[class*='ad-interrupting']",
            "div[class*='ytp-ad-player-overlay-layout']"
        ];

        youtubeAdSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(ad => {
                if (!ad.dataset.processed) {
                    console.log(`Menghapus iklan YouTube: ${selector}`);
                    ad.remove();
                    ad.dataset.processed = "true";
                }
            });
        });

        // Klik otomatis tombol "Lewati Iklan"
        const skipButtons = document.querySelectorAll(
            ".ytp-ad-skip-button, .ytp-skip-ad-button, .ytp-ad-text.ytp-ad-preview-text"
        );

        skipButtons.forEach(button => {
            console.log("Menekan tombol 'Lewati Iklan'.");
            button.click();
        });

        // Hapus iframe iklan YouTube
        document.querySelectorAll("iframe").forEach(iframe => {
            if (iframe.src.includes("doubleclick.net") || iframe.src.includes("googleadservices.com")) {
                console.log("Menghapus iframe iklan YouTube:", iframe.src);
                iframe.remove();
            }
        });

        // Coba lewati iklan dengan perintah video API YouTube
        const video = document.querySelector("video");
        if (video) {
            video.currentTime = video.duration;
            console.log("Mempercepat video iklan.");
        }
    }

    function bypassAdblockDetection() {
        const adblockSelectors = [
            "div[class*='adblock']",
            "div[class*='deteksi-adblock']",
            "div[class*='ads-blocked']",
            "body[class*='adblock-detected']",
            "html[class*='adblock-detected']"
        ];

        adblockSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => {
                console.log(`Menghapus deteksi adblock: ${selector}`);
                el.remove();
            });
        });

        // Blokir eksekusi skrip deteksi adblock
        document.querySelectorAll("script").forEach(script => {
            if (script.textContent.includes("adsBlocked") || script.textContent.includes("adBlockDetected")) {
                console.log("Memblokir skrip deteksi adblock.");
                script.remove();
            }
        });
    }

    const observer = new MutationObserver(() => {
        removeAds();
        removeYouTubeAds();
        bypassAdblockDetection();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("load", () => {
        removeAds();
        removeYouTubeAds();
        bypassAdblockDetection();

        setInterval(() => {
            removeAds();
            removeYouTubeAds();
            bypassAdblockDetection();
        }, 2000);
    });
});
