import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";

const MAX_PDF_BYTES = 250 * 1024 * 1024; // Büyük ders/ünite PDF'leri için 250 MB sınır

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Yüklenecek bir PDF dosyası bulunamadı." },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Yalnızca .pdf uzantılı dosyalar desteklenmektedir." },
        { status: 400 }
      );
    }

    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: "PDF dosya boyutu 250 MB sınırını aşamaz." },
        { status: 400 }
      );
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const result = await extractText(buffer, { mergePages: true });
    const cleanedText = (result.text ?? "")
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!cleanedText) {
      return NextResponse.json(
        {
          error:
            "PDF içinden metin çıkarılamadı (dosya taranmış görsel/resim PDF olabilir). Metni kopyalayıp yapıştırmayı deneyebilirsiniz.",
        },
        { status: 422 }
      );
    }

    const brokenCharCount = (cleanedText.match(/\uFFFD/g) || []).length;
    const avgCharsPerPage = cleanedText.length / Math.max(1, result.totalPages || 1);
    let warning: string | undefined;

    if (brokenCharCount > 10) {
      warning =
        "PDF içinde bozuk karakterler tespit edildi; çıkacak notları orijinal kitaptan doğrulaman önerilir.";
    } else if ((result.totalPages || 1) >= 3 && avgCharsPerPage < 120) {
      warning =
        "Sayfa başına düşen metin miktarı çok düşük (bazı sayfalar taranmış resim veya tablo görseli olabilir). Eksik kalan kısımları kitaptan kontrol edin.";
    }

    return NextResponse.json({
      text: cleanedText,
      totalPages: result.totalPages,
      charCount: cleanedText.length,
      ...(warning ? { warning } : {}),
    });
  } catch (err) {
    console.error("PDF ayrıştırma hatası:", err);
    return NextResponse.json(
      { error: "PDF dosyası işlenirken bir sunucu hatası oluştu." },
      { status: 500 }
    );
  }
}
