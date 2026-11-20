import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { CoachProvider } from "@/context/CoachContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "AÖF Akıllı Çalışma Koçu | Kişisel Ders & Sınav Asistanı",
  description:
    "Öğrencilerin kendi ders ve ünitelerini ekleyip yapay zeka destekli çalışma rehberi, A4 çıktısı ve 5 şıklı AÖF uyumlu quiz çözebildiği kişisel çalışma asistanı.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen bg-slate-50 text-slate-900 antialiased transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100`}
      >
        <CoachProvider>{children}</CoachProvider>
      </body>
    </html>
  );
}
