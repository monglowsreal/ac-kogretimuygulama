# AÖF Akıllı Çalışma Koçu

Her bölüm ve sınıftan öğrencinin **kendi derslerini ekleyip** ünite PDF/ders notlarını yükleyerek **Google Gemini, OpenAI (ChatGPT), Anthropic Claude, Groq, OpenRouter, DeepSeek, xAI Grok, EVREN LLM, yerel Ollama veya herhangi bir OpenAI-uyumlu API anahtarıyla** kapsamlı çalışma rehberi, A4 çıktı ve 5 şıklı AÖF uyumlu testler üretebileceği açık kaynaklı kişisel çalışma asistanı.

> **Yasal Uyarı / Sorumluluk Reddi:** Bu yazılım **bağımsız** bir açık kaynak eğitim aracıdır; **Anadolu Üniversitesi** veya **Açıköğretim Fakültesi (AÖF)** ile resmi bir bağı yoktur. Uygulama içinde telifli AÖF ders kitapları veya çıkmış soru arşivleri bulunmaz; tüm analizler yalnızca kullanıcının kendi yüklediği materyaller üzerinden yapılır. Gerçek sınavlara hazırlıkta resmi ders kitaplarını ve çıkmış soruları esas almanız önerilir.

---

## Öne Çıkan Özellikler

- **Serbest Ders Ekleme & Otomatik Kategori Algılama:**
  - Uygulama temiz başlar; herkes sol panelden veya ana ekrandan kendi ders adını ve kodunu yazarak **Sözel / Kavramsal** veya **Teknik / Kodlama** dersi ekleyip 1–8. ünitelerini yönetebilir (isteğe bağlı 1 tıkla örnek 6 derslik demo müfredat da yüklenebilir).
  - Eklenen dersin adına veya ünite metnine göre Sözel / Teknik strateji otomatik algılanır.
- **Modül 1 — Ünite İçeriği Yükleme:**
  - Doğrudan metin yapıştırma, `.txt` veya `.pdf` yükleme (`unpdf` ile sunucu taraflı metin çıkarma).
  - Taranmış (metinsiz) veya karakter bozulmalı PDF'ler için kalite uyarısı.
  - Her varsayılan ders için telifsiz yerleşik örnek ünite özeti (**Örnek Not Yükle**).
- **Modül 2 — Kaynağa Sadık Çalışma Rehberi & Kapsam Denetimi:**
  - Metindeki tüm başlık ve alt türleri tespit eden **otomatik kapsam kontrolü (`coverageReport`)** ve eksik kalan başlıkları tamamlama turu.
  - Bölüm bölüm sınav notları, karşılaştırma tabloları, *Sınavda Çıkabilecek Kritik Ayrıntılar*, kritik kavramlar ve *Kitaptan Doğrulanması Gereken Yerler*.
  - Teknik dersler için adım adım kod/formül çözümleme ve pratik görevler; rehber sonunda isteğe bağlı *Kendi Cümlelerinle Pekiştir* değerlendirmesi.
- **Modül 3 — 5 Şıklı AÖF Mini Quiz (`A–E`):**
  - 5, 10, 15, 20 veya 25 soruluk tamamen **5 şıklı** çoktan seçmeli testler.
  - **Anında Cevap & Açıklama** (varsayılan) veya **Cevaplar Sonda** modu; her şık için *Neden Doğru / Neden Yanlış* açıklaması ve ünite dayanağı.
  - Resmi AÖF net hesabı (**4 yanlış 1 doğruyu götürür**: `Doğru - Yanlış / 4`) + *Boş Bırak* stratejisi.
- **Modül 4 — Çoklu Ünite Deneme Sınavı, Yanlış Defteri & A4 Çıktı:**
  - Vize (1–4) / Final (5–8) veya seçili ünitelerle süreli karma deneme sınavı.
  - Yanlış yapılan soruların **1., 3., 7. ve 14. gün** aralıklı tekrar takvimiyle **Yanlış Defteri**'ne eklenmesi ve tek tıkla zayıf konu tekrar quizi.
  - **A4 Kağıdı Çıktısı & PDF / HTML İndirme:** Beyaz kâğıt düzeninde tek ünite veya çoklu ünite A4 önizleme, 1 sütun / 2 sütun sıkı özet, yazdırma (`PDF olarak kaydet`) ve tek dosya `.html` dışa aktarma.

