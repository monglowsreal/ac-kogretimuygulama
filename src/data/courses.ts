import { Course } from "@/types/coach";

/**
 * AÖF Bilgisayar Programcılığı 1. Sınıf Güz Dönemi varsayılan ders müfredatı.
 * Dersler içerik tipine göre "sozel" (kavramsal) veya "teknik" (kodlama/uygulamalı) olarak gruplanır.
 */
export const DEFAULT_COURSES: Course[] = [
  {
    id: "bilisim-teknolojileri",
    name: "Bilişim Teknolojileri",
    code: "BİL101U",
    category: "sozel",
    description: "Donanım, yazılım, ağ temelleri, bilgi güvenliği ve dijital okuryazarlık kavramları.",
  },
  {
    id: "kullanici-deneyimi-tasarimi",
    name: "Kullanıcı Deneyimi Tasarımı",
    code: "TİY103U",
    category: "sozel",
    description: "UX/UI ilkeleri, kullanılabilirlik testleri, bilgi mimarisi ve etkileşim tasarımı.",
  },
  {
    id: "yabanci-dil-1",
    name: "Yabancı Dil I",
    code: "İNG101U",
    category: "sozel",
    description: "Temel İngilizce dil bilgisi, zaman yapıları, kelime dağarcığı ve okuduğunu anlama.",
  },
  {
    id: "algoritmalar",
    name: "Algoritmalar",
    code: "BİL103U",
    category: "teknik",
    description: "Akış şemaları, sözde kod (pseudocode), koşullar, döngüler, diziler ve algoritma analizi.",
  },
  {
    id: "web-tabanli-kodlama",
    name: "Web Tabanlı Kodlama",
    code: "BİL105U",
    category: "teknik",
    description: "HTML5 semantik etiketler, CSS seçiciler, kutu modeli, form elemanları ve temel JavaScript.",
  },
  {
    id: "islem-tablosu-programlama",
    name: "İşlem Tablosu Programlama",
    code: "BİL107U",
    category: "teknik",
    description: "Excel hücre referansları ($), EĞER/DÜŞEYARA/ETOPLA fonksiyonları ve veri analizi.",
  },
];

/** AÖF sınav yapısı sabitleri */
export const TOTAL_UNITS = 8;
export const VIZE_UNIT_LIMIT = 4; // Vize: İlk 4 ünite
export const FINAL_UNIT_LIMIT = 8; // Final: Tüm 8 ünite
