import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "易經占卜 | 蓍草法",
  description: "傳統蓍草占卜，匿名使用隱私保護",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" style={{ fontFamily: "'Noto Serif TC', serif" }}>
        {children}
      </body>
    </html>
  );
}
