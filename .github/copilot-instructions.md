<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# LinkedIn Profile Analyzer Extension

Bu bir Chrome Extension projesidir. LinkedIn profil analizi yapan bir extension geliştiriyoruz.

## Proje Bilgileri

- **Dil**: JavaScript (ES6+)
- **Platform**: Chrome Extension (Manifest V3)
- **Hedef**: LinkedIn profil analizi ve işe alım desteği

## Kodlama Standartları

- Modern JavaScript (ES6+) kullanın
- Async/await pattern'ını tercih edin
- Error handling ekleyin
- Console.log kullanarak debug yapın
- Türkçe yorum ve mesajlar kullanın

## Extension Dosyaları

- `manifest.json`: Extension tanım dosyası (Manifest V3)
- `popup.html/js`: Ana kullanıcı arayüzü
- `content.js`: LinkedIn sayfasında çalışan script
- `background.js`: Service worker (arka plan işlemleri)

## Özellikler

- LinkedIn profil URL'si ile analiz
- Mevcut sayfa analizi
- Profil bilgilerini çıkarma (ad, pozisyon, deneyim, eğitim, beceriler)
- Analiz geçmişi kaydetme
- Otomatik analiz ayarları

## Chrome APIs

- `chrome.storage.local`: Yerel veri saklama
- `chrome.tabs`: Tab yönetimi
- `chrome.scripting`: Content script enjeksiyonu
- `chrome.runtime`: Extension mesajlaşma

## LinkedIn Selectors

LinkedIn'in DOM yapısını analiz ederken güncel CSS selector'ları kullanın:
- Profil adı için: `h1.text-heading-xlarge`
- Pozisyon için: `.text-body-medium.break-words`
- Deneyim için: `#experience` section altındaki öğeler
- Eğitim için: `#education` section altındaki öğeler
