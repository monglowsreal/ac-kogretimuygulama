import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AÖF Akıllı Çalışma Koçu",
    short_name: "AÖF Koç",
    description:
      "Kendi ders ve ünite notlarınla yapay zeka destekli çalışma rehberi, A4 çıktı ve 5 şıklı quiz hazırla.",
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "/icon.png",
        sizes: "256x256",
        type: "image/png",
      },
    ],
  };
}