---

## Tek Tıkla İndir & Başlat (Windows)

Hiç terminal veya kod düzenlemesi yapmadan çalıştırmak için:

1. [Releases sayfasından](https://github.com/monglowsreal/ac-kogretimuygulama/releases/latest) **`AOF-Akilli-Calisma-Kocu-Hazir-Paket.zip`** dosyasını indirip klasöre çıkarın *(alternatif olarak Electron tabanlı `AOF-Akilli-Calisma-Kocu-Portable.exe` dosyasını da indirebilirsiniz)*.
2. Bilgisayarınızda [Node.js LTS](https://nodejs.org/) kurulu değilse tek seferliğine kurun *(Edge ile Windows 11 Akıllı Uygulama Denetimi'ne takılmadan çalışması için kullanılır)*.
3. Klasördeki **`BASLAT.cmd`** dosyasına çift tıklayın — uygulama ayrı pencere olarak açılır. *(İsterseniz `Masaustu_Kisayolu_Olustur.cmd` ile masaüstüne simge de oluşturabilirsiniz.)*
4. Açılan ekrandaki **"API Anahtarı Gir"** butonundan elinizdeki herhangi bir AI API anahtarını (**Gemini, OpenAI, Claude, Groq, OpenRouter, DeepSeek, EVREN** veya **Ollama**) yapıştırıp kaydedin.
5. Sol panelden kendi dersinizi yazıp ünite PDF/metinlerinizi yüklemeye başlayın!

---

## Geliştiriciler İçin Kurulum (Kaynak Koddan)

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
2. Kök dizindeki `.env.example` dosyasını `.env.local` adıyla kopyalayıp kendi API anahtarınızı yazın *(veya uygulamayı açtıktan sonra arayüzdeki "API & EVREN Ayarları" ekranından girin)*:
   ```env
   GEMINI_API_KEY=buraya_kendi_gemini_api_anahtarinizi_yazin
   # İsteğe bağlı otomatik yedek:
   # EVREN_API_KEY=buraya_kendi_evren_api_anahtarinizi_yazin
   ```
   > **Uyarı:** `.env.local` ve kişisel verilerinizi içeren `coach-data.json` dosyasını **asla** GitHub'a yüklemeyin.
3. Geliştirme sunucusunu başlatın ve `http://localhost:3000` adresini açın:
   ```bash
   npm run dev
   ```

---

## Windows Uygulaması Olarak Çalıştırma

* **Önerilen (Windows 11 Akıllı Uygulama Denetimi'ne Takılmadan):**
  ```bash
  npm run desktop:prepare
  npm run desktop:app
  ```
  Microsoft imzalı `node.exe` üzerinden yerel sunucuyu başlatır ve Microsoft Edge Uygulama Modu (`--app`) ile sekmesiz masaüstü penceresi açar.
* **Electron Geliştirme / Paketleme:**
  ```bash
  npm run desktop       # Standalone Electron penceresi
  npm run desktop:dev   # Geliştirici modu
  npm run desktop:build # İmzasız taşınabilir Windows paketi (dist-electron/)
  ```

---

## Veri, Gizlilik ve Web Deploy (Vercel vb.)

* **Yerel Kullanım (`localhost` / Windows Masaüstü):** Notlar ve dersler tarayıcıya ek olarak bilgisayarınızdaki `%APPDATA%\aof-akilli-calisma-kocu\coach-data.json` dosyasında saklanır.
* **Bulut / Vercel Deploy:** Uygulama bulut ortamında (`VERCEL`, `RENDER`, `RAILWAY_ENVIRONMENT` veya `localhost` dışı alan adı) çalıştırıldığında `src/app/api/state/route.ts` yerel disk senkronizasyonu otomatik olarak devre dışı kalır; her ziyaretçi yalnızca kendi tarayıcısındaki `localStorage` alanını kullanır ve kullanıcılar birbirinin ders/not verisini görmez. *(Herkese açık bir sitede kendi API anahtarınızı paylaşıyorsanız hız sınırı/kimlik doğrulama eklemeniz önerilir.)*

## Lisans

Bu proje [MIT Lisansı](./LICENSE) ile lisanslanmıştır.
