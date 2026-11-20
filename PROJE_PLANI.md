# Proje Adı: AÖF Bilgisayar Programcılığı Akıllı Çalışma Koçu

## 1. Proje Amacı ve Vizyonu
Bu uygulama, Anadolu Üniversitesi Açıköğretim Fakültesi (AÖF) Bilgisayar Programcılığı 1. sınıf güz dönemi öğrencisi için kişiselleştirilmiş bir yapay zeka destekli çalışma koçudur. Kullanıcının yüklediği ünite özetlerini veya ders notlarını analiz ederek; dersin türüne (sözel veya teknik/kodlama) göre özelleştirilmiş çalışma adımları, AÖF sınav formatına uygun çeldiricili testler ve ilerleme takibi sunar.

## 2. Hedef Müfredat ve Ders Yapısı (1. Sınıf Güz)
Sistem, dersleri içerik tipine göre otomatik olarak iki kategoride değerlendirmelidir:
- **Sözel / Kavramsal Dersler:** Bilişim Teknolojileri, Kullanıcı Deneyimi Tasarımı, Yabancı Dil I. (Strateji: Anahtar kavram çıkarma, hızlı tekrar özetleri, tanım bazlı testler).
- **Teknik / Kodlama / Uygulamalı Dersler:** Algoritmalar, Web Tabanlı Kodlama, İşlem Tablosu Programlama. (Strateji: Adım adım kod/formül mantığı analizi, değişken takibi, yazım hatası/syntax odaklı tuzak sorular).
- **Sınav Dönemi Mantığı:** Vize sınavları için **İlk 4 Ünite**, Final sınavları için **Tüm 8 Ünite** baz alınarak çalışma planı oluşturulur.

## 3. Teknoloji Yığını (Tech Stack)
- **Frontend:** Next.js (App Router) veya React + Tailwind CSS (Sade, odaklanmayı artıran modern ve koyu/açık tema destekli arayüz).
- **Backend / API:** Next.js API Routes veya Python (FastAPI).
- **Yapay Zeka Entegrasyonu:** Google Gemini API (`gemini-2.5-flash` modeli - ünite analizi, çalışma rehberi oluşturma ve soru üretimi için).
- **Veritabanı / Depolama:** Başlangıç için yerel SQLite veya tarayıcı tabanlı `localStorage` (Kurulum gerektirmeden hemen çalışabilmesi için).

## 4. Temel Özellikler ve Modüller

### Modül 1: Ders ve Ünite Yükleme Ekranı
- Kullanıcı ders adını seçer (veya yeni ders ekler) ve ünite numarasını (1-8 arası) belirtir.
- Ünite özetini metin olarak yapıştırabilir veya `.txt` / `.pdf` dosyası olarak yükleyebilir.

### Modül 2: Akıllı Çalışma Rehberi (Koçluk Motoru)
Yüklenen ünite içeriği yapay zekaya gönderilir ve şu çıktılar üretilir:
- **Ünite Özeti ve Kritik Kavramlar:** Sınavda çıkma ihtimali yüksek en önemli 5-7 kavram.
- **Nasıl Çalışmalısın? (Eylem Planı):** 
  - Eğer ders sözel ise: Hangi tanımlara odaklanılması gerektiğini ve ezber ipuçlarını listeler.
  - Eğer ders teknik ise (Algoritma, Web, Excel): Ünitedeki kod bloklarını/formülleri parçalar, adım adım mantığını anlatır ve kullanıcının bilgisayarda denemesi gereken 2-3 mini pratik görevi verir.

### Modül 3: AÖF Formatında Çeldiricili Mini Quiz
- Üniteden **5 şıklı (A, B, C, D, E)** 5 veya 10 soruluk deneme testi üretir.
- **Kritik Kural:** Teknik derslerde şıklar rastgele oluşturulmaz. Öğrencilerin en sık yaptığı mantık hataları (örneğin döngünün 1 eksik dönmesi, yanlış HTML etiketi, Excel formülünde noktalı virgül hatası) güçlü çeldiriciler olarak şıklara yerleştirilir.
- Kullanıcı soruyu yanıtladığında, doğru cevabı ve **diğer şıkların neden yanlış olduğunu** kısaca açıklar.
- AÖF puanlama sistemine uygun olarak **4 yanlışın 1 doğruyu götürdüğü** net hesabı ekranda gösterilir.

### Modül 4: İlerleme ve Sınav Sayacı Paneli (Dashboard)
- Vize (İlk 4 ünite) ve Final (8 ünite) bazında her dersin tamamlanma yüzdesini gösterir.
- Quizlerde yanlış yapılan konular "Tekrar Edilmesi Gerekenler" listesine otomatik eklenir.

## 5. Geliştirme Fazları (Adım Adım Uygulama Planı)

- **Faz 1 (İskelet ve Arayüz):** Proje kurulumunu yap, yan menüde derslerin listelendiği, ortada ünite metni girilebilen sade ve modern bir arayüz oluştur.
- **Faz 2 (Yapay Zeka Koçluk Entegrasyonu):** Kullanıcının girdiği ünite metnini Gemini API ile analiz edip "Kritik Kavramlar" ve "Adım Adım Çalışma Planı" üreten backend yapısını kur.
- **Faz 3 (Çeldiricili Quiz Sistemi):** Ünite içeriğinden 5 şıklı, çeldiricili test üreten ve net hesaplaması yapan interaktif quiz bileşenini ekle.
- **Faz 4 (Veri Kalıcılığı ve İlerleme Takibi):** Çalışılan üniteleri, oluşturulan rehberleri ve quiz skorlarını yerel veritabanına/depolamaya kaydet.

## 6. Antigravity Ajanı İçin Geliştirme Kuralları
1. Her fazı tamamladıktan sonra uygulamayı çalıştır ve arayüzde hata olup olmadığını kontrol et.
2. Kullanıcı deneyimini bozacak karmaşık formlardan kaçın; temiz, kart tabanlı (card-based) bir tasarım kullan.
3. Gemini API anahtarı için `.env.local` dosyası oluştur ve örnek bir `.env.example` bırak.
4. Kodları modüler, okunabilir ve yorum satırlarıyla açıklanmış şekilde yaz.
