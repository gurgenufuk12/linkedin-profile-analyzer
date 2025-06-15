// Background Script - Extension'ın arka plan işlemleri

// Extension kurulduğunda çalışır
chrome.runtime.onInstalled.addListener(() => {
    console.log('LinkedIn Profile Analyzer extension installed');
    
    // Varsayılan ayarları belirle
    chrome.storage.local.set({
        autoAnalyze: false,
        saveHistory: true
    });
    
    // Context menu oluştur (sağ tık menüsü)
    try {
        chrome.contextMenus.create({
            id: 'analyzeProfile',
            title: 'Bu profili analiz et',
            contexts: ['page'],
            documentUrlPatterns: ['https://www.linkedin.com/in/*']
        });
    } catch (error) {
        console.log('Context menu creation failed:', error);
    }
});

// Content script'ten gelen mesajları dinle
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'profileAnalyzed') {
        // Otomatik analiz sonucu geldiğinde
        handleAutoAnalysis(request.data, sender.tab);
    }
    
    return true;
});

// Tab güncellemelerini dinle
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // LinkedIn profil sayfasına gidildiğinde
    if (changeInfo.status === 'complete' && 
        tab.url && 
        tab.url.includes('linkedin.com/in/')) {
        
        // Badge'i güncelle
        chrome.action.setBadgeText({
            text: '●',
            tabId: tabId
        });
        
        chrome.action.setBadgeBackgroundColor({
            color: '#0077b5'
        });
    }
});

// Tab kapatıldığında badge'i temizle
chrome.tabs.onRemoved.addListener((tabId) => {
    chrome.action.setBadgeText({
        text: '',
        tabId: tabId
    });
});

// Otomatik analiz sonuçlarını işle
async function handleAutoAnalysis(profileData, tab) {
    try {
        // Badge'i güncelle
        chrome.action.setBadgeText({
            text: '✓',
            tabId: tab.id
        });
        
        chrome.action.setBadgeBackgroundColor({
            color: '#00ff00'
        });
        
        // Badge'i 3 saniye sonra temizle
        setTimeout(() => {
            chrome.action.setBadgeText({
                text: '',
                tabId: tab.id
            });
        }, 3000);
        
    } catch (error) {
        console.error('Error handling auto analysis:', error);
    }
}

// Context menu tıklamalarını dinle
if (chrome.contextMenus) {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === 'analyzeProfile') {
            // Popup'ı aç
            chrome.action.openPopup();
        }
    });
}

// Storage değişikliklerini dinle
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.autoAnalyze) {
            console.log('Auto analyze setting changed:', changes.autoAnalyze.newValue);
        }
        if (changes.saveHistory) {
            console.log('Save history setting changed:', changes.saveHistory.newValue);
        }
    }
});
