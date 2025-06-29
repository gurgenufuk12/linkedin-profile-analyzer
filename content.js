function logToConsole(message) {
    console.log(`[LinkedIn Analyzer] ${new Date().toLocaleTimeString()}: ${message}`);
}

async function waitForElement(selectors, timeout = 5000) {
    logToConsole(`Öğe bekleniyor: ${selectors.join(', ')}`);
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element && element.textContent.trim()) {
                logToConsole(`Öğe bulundu: "${selector}"`);
                return element;
            }
        }
        await new Promise(resolve => setTimeout(resolve, 250));
    }
    logToConsole(`Bekleme süresi doldu. Öğe bulunamadı: ${selectors.join(', ')}`);
    return null;
}

async function getProfileInfo() {
    logToConsole("Profil analizi başlatılıyor...");
    const result = {
        name: "Ad bulunamadı",
        headline: "Başlık bulunamadı",
        connections: "Bağlantı bulunamadı",
        followers: "Takipçi bulunamadı",
        avatar: "",
        posts: [],
        error: null,
    };

    try {
        const nameSelectors = [
            'a[href*="/overlay/about-this-profile/"] h1',
            'h1[class*="t-24"][class*="break-words"]',
            'h1.text-heading-xlarge',
            '.pv-top-card__name',
            'main h1'
        ];
        
        const headlineSelectors = [
            'a[href*="/overlay/about-this-profile/"] ~ div.text-body-medium',
            'h1[class*="t-24"][class*="break-words"] + div',
            '.text-body-medium.break-words',
            '.pv-top-card__headline'
        ];

        const nameElement = await waitForElement(nameSelectors);
        if (nameElement) {
            result.name = nameElement.textContent.trim();
        }

        const headlineElement = await waitForElement(headlineSelectors, 1000);
        if (headlineElement) {
            result.headline = headlineElement.textContent.trim();
        }

        // Avatar
        const avatarElement = document.querySelector('.pv-top-card-profile-picture img, .profile-photo-edit__preview, img.profile-photo-edit__preview, img.pv-top-card-profile-picture__image');
        if (avatarElement && avatarElement.src) {
            result.avatar = avatarElement.src;
        }

        const pageText = document.body.innerText;
        const connectionsMatch = pageText.match(/(\d+|500\+)\s*(bağlantı|connections)/i);
        if (connectionsMatch) result.connections = connectionsMatch[1];

        const followersMatch = pageText.match(/([\d.,]+)\s*(takipçi|followers)/i);
        if (followersMatch) result.followers = followersMatch[1];

        logToConsole(`Temel bilgiler: ${result.name}, ${result.connections} bağlantı, ${result.followers} takipçi`);

        // Sadece gönderi kartı bulunamazsa scrollBy tetikle
        let postElements = document.querySelectorAll('div.update-components-update-v2, div.feed-shared-update-v2, .occludable-update');
        if (!postElements || postElements.length === 0) {
            logToConsole(`[DEBUG] window.scrollBy tetiklendi (gönderi bulunamadı). window.location.href: ${window.location.href}`);
            window.scrollBy(0, window.innerHeight);
            await new Promise(resolve => setTimeout(resolve, 800));
            // Scroll sonrası tekrar gönderi kartlarını kontrol et
            postElements = document.querySelectorAll('div.update-components-update-v2, div.feed-shared-update-v2, .occludable-update');
        }


        // postElements tekrar tanımlanmasın, yukarıda let ile tanımlandı
        const uniquePosts = new Set();
        postElements.forEach((postElement) => {
            if (result.posts.length >= 10) return;

            const postContentElement = postElement.querySelector('.update-components-text, .feed-shared-update-v2__description-wrapper, .feed-shared-text');
            if (!postContentElement || !postContentElement.textContent.trim()) return;

            const postText = postContentElement.textContent.trim();
            const postIdentifier = postText.substring(0, 150);
            if (uniquePosts.has(postIdentifier)) return;

            uniquePosts.add(postIdentifier);

            const post = {
                id: result.posts.length + 1,
                content: postText,
                date: "",
                likes: "0",
                comments: "0",
                url: "#"
            };

            // Tarih ve Post Linki
            // Gönderi tarihi için: sadece zaman ifadesi içeren <span class="visually-hidden"> veya <time> etiketlerini kontrol et
            let dateText = "";
            const dateCandidates = postElement.querySelectorAll('span.visually-hidden, time');
            for (const el of dateCandidates) {
                const txt = el.textContent.trim();
                // Türkçe ve İngilizce zaman ifadeleri
                if (/(saniye|dakika|saat|gün|hafta|ay|yıl|second|minute|hour|day|week|mo|month|yr|year|d|h|w)/i.test(txt)) {
                    dateText = txt;
                    break;
                }
            }
            post.date = dateText;

            // DEBUG: Gönderi kartı içindeki tüm linkleri logla
            const allLinks = postElement.querySelectorAll('a');
            let found = false;
            allLinks.forEach(l => {
                console.log('[DEBUG] Gönderi kartı link:', l.href);
                if (!found && l.href && l.href.includes('/feed/update/')) {
                    post.url = l.href;
                    found = true;
                }
            });
            if (!found) {
                console.warn('[DEBUG] Bu gönderi kartında /feed/update/ linki bulunamadı.');
            }

            // Beğeni ve Yorum Sayıları
            const socialCountsElement = postElement.querySelector('.social-details-social-counts__reactions-count, .social-details-social-counts__social-proof-fallback');
            if (socialCountsElement) {
                post.likes = socialCountsElement.textContent.trim().match(/\d+/) ? socialCountsElement.textContent.trim().match(/\d+/)[0] : "0";
            }

            const commentsElement = postElement.querySelector('a.social-details-social-counts__comments, li.social-details-social-counts__item--with-social-proof button');
            if (commentsElement) {
                post.comments = commentsElement.textContent.trim().match(/\d+/) ? commentsElement.textContent.trim().match(/\d+/)[0] : "0";
            }

            result.posts.push(post);
        });
        logToConsole(`${result.posts.length} benzersiz gönderi bulundu.`);

    } catch (error) {
        logToConsole(`Analiz sırasında hata: ${error.message}`);
        result.error = error.message;
    }

    return result;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeProfile') {
        logToConsole(`'analyzeProfile' mesajı alındı.`);
        (async () => {
            const profileInfo = await getProfileInfo();
            if (profileInfo.name === "Ad bulunamadı" && !profileInfo.error) {
                logToConsole("Analiz başarısız: Profil adı bulunamadı.");
                sendResponse({ status: 'error', message: 'Profil adı bulunamadı. Lütfen sayfanın tam yüklendiğinden emin olun ve tekrar deneyin.' });
            } else if (profileInfo.error) {
                 logToConsole(`Analiz hatası: ${profileInfo.error}`);
                 sendResponse({ status: 'error', message: profileInfo.error });
            } else {
                logToConsole(`Analiz başarılı. Ad: ${profileInfo.name}`);
                sendResponse({ status: 'success', data: profileInfo });
            }
        })();
        return true; // Yanıtın asenkron olarak gönderileceğini belirtir
    }
});

logToConsole("LinkedIn Profil Analizci content script yüklendi ve çalışıyor.");
