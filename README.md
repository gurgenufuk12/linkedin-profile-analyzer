# LinkedIn Profile Analyzer - Chrome Extension

İşe alım uzmanları için geliştirilmiş LinkedIn profil analiz aracı.

## Özellikler

- 🔍 LinkedIn profil ID'si ile hızlı analiz
- 📊 Mevcut sayfayı anında analiz etme
- 📝 Profil adı çıkarma (şimdilik, daha fazlası gelecek)
- 📚 Analiz geçmişi kaydetme
- ⚙️ Otomatik analiz ayarları
- 🎨 Modern ve kullanıcı dostu arayüz

## Çıkarılan Bilgiler

- Ad Soyad
- Takipçi Sayısı (örnek: 21.263 takipçi)
- Bağlantı Sayısı (örnek: 500+ bağlantı)
- Profil URL'si
- Analiz tarihi

*Not: İlerleyen versiyonlarda pozisyon, deneyim, eğitim, beceriler vb. bilgiler de eklenecek.*

## Kurulum

1. Chrome'da `chrome://extensions/` adresine gidin
2. "Geliştirici modu"nu etkinleştirin
3. "Paketlenmemiş uzantı yükle" butonuna tıklayın
4. Bu projenin klasörünü seçin

## Kullanım

### Yöntem 1: ID ile Analiz
1. Extension ikonuna tıklayın
2. LinkedIn profil ID'sini girin (örnek: ufuk-doğuhan-gürgen-562a69165)
3. "Profili Analiz Et" butonuna tıklayın

### Yöntem 2: Mevcut Sayfa
1. LinkedIn profil sayfasına gidin
2. Extension ikonuna tıklayın
3. "Mevcut Sayfayı Analiz Et" butonuna tıklayın

## Ayarlar

- **Otomatik Analiz**: LinkedIn profilinde otomatik olarak analiz yapar
- **Geçmiş Kaydetme**: Analiz edilen profillerin geçmişini saklar
- **Geçmiş Temizleme**: Tüm analiz geçmişini siler

## Geliştirme

### Dosya Yapısı
```
linkedin-profile-analyzer/
├── manifest.json          # Extension tanım dosyası
├── popup.html             # Ana arayüz
├── popup.js               # Arayüz JavaScript'i
├── content.js             # LinkedIn sayfasında çalışan script
├── background.js          # Arka plan işlemleri
├── icons/                 # Extension ikonları
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### Güvenlik

- Extension yalnızca LinkedIn domaininde çalışır
- Kullanıcı verileri yerel olarak saklanır
- Harici sunuculara veri gönderilmez

## Sürüm Geçmişi

### v1.0.0
- İlk sürüm
- Temel profil analizi
- Modern arayüz tasarımı
- Geçmiş kaydetme özelliği

## Lisans

Bu proje MIT lisansı ile lisanslanmıştır.

## Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## İletişim

Proje sahibi: [İsminiz]
Email: [email@example.com]

## Teknik Detaylar

### Gereksinimler
- Chrome 88 veya üzeri
- Manifest V3 desteği

### API'ler
- Chrome Extensions API
- Chrome Storage API
- Chrome Scripting API
- Chrome Tabs API

### Desteklenen LinkedIn Sayfaları
- Profil sayfaları: `https://www.linkedin.com/in/*`
- Mobil uyumluluk: Planlanıyor
