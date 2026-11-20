# AÖF Akıllı Çalışma Koçu

Her bölüm ve sınıftan öğrencinin **kendi derslerini ekleyip** ünite PDF/ders notlarını yükleyerek **Google Gemini, OpenAI (ChatGPT), Anthropic Claude, Groq, OpenRouter, DeepSeek, xAI Grok, EVREN LLM, yerel Ollama veya herhangi bir OpenAI-uyumlu API anahtarıyla** kapsamlı çalışma rehberi, A4 çıktı ve 5 şıklı AÖF uyumlu testler üretebileceği açık kaynaklı kişisel çalışma asistanı.

> **Yasal Uyarı / Sorumluluk Reddi:** Bu yazılım **bağımsız** bir açık kaynak eğitim aracıdır; **Anadolu Üniversitesi** veya **Açıköğretim Fakültesi (AÖF)** ile resmi bir bağı yoktur. Uygulama içinde telifli AÖF ders kitapları veya çıkmış soru arşivleri bulunmaz; tüm analizler yalnızca kullanıcının kendi yüklediği materyaller üzerinden yapılır. Gerçek sınavlara hazırlıkta resmi ders kitaplarını ve çıkmış soruları esas almanız önerilir.

---

## Öne Çıkan Özellikler

- **Serbest Ders Ekleme, Özel Ünite Sayısı & Otomatik Kategori Algılama:**
  - Uygulama temiz başlar; herkes sol panelden veya ana ekrandan kendi ders adını ve kodunu yazarak **Sözel / Kavramsal** veya **Teknik / Kodlama** dersi ekleyip **ünite sayısını (1–24)** ve **hangi ünitelerin Vize / Final'de çıkacağını** dilediği gibi özelleştirebilir (isteğe bağlı 1 tıkla örnek 6 derslik demo müfredat da yüklenebilir).
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
  - Dersin belirlediğin Vize / Final ünite aralığına veya özel ünite seçimlerine göre süreli karma deneme sınavı.
  - Yanlış yapılan soruların **1., 3., 7. ve 14. gün** aralıklı tekrar takvimiyle **Yanlış Defteri**'ne eklenmesi ve tek tıkla zayıf konu tekrar quizi.
  - **A4 Kağıdı Çıktısı & PDF / HTML İndirme:** Beyaz kâğıt düzeninde tek ünite veya çoklu ünite A4 önizleme, 1 sütun / 2 sütun sıkı özet, yazdırma (`PDF olarak kaydet`) ve tek dosya `.html` dışa aktarma.

---

## En Sorunsuz Kurulum & Kullanım (Windows 11 Akıllı Uygulama Denetimi Dostu)

> **Not:** Windows 11'de **Akıllı Uygulama Denetimi (Smart App Control)** açık olan bilgisayarlarda ticari kod imzası bulunmayan internetten indirilmiş `.exe` veya `.cmd`/`.bat` dosyaları engellenebilir. Aşağıdaki **1. ve 2. yöntem** bu engelle karşılaşmadan çalışır:

### 1) Ücretsiz Web / Vercel + Tek Tıkla Masaüstü Uygulaması (Önerilen)
* [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmonglowsreal%2Fac-kogretimuygulama)
* Yayına alınan web adresini **Microsoft Edge** veya **Chrome** ile açtığınızda adres çubuğundaki **"Uygulama Olarak Yükle"** simgesine tıklayarak hiçbir `.exe` veya `.cmd` indirmeden masaüstünüze ayrı pencere olarak kurabilirsiniz.
* Siteye giren her ziyaretçi kendi AI API anahtarını (**Gemini, OpenAI, Claude, Groq, OpenRouter, DeepSeek, EVREN**) yalnızca kendi tarayıcısında saklayarak kullanır; veriler kullanıcıya özel kalır.

### 2) Kendi Bilgisayarında Git + İmzalı Node/Edge ile Başlatma (Windows 11 Engeline Takılmaz)
Bilgisayarınızda [Git](https://git-scm.com/) ve [Node.js LTS](https://nodejs.org/) kuruluysa PowerShell / terminalde şu adımları çalıştırın:
```powershell
git clone https://github.com/monglowsreal/ac-kogretimuygulama.git
cd ac-kogretimuygulama
npm install
npm run desktop:prepare
npm run desktop:app
```
Microsoft dijital imzalı `node.exe` + Microsoft Edge Uygulama Modu (`--app`) ile ayrı masaüstü penceresi olarak açılır (`node scripts/create-shortcut.mjs` ile masaüstü kısayolu da oluşturabilirsiniz).

### 3) Windows Kurulum Sihirbazı / Taşınabilir Paketler (Releases)
* [Releases sayfasından](https://github.com/monglowsreal/ac-kogretimuygulama/releases/latest):
  * **`AOF-Akilli-Calisma-Kocu-Kurulum.exe`**: Standart Windows kurulum sihirbazıdır; bilgisayara kurar ve **Masaüstü + Başlat Menüsü kısayolu** oluşturur.
  * **`AOF-Akilli-Calisma-Kocu-Portable.exe`** veya **`AOF-Akilli-Calisma-Kocu-Hazir-Paket.zip`**: Kurulumsuz taşınabilir paketler.
  * *(Not: Ücretli Code Signing sertifikası olmadığı için Windows 11 **Akıllı Uygulama Denetimi** açık cihazlarda imzasız `.exe`/`.cmd` dosyaları engellenebilir; bu durumda yukarıdaki 1. veya 2. yöntemi kullanın.)*

---

## Geliştiriciler İçin Kurulum (Kaynak Koddan)

1. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
2. Kök dizindeki `.env.example` dosyasını `.env.local` adıyla kopyalayıp kendi API anahtarınızı yazın *(veya uygulamayı açtıktan sonra arayüzdeki **"API & AI Ayarları"** ekranından herhangi bir sağlayıcı anahtarını girin)*:
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
