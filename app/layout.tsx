import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NicheScope — экспресс-аналитика Instagram по нише",
  description:
    "Находим топ-аккаунты по нише и локации, разбираем топ-10 постов и Reels, выдаём отчёт и готовые темы для контента.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Unbounded:wght@500;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-ink text-white antialiased">{children}</body>
    </html>
  );
}
