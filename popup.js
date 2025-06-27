document.addEventListener('DOMContentLoaded', function () {
    // Element selectors
    const analyzeBtn = document.getElementById('analyzeBtn');
    const getCurrentPageBtn = document.getElementById('getCurrentPageBtn');
    const profileIdInput = document.getElementById('profileId');
    const loadingDiv = document.getElementById('loading');
    const resultsDiv = document.getElementById('results');
    const profileDataDiv = document.getElementById('profileData');
    const errorDiv = document.getElementById('error');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const historyListDiv = document.getElementById('historyList');
    const clearHistoryBtn = document.getElementById('clearHistory');
    const autoAnalyzeCheckbox = document.getElementById('autoAnalyze');
    const saveHistoryCheckbox = document.getElementById('saveHistory');

    // Tab switching logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');

            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(tabName).classList.add('active');

            if (tabName === 'history') {
                loadHistory();
            }
        });
    });

    // Analyze from profile ID
    analyzeBtn.addEventListener('click', async () => {
        const profileId = profileIdInput.value.trim();
        if (!profileId) {
            showError("Lütfen bir LinkedIn profil ID'si girin.");
            return;
        }
        if (!isValidLinkedInId(profileId)) {
            showError("Geçerli bir LinkedIn profil ID'si girin.");
            return;
        }
        const profileUrl = `https://www.linkedin.com/in/${profileId}/`;
        await analyzeProfile(profileUrl);
    });

    // Analyze current page
    getCurrentPageBtn.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab.url || !tab.url.includes('linkedin.com/in/')) {
                showError('Bu sayfa bir LinkedIn profil sayfası değil.');
                return;
            }
            await analyzeProfile(tab.url, true);
        } catch (error) {
            console.error('Error getting current tab:', error);
            showError('Mevcut sayfa bilgileri alınamadı.');
        }
    });

    // Main analysis function
    async function analyzeProfile(profileUrl, isCurrentPage = false) {
        showLoading();

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });

            await new Promise(resolve => setTimeout(resolve, 200));

            chrome.tabs.sendMessage(tab.id, { action: 'analyzeProfile', url: profileUrl, isCurrentPage }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Mesaj gönderme hatası:', chrome.runtime.lastError.message);
                    showError('Analiz başlatılamadı. Sayfayı yenileyip tekrar deneyin.');
                    hideLoading();
                    return;
                }

                if (response && response.status === 'success') {
                    hideLoading();
                    showProfileData(response.data);
                    saveToHistory(response.data);
                } else {
                    hideLoading();
                    showError(response ? response.message : 'Analiz sırasında bilinmeyen bir hata oluştu.');
                }
            });
        } catch (error) {
            console.error('Analiz sırasında hata:', error);
            hideLoading();
            showError('Analiz sırasında bir hata oluştu.');
        }
    }

    // UI update functions
    function showProfileData(data) {
        resultsDiv.style.display = 'block';

        let profileHtml = `
            <div class="profile-card">
                <h3>${data.name || 'İsimsiz Profil'}</h3>
                <p>${data.headline || ''}</p>
                <p><strong>Bağlantı Sayısı:</strong> ${data.connections || 'N/A'} | <strong>Takipçi Sayısı:</strong> ${data.followers || 'N/A'}</p>
            </div>
        `;

        let postsHtml = '';
        if (data.posts && data.posts.length > 0) {
            postsHtml = data.posts.map(post => {
                const shortContent = post.content.length > 250 ? post.content.substring(0, 250) + '...' : post.content;
                return `
                <div class="post-card">
                    <div class="post-header">
                        <span class="post-title">🚀 Gönderi ${post.id}</span>
                        <span class="post-time">${post.date || ''}</span>
                    </div>
                    <div class="post-content">
                        ${shortContent}
                    </div>
                    <div class="post-footer">
                        <div class="post-stats">
                            <span>❤️ ${post.likes || '0'}</span>
                            <span>💬 ${post.comments || '0'}</span>
                        </div>
                        <a href="${post.url}" target="_blank" class="post-link">Gönderiyi Görüntüle</a>
                    </div>
                </div>
            `}).join('');
        } else {
            postsHtml = '<div class="info">Bu profil için gösterilecek gönderi bulunamadı.</div>';
        }

        profileDataDiv.innerHTML = profileHtml + postsHtml;
    }

    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.className = 'error';
        errorDiv.style.display = 'block';
    }

    function showSuccess(message) {
        errorDiv.textContent = message;
        errorDiv.className = 'success';
        errorDiv.style.display = 'block';
    }

    function showLoading() {
        loadingDiv.style.display = 'block';
        resultsDiv.style.display = 'none';
        profileDataDiv.innerHTML = '';
        clearMessages();
    }

    function hideLoading() {
        loadingDiv.style.display = 'none';
    }

    function clearMessages() {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
    }

    // History functions
    async function saveToHistory(profileData) {
        const { saveHistory = true } = await chrome.storage.local.get(['saveHistory']);

        if (saveHistory && profileData && profileData.name && profileData.name !== 'Ad bulunamadı') {
            const { profileHistory = [] } = await chrome.storage.local.get(['profileHistory']);
            
            const newEntry = { 
                name: profileData.name,
                analyzedAt: new Date().toISOString()
            };

            if (profileHistory.length > 0 && profileHistory[0].name === newEntry.name) {
                return; // Prevent duplicate consecutive entries
            }

            profileHistory.unshift(newEntry);

            if (profileHistory.length > 50) {
                profileHistory.splice(50);
            }
            
            await chrome.storage.local.set({ profileHistory });
            
            loadHistory(); // Refresh history view
        }
    }

    async function loadHistory() {
        const { profileHistory = [] } = await chrome.storage.local.get(['profileHistory']);
        if (profileHistory.length === 0) {
            historyListDiv.innerHTML = '<div class="info">Henüz analiz edilmiş profil bulunmuyor.</div>';
            return;
        }
        const historyHtml = profileHistory.map(profile => `
            <div class="history-item">
                <div style="font-weight: 600;">${profile.name || 'İsimsiz'}</div>
                <div style="font-size: 12px; color: var(--text-secondary-color);">${new Date(profile.analyzedAt).toLocaleString('tr-TR')}</div>
            </div>
        `).join('');
        historyListDiv.innerHTML = historyHtml;
    }

    // Settings functions
    clearHistoryBtn.addEventListener('click', async () => {
        if (confirm('Tüm analiz geçmişini silmek istediğinizden emin misiniz?')) {
            await chrome.storage.local.remove(['profileHistory']);
            loadHistory();
            showSuccess('Geçmiş başarıyla temizlendi.');
        }
    });

    async function loadSettings() {
        const { autoAnalyze = false, saveHistory = true } = await chrome.storage.local.get(['autoAnalyze', 'saveHistory']);
        autoAnalyzeCheckbox.checked = autoAnalyze;
        saveHistoryCheckbox.checked = saveHistory;
    }

    autoAnalyzeCheckbox.addEventListener('change', (e) => {
        chrome.storage.local.set({ autoAnalyze: e.target.checked });
    });

    saveHistoryCheckbox.addEventListener('change', (e) => {
        chrome.storage.local.set({ saveHistory: e.target.checked });
    });

    // Utility function
    function isValidLinkedInId(profileId) {
        if (!profileId || profileId.length < 3 || profileId.length > 100) return false;
        const linkedInIdPattern = /^[a-zA-Z0-9\u00C0-\u017F\u0100-\u024F\u1E00-\u1EFF-]+$/;
        return linkedInIdPattern.test(profileId);
    }

    // Initial load
    loadSettings();
});
