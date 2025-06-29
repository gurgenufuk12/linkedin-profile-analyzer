// popup.js – clean rebuilt 27-Jun-2025
document.addEventListener('DOMContentLoaded', () => {

    /* ---------- Element refs ---------- */
    const $ = id => document.getElementById(id);
    const analyzeBtn        = $('analyzeBtn');
    const currentPageBtn    = $('getCurrentPageBtn');
    const profileIdInput    = $('profileId');
    const loadingDiv        = $('loading');
    const errorDiv          = $('error');
    const resultsDiv        = $('results');
    const profileDataDiv    = $('profileData');
    const historyListDiv    = $('historyList');
    const clearHistoryBtn   = $('clearHistory');
    const autoAnalyzeCb     = $('autoAnalyze');
    const saveHistoryCb     = $('saveHistory');
    const themeToggleBtn    = $('themeToggle');

    /* ---------- Tabs ---------- */
    document.querySelectorAll('.tab').forEach(tab => {
        tab.onclick = () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
            if (tab.dataset.tab === 'history') loadHistory();
        };
    });

    /* ---------- Analyze buttons ---------- */
    analyzeBtn.addEventListener('click', () => {
        const id = profileIdInput.value.trim();
        if (!id) return showError('ID girin.');
        if (!/^[\w\-]{3,100}$/.test(id)) return showError('Geçersiz ID.');
        console.log('Analyze button clicked with ID', id);
        analyzeProfile(`https://www.linkedin.com/in/${id}/`);
    });

    currentPageBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({active:true, currentWindow:true});
        if (!tab?.url || !/linkedin\.com\/(in|pub|public-profile)\//.test(tab.url))
            return showError('Bu sayfa LinkedIn profili değil.');
        console.log('Current page button clicked. URL:', tab.url);
        analyzeProfile(tab.url,true);
    });

    /* ---------- Main ---------- */
    async function analyzeProfile(url,isCurrent=false){
        console.log('Starting analyzeProfile for', url, 'isCurrent', isCurrent);
        showLoading();
        try{
            const [tab] = await chrome.tabs.query({active:true,currentWindow:true});
            await chrome.scripting.executeScript({target:{tabId:tab.id},files:['content.js']});
            await new Promise(r=>setTimeout(r,200));
            chrome.tabs.sendMessage(tab.id,{action:'analyzeProfile',url,isCurrent},res=>{
                hideLoading();
                if(chrome.runtime.lastError) return showError('İçerik betiği hatası.');
                if(res?.status==='success'){
                    const enriched = {...res.data, url};
                    console.log('Analyze success', enriched);
                    showProfileData(enriched); 
                    saveToHistory(enriched);
                }
                else showError(res?.message||'Analiz hatası.');
            });
        }catch(e){ hideLoading();showError('Analiz sırasında hata');}
    }

    /* ---------- UI helpers ---------- */
    function showLoading(){ loadingDiv.style.display='block'; resultsDiv.style.display='none'; clearMessages();}
    function hideLoading(){ loadingDiv.style.display='none';}
    function showError(msg){ errorDiv.className='error'; errorDiv.textContent=msg; errorDiv.style.display='block';}
    function showSuccess(msg){ errorDiv.className='success'; errorDiv.textContent=msg; errorDiv.style.display='block';}
    function clearMessages(){ errorDiv.style.display='none';}

    /* ---------- Render profile ---------- */
    function showProfileData(d){
        resultsDiv.style.display='block';
        const connectionsSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm-8 0c1.657 0 3-1.343 3-3S9.657 5 8 5 5 6.343 5 8s1.343 3 3 3zm0 2c-2.673 0-8 1.337-8 4v3h8v-3c0-.708.148-1.382.414-2H0v-2c0-2.663 5.327-4 8-4s8 1.337 8 4v2h-2.414c.266.618.414 1.292.414 2v3h8v-3c0-2.663-5.327-4-8-4zm8 0c-.69 0-1.354.054-2 .152V13c0-2.663 5.327-4 8-4s8 1.337 8 4v3h-8v-3c0-.708-.148-1.382-.414-2H24v-2c0-2.663-5.327-4-8-4z"/></svg>';
        const followersSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M15 14c-2.761 0-5 2.239-5 5v3h10v-3c0-2.761-2.239-5-5-5zm7-9h-3V2h-2v3h-3v2h3v3h2V7h3zM7.5 11c1.93 0 3.5-1.57 3.5-3.5S9.43 4 7.5 4 4 5.57 4 7.5 5.57 11 7.5 11zm5.5 2h-2c-2.906 0-5.613.828-7.5 2.236V21h10v-3c0-.728.195-1.41.535-2H10c.814 0 1.578-.141 2.258-.399C11.742 14.197 12 13.613 12 13z"/></svg>';
        const avatar = d.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.name||'U')}&size=128`;
        const profileHTML = `
            <div class="profile-card glass-card fade-in">
                <img src="${avatar}" class="avatar" />
                <div class="profile-info">
                    <h3>${d.name||'Unnamed'}</h3>
                    <p>${d.headline||''}</p>
                </div>
                <div class="profile-links" style="display:flex;align-items:center;gap:8px;margin:8px 0 0 0;">
                    <div class="badges" style="display:flex;gap:8px;">
                        <div class="badge-pill">${connectionsSvg} ${d.connections||0}</div>
                        <div class="badge-pill">${followersSvg} ${d.followers||0}</div>
                    </div>
                    <a href="${d.url}" id="profile-link-btn" title="Profili yeni sekmede aç" target="_blank" rel="noopener noreferrer"
                        style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#f3f3f3;color:#444;text-decoration:none;transition:background 0.2s;box-shadow:0 1px 2px #0001;font-size:18px;margin-left:auto;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/></svg>
                    </a>
                </div>
            </div>`;
        
        const postsHTML = (d.posts?.length?d.posts:[]).map((p,i)=>{
            const firstRaw = p.content.split('\n')[0].replace(/\s+/g,' ').trim();
            const first = firstRaw.length>50 ? firstRaw.slice(0,50)+'…' : firstRaw;
            return (
                `<div class="post-card fade-in" data-idx="${i}">
                    <div class="post-header">
                        <span class="post-title"><strong>${first}</strong></span>
                    </div>
                    <div class="post-footer" style="display:flex;align-items:center;gap:8px;">
                        <div class="post-stats"><span>❤️ ${p.likes||0}</span><span>💬 ${p.comments||0}</span></div>
                        <span class="post-date" style="font-size:12px;color:#888;margin-left:6px;">${p.date ? p.date : ''}</span>
                    </div>
                </div>`
            );
        }).join('') || '<div class="info">Gönderi yok.</div>';

        profileDataDiv.innerHTML = profileHTML + `<h3 class="posts-title">Son Gönderiler</h3><div class="posts-container">${postsHTML}</div>`;

        // Gönderi linkine tıklayınca yeni sekmede aç
        profileDataDiv.addEventListener('click', e=>{
            const a = e.target.closest('.post-link');
            if(!a) return;
            e.preventDefault();
            const url = a.href;
            // LOG: Gönderi linkine tıklandı, url ve chrome.tabs.create durumu
            console.log('[DEBUG] Gönderi linkine tıklandı:', url, 'chrome.tabs.create:', typeof chrome?.tabs?.create);
            if(url && url!=='#'){
                if(chrome?.tabs?.create){
                    chrome.tabs.create({url}, tab => {
                        if (chrome.runtime.lastError) {
                            console.error('[DEBUG] chrome.tabs.create hatası:', chrome.runtime.lastError.message);
                        } else {
                            console.log('[DEBUG] chrome.tabs.create başarılı:', tab);
                        }
                    });
                }else{
                    window.open(url,'_blank');
                    console.log('[DEBUG] window.open ile açıldı:', url);
                }
            } else {
                console.warn('[DEBUG] Geçersiz gönderi linki:', url);
            }
        });
    }

    /* ---------- History ---------- */
    async function saveToHistory(data){
        const {saveHistory=true}=await chrome.storage.local.get('saveHistory');
        if(!saveHistory||!data?.name) return;
        const {profileHistory=[]}=await chrome.storage.local.get('profileHistory');
        if(profileHistory[0]?.name===data.name) return;
        profileHistory.unshift({name:data.name,url:data.url||'', analyzedAt:Date.now()});
        if(profileHistory.length>50) profileHistory.splice(50);
        await chrome.storage.local.set({profileHistory});
    }

    async function loadHistory(){
        const {profileHistory=[]}=await chrome.storage.local.get('profileHistory');
        historyListDiv.innerHTML=profileHistory.length?profileHistory.map(p=>`
            <div class="history-item">
                <a href="${p.url}" target="_blank" rel="noopener noreferrer" style="font-weight:600">${p.name}</a>
                <div style="font-size:12px;color:var(--text-secondary-color)">${new Date(p.analyzedAt).toLocaleString('tr-TR',{dateStyle:'medium',timeStyle:'short'})}</div>
            </div>`).join(''):'<div class="info">Henüz analiz edilmiş profil bulunmuyor.</div>';
    }

    clearHistoryBtn.addEventListener('click', async () => {
        if(confirm('Tüm geçmiş silinsin mi?')){
            await chrome.storage.local.remove('profileHistory');
            loadHistory(); showSuccess('Geçmiş silindi.');
        }
    });

    /* ---------- Settings ---------- */
    autoAnalyzeCb.onchange  = () => chrome.storage.local.set({autoAnalyze:  autoAnalyzeCb.checked});
    saveHistoryCb.onchange  = () => chrome.storage.local.set({saveHistory: saveHistoryCb.checked});
    (async()=>{const s=await chrome.storage.local.get(['autoAnalyze','saveHistory']);autoAnalyzeCb.checked=s.autoAnalyze||false;saveHistoryCb.checked=s.saveHistory!==false;})();

    /* ---------- Theme ---------- */
    const applyTheme=t=>{document.documentElement.dataset.theme=t;themeToggleBtn.querySelector('i').className=t==='dark'?'fas fa-sun':'fas fa-moon';};
    chrome.storage.sync.get(['theme'],({theme='light'})=>applyTheme(theme));
    themeToggleBtn.onclick=()=>chrome.storage.sync.get(['theme'],({theme='light'})=>{
        const nt=theme==='light'?'dark':'light';chrome.storage.sync.set({theme:nt},()=>applyTheme(nt));});

});