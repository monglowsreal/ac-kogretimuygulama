import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Masaüstü (Electron) paketlemesi için bağımsız sunucu çıktısı üret
  output: "standalone",
  // Harici imzasız native sharp ikilisine ihtiyaç duymamak için
  images: { unoptimized: true },
  // unpdf sunucu tarafında dış paket olarak çözümlensin
  serverExternalPackages: ["unpdf"],
};

export default nextConfig;
