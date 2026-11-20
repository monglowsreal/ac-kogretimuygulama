/**
 * Kullanıcının hızlıca test edebilmesi için her varsayılan AÖF dersine özel
 * örnek ünite özetleri.
 */
export const SAMPLE_UNIT_TEXTS: Record<string, { title: string; content: string }> = {
  "bilisim-teknolojileri": {
    title: "Ünite 2: Bilgisayar Donanımı ve Bellek Yapıları",
    content: `BİLİŞİM TEKNOLOJİLERİ - ÜNİTE 2 ÖZETİ: DONANIM VE BELLEK SİSTEMLERİ

1. Merkezi İşlem Birimi (CPU - Central Processing Unit)
Bilgisayarın beyni olarak görev yapan CPU, aritmetik ve mantıksal işlemleri gerçekleştirir. Temel olarak üç ana bileşenden oluşur:
- Aritmetik Mantık Birimi (ALU): Toplama, çıkarma, karşılaştırma (<, >, =) gibi tüm matematiksel ve mantıksal işlemleri yapar.
- Kontrol Birimi (CU): Bellekten komutları getirir, çözer (decode) ve diğer birimlere yürütme sinyali gönderir.
- Kaydediciler (Registers): İşlemci içinde yer alan en hızlı, en küçük kapasiteli geçici bellek birimleridir.

2. Bellek Hiyerarşisi
Bilgisayar sistemlerinde hız arttıkça birim maliyet artar, kapasite genellikle azalır:
- En hızlıdan en yavaşa sıralama: Register -> Ön Bellek (Cache L1/L2/L3) -> Ana Bellek (RAM) -> İkincil Depolama (SSD/HDD).
- RAM (Random Access Memory): Geçici (uçucu / volatile) bellektir. Elektrik kesildiğinde içindeki veriler silinir. Çalışmakta olan işletim sistemi ve programlar RAM üzerinde tutulur.
- ROM (Read Only Memory): Kalıcı (non-volatile) bellektir. Bilgisayar açılırken çalışan BIOS/UEFI başlatma komutlarını (POST işlemi dahil) içerir.

3. Giriş / Çıkış ve Veri Yolu (Bus)
- Veri Yolu (Data Bus): Bileşenler arasında çift yönlü veri taşır.
- Adres Yolu (Address Bus): İşlemciden belleğe tek yönlü adres bilgisi taşır.
- Anakart (Motherboard) üzerindeki yonga seti (Chipset), CPU, RAM ve çevre birimleri arasındaki iletişimi koordine eder.`,
  },
  "kullanici-deneyimi-tasarimi": {
    title: "Ünite 1: Kullanıcı Deneyimi (UX) ve Kullanılabilirlik İlkeleri",
    content: `KULLANICI DENEYİMİ TASARIMI - ÜNİTE 1 ÖZETİ

1. Kullanıcı Deneyimi (UX) ve Kullanıcı Arayüzü (UI) Farkı
- UX (User Experience): Kullanıcının bir ürün, sistem veya hizmetle etkileşime girdiğinde yaşadığı bütünsel algı, duygu ve verimlilik deneyimidir. Donald Norman tarafından yaygınlaştırılmıştır.
- UI (User Interface): Kullanıcının doğrudan gördüğü ve dokunduğu görsel arayüz katmanıdır (butonlar, tipografi, renk paleti, menüler).

2. Jakob Nielsen'in Kullanılabilirlik Bileşenleri (5 Temel Kriter)
- Öğrenilebilirlik (Learnability): İlk kez karşılaşan kullanıcı temel görevleri ne kadar kolay tamamlıyor?
- Verimlilik (Efficiency): Tasarımı öğrenen kullanıcı görevleri ne kadar hızlı yapıyor?
- Hatırlanabilirlik (Memorability): Bir süre kullanmadıktan sonra geri dönen kullanıcı kolayca hatırlıyor mu?
- Hata Oranı (Errors): Kullanıcı ne sıklıkla hata yapıyor ve hatadan ne kadar kolay dönebiliyor?
- Memnuniyet (Satisfaction): Tasarımı kullanmak ne kadar keyifli ve tatmin edici?

3. Bilgi Mimarisi ve Tel Çerçeve (Wireframe)
- Bilgi Mimarisi (Information Architecture): İçeriğin kullanıcıların kolayca bulabileceği şekilde kategorize edilmesi ve navigasyon yapısının kurulmasıdır. Kart sıralama (Card Sorting) tekniği sıkça kullanılır.
- Wireframe (Düşük Sadakatli Tasarım): Renk ve görsellerden arındırılmış, sayfa yerleşimini ve hiyerarşiyi gösteren iskelet çizimdir.`,
  },
  "yabanci-dil-1": {
    title: "Ünite 3: Simple Present vs. Present Continuous & Modal Verbs",
    content: `YABANCI DİL I (İNGİLİZCE) - ÜNİTE 3 DİL BİLGİSİ ÖZETİ

1. Simple Present Tense (Geniş Zaman)
- Kullanım: Alışkanlıklar, günlük rutinler, genel doğrular ve değişmeyen durumlar.
- Yapı: Olumlu cümlede özne "He / She / It" ise fiile -s, -es veya -ies takısı gelir.
  Örnek: "She writes clean code every morning."
- Soru ve Olumsuz: "do / does" yardımcı fiili kullanılır, ana fiil yalın (V1) hale döner! (Sık yapılan hata: "Does she writes?" YANLIŞ -> "Does she write?" DOĞRU).
- Zaman Zarfları: always, usually, often, sometimes, rarely, never, every day.

2. Present Continuous Tense (Şimdiki Zaman)
- Kullanım: Konuşma anında gerçekleşen eylemler ve geçici durumlar.
- Yapı: am / is / are + V-ing
  Örnek: "We are debugging the algorithm right now."
- Durum Fiilleri (Stative Verbs): know, believe, understand, love, hate, need, want gibi zihinsel/duygusal durum fiilleri genellikle -ing almaz! ("I am knowing" YANLIŞ -> "I know" DOĞRU).

3. Temel Kipler (Modals): Can / Must / Have to
- Can: Yetenek ve izin bildirir (He can speak Python and English).
- Must vs. Don't have to:
  - Mustn't: Kesin yasak (You mustn't share your password).
  - Don't have to: Zorunluluk yok, isteğe bağlı (You don't have to submit it today).`,
  },
  "algoritmalar": {
    title: "Ünite 4: Döngü Yapıları (For, While) ve İzleme Tabloları",
    content: `ALGORİTMALAR VE PROGRAMLAMAYA GİRİŞ - ÜNİTE 4: DÖNGÜLER

1. Döngü Kavramı ve Temel Bileşenleri
Bir işlemin belirli bir koşul sağlandığı sürece tekrar edilmesini sağlayan yapılardır. Her döngüde üç kritik öğe bulunur:
- Başlangıç değeri (Initialization)
- Devam koşulu (Condition)
- Artış/Azalış adımı (Increment/Decrement) — unutulursa sonsuz döngü (infinite loop) oluşur!

2. Örnek Sözde Kod (Pseudocode) Analizi: 1'den N'e Çift Sayıların Toplamı
Başla
  toplam = 0
  sayac = 2
  Oku N
  Döngü (sayac <= N) iken:
    toplam = toplam + sayac
    sayac = sayac + 2
  Döngü Sonu
  Yaz toplam
Bitir

3. For ve While Farkı
- For döngüsü: Tekrar sayısının başlangıçta bilindiği durumlarda tercih edilir.
  Örnek (C/JS benzeri):
  for (let i = 1; i < 5; i++) {
    toplam += i;
  }
  Dikkat! i < 5 koşulunda i değerleri 1, 2, 3, 4 olur (5 dahil değildir -> toplam = 10). i <= 5 olsaydı 15 olurdu!
- While vs Do-While:
  - While: Koşul döngü başında kontrol edilir. Koşul başlangıçta yanlışsa gövde hiç çalışmaz (0 kez).
  - Do-While: Koşul döngü sonunda kontrol edilir. Koşul yanlış olsa bile gövde en az 1 kez çalışır.`,
  },
  "web-tabanli-kodlama": {
    title: "Ünite 3: HTML5 Semantik Etiketler, Formlar ve CSS Kutu Modeli",
    content: `WEB TABANLI KODLAMA - ÜNİTE 3: HTML5 VE CSS TEMELLERİ

1. HTML5 Semantik (Anlamsal) Etiketler
Sayfa yapısını hem tarayıcıya hem arama motorlarına anlamlı şekilde tanımlar:
- <header>: Sayfa veya bölüm başlığı
- <nav>: Gezinme menüsü bağlantıları
- <main>: Sayfanın benzersiz ana içeriği (bir sayfada bir kez kullanılır)
- <article>: Kendi başına anlamlı, bağımsız içerik (blog yazısı, haber)
- <section>: Tematik içerik bölümü
- <footer>: Alt bilgi alanı

2. HTML Formları ve Sık Yapılan Hatalar
<form action="/kayit" method="POST">
  <label for="eposta">E-posta:</label>
  <input type="email" id="eposta" name="user_email" required />
  <button type="submit">Gönder</button>
</form>
- Kritik Not: Sunucuya verinin gidebilmesi için <input> etiketinde mutlaka "name" özniteliği bulunmalıdır! "id" sadece label eşleştirme ve CSS/JS seçimi içindir.
- <a href="..."> bağlantılarında yeni sekmede açmak için target="_blank" kullanılır ("src" değil "href" kullanılır!).

3. CSS Kutu Modeli (Box Model) ve Seçiciler
- İçten dışa sıralama: Content (İçerik) -> Padding (İç Boşluk) -> Border (Kenarlık) -> Margin (Dış Boşluk).
- Seçici Önceliği (Specificity): Satır içi (inline style) > ID (#kutu) > Sınıf (.kart) > Etiket (div).
- box-sizing: border-box; özelliği padding ve border değerlerinin belirtilen width değerine dahil edilmesini sağlar.`,
  },
  "islem-tablosu-programlama": {
    title: "Ünite 4: Hücre Referansları ve Koşullu Fonksiyonlar (EĞER, ETOPLA)",
    content: `İŞLEM TABLOSU PROGRAMLAMA (EXCEL) - ÜNİTE 4: FORMÜLLER VE REFERANSLAR

1. Formül Yazım Kuralları (Türkçe Excel)
- Tüm formüller "=" (eşittir) işareti ile başlar.
- Türkçe Excel'de fonksiyon argümanları ";" (noktalı virgül) ile ayrılır! (Virgül kullanılırsa hata verir).
- Metin ifadeler çift tırnak ("Geçti") içinde yazılır.
- Aralık belirtmek için ":" (iki nokta üst üste) kullanılır: A1:A10 (A1'den A10'a tüm hücreler). A1;A10 sadece A1 ve A10 hücrelerini ifade eder!

2. Göreli ve Mutlak Hücre Başvuruları ($)
- Göreli (Relative): A1 -> Formül aşağı kopyalandığında A2, A3 olarak değişir.
- Mutlak (Absolute): $A$1 -> Formül kopyalandığında satır ve sütun sabit kalır (KDV oranı, taban puan gibi sabitlerde kullanılır).
- Karma (Mixed): $A1 (sütun sabit, satır değişir) veya A$1 (satır sabit, sütun değişir).

3. Kritik Fonksiyonlar
- EĞER (IF): =EĞER(B2>=50;"Geçti";"Kaldı") -> B2 hücresi 50 veya büyükse Geçti, değilse Kaldı yazar.
- ETOPLA (SUMIF): =ETOPLA(A2:A10;"Bilgisayar";C2:C10) -> A2:A10 aralığında "Bilgisayar" yazan satırların C2:C10'daki karşılıklarını toplar.
- EĞERSAY (COUNTIF): =EĞERSAY(B2:B20;">=70") -> 70 ve üzeri not alan öğrenci sayısını sayar.
- DÜŞEYARA (VLOOKUP): =DÜŞEYARA(Aranan_Değer; Tablo_Dizisi; Sütun_İndis_Sayısı; YANLIŞ) -> Son parametre YANLIŞ (0) ise tam eşleşme yapar.`,
  },
};
