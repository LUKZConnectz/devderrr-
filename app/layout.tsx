import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "[YOUR-SHOP-NAME] — เติมเกม/เช่าเว็บไซต์ราคาถูก",
  description:
    "[YOUR-SHOP-NAME] บริการเติมเกมและเช่าเว็บไซต์ระบบร้านค้า ราคาถูก ฟังก์ชันครบ รองรับ FiveM, Valorant, Roblox, Minecraft และแอปพรีเมียม",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Sarabun:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-base text-ink antialiased">{children}</body>
    </html>
  );
}
