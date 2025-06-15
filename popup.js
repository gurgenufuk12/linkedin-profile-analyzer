// Popup JavaScript - Extension'ın ana arayüzü

document.addEventListener('DOMContentLoaded', function() {    const analyzeBtn = document.getElementById('analyzeBtn');
    const getCurrentPageBtn = document.getElementById('getCurrentPageBtn');
    const profileIdInput = document.getElementById('profileId');
    const loadingDiv = document.getElementById('loading');
    const resultsDiv = document.getElementById('results');
    const profileDataDiv = document.getElementById('profileData');
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            document.getElementById(tabName).classList.add('active');
            
            // Load tab-specific content
            if (tabName === 'history') {
                loadHistory();
            }
        });
    });
      // Analyze profile from ID
    analyzeBtn.addEventListener('click', async () => {
        const profileId = profileIdInput.value.trim();
        
        if (!profileId) {
            showError('Lütfen bir LinkedIn profil ID\'si girin.');
            return;
        }
        
        if (!isValidLinkedInId(profileId)) {
            showError('Geçerli bir LinkedIn profil ID\'si girin (örnek: ufuk-doğuhan-gürgen-562a69165).');
            return;
        }
        
        // Create full LinkedIn URL
        const profileUrl = `https://www.linkedin.com/in/${profileId}`;
        await analyzeProfile(profileUrl);
    });
    
    // Analyze current page
    getCurrentPageBtn.addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({active: true, currentWindow: true});
            
            if (!tab.url.includes('linkedin.com/in/')) {
                showError('Bu sayfa bir LinkedIn profil sayfası değil.');
                return;
            }
            
            await analyzeProfile(tab.url, true);
        } catch (error) {
            console.error('Error getting current tab:', error);
            showError('Mevcut sayfa bilgileri alınamadı.');
        }
    });
      // Profile analysis function
    async function analyzeProfile(profileUrl, isCurrentPage = false) {
        showLoading();
        console.log("Profil analizi başlatılıyor:", profileUrl);

        try {
            let profileData;

            if (isCurrentPage) {
                console.log("Mevcut sayfa analiz ediliyor...");
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });

                // Sayfanın yüklenmesi için biraz bekle
                await new Promise(resolve => setTimeout(resolve, 1000));

                profileData = await new Promise((resolve) => {
                    chrome.tabs.sendMessage(tab.id, { action: 'getProfileData' }, (response) => {
                        console.log("Content script'ten gelen yanıt:", response);
                        if (response && response.status === 'success') {
                            resolve(response.data);
                        } else {
                            resolve({ error: response ? response.message : 'Veri alınamadı.' });
                        }
                    });
                });
            } else {
                console.log("Yeni tab'da analiz ediliyor:", profileUrl);
                const tab = await chrome.tabs.create({ url: profileUrl, active: false });

                // Sayfanın tamamen yüklenmesini bekle
                await new Promise((resolve) => {
                    const checkComplete = () => {
                        chrome.tabs.get(tab.id, (tabInfo) => {
                            if (tabInfo.status === 'complete') {
                                console.log("Sayfa yüklemesi tamamlandı");
                                resolve();
                            } else {
                                setTimeout(checkComplete, 500);
                            }
                        });
                    };
                    checkComplete();
                });

                // Ek bekleme süresi - LinkedIn'in JavaScript'inin çalışması için
                await new Promise(resolve => setTimeout(resolve, 3000));

                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });

                // Content script'in çalışması için bekle
                await new Promise(resolve => setTimeout(resolve, 1000));

                profileData = await new Promise((resolve) => {
                    chrome.tabs.sendMessage(tab.id, { action: 'getProfileData' }, (response) => {
                        console.log("Content script'ten gelen yanıt:", response);
                        if (response && response.status === 'success') {
                            resolve(response.data);
                        } else {
                            resolve({ error: response ? response.message : 'Veri alınamadı.' });
                        }
                    });
                });

                await chrome.tabs.remove(tab.id);
            }

            console.log("Alınan profil verisi:", profileData);

            if (profileData.error) {
                showError(profileData.error);
            } else {
                showProfileData(profileData);
            }
        } catch (error) {
            console.error('Profil analizi sırasında hata:', error);
            showError('Profil analizi sırasında bir hata oluştu: ' + error.message);
        } finally {
            hideLoading();
        }
    }    function showProfileData(data) {
        console.log("Popup'ta gösterilecek veri:", data);
        
        const { name, connections, followers, posts } = data;

        // En son gönderi tarihini bul
        let lastPostDate = '';
        if (posts && posts.length > 0 && posts[0].timeAgo) {
            lastPostDate = posts[0].timeAgo;
        }

        let postsHtml = '';
        if (posts && posts.length > 0) {
            postsHtml = `
                <div style="margin-top: 15px; border-top: 1px solid rgba(255,255,255,0.2); padding-top: 10px;">
                    <h4 style="margin: 0 0 10px 0; color: #fff;">Son Gönderiler (${posts.length})</h4>
                    ${posts.map((post, index) => `
                        <div style="background: rgba(255,255,255,0.1); margin: 5px 0; padding: 8px; border-radius: 4px; font-size: 11px;">
                            <div style="font-weight: bold; margin-bottom: 4px;">Gönderi ${post.index}:</div>
                            <div style="margin-bottom: 4px; line-height: 1.3;">${post.content}</div>
                            <div style="display: flex; gap: 15px; font-size: 10px; opacity: 0.8;">
                                ${post.timeAgo ? `<span>📅 ${post.timeAgo}</span>` : ''}
                                ${post.likes ? `<span>👍 ${post.likes}</span>` : ''}
                                ${post.comments ? `<span>💬 ${post.comments}</span>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        profileDataDiv.innerHTML = `
            <p><strong>Ad:</strong> ${name || 'Bilinmiyor'}</p>
            <p><strong>Bağlantı Sayısı:</strong> ${connections || 'Bilinmiyor'}</p>
            <p><strong>Takipçi Sayısı:</strong> ${followers || 'Bilinmiyor'}</p>
            ${lastPostDate ? `<p><strong>Son Gönderi:</strong> ${lastPostDate}</p>` : ''}
            ${postsHtml}
            <p style="font-size: 10px; opacity: 0.7; margin-top: 10px;">
                Analiz tarihi: ${new Date().toLocaleString('tr-TR')}
            </p>
        `;

        resultsDiv.style.display = 'block';
        
        // Verileri geçmişe kaydet
        saveToHistory(data);
    }
    
    function showError(message) {
        profileDataDiv.innerHTML = `<p class="error">${message}</p>`;
        resultsDiv.style.display = 'block';
    }
    
    function showLoading() {
        loadingDiv.style.display = 'block';
        resultsDiv.style.display = 'none';
    }
    
    function hideLoading() {
        loadingDiv.style.display = 'none';
    }
    
    function clearMessages() {
        const existingMessages = document.querySelectorAll('.error, .success');
        existingMessages.forEach(msg => msg.remove());
    }
    
    // History functions
    async function saveToHistory(profileData) {
        const settings = await chrome.storage.local.get(['saveHistory']);
        if (settings.saveHistory !== false) { // Default to true
            const history = await chrome.storage.local.get(['profileHistory']);
            const profileHistory = history.profileHistory || [];
            
            const newEntry = {
                ...profileData,
                analyzedAt: new Date().toISOString(),
                id: Date.now()
            };
            
            profileHistory.unshift(newEntry);
            
            // Keep only last 50 entries
            if (profileHistory.length > 50) {
                profileHistory.splice(50);
            }
            
            await chrome.storage.local.set({ profileHistory });
        }
    }
    
    async function loadHistory() {
        const history = await chrome.storage.local.get(['profileHistory']);
        const profileHistory = history.profileHistory || [];
        const historyListDiv = document.getElementById('historyList');
        
        if (profileHistory.length === 0) {
            historyListDiv.innerHTML = '<p>Henüz analiz edilmiş profil bulunmuyor.</p>';
            return;
        }
        
        const historyHtml = profileHistory.map(profile => `
            <div style="border-bottom: 1px solid rgba(255,255,255,0.2); padding: 10px 0; margin-bottom: 10px;">
                <div style="font-weight: bold;">${profile.name || 'İsimsiz'}</div>
                <div style="font-size: 12px; opacity: 0.8;">${profile.headline || ''}</div>
                <div style="font-size: 10px; margin-top: 5px;">
                    ${new Date(profile.analyzedAt).toLocaleDateString('tr-TR')}
                </div>
            </div>
        `).join('');
        
        historyListDiv.innerHTML = historyHtml;
    }
    
    // Settings
    document.getElementById('clearHistory').addEventListener('click', async () => {
        if (confirm('Tüm analiz geçmişini silmek istediğinizden emin misiniz?')) {
            await chrome.storage.local.remove(['profileHistory']);
            loadHistory();
            showSuccess('Geçmiş temizlendi!');
        }
    });
    
    // Load settings
    async function loadSettings() {
        const settings = await chrome.storage.local.get(['autoAnalyze', 'saveHistory']);
        document.getElementById('autoAnalyze').checked = settings.autoAnalyze || false;
        document.getElementById('saveHistory').checked = settings.saveHistory !== false; // Default to true
    }
    
    // Save settings
    document.getElementById('autoAnalyze').addEventListener('change', async (e) => {
        await chrome.storage.local.set({ autoAnalyze: e.target.checked });
    });
    
    document.getElementById('saveHistory').addEventListener('change', async (e) => {
        await chrome.storage.local.set({ saveHistory: e.target.checked });
    });
    
    // Initialize
    loadSettings();    function isValidLinkedInId(profileId) {
        // LinkedIn profil ID'si harfler, rakamlar, tire ve Unicode karakterler içerebilir
        // Türkçe karakterler (ç, ğ, ı, ö, ş, ü) ve diğer özel karakterleri destekle
        if (!profileId || profileId.length < 3 || profileId.length > 100) {
            return false;
        }
        
        // Boşluk içermemeli ve geçerli karakterlerden oluşmalı
        const linkedInIdPattern = /^[a-zA-Z0-9\u00C0-\u017F\u0100-\u024F\u1E00-\u1EFF-]+$/;
        return linkedInIdPattern.test(profileId);
    }
});
